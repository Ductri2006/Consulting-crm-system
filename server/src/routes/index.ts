import { Router } from "express";

import { healthRouter } from "./health.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);

export { apiRouter };
