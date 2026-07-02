import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  createTask,
  deleteTask,
  findTaskById,
  listOverdueTasks,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "./task.service";
import type {
  CreateTaskInput,
  OverdueTaskQuery,
  TaskListQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./task.types";

const getTaskId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError("Invalid task id.", HTTP_STATUS.BAD_REQUEST);
  }

  return id;
};

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const listTasksController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listTasks(
    request.query as unknown as TaskListQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Tasks retrieved successfully.", result));
};

export const listOverdueTasksController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listOverdueTasks(
    request.query as unknown as OverdueTaskQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Overdue tasks retrieved successfully.", result),
    );
};

export const getTaskController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const task = await findTaskById(
    getTaskId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Task retrieved successfully.", { task }));
};

export const createTaskController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const task = await createTask(
    request.body as CreateTaskInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(successResponse("Task created successfully.", { task }));
};

export const updateTaskController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const task = await updateTask(
    getTaskId(request),
    request.body as UpdateTaskInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Task updated successfully.", { task }));
};

export const updateTaskStatusController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const task = await updateTaskStatus(
    getTaskId(request),
    request.body as UpdateTaskStatusInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Task status updated successfully.", { task }));
};

export const deleteTaskController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const task = await deleteTask(
    getTaskId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Task deleted successfully.", { task }));
};
