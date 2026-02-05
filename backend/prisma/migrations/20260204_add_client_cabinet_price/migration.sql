-- AlterTable
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "client_cabinet_price" DECIMAL(10,2) NOT NULL DEFAULT 0;
