import { Router, type IRouter } from "express";
import { db, temperatureReadings } from "@workspace/db";
import { desc, eq, gte, and, type SQL } from "drizzle-orm";
import {
  ListTemperaturePointsQueryParams,
  GetTemperatureHistoryParams,
} from "@workspace/api-zod";
import { collectOceanData } from "../lib/ocean-data.js";

const router: IRouter = Router();

function getPeriodDate(period: string): Date {
  const now = new Date();
  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  now.setDate(now.getDate() - days);
  return now;
}

router.get("/temperature", async (req, res) => {
  try {
    const query = ListTemperaturePointsQueryParams.parse({
      period: req.query.period || "7d",
      riskLevel: req.query.riskLevel,
      limit: req.query.limit ? Number(req.query.limit) : 100,
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
      .orderBy(desc(temperatureReadings.timestamp))
      .limit(query.limit ?? 100);

    const formatted = points.map((p) => ({
      id: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      temperature: p.temperature,
      historicalAvg: p.historicalAvg,
      historicalStdDev: p.historicalStdDev,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      regionName: p.regionName,
      timestamp: p.timestamp.toISOString(),
      trend7d: p.trend7d,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.get("/temperature/:id", async (req, res) => {
  try {
    const { id } = GetTemperatureHistoryParams.parse({ id: Number(req.params.id) });

    const point = await db
      .select()
      .from(temperatureReadings)
      .where(eq(temperatureReadings.id, id))
      .limit(1);

    if (point.length === 0) {
      res.status(404).json({ error: "Not Found", message: "Temperature point not found" });
      return;
    }

    const p = point[0];

    const history = await db
      .select()
      .from(temperatureReadings)
      .where(
        and(
          eq(temperatureReadings.regionName, p.regionName),
          gte(temperatureReadings.timestamp, getPeriodDate("30d"))
        )
      )
      .orderBy(desc(temperatureReadings.timestamp))
      .limit(100);

    res.json({
      point: {
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        temperature: p.temperature,
        historicalAvg: p.historicalAvg,
        historicalStdDev: p.historicalStdDev,
        riskScore: p.riskScore,
        riskLevel: p.riskLevel,
        regionName: p.regionName,
        timestamp: p.timestamp.toISOString(),
        trend7d: p.trend7d,
      },
      history: history.map((h) => ({
        timestamp: h.timestamp.toISOString(),
        temperature: h.temperature,
        riskScore: h.riskScore,
        riskLevel: h.riskLevel,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

router.post("/scheduler/trigger", async (_req, res) => {
  try {
    const count = await collectOceanData();
    res.json({
      message: "Data collection triggered successfully",
      pointsCollected: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: String(err) });
  }
});

export default router;
