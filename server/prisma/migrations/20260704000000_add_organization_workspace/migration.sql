-- Step 22: introduce the Organization workspace tenant foundation.
-- This migration backfills all existing CRM data into the default demo workspace
-- without deleting or resetting any staging data.

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Organization_isActive_idx" ON "Organization"("isActive");

-- Backfill target workspace.
INSERT INTO "Organization" (
    "id",
    "name",
    "slug",
    "industry",
    "email",
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Advisora Demo Workspace',
    'advisora-demo',
    'Consulting',
    'workspace@advisora.test',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Add nullable columns first so this is safe for non-empty tables.
ALTER TABLE "User" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ConsultationRequest" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "CaseProfile" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Task" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Document" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "CaseHistory" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "ActivityLog" ADD COLUMN "organizationId" TEXT;

-- Backfill existing data into the default workspace.
UPDATE "User"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "Customer"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "ConsultationRequest"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "CaseProfile"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "Appointment"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "Task"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "Document"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "CaseHistory"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

UPDATE "ActivityLog"
SET "organizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "organizationId" IS NULL;

-- Enforce tenant requirement after backfill.
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ConsultationRequest" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "CaseProfile" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Appointment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Document" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "CaseHistory" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "ActivityLog" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_organizationId_role_isActive_idx" ON "User"("organizationId", "role", "isActive");

-- CreateIndex
CREATE INDEX "Customer_organizationId_phone_idx" ON "Customer"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "Customer_organizationId_email_idx" ON "Customer"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Customer_organizationId_createdAt_idx" ON "Customer"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_organizationId_status_createdAt_idx" ON "ConsultationRequest"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_organizationId_serviceId_status_idx" ON "ConsultationRequest"("organizationId", "serviceId", "status");

-- CreateIndex
CREATE INDEX "ConsultationRequest_organizationId_phone_idx" ON "ConsultationRequest"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "ConsultationRequest_organizationId_email_idx" ON "ConsultationRequest"("organizationId", "email");

-- CreateIndex
CREATE INDEX "CaseProfile_organizationId_customerId_createdAt_idx" ON "CaseProfile"("organizationId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseProfile_organizationId_serviceId_status_idx" ON "CaseProfile"("organizationId", "serviceId", "status");

-- CreateIndex
CREATE INDEX "CaseProfile_organizationId_assignedToId_status_idx" ON "CaseProfile"("organizationId", "assignedToId", "status");

-- CreateIndex
CREATE INDEX "CaseProfile_organizationId_status_deadline_idx" ON "CaseProfile"("organizationId", "status", "deadline");

-- CreateIndex
CREATE INDEX "CaseProfile_organizationId_createdAt_idx" ON "CaseProfile"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseHistory_organizationId_caseProfileId_createdAt_idx" ON "CaseHistory"("organizationId", "caseProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseHistory_organizationId_userId_createdAt_idx" ON "CaseHistory"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_appointmentDate_status_idx" ON "Appointment"("organizationId", "appointmentDate", "status");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_staffId_appointmentDate_idx" ON "Appointment"("organizationId", "staffId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_customerId_appointmentDate_idx" ON "Appointment"("organizationId", "customerId", "appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_organizationId_caseProfileId_idx" ON "Appointment"("organizationId", "caseProfileId");

-- CreateIndex
CREATE INDEX "Task_organizationId_assignedToId_status_idx" ON "Task"("organizationId", "assignedToId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_caseProfileId_status_idx" ON "Task"("organizationId", "caseProfileId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_deadline_idx" ON "Task"("organizationId", "status", "deadline");

-- CreateIndex
CREATE INDEX "Task_organizationId_createdById_idx" ON "Task"("organizationId", "createdById");

-- CreateIndex
CREATE INDEX "Document_organizationId_caseProfileId_createdAt_idx" ON "Document"("organizationId", "caseProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_organizationId_customerId_createdAt_idx" ON "Document"("organizationId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Document_organizationId_uploadedById_idx" ON "Document"("organizationId", "uploadedById");

-- CreateIndex
CREATE INDEX "Document_organizationId_fileType_idx" ON "Document"("organizationId", "fileType");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_userId_createdAt_idx" ON "ActivityLog"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_action_createdAt_idx" ON "ActivityLog"("organizationId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_entityType_entityId_idx" ON "ActivityLog"("organizationId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationRequest" ADD CONSTRAINT "ConsultationRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseProfile" ADD CONSTRAINT "CaseProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseHistory" ADD CONSTRAINT "CaseHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
