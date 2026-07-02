import { randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { env } from "../config/env";
import { getLowercaseFileExtension } from "./fileValidation";

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);
const publicUploadPrefix = "/uploads/";

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const isSafeStoredFileName = (storedFileName: string): boolean =>
  storedFileName.length > 0 &&
  storedFileName !== "." &&
  storedFileName !== ".." &&
  /^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(storedFileName) &&
  path.basename(storedFileName) === storedFileName &&
  !storedFileName.includes("/") &&
  !storedFileName.includes("\\");

export const ensureUploadDir = async (): Promise<void> => {
  await mkdir(uploadDirectory, { recursive: true });
};

export const buildStoredFileName = (
  originalName: string,
): string => {
  const extension = getLowercaseFileExtension(originalName);

  return `${Date.now()}-${randomUUID()}${extension}`;
};

export const getUploadPath = (
  storedFileName: string,
): string | null =>
  isSafeStoredFileName(storedFileName)
    ? path.join(uploadDirectory, storedFileName)
    : null;

export const buildLocalFileUrl = (
  storedFileName: string,
): string => `${publicUploadPrefix}${storedFileName}`;

export const getLocalFilePathFromUrl = (
  fileUrl: string,
): string | null => {
  const normalizedUrl = fileUrl.replaceAll("\\", "/");
  const storedFileName = normalizedUrl.startsWith(publicUploadPrefix)
    ? normalizedUrl.slice(publicUploadPrefix.length)
    : normalizedUrl.startsWith("uploads/")
      ? normalizedUrl.slice("uploads/".length)
      : "";

  return getUploadPath(storedFileName);
};

export const saveLocalFile = async (
  storedFileName: string,
  contents: Buffer,
): Promise<void> => {
  const localPath = getUploadPath(storedFileName);

  if (!localPath) {
    throw new Error("Invalid stored file name.");
  }

  await ensureUploadDir();
  await writeFile(localPath, contents, { flag: "wx" });
};

export const deleteLocalFile = async (
  fileUrl: string,
): Promise<boolean> => {
  const localPath = getLocalFilePathFromUrl(fileUrl);

  if (!localPath) {
    return false;
  }

  try {
    await unlink(localPath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

export const localFileExists = async (
  localPath: string,
): Promise<boolean> => {
  try {
    await access(localPath);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};
