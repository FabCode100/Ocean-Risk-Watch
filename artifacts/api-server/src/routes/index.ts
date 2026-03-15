import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import temperatureRouter from "./temperature.js";
import heatmapRouter from "./heatmap.js";
import regionsRouter from "./regions.js";
import insightsRouter from "./insights.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(temperatureRouter);
router.use(heatmapRouter);
router.use(regionsRouter);
router.use(insightsRouter);

export default router;
