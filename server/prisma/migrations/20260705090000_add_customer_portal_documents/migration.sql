CREATE TYPE "DocumentSource" AS ENUM ('INTERNAL', 'CUSTOMER_PORTAL');

CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL_ONLY', 'CUSTOMER_VISIBLE');

ALTER TABLE "Document"
ADD COLUMN "source" "DocumentSource" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL_ONLY',
ADD COLUMN "uploadedByPortalAccountId" TEXT,
ADD COLUMN "portalVisibilityUpdatedAt" TIMESTAMP(3),
ADD COLUMN "portalVisibilityUpdatedById" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Document_uploadedByPortalAccountId_idx" ON "Document"("uploadedByPortalAccountId");

CREATE INDEX "Document_portalVisibilityUpdatedById_idx" ON "Document"("portalVisibilityUpdatedById");

CREATE INDEX "Document_source_idx" ON "Document"("source");

CREATE INDEX "Document_visibility_idx" ON "Document"("visibility");

CREATE INDEX "Document_organizationId_customerId_visibility_createdAt_idx" ON "Document"("organizationId", "customerId", "visibility", "createdAt");

CREATE INDEX "Document_organizationId_caseProfileId_visibility_createdAt_idx" ON "Document"("organizationId", "caseProfileId", "visibility", "createdAt");

CREATE INDEX "Document_organizationId_source_createdAt_idx" ON "Document"("organizationId", "source", "createdAt");

ALTER TABLE "Document"
ADD CONSTRAINT "Document_uploadedByPortalAccountId_fkey"
FOREIGN KEY ("uploadedByPortalAccountId")
REFERENCES "CustomerPortalAccount"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "Document"
ADD CONSTRAINT "Document_portalVisibilityUpdatedById_fkey"
FOREIGN KEY ("portalVisibilityUpdatedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
