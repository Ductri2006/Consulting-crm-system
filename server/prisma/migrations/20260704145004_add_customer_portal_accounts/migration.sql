-- CreateTable
CREATE TABLE "CustomerPortalAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPortalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPortalAccount_customerId_key" ON "CustomerPortalAccount"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPortalAccount_organizationId_isActive_idx" ON "CustomerPortalAccount"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerPortalAccount_customerId_idx" ON "CustomerPortalAccount"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPortalAccount_email_idx" ON "CustomerPortalAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPortalAccount_organizationId_email_key" ON "CustomerPortalAccount"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "CustomerPortalAccount" ADD CONSTRAINT "CustomerPortalAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPortalAccount" ADD CONSTRAINT "CustomerPortalAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
