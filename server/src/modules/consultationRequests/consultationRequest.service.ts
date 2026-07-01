import { Prisma } from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type {
  ConsultationRequestListQuery,
  CreateConsultationRequestInput,
  UpdateConsultationRequestStatusInput,
} from "./consultationRequest.types";

const serviceSummarySelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
} satisfies Prisma.ServiceSelect;

const consultationRequestWithService = {
  service: {
    select: serviceSummarySelect,
  },
} satisfies Prisma.ConsultationRequestInclude;

const publicConsultationRequestSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  serviceId: true,
  message: true,
  status: true,
  createdAt: true,
  service: {
    select: serviceSummarySelect,
  },
} satisfies Prisma.ConsultationRequestSelect;

export const createConsultationRequest = async (
  input: CreateConsultationRequestInput,
) => {
  if (input.serviceId) {
    const service = await prisma.service.findFirst({
      where: {
        id: input.serviceId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!service) {
      throw new AppError(
        "Selected service is not available.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  try {
    return await prisma.consultationRequest.create({
      data: input,
      select: publicConsultationRequestSelect,
    });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        "Selected service is not available.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    throw error;
  }
};

export const findConsultationRequests = async (
  query: ConsultationRequestListQuery,
) => {
  const { page, limit, search, status, serviceId } = query;
  const where: Prisma.ConsultationRequestWhereInput = {
    ...(status && { status }),
    ...(serviceId && { serviceId }),
    ...(search && {
      OR: [
        {
          fullName: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          phone: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          email: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          message: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.consultationRequest.findMany({
      where,
      ...pagination,
      include: consultationRequestWithService,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.consultationRequest.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findConsultationRequestById = async (id: string) => {
  const request = await prisma.consultationRequest.findUnique({
    where: { id },
    include: consultationRequestWithService,
  });

  if (!request) {
    throw new AppError(
      "Consultation request not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  return request;
};

export const updateConsultationRequestStatus = async (
  id: string,
  input: UpdateConsultationRequestStatusInput,
) => {
  await findConsultationRequestById(id);

  try {
    return await prisma.consultationRequest.update({
      where: { id },
      data: {
        status: input.status,
      },
      include: consultationRequestWithService,
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError(
        "Consultation request not found.",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    throw error;
  }
};
