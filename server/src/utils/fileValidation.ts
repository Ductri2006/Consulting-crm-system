import path from "node:path";

import { env } from "../config/env";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "./AppError";

const extensionsByMimeType: Readonly<
  Record<string, readonly string[]>
> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    [".xlsx"],
};

const forbiddenExtensionPattern =
  /\.(?:exe|js|ts|html?|bat|cmd|com|sh|ps1)(?:\.|$)/i;

export const MAX_FILE_SIZE_BYTES =
  env.MAX_FILE_SIZE_MB * 1024 * 1024;

export interface UploadFileDescriptor {
  originalName: string;
  mimeType: string;
  size?: number;
  buffer?: Buffer;
}

export const getLowercaseFileExtension = (
  fileName: string,
): string => path.extname(fileName).toLowerCase();

export const assertValidUploadFile = ({
  originalName,
  mimeType,
  size,
  buffer,
}: UploadFileDescriptor): void => {
  const normalizedName = originalName.replaceAll("\\", "/");
  const baseName = path.posix.basename(normalizedName);
  const extension = getLowercaseFileExtension(baseName);
  const allowedExtensions = extensionsByMimeType[mimeType];

  if (
    !extension ||
    forbiddenExtensionPattern.test(baseName) ||
    !allowedExtensions?.includes(extension)
  ) {
    throw new AppError(
      "The selected file type or extension is not allowed.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (size !== undefined && size > MAX_FILE_SIZE_BYTES) {
    throw new AppError(
      `File size must not exceed ${env.MAX_FILE_SIZE_MB} MB.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (buffer && !hasExpectedFileSignature(mimeType, buffer)) {
    throw new AppError(
      "The selected file content does not match its declared type.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
};

const startsWithBytes = (
  buffer: Buffer,
  signature: readonly number[],
): boolean =>
  signature.every((byte, index) => buffer[index] === byte);

const hasExpectedFileSignature = (
  mimeType: string,
  buffer: Buffer,
): boolean => {
  if (buffer.length === 0) {
    return false;
  }

  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  if (mimeType === "image/jpeg") {
    return startsWithBytes(buffer, [0xff, 0xd8, 0xff]);
  }

  if (mimeType === "image/png") {
    return startsWithBytes(buffer, [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return startsWithBytes(buffer, [
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ]);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04]);
  }

  return false;
};

export const sanitizeOriginalFileName = (
  originalName: string,
): string => {
  const normalizedName = originalName.replaceAll("\\", "/");
  const baseName = path.posix.basename(normalizedName);
  const extension = getLowercaseFileExtension(baseName);
  const normalizedStem = baseName
    .slice(0, Math.max(0, baseName.length - extension.length))
    .normalize("NFKC");
  const stem = [...normalizedStem]
    .filter((character) => {
      const codePoint = character.codePointAt(0);

      return codePoint !== undefined && codePoint > 31 && codePoint !== 127;
    })
    .join("")
    .replace(/[^a-zA-Z0-9 _.-]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim();
  const safeStem = stem.slice(0, 180) || "document";

  return `${safeStem}${extension}`;
};
