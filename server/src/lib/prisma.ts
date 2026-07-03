import { PrismaClient } from "@prisma/client";

import { env } from "../config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    transactionOptions: {
      maxWait: 10_000,
      timeout: 15_000,
    },
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
