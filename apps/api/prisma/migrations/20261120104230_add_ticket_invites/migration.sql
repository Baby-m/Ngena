-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'CLAIMED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TicketInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "ticketId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "claimedById" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketInvite_token_key" ON "TicketInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TicketInvite_ticketId_key" ON "TicketInvite"("ticketId");

-- CreateIndex
CREATE INDEX "TicketInvite_createdById_idx" ON "TicketInvite"("createdById");

-- CreateIndex
CREATE INDEX "TicketInvite_claimedById_idx" ON "TicketInvite"("claimedById");

-- AddForeignKey
ALTER TABLE "TicketInvite" ADD CONSTRAINT "TicketInvite_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketInvite" ADD CONSTRAINT "TicketInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketInvite" ADD CONSTRAINT "TicketInvite_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
