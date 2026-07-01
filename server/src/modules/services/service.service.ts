import { Prisma, type Service } from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type {
  CreateServiceInput,
  PublicService,
  ServiceListQuery,
  ServiceListResult,
  UpdateServiceInput,
} from "./service.types";

const createServiceSlug = (name: string): string => {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new AppError(
      "A URL-friendly slug could not be generated from the service name.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return slug;
};

const throwUniqueConstraintError = (error: unknown): never => {
  if (!isPrismaError(error, "P2002")) {
    throw error;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];

  if (fields.includes("name")) {
    throw new AppError(
      "A service with this name already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (fields.includes("slug")) {
    throw new AppError(
      "A service with this slug already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw new AppError(
    "A service with this name or slug already exists.",
    HTTP_STATUS.CONFLICT,
  );
};

const assertServiceIsUnique = async (
  name: string | undefined,
  slug: string | undefined,
  excludeId?: string,
): Promise<void> => {
  const uniqueValues: Prisma.ServiceWhereInput[] = [];

  if (name !== undefined) {
    uniqueValues.push({ name });
  }

  if (slug !== undefined) {
    uniqueValues.push({ slug });
  }

  if (uniqueValues.length === 0) {
    return;
  }

  const duplicate = await prisma.service.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: uniqueValues,
    },
    select: {
      name: true,
      slug: true,
    },
  });

  if (!duplicate) {
    return;
  }

  if (name !== undefined && duplicate.name === name) {
    throw new AppError(
      "A service with this name already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw new AppError(
    "A service with this slug already exists.",
    HTTP_STATUS.CONFLICT,
  );
};

export const findServices = async (
  query: ServiceListQuery,
): Promise<ServiceListResult> => {
  const { page, limit, search } = query;
  const { skip, take } = getPagination(page, limit);
  const where: Prisma.ServiceWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
    }),
    prisma.service.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findServiceById = async (id: string): Promise<Service> => {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new AppError("Service not found.", HTTP_STATUS.NOT_FOUND);
  }

  return service;
};

export const findPublicServices = async (): Promise<PublicService[]> =>
  prisma.service.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
    },
    orderBy: { name: "asc" },
  });

export const createService = async (
  input: CreateServiceInput,
): Promise<Service> => {
  const slug = input.slug ?? createServiceSlug(input.name);

  await assertServiceIsUnique(input.name, slug);

  try {
    return await prisma.service.create({
      data: {
        ...input,
        slug,
      },
    });
  } catch (error) {
    return throwUniqueConstraintError(error);
  }
};

export const updateService = async (
  id: string,
  input: UpdateServiceInput,
): Promise<Service> => {
  await findServiceById(id);

  const slug =
    input.slug ?? (input.name ? createServiceSlug(input.name) : undefined);

  await assertServiceIsUnique(input.name, slug, id);

  try {
    return await prisma.service.update({
      where: { id },
      data: {
        ...input,
        ...(slug !== undefined ? { slug } : {}),
      },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError("Service not found.", HTTP_STATUS.NOT_FOUND);
    }

    return throwUniqueConstraintError(error);
  }
};

export const deleteService = async (id: string): Promise<Service> => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          cases: true,
          requests: true,
        },
      },
    },
  });

  if (!service) {
    throw new AppError("Service not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (service._count.cases > 0 || service._count.requests > 0) {
    throw new AppError(
      "Service cannot be deleted because it is linked to cases or consultation requests.",
      HTTP_STATUS.CONFLICT,
    );
  }

  try {
    return await prisma.service.delete({
      where: { id },
    });
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      throw new AppError("Service not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        "Service cannot be deleted because it is linked to other records.",
        HTTP_STATUS.CONFLICT,
      );
    }

    throw error;
  }
};
