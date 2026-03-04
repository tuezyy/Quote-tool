-- Add call tracking fields to quotes
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "call_attempted_at" TIMESTAMP(3);
ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "call_outcome" TEXT;

-- Create measurement_appointments table
CREATE TABLE IF NOT EXISTS "measurement_appointments" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'CALL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurement_appointments_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "measurement_appointments_quote_id_idx" ON "measurement_appointments"("quote_id");
CREATE INDEX IF NOT EXISTS "measurement_appointments_scheduled_at_idx" ON "measurement_appointments"("scheduled_at");

-- Foreign keys
ALTER TABLE "measurement_appointments" ADD CONSTRAINT "measurement_appointments_quote_id_fkey"
    FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "measurement_appointments" ADD CONSTRAINT "measurement_appointments_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
