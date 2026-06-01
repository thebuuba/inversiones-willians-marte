-- Simplify UserRole enum: remove MANAGER and VIEWER, keep only ADMIN and COLLECTOR
-- Update existing MANAGER and VIEWER users to ADMIN first
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'MANAGER' OR "role" = 'VIEWER';

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COLLECTOR');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";
