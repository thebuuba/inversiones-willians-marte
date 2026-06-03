-- AlterTable: add receipt_number to investor_payments (already added via db push)
ALTER TABLE "investor_payments" ADD COLUMN IF NOT EXISTS "receipt_number" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "investor_payments_receipt_number_idx" ON "investor_payments"("receipt_number");
