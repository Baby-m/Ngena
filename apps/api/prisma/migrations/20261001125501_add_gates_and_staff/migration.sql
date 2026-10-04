-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "gateId" TEXT;

-- CreateTable
CREATE TABLE "Gate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateStaff" (
    "id" TEXT NOT NULL,
    "gateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GateStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gate_eventId_idx" ON "Gate"("eventId");

-- CreateIndex
CREATE INDEX "GateStaff_userId_idx" ON "GateStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GateStaff_gateId_userId_key" ON "GateStaff"("gateId", "userId");

-- CreateIndex
CREATE INDEX "CheckIn_gateId_idx" ON "CheckIn"("gateId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateStaff" ADD CONSTRAINT "GateStaff_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateStaff" ADD CONSTRAINT "GateStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
