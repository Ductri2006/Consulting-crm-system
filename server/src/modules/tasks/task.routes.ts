import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listOverdueTasksController,
  listTasksController,
  updateTaskController,
  updateTaskStatusController,
} from "./task.controller";
import {
  createTaskSchema,
  overdueTaskQuerySchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.validation";

const taskRouter = Router();
const taskRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

taskRouter.use(authenticate, authorizeRoles(...taskRoles));

taskRouter.get(
  "/",
  validate({ query: taskListQuerySchema }),
  asyncHandler(listTasksController),
);
taskRouter.get(
  "/overdue",
  validate({ query: overdueTaskQuerySchema }),
  asyncHandler(listOverdueTasksController),
);
taskRouter.post(
  "/",
  validate({ body: createTaskSchema }),
  asyncHandler(createTaskController),
);
taskRouter.get(
  "/:id",
  validate({ params: taskIdParamsSchema }),
  asyncHandler(getTaskController),
);
taskRouter.patch(
  "/:id/status",
  validate({
    params: taskIdParamsSchema,
    body: updateTaskStatusSchema,
  }),
  asyncHandler(updateTaskStatusController),
);
taskRouter.patch(
  "/:id",
  validate({
    params: taskIdParamsSchema,
    body: updateTaskSchema,
  }),
  asyncHandler(updateTaskController),
);
taskRouter.delete(
  "/:id",
  validate({ params: taskIdParamsSchema }),
  asyncHandler(deleteTaskController),
);

export { taskRouter };
