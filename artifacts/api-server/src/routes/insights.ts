import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { db, insightsCache } from "@workspace/db";
import { eq, gt } from "drizzle-orm";
import { GenerateInsightsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/insights", async (req, res) => {
  try {
    const body = GenerateInsightsBody.parse(req.body);

    const cached = await db
      .select()
      .from(insightsCache)
      .where(eq(insightsCache.regionName, body.regionName))
      .limit(1);

    if (cached.length > 0 && cached[0].expiresAt > new Date()) {
      const c = cached[0];
      res.json({
        regionName: c.regionName,
        riskLevel: c.riskLevel,
        diagnosis: c.diagnosis,
        vulnerableSpecies: JSON.parse(c.vulnerableSpecies),
        immediateActions: JSON.parse(c.immediateActions),
        projection30d: c.projection30d,
        generatedAt: c.generatedAt.toISOString(),
        cached: true,
      });
      return;
    }

    const trendText =
      body.trend7d > 0.2
        ? `aquecimento de +${body.trend7d.toFixed(2)}°C/semana`
        : body.trend7d < -0.2
        ? `resfriamento de ${body.trend7d.toFixed(2)}°C/semana`
        : "estável";

    const prompt = `Região: ${body.regionName} | Coordenadas: ${body.latitude.toFixed(2)}°S, ${body.longitude.toFixed(2)}°W
Temperatura atual: ${body.temperature}°C | Média histórica: ${body.historicalAvg}°C | Desvio padrão: ${body.historicalStdDev}°C
Nível de risco: ${body.riskLevel.toUpperCase()} | Tendência (7 dias): ${trendText}

Gere uma análise estruturada em formato JSON com exatamente estas chaves:
{
  "diagnosis": "Texto do diagnóstico do risco para biodiversidade local (2-3 parágrafos)",
  "vulnerableSpecies": ["espécie 1", "espécie 2", "espécie 3", "espécie 4", "espécie 5"],
  "immediateActions": ["Ação 1", "Ação 2", "Ação 3", "Ação 4"],
  "projection30d": "Projeção de risco para os próximos 30 dias (1-2 parágrafos)"
}

Responda APENAS com o JSON, sem texto adicional.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system:
        "Você é um especialista em oceanografia e ecologia marinha brasileira. Analise os dados de temperatura oceânica fornecidos e gere insights práticos e recomendações de conservação focadas na biodiversidade marinha do Brasil. Responda sempre em português do Brasil.",
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      throw new Error("Unexpected response from Claude");
    }

    let parsed: {
      diagnosis: string;
      vulnerableSpecies: string[];
      immediateActions: string[];
      projection30d: string;
    };

    try {
      const jsonMatch = block.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      parsed = {
        diagnosis: block.text,
        vulnerableSpecies: [],
        immediateActions: [],
        projection30d: "Dados insuficientes para projeção.",
      };
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db
      .insert(insightsCache)
      .values({
        regionName: body.regionName,
        riskLevel: body.riskLevel,
        diagnosis: parsed.diagnosis,
        vulnerableSpecies: JSON.stringify(parsed.vulnerableSpecies),
        immediateActions: JSON.stringify(parsed.immediateActions),
        projection30d: parsed.projection30d,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: insightsCache.regionName,
        set: {
          riskLevel: body.riskLevel,
          diagnosis: parsed.diagnosis,
          vulnerableSpecies: JSON.stringify(parsed.vulnerableSpecies),
          immediateActions: JSON.stringify(parsed.immediateActions),
          projection30d: parsed.projection30d,
          generatedAt: new Date(),
          expiresAt,
        },
      });

    res.json({
      regionName: body.regionName,
      riskLevel: body.riskLevel,
      diagnosis: parsed.diagnosis,
      vulnerableSpecies: parsed.vulnerableSpecies,
      immediateActions: parsed.immediateActions,
      projection30d: parsed.projection30d,
      generatedAt: new Date().toISOString(),
      cached: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
