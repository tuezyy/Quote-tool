/*
  Warnings:

  - The values [ACCEPTED] on the enum `QuoteStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuoteStatus_new" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED');
ALTER TABLE "quotes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "quotes" ALTER COLUMN "status" TYPE "QuoteStatus_new" USING ("status"::text::"QuoteStatus_new");
ALTER TYPE "QuoteStatus" RENAME TO "QuoteStatus_old";
ALTER TYPE "QuoteStatus_new" RENAME TO "QuoteStatus";
DROP TYPE "QuoteStatus_old";
ALTER TABLE "quotes" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "styles" ADD COLUMN     "description" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
