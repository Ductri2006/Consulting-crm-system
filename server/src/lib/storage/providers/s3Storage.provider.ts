import { Readable } from "node:stream";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const getBucket = (): string => {
  if (!env.DOCUMENT_STORAGE_BUCKET) {
    throw new Error("DOCUMENT_STORAGE_BUCKET is required for S3 storage.");
  }

  return env.DOCUMENT_STORAGE_BUCKET;
};

const getS3Client = (): S3Client => {
  if (
    !env.DOCUMENT_STORAGE_REGION ||
    !env.DOCUMENT_STORAGE_ACCESS_KEY_ID ||
    !env.DOCUMENT_STORAGE_SECRET_ACCESS_KEY
  ) {
    throw new Error("S3 document storage is not fully configured.");
  }

  return new S3Client({
    region: env.DOCUMENT_STORAGE_REGION,
    endpoint: env.DOCUMENT_STORAGE_ENDPOINT,
    forcePathStyle: env.DOCUMENT_STORAGE_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.DOCUMENT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.DOCUMENT_STORAGE_SECRET_ACCESS_KEY,
    },
  });
};

const toAttachmentDisposition = (fileName: string): string => {
  const safeFileName = fileName.replace(/["\\\r\n]/g, "_");

  return `attachment; filename="${safeFileName}"`;
};

const toReadable = (body: unknown): Readable => {
  if (body instanceof Readable) {
    return body;
  }

  if (
    body &&
    typeof body === "object" &&
    "transformToWebStream" in body &&
    typeof body.transformToWebStream === "function"
  ) {
    return Readable.fromWeb(body.transformToWebStream());
  }

  throw new Error("S3 object body is not readable.");
};

const isNotFoundError = (error: unknown): boolean =>
  error instanceof Error &&
  ("name" in error &&
    (error.name === "NotFound" ||
      error.name === "NoSuchKey" ||
      error.name === "NoSuchBucket"));

export class S3StorageProvider implements DocumentStorageProvider {
  private readonly client = getS3Client();
  private readonly bucket = getBucket();

  async uploadObject({
    objectKey,
    buffer,
    contentType,
    metadata,
  }: UploadObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      }),
    );
  }

  async getDownloadStream({
    objectKey,
  }: DownloadObjectInput): Promise<DownloadObjectResult> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );

    return {
      stream: toReadable(result.Body),
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    };
  }

  async getSignedDownloadUrl({
    objectKey,
    fileName,
    contentType,
    expiresInSeconds,
  }: SignedDownloadUrlInput): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ResponseContentDisposition: toAttachmentDisposition(fileName),
        ResponseContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    );
  }

  async deleteObject({
    objectKey,
  }: DeleteObjectInput): Promise<boolean> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );

    return true;
  }

  async objectExists({
    objectKey,
  }: ObjectExistsInput): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );
      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }
}
