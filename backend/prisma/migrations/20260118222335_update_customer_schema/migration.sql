/*
  Warnings:

  - You are about to drop the column `name` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `zip` on the `customers` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `customers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "name",
DROP COLUMN "zip",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "zip_code" TEXT,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;
