-- Existing SOS records retain their descriptions and are classified as OTHER.
CREATE TYPE "BarSosCategory" AS ENUM ('OVERCROWDED', 'DRINKS_SHORTAGE', 'ICE_SHORTAGE', 'SECURITY', 'OTHER');
ALTER TABLE "BarSos" ADD COLUMN "category" "BarSosCategory" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "BarSos" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "BarSos" ALTER COLUMN "message" DROP NOT NULL;
