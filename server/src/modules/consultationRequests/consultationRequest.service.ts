import { Prisma } from "@prisma/client";

import { env } from "../../config/env";
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
  const organization = await prisma.organization.findFirst({
    where: {
      slug: env.DEFAULT_ORGANIZATION_SLUG,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!organization) {
    throw new AppError(
      "Default workspace is not configured or is inactive.",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

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
      data: {
        ...input,
        organizationId: organization.id,
      },
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
  organizationId: string,
) => {
  const { page, limit, search, status, serviceId } = query;
  const where: Prisma.ConsultationRequestWhereInput = {
    organizationId,
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

export const findConsultationRequestById = async (
  id: string,
  organizationId: string,
) => {
  const request = await prisma.consultationRequest.findFirst({
    where: {
      id,
      organizationId,
    },
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
  organizationId: string,
) => {
  await findConsultationRequestById(id, organizationId);

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
