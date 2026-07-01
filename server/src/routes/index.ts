import { Router } from "express";

import { authRouter } from "../modules/auth/auth.routes";
import {
  consultationRequestRouter,
  publicConsultationRequestRouter,
} from "../modules/consultationRequests/consultationRequest.routes";
import { customerRouter } from "../modules/customers/customer.routes";
import {
  publicServiceRouter,
  serviceRouter,
} from "../modules/services/service.routes";
import { userRouter } from "../modules/users/user.routes";
import { healthRouter } from "./health.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/public/services", publicServiceRouter);
apiRouter.use(
  "/public/consultation-requests",
  publicConsultationRequestRouter,
);
apiRouter.use("/users", userRouter);
apiRouter.use("/customers", customerRouter);
apiRouter.use("/services", serviceRouter);
apiRouter.use("/consultation-requests", consultationRequestRouter);

export { apiRouter };
