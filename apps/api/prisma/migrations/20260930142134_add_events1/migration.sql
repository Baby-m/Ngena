-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizerId_fkey";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
