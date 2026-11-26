-- CreateTable
CREATE TABLE "SavedPlace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPlace_siteId_idx" ON "SavedPlace"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPlace_userId_siteId_key" ON "SavedPlace"("userId", "siteId");

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPlace" ADD CONSTRAINT "SavedPlace_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "HeritageSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
