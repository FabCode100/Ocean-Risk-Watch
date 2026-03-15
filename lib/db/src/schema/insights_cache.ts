import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insightsCache = pgTable("insights_cache", {
  id: serial("id").primaryKey(),
  regionName: text("region_name").notNull().unique(),
  riskLevel: text("risk_level").notNull(),
  diagnosis: text("diagnosis").notNull(),
  vulnerableSpecies: text("vulnerable_species").notNull(),
  immediateActions: text("immediate_actions").notNull(),
  projection30d: text("projection_30d").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertInsightsCacheSchema = createInsertSchema(insightsCache).omit({ id: true });
export type InsertInsightsCache = z.infer<typeof insertInsightsCacheSchema>;
export type InsightsCache = typeof insightsCache.$inferSelect;
