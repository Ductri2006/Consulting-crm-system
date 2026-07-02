import { Router } from "express";

import { appointmentRouter } from "../modules/appointments/appointment.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { caseRouter } from "../modules/cases/case.routes";
import {
  consultationRequestRouter,
  publicConsultationRequestRouter,
} from "../modules/consultationRequests/consultationRequest.routes";
import { customerRouter } from "../modules/customers/customer.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { documentRouter } from "../modules/documents/document.routes";
import {
  publicServiceRouter,
  serviceRouter,
} from "../modules/services/service.routes";
import { taskRouter } from "../modules/tasks/task.routes";
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
apiRouter.use("/cases", caseRouter);
apiRouter.use("/appointments", appointmentRouter);
apiRouter.use("/tasks", taskRouter);
apiRouter.use("/documents", documentRouter);
apiRouter.use("/dashboard", dashboardRouter);

export { apiRouter };
