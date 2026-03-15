import { collectOceanData } from "./ocean-data.js";

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export function startScheduler() {
  console.log("[Scheduler] Starting data collection scheduler (every 6 hours)");

  collectOceanData()
    .then((count) => console.log(`[Scheduler] Initial data collection: ${count} points inserted`))
    .catch((err) => console.error("[Scheduler] Initial collection failed:", err));

  schedulerInterval = setInterval(async () => {
    try {
      const count = await collectOceanData();
      console.log(`[Scheduler] Periodic collection: ${count} points inserted at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("[Scheduler] Periodic collection failed:", err);
    }
  }, SIX_HOURS_MS);
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
