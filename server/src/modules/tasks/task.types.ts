import { z } from "zod";

import {
  createTaskSchema,
  overdueTaskQuerySchema,
  taskIdParamsSchema,
  taskListQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.validation";

export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type OverdueTaskQuery = z.infer<typeof overdueTaskQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<
  typeof updateTaskStatusSchema
>;
