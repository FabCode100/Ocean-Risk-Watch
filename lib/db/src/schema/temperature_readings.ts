import { pgTable, serial, real, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const temperatureReadings = pgTable(
  "temperature_readings",
  {
    id: serial("id").primaryKey(),
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    temperature: real("temperature").notNull(),
    historicalAvg: real("historical_avg").notNull(),
    historicalStdDev: real("historical_std_dev").notNull(),
    riskScore: real("risk_score").notNull(),
    riskLevel: text("risk_level").notNull(),
    regionName: text("region_name").notNull(),
    trend7d: real("trend_7d").notNull().default(0),
    source: text("source").notNull().default("simulated"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => [
    index("idx_temperature_timestamp").on(table.timestamp),
    index("idx_temperature_region").on(table.regionName),
    index("idx_temperature_risk_level").on(table.riskLevel),
  ]
);

export const insertTemperatureReadingSchema = createInsertSchema(temperatureReadings).omit({ id: true });
export type InsertTemperatureReading = z.infer<typeof insertTemperatureReadingSchema>;
export type TemperatureReading = typeof temperatureReadings.$inferSelect;
