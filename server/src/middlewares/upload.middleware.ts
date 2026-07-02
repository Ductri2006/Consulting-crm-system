import type { RequestHandler } from "express";
import multer from "multer";

import { env } from "../config/env";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import {
  assertValidUploadFile,
  MAX_FILE_SIZE_BYTES,
} from "../utils/fileValidation";

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 3,
  },
  fileFilter: (_request, file, callback) => {
    try {
      assertValidUploadFile({
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      callback(null, true);
    } catch (error) {
      callback(
        error instanceof Error
          ? error
          : new AppError(
              "The selected file is not valid.",
              HTTP_STATUS.BAD_REQUEST,
            ),
      );
    }
  },
}).single("file");

const toUploadError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? `File size must not exceed ${env.MAX_FILE_SIZE_MB} MB.`
        : error.code === "LIMIT_UNEXPECTED_FILE"
          ? "Only one file using the file field can be uploaded."
          : "The multipart upload is not valid.";

    return new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  return new AppError("File upload failed.", HTTP_STATUS.BAD_REQUEST);
};

export const uploadDocumentFile: RequestHandler = (
  request,
  response,
  next,
): void => {
  documentUpload(request, response, (error: unknown) => {
    if (error) {
      next(toUploadError(error));
      return;
    }

    next();
  });
};
