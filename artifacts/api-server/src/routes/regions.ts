import { Router, type IRouter } from "express";
import { db, temperatureReadings } from "@workspace/db";
import { gte, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/regions/risk-summary", async (_req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const allPoints = await db
      .select()
      .from(temperatureReadings)
      .where(gte(temperatureReadings.timestamp, since));

    const regionMap = new Map<string, typeof allPoints>();
    for (const p of allPoints) {
      if (!regionMap.has(p.regionName)) {
        regionMap.set(p.regionName, []);
      }
      regionMap.get(p.regionName)!.push(p);
    }

    const summaries = Array.from(regionMap.entries()).map(([regionName, points]) => {
      const avgTemperature =
        points.reduce((s, p) => s + p.temperature, 0) / points.length;
      const avgRiskScore =
        points.reduce((s, p) => s + p.riskScore, 0) / points.length;
      const maxRiskScore = Math.max(...points.map((p) => p.riskScore));
      const critical = points.filter((p) => p.riskLevel === "critical").length;
      const attention = points.filter((p) => p.riskLevel === "attention").length;
      const normal = points.filter((p) => p.riskLevel === "normal").length;
      const trend7d = points.reduce((s, p) => s + p.trend7d, 0) / points.length;
      const centerLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
      const centerLng = points.reduce((s, p) => s + p.longitude, 0) / points.length;

      let dominantRiskLevel: "normal" | "attention" | "critical" = "normal";
      if (critical > 0) dominantRiskLevel = "critical";
      else if (attention > critical) dominantRiskLevel = "attention";

      return {
        regionName,
        avgTemperature: Math.round(avgTemperature * 100) / 100,
        avgRiskScore: Math.round(avgRiskScore * 1000) / 1000,
        maxRiskScore: Math.round(maxRiskScore * 1000) / 1000,
        dominantRiskLevel,
        pointsCount: points.length,
        criticalCount: critical,
        attentionCount: attention,
        normalCount: normal,
        trend7d: Math.round(trend7d * 100) / 100,
        centerLat: Math.round(centerLat * 10000) / 10000,
        centerLng: Math.round(centerLng * 10000) / 10000,
      };
    });

    summaries.sort((a, b) => b.maxRiskScore - a.maxRiskScore);

    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
