-- Bar SOS: atribuição de funcionários, alertas e encaminhamento.
ALTER TYPE "UserRole" ADD VALUE 'BAR_STAFF';

CREATE TYPE "BarSosStatus" AS ENUM ('PENDING', 'FORWARDED', 'RESOLVED');

CREATE TABLE "BarStaff" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BarStaff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BarSos" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "message" VARCHAR(500) NOT NULL,
  "status" "BarSosStatus" NOT NULL DEFAULT 'PENDING',
  "activeKey" TEXT,
  "forwardedById" TEXT,
  "assignedManagerId" TEXT,
  "resolvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "forwardedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "BarSos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BarStaff_eventId_userId_key" ON "BarStaff"("eventId", "userId");
CREATE INDEX "BarStaff_userId_idx" ON "BarStaff"("userId");
CREATE UNIQUE INDEX "BarSos_activeKey_key" ON "BarSos"("activeKey");
CREATE INDEX "BarSos_eventId_status_idx" ON "BarSos"("eventId", "status");
CREATE INDEX "BarSos_requestedById_idx" ON "BarSos"("requestedById");
CREATE INDEX "BarSos_assignedManagerId_status_idx" ON "BarSos"("assignedManagerId", "status");

ALTER TABLE "BarStaff" ADD CONSTRAINT "BarStaff_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarStaff" ADD CONSTRAINT "BarStaff_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarSos" ADD CONSTRAINT "BarSos_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BarSos" ADD CONSTRAINT "BarSos_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BarSos" ADD CONSTRAINT "BarSos_forwardedById_fkey"
  FOREIGN KEY ("forwardedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BarSos" ADD CONSTRAINT "BarSos_assignedManagerId_fkey"
  FOREIGN KEY ("assignedManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BarSos" ADD CONSTRAINT "BarSos_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
