import { DocumentStorageProvider as PrismaStorageProvider } from "@prisma/client";

import { env } from "../../config/env";
import type { StorageProviderName } from "./storage.types";

export const getConfiguredStorageProviderName = (): StorageProviderName =>
  env.DOCUMENT_STORAGE_PROVIDER;

export const getConfiguredPrismaStorageProvider =
  (): PrismaStorageProvider =>
    env.DOCUMENT_STORAGE_PROVIDER === "s3"
      ? PrismaStorageProvider.S3
      : PrismaStorageProvider.LOCAL;

export const getConfiguredStorageBucket = (): string | null =>
  env.DOCUMENT_STORAGE_PROVIDER === "s3"
    ? (env.DOCUMENT_STORAGE_BUCKET ?? null)
    : null;

export const getConfiguredStorageRegion = (): string | null =>
  env.DOCUMENT_STORAGE_PROVIDER === "s3"
    ? (env.DOCUMENT_STORAGE_REGION ?? null)
    : null;
