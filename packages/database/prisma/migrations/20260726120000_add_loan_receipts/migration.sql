ALTER TABLE "system_settings"
  ADD COLUMN IF NOT EXISTS "company_name" TEXT NOT NULL DEFAULT 'Inversiones Willians Marte',
  ADD COLUMN IF NOT EXISTS "company_tax_id" TEXT,
  ADD COLUMN IF NOT EXISTS "company_email" TEXT,
  ADD COLUMN IF NOT EXISTS "company_phone" TEXT,
  ADD COLUMN IF NOT EXISTS "company_address" TEXT;

CREATE TABLE "loan_receipts" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "receipt_number" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "generated_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_receipts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "loan_receipts_loan_id_fkey"
    FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "loan_receipts_generated_by_fkey"
    FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "loan_receipts_loan_id_key" ON "loan_receipts"("loan_id");
CREATE UNIQUE INDEX "loan_receipts_receipt_number_key" ON "loan_receipts"("receipt_number");
CREATE INDEX "loan_receipts_created_at_idx" ON "loan_receipts"("created_at");
