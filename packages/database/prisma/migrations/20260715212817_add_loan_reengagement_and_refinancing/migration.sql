CREATE TYPE "LoanOperationType" AS ENUM ('NORMAL', 'REENGAGEMENT', 'REFINANCE');

ALTER TYPE "ScheduleStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "loans"
  ADD COLUMN "operation_type" "LoanOperationType" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "disbursed_amount" DECIMAL(65, 30);

CREATE TABLE "loan_replacements" (
  "new_loan_id" TEXT NOT NULL,
  "source_loan_id" TEXT NOT NULL,
  "settlement_amount" DECIMAL(65, 30) NOT NULL,
  CONSTRAINT "loan_replacements_pkey" PRIMARY KEY ("new_loan_id", "source_loan_id"),
  CONSTRAINT "loan_replacements_new_loan_id_fkey"
    FOREIGN KEY ("new_loan_id") REFERENCES "loans"("id") ON DELETE CASCADE,
  CONSTRAINT "loan_replacements_source_loan_id_fkey"
    FOREIGN KEY ("source_loan_id") REFERENCES "loans"("id")
);

CREATE INDEX "loan_replacements_source_loan_id_idx"
  ON "loan_replacements"("source_loan_id");

ALTER TABLE "loan_replacements" ENABLE ROW LEVEL SECURITY;
