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
}

export const getLowercaseFileExtension = (
  fileName: string,
): string => path.extname(fileName).toLowerCase();

export const assertValidUploadFile = ({
  originalName,
  mimeType,
  size,
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
