-- CreateEnum
CREATE TYPE "CrowdSource" AS ENUM ('STAFF_MANUAL', 'ADMIN_MANUAL', 'QR_SCAN');

-- CreateEnum
CREATE TYPE "CrowdUpdateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "SiteCrowdState" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "currentOccupancy" INTEGER,
    "lastUpdatedAt" TIMESTAMP(3),
    "source" "CrowdSource",
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCrowdState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrowdUpdate" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "reportedOccupancy" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "CrowdUpdateStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CrowdUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteCrowdState_siteId_key" ON "SiteCrowdState"("siteId");

-- CreateIndex
CREATE INDEX "CrowdUpdate_siteId_status_idx" ON "CrowdUpdate"("siteId", "status");

-- CreateIndex
CREATE INDEX "CrowdUpdate_submittedById_idx" ON "CrowdUpdate"("submittedById");

-- AddForeignKey
ALTER TABLE "SiteCrowdState" ADD CONSTRAINT "SiteCrowdState_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "HeritageSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCrowdState" ADD CONSTRAINT "SiteCrowdState_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdUpdate" ADD CONSTRAINT "CrowdUpdate_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "HeritageSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdUpdate" ADD CONSTRAINT "CrowdUpdate_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrowdUpdate" ADD CONSTRAINT "CrowdUpdate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
