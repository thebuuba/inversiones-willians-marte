/*
  Warnings:

  - You are about to drop the column `name` on the `clients` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `clients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" DROP COLUMN "name",
ADD COLUMN     "alt_phone" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "dependents" INTEGER,
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "photo" TEXT;
