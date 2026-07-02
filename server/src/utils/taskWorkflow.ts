import { TaskStatus } from "@prisma/client";

const nextWorkflowStatuses: Partial<Record<TaskStatus, TaskStatus[]>> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.DONE, TaskStatus.CANCELLED],
};

export const isTerminalTaskStatus = (status: TaskStatus): boolean =>
  status === TaskStatus.DONE || status === TaskStatus.CANCELLED;

export const isValidTaskTransition = (
  current: TaskStatus,
  next: TaskStatus,
): boolean => {
  if (current === next || isTerminalTaskStatus(current)) {
    return false;
  }

  return nextWorkflowStatuses[current]?.includes(next) ?? false;
};
