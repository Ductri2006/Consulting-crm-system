import type { Readable } from "node:stream";

export type StorageProviderName = "local" | "s3";

export interface UploadObjectInput {
  objectKey: string;
  buffer: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface DownloadObjectInput {
  objectKey: string;
}

export interface SignedDownloadUrlInput extends DownloadObjectInput {
  fileName: string;
  contentType?: string;
  expiresInSeconds: number;
}

export interface DeleteObjectInput {
  objectKey: string;
}

export interface ObjectExistsInput {
  objectKey: string;
}

export interface DownloadObjectResult {
  stream: Readable;
  contentLength?: number;
  contentType?: string;
}

export interface DocumentStorageProvider {
  uploadObject(input: UploadObjectInput): Promise<void>;
  getDownloadStream(input: DownloadObjectInput): Promise<DownloadObjectResult>;
  getSignedDownloadUrl(input: SignedDownloadUrlInput): Promise<string>;
  deleteObject(input: DeleteObjectInput): Promise<boolean>;
  objectExists(input: ObjectExistsInput): Promise<boolean>;
}
