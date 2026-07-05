import { createHash, randomUUID } from "node:crypto";

import { DocumentStorageProvider as PrismaStorageProvider } from "@prisma/client";

import {
  getConfiguredPrismaStorageProvider,
  getConfiguredStorageBucket,
  getConfiguredStorageProviderName,
  getConfiguredStorageRegion,
} from "./storage.config";
import { LocalStorageProvider } from "./providers/localStorage.provider";
import { S3StorageProvider } from "./providers/s3Storage.provider";
import type { DocumentStorageProvider } from "./storage.types";

let providerInstance: DocumentStorageProvider | null = null;

const getStorageProvider = (): DocumentStorageProvider => {
  if (providerInstance) {
    return providerInstance;
  }

  providerInstance =
    getConfiguredStorageProviderName() === "s3"
      ? new S3StorageProvider()
      : new LocalStorageProvider();

  return providerInstance;
};

const toSafeObjectFileName = (fileName: string): string =>
  fileName
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 180) || "document";

export const createDocumentObjectKey = ({
  organizationId,
  documentId,
  fileName,
}: {
  organizationId: string;
  documentId: string;
  fileName: string;
}): string =>
  [
    "documents",
    organizationId,
    documentId,
    `${randomUUID()}-${toSafeObjectFileName(fileName)}`,
  ].join("/");

export const calculateSha256 = (buffer: Buffer): string =>
  createHash("sha256").update(buffer).digest("hex");

export const documentStorageService = {
  uploadObject: (input: Parameters<DocumentStorageProvider["uploadObject"]>[0]) =>
    getStorageProvider().uploadObject(input),
  getDownloadStream: (
    input: Parameters<DocumentStorageProvider["getDownloadStream"]>[0],
  ) => getStorageProvider().getDownloadStream(input),
  getSignedDownloadUrl: (
    input: Parameters<DocumentStorageProvider["getSignedDownloadUrl"]>[0],
  ) => getStorageProvider().getSignedDownloadUrl(input),
  deleteObject: (input: Parameters<DocumentStorageProvider["deleteObject"]>[0]) =>
    getStorageProvider().deleteObject(input),
  objectExists: (input: Parameters<DocumentStorageProvider["objectExists"]>[0]) =>
    getStorageProvider().objectExists(input),
  getPrismaStorageProvider: (): PrismaStorageProvider =>
    getConfiguredPrismaStorageProvider(),
  getStorageBucket: (): string | null => getConfiguredStorageBucket(),
  getStorageRegion: (): string | null => getConfiguredStorageRegion(),
};
