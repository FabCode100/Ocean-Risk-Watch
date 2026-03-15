import { Router, type IRouter } from "express";
import { db, temperatureReadings } from "@workspace/db";
import { gte, and, eq, type SQL } from "drizzle-orm";
import { GetHeatmapDataQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function getPeriodDate(period: string): Date {
  const now = new Date();
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  now.setDate(now.getDate() - days);
  return now;
}

router.get("/heatmap", async (req, res) => {
  try {
    const query = GetHeatmapDataQueryParams.parse({
      period: req.query.period || "7d",
      riskLevel: req.query.riskLevel,
    });

    const since = getPeriodDate(query.period!);
    const conditions: SQL[] = [gte(temperatureReadings.timestamp, since)];

    if (query.riskLevel) {
      conditions.push(eq(temperatureReadings.riskLevel, query.riskLevel));
    }

    const points = await db
      .select()
      .from(temperatureReadings)
      .where(and(...conditions))
      .orderBy(temperatureReadings.timestamp);

    const latestByLocation = new Map<string, typeof points[0]>();
    for (const p of points) {
      const key = `${p.latitude.toFixed(2)}_${p.longitude.toFixed(2)}`;
      if (!latestByLocation.has(key) || p.timestamp > latestByLocation.get(key)!.timestamp) {
        latestByLocation.set(key, p);
      }
    }

    const uniquePoints = Array.from(latestByLocation.values());

    const maxScore = Math.max(...uniquePoints.map((p) => Math.abs(p.riskScore)), 1);

    const heatPoints = uniquePoints.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      intensity: Math.min(1, Math.abs(p.riskScore) / maxScore),
      riskLevel: p.riskLevel,
    }));

    const critical = uniquePoints.filter((p) => p.riskLevel === "critical").length;
    const attention = uniquePoints.filter((p) => p.riskLevel === "attention").length;
    const normal = uniquePoints.filter((p) => p.riskLevel === "normal").length;
    const avgTemp =
      uniquePoints.reduce((sum, p) => sum + p.temperature, 0) / (uniquePoints.length || 1);
    const maxRiskScore = Math.max(...uniquePoints.map((p) => p.riskScore), 0);

    res.json({
      points: heatPoints,
      stats: {
        total: uniquePoints.length,
        critical,
        attention,
        normal,
        avgTemperature: Math.round(avgTemp * 100) / 100,
        maxRiskScore: Math.round(maxRiskScore * 1000) / 1000,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
