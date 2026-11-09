-- CreateEnum
CREATE TYPE "EntryRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "EntryRequest" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "EntryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryRequest_ticketId_status_idx" ON "EntryRequest"("ticketId", "status");

-- CreateIndex
CREATE INDEX "EntryRequest_gateId_status_idx" ON "EntryRequest"("gateId", "status");

-- CreateIndex
CREATE INDEX "EntryRequest_customerId_idx" ON "EntryRequest"("customerId");

-- CreateIndex
CREATE INDEX "EntryRequest_resolvedById_idx" ON "EntryRequest"("resolvedById");

-- AddForeignKey
ALTER TABLE "EntryRequest" ADD CONSTRAINT "EntryRequest_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryRequest" ADD CONSTRAINT "EntryRequest_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryRequest" ADD CONSTRAINT "EntryRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryRequest" ADD CONSTRAINT "EntryRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prevent multiple pending entry requests for the same ticket
CREATE UNIQUE INDEX "EntryRequest_one_pending_per_ticket"
ON "EntryRequest" ("ticketId")
WHERE "status" = 'PENDING';
