import { Prisma, type Customer } from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListQuery,
  CustomerListResult,
  UpdateCustomerInput,
} from "./customer.types";

const customerRelatedCountSelection = {
  cases: true,
  appointments: true,
  documents: true,
} as const;

const throwCustomerWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "A customer with this identity number already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
  }

  throw error;
};

export const getCustomers = async (
  query: CustomerListQuery,
): Promise<CustomerListResult> => {
  const { page, limit, search } = query;
  const { skip, take } = getPagination(page, limit);
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          {
            identityNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const getCustomerById = async (
  customerId: string,
): Promise<CustomerDetail> => {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      _count: {
        select: customerRelatedCountSelection,
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
  }

  const { _count, ...customerData } = customer;

  return {
    ...customerData,
    relatedCounts: _count,
  };
};

export const createCustomer = async (
  input: CreateCustomerInput,
): Promise<Customer> => {
  try {
    return await prisma.customer.create({
      data: input,
    });
  } catch (error) {
    return throwCustomerWriteError(error);
  }
};

export const updateCustomer = async (
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> => {
  try {
    return await prisma.customer.update({
      where: { id: customerId },
      data: input,
    });
  } catch (error) {
    return throwCustomerWriteError(error);
  }
};

export const deleteCustomer = async (
  customerId: string,
): Promise<Customer> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const customer = await transaction.customer.findUnique({
        where: { id: customerId },
        include: {
          _count: {
            select: customerRelatedCountSelection,
          },
        },
      });

      if (!customer) {
        throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
      }

      const hasRelatedRecords =
        customer._count.cases > 0 ||
        customer._count.appointments > 0 ||
        customer._count.documents > 0;

      if (hasRelatedRecords) {
        throw new AppError(
          "Customer cannot be deleted because related cases, appointments, or documents exist.",
          HTTP_STATUS.CONFLICT,
        );
      }

      return transaction.customer.delete({
        where: { id: customerId },
      });
    });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      throw new AppError(
        "Customer cannot be deleted because related records exist.",
        HTTP_STATUS.CONFLICT,
      );
    }

    if (isPrismaError(error, "P2025")) {
      throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
    }

    throw error;
  }
};
