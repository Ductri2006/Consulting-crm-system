import { AppointmentStatus } from "@prisma/client";

const nextWorkflowStatuses: Partial<
  Record<AppointmentStatus, AppointmentStatus[]>
> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
  ],
};

export const isTerminalAppointmentStatus = (
  status: AppointmentStatus,
): boolean =>
  status === AppointmentStatus.COMPLETED ||
  status === AppointmentStatus.CANCELLED;

export const isValidAppointmentTransition = (
  current: AppointmentStatus,
  next: AppointmentStatus,
): boolean => {
  if (current === next || isTerminalAppointmentStatus(current)) {
    return false;
  }

  return nextWorkflowStatuses[current]?.includes(next) ?? false;
};
