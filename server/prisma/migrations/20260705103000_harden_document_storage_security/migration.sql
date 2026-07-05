CREATE TYPE "DocumentStorageProvider" AS ENUM ('LOCAL', 'S3');

CREATE TYPE "DocumentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED', 'SKIPPED');

CREATE TYPE "DocumentOcrStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED', 'SKIPPED');

CREATE TYPE "DocumentDownloadActorType" AS ENUM ('INTERNAL_USER', 'CUSTOMER_PORTAL');

ALTER TABLE "Document"
ADD COLUMN "storageProvider" "DocumentStorageProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "storageBucket" TEXT,
ADD COLUMN "storageRegion" TEXT,
ADD COLUMN "checksumSha256" TEXT,
ADD COLUMN "scanStatus" "DocumentScanStatus" NOT NULL DEFAULT 'SKIPPED',
ADD COLUMN "scanMessage" TEXT,
ADD COLUMN "scannedAt" TIMESTAMP(3),
ADD COLUMN "ocrStatus" "DocumentOcrStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "ocrText" TEXT,
ADD COLUMN "ocrTextPreview" TEXT,
ADD COLUMN "ocrProcessedAt" TIMESTAMP(3),
ADD COLUMN "lastDownloadedAt" TIMESTAMP(3),
ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "DocumentDownloadAudit" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorPortalAccountId" TEXT,
  "actorType" "DocumentDownloadActorType" NOT NULL,
  "customerId" TEXT,
  "caseProfileId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocumentDownloadAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_storageProvider_idx" ON "Document"("storageProvider");

CREATE INDEX "Document_scanStatus_idx" ON "Document"("scanStatus");

CREATE INDEX "Document_ocrStatus_idx" ON "Document"("ocrStatus");

CREATE INDEX "Document_lastDownloadedAt_idx" ON "Document"("lastDownloadedAt");

CREATE INDEX "Document_organizationId_scanStatus_createdAt_idx" ON "Document"("organizationId", "scanStatus", "createdAt");

CREATE INDEX "DocumentDownloadAudit_organizationId_createdAt_idx" ON "DocumentDownloadAudit"("organizationId", "createdAt");

CREATE INDEX "DocumentDownloadAudit_documentId_createdAt_idx" ON "DocumentDownloadAudit"("documentId", "createdAt");

CREATE INDEX "DocumentDownloadAudit_actorUserId_createdAt_idx" ON "DocumentDownloadAudit"("actorUserId", "createdAt");

CREATE INDEX "DocumentDownloadAudit_actorPortalAccountId_createdAt_idx" ON "DocumentDownloadAudit"("actorPortalAccountId", "createdAt");

CREATE INDEX "DocumentDownloadAudit_actorType_createdAt_idx" ON "DocumentDownloadAudit"("actorType", "createdAt");

CREATE INDEX "DocumentDownloadAudit_customerId_createdAt_idx" ON "DocumentDownloadAudit"("customerId", "createdAt");

CREATE INDEX "DocumentDownloadAudit_caseProfileId_createdAt_idx" ON "DocumentDownloadAudit"("caseProfileId", "createdAt");

ALTER TABLE "DocumentDownloadAudit"
ADD CONSTRAINT "DocumentDownloadAudit_organizationId_fkey"
FOREIGN KEY ("organizationId")
REFERENCES "Organization"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "DocumentDownloadAudit"
ADD CONSTRAINT "DocumentDownloadAudit_documentId_fkey"
FOREIGN KEY ("documentId")
REFERENCES "Document"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "DocumentDownloadAudit"
ADD CONSTRAINT "DocumentDownloadAudit_actorUserId_fkey"
FOREIGN KEY ("actorUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "DocumentDownloadAudit"
ADD CONSTRAINT "DocumentDownloadAudit_actorPortalAccountId_fkey"
FOREIGN KEY ("actorPortalAccountId")
REFERENCES "CustomerPortalAccount"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
