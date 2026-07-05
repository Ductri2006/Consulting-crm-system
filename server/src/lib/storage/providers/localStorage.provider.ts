import { createReadStream } from "node:fs";
import {
  access,
  mkdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { env } from "../../../config/env";
import type {
  DeleteObjectInput,
  DocumentStorageProvider,
  DownloadObjectInput,
  DownloadObjectResult,
  ObjectExistsInput,
  SignedDownloadUrlInput,
  UploadObjectInput,
} from "../storage.types";

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);
const publicUploadPrefix = "/uploads/";

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const normalizeObjectKey = (objectKey: string): string | null => {
  const normalized = objectKey.replaceAll("\\", "/").replace(/^\/+/, "");

  if (
    normalized.length === 0 ||
    normalized.includes("\0") ||
    normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }

  return normalized;
};

const getObjectPath = (objectKey: string): string | null => {
  const normalized = normalizeObjectKey(objectKey);

  if (!normalized) {
    return null;
  }

  const absolutePath = path.resolve(uploadDirectory, normalized);
  const relativePath = path.relative(uploadDirectory, absolutePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  return absolutePath;
};

export const getLegacyLocalObjectKeyFromFileUrl = (
  fileUrl: string,
): string | null => {
  const normalizedUrl = fileUrl.replaceAll("\\", "/");
  const objectKey = normalizedUrl.startsWith(publicUploadPrefix)
    ? normalizedUrl.slice(publicUploadPrefix.length)
    : normalizedUrl.startsWith("uploads/")
      ? normalizedUrl.slice("uploads/".length)
      : "";

  return normalizeObjectKey(objectKey);
};

export const buildLocalFileUrlFromObjectKey = (
  objectKey: string,
): string => `${publicUploadPrefix}${objectKey}`;

export class LocalStorageProvider implements DocumentStorageProvider {
  async uploadObject({
    objectKey,
    buffer,
  }: UploadObjectInput): Promise<void> {
    const objectPath = getObjectPath(objectKey);

    if (!objectPath) {
      throw new Error("Invalid local storage object key.");
    }

    await mkdir(path.dirname(objectPath), { recursive: true });
    await writeFile(objectPath, buffer, { flag: "wx" });
  }

  async getDownloadStream({
    objectKey,
  }: DownloadObjectInput): Promise<DownloadObjectResult> {
    const objectPath = getObjectPath(objectKey);

    if (!objectPath) {
      throw new Error("Invalid local storage object key.");
    }

    const fileStat = await stat(objectPath);

    return {
      stream: createReadStream(objectPath),
      contentLength: fileStat.size,
    };
  }

  async getSignedDownloadUrl({
    objectKey,
  }: SignedDownloadUrlInput): Promise<string> {
    const normalized = normalizeObjectKey(objectKey);

    if (!normalized) {
      throw new Error("Invalid local storage object key.");
    }

    return buildLocalFileUrlFromObjectKey(normalized);
  }

  async deleteObject({
    objectKey,
  }: DeleteObjectInput): Promise<boolean> {
    const objectPath = getObjectPath(objectKey);

    if (!objectPath) {
      return false;
    }

    try {
      await unlink(objectPath);
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  async objectExists({
    objectKey,
  }: ObjectExistsInput): Promise<boolean> {
    const objectPath = getObjectPath(objectKey);

    if (!objectPath) {
      return false;
    }

    try {
      await access(objectPath);
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }
}
