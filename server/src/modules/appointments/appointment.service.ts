import {
  AppointmentStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  isTerminalAppointmentStatus,
  isValidAppointmentTransition,
} from "../../utils/appointmentWorkflow";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type { SafeUser } from "../../utils/sanitizeUser";
import type {
  AppointmentListQuery,
  CreateAppointmentInput,
  TodayAppointmentQuery,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointment.types";

const assignableRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

const safeUserSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const customerSummarySelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
} satisfies Prisma.CustomerSelect;

const caseSummarySelect = {
  id: true,
  caseCode: true,
  title: true,
  status: true,
} satisfies Prisma.CaseProfileSelect;

const appointmentInclude = {
  customer: {
    select: customerSummarySelect,
  },
  caseProfile: {
    select: caseSummarySelect,
  },
  staff: {
    select: safeUserSelect,
  },
} satisfies Prisma.AppointmentInclude;

type AppointmentAccessRecord = {
  staffId: string | null;
};

const assertCrmActor = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER &&
    actor.role !== UserRole.STAFF
  ) {
    throw new AppError(
      "You do not have permission to access appointments.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertAppointmentAccess = (
  appointment: AppointmentAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    appointment.staffId !== actor.id
  ) {
    throw new AppError(
      "You do not have permission to access this appointment.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const getStaffFilter = (
  actor: SafeUser,
  requestedStaffId?: string,
): string | undefined => {
  assertCrmActor(actor);

  return actor.role === UserRole.STAFF
    ? actor.id
    : requestedStaffId;
};

const findAssignableUser = async (
  transaction: Prisma.TransactionClient,
  id: string,
  organizationId: string,
) => {
  const user = await transaction.user.findFirst({
    where: {
      id,
      organizationId,
      isActive: true,
      role: {
        in: assignableRoles,
      },
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AppError(
      "The appointment staff member must be an active administrator, manager, or staff member.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return user;
};

const findCaseForCustomer = async (
  transaction: Prisma.TransactionClient,
  caseProfileId: string,
  customerId: string,
  organizationId: string,
): Promise<void> => {
  const caseProfile = await transaction.caseProfile.findFirst({
    where: {
      id: caseProfileId,
      organizationId,
    },
    select: {
      id: true,
      customerId: true,
    },
  });

  if (!caseProfile) {
    throw new AppError(
      "Case profile not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (caseProfile.customerId !== customerId) {
    throw new AppError(
      "The selected case profile does not belong to the appointment customer.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

const assertValidTimeRange = (
  startTime: string,
  endTime: string | null | undefined,
): void => {
  if (endTime !== null && endTime !== undefined && endTime <= startTime) {
    throw new AppError(
      "End time must be later than start time.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

const throwAppointmentPersistenceError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError(
      "Appointment not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  if (isPrismaError(error, "P2003")) {
    throw new AppError(
      "The appointment operation conflicts with a related record.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw error;
};

export const listAppointments = async (
  query: AppointmentListQuery,
  actor: SafeUser,
) => {
  const {
    page,
    limit,
    search,
    status,
    method,
    customerId,
    caseProfileId,
    staffId: requestedStaffId,
    date,
    fromDate,
    toDate,
  } = query;
  const staffId = getStaffFilter(actor, requestedStaffId);
  const appointmentDate: Prisma.DateTimeFilter | undefined = date
    ? { equals: date }
    : fromDate || toDate
      ? {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        }
      : undefined;
  const where: Prisma.AppointmentWhereInput = {
    organizationId: actor.organizationId,
    ...(status && { status }),
    ...(method && { method }),
    ...(customerId && { customerId }),
    ...(caseProfileId && { caseProfileId }),
    ...(staffId && { staffId }),
    ...(appointmentDate && { appointmentDate }),
    ...(search && {
      OR: [
        {
          customer: {
            fullName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
        {
          customer: {
            phone: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
        {
          note: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      ...pagination,
      include: appointmentInclude,
      orderBy: [
        { appointmentDate: "desc" },
        { startTime: "asc" },
        { id: "desc" },
      ],
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const listTodayAppointments = async (
  query: TodayAppointmentQuery,
  actor: SafeUser,
) => {
  const staffId = getStaffFilter(actor, query.staffId);
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const items = await prisma.appointment.findMany({
    where: {
      organizationId: actor.organizationId,
      appointmentDate: today,
      status: {
        not: AppointmentStatus.CANCELLED,
      },
      ...(staffId && { staffId }),
    },
    include: appointmentInclude,
    orderBy: [{ startTime: "asc" }, { id: "asc" }],
  });

  return { items };
};

export const findAppointmentById = async (
  id: string,
  actor: SafeUser,
) => {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
    },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw new AppError(
      "Appointment not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  assertAppointmentAccess(appointment, actor);

  return appointment;
};

export const createAppointment = async (
  input: CreateAppointmentInput,
  actor: SafeUser,
) => {
  assertCrmActor(actor);
  assertValidTimeRange(input.startTime, input.endTime);

  if (
    actor.role === UserRole.STAFF &&
    input.staffId !== undefined &&
    input.staffId !== actor.id
  ) {
    throw new AppError(
      "Staff members can only create appointments assigned to themselves.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const effectiveStaffId =
    actor.role === UserRole.STAFF ? actor.id : input.staffId;

  try {
    return await prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.findFirst({
        where: {
          id: input.customerId,
          organizationId: actor.organizationId,
        },
        select: { id: true },
      });

      if (!customer) {
        throw new AppError(
          "Customer not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (input.caseProfileId) {
        await findCaseForCustomer(
          transaction,
          input.caseProfileId,
          input.customerId,
          actor.organizationId,
        );
      }

      if (effectiveStaffId) {
        await findAssignableUser(
          transaction,
          effectiveStaffId,
          actor.organizationId,
        );
      }

      return transaction.appointment.create({
        data: {
          organizationId: actor.organizationId,
          customerId: input.customerId,
          caseProfileId: input.caseProfileId,
          staffId: effectiveStaffId,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          endTime: input.endTime,
          method: input.method,
          note: input.note,
        },
        include: appointmentInclude,
      });
    });
  } catch (error) {
    return throwAppointmentPersistenceError(error);
  }
};

export const updateAppointment = async (
  id: string,
  input: UpdateAppointmentInput,
  actor: SafeUser,
) => {
  if (Object.keys(input).length === 0) {
    throw new AppError(
      "At least one appointment field must be provided.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const currentAppointment =
        await transaction.appointment.findFirst({
          where: {
            id,
            organizationId: actor.organizationId,
          },
          select: {
            customerId: true,
            staffId: true,
            startTime: true,
            endTime: true,
          },
        });

      if (!currentAppointment) {
        throw new AppError(
          "Appointment not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      assertAppointmentAccess(currentAppointment, actor);

      if (
        actor.role === UserRole.STAFF &&
        input.staffId !== undefined &&
        input.staffId !== actor.id
      ) {
        throw new AppError(
          "Staff members cannot assign an appointment to another user.",
          HTTP_STATUS.FORBIDDEN,
        );
      }

      if (input.staffId) {
        await findAssignableUser(
          transaction,
          input.staffId,
          actor.organizationId,
        );
      }

      if (input.caseProfileId) {
        await findCaseForCustomer(
          transaction,
          input.caseProfileId,
          currentAppointment.customerId,
          actor.organizationId,
        );
      }

      const effectiveStartTime =
        input.startTime ?? currentAppointment.startTime;
      const effectiveEndTime =
        input.endTime === undefined
          ? currentAppointment.endTime
          : input.endTime;
      assertValidTimeRange(effectiveStartTime, effectiveEndTime);

      return transaction.appointment.update({
        where: { id },
        data: input,
        include: appointmentInclude,
      });
    });
  } catch (error) {
    return throwAppointmentPersistenceError(error);
  }
};

export const updateAppointmentStatus = async (
  id: string,
  input: UpdateAppointmentStatusInput,
  actor: SafeUser,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const currentAppointment =
        await transaction.appointment.findFirst({
          where: {
            id,
            organizationId: actor.organizationId,
          },
          select: {
            staffId: true,
            status: true,
          },
        });

      if (!currentAppointment) {
        throw new AppError(
          "Appointment not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      assertAppointmentAccess(currentAppointment, actor);

      if (currentAppointment.status === input.status) {
        throw new AppError(
          "The appointment already has this status.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (isTerminalAppointmentStatus(currentAppointment.status)) {
        throw new AppError(
          "A completed or cancelled appointment cannot change status.",
          HTTP_STATUS.CONFLICT,
        );
      }

      if (
        !isValidAppointmentTransition(
          currentAppointment.status,
          input.status,
        )
      ) {
        throw new AppError(
          `Invalid appointment status transition from ${currentAppointment.status} to ${input.status}.`,
          HTTP_STATUS.CONFLICT,
        );
      }

      return transaction.appointment.update({
        where: { id },
        data: {
          status: input.status,
        },
        include: appointmentInclude,
      });
    });
  } catch (error) {
    return throwAppointmentPersistenceError(error);
  }
};

export const deleteAppointment = async (
  id: string,
  actor: SafeUser,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const appointment = await transaction.appointment.findFirst({
        where: {
          id,
          organizationId: actor.organizationId,
        },
        select: {
          staffId: true,
          status: true,
        },
      });

      if (!appointment) {
        throw new AppError(
          "Appointment not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      assertAppointmentAccess(appointment, actor);

      if (appointment.status === AppointmentStatus.COMPLETED) {
        throw new AppError(
          "A completed appointment cannot be deleted.",
          HTTP_STATUS.CONFLICT,
        );
      }

      if (
        actor.role === UserRole.STAFF &&
        appointment.status !== AppointmentStatus.PENDING &&
        appointment.status !== AppointmentStatus.CANCELLED
      ) {
        throw new AppError(
          "Staff members can only delete pending or cancelled appointments.",
          HTTP_STATUS.CONFLICT,
        );
      }

      return transaction.appointment.delete({
        where: { id },
        include: appointmentInclude,
      });
    });
  } catch (error) {
    return throwAppointmentPersistenceError(error);
  }
};
