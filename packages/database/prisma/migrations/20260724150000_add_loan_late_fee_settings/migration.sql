ALTER TABLE "loans"
  ADD COLUMN "late_fee_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "late_fee_mode" TEXT NOT NULL DEFAULT 'PER_INSTALLMENT',
  ADD COLUMN "late_fee_calculation" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "late_fee_value" DECIMAL(65,30) NOT NULL DEFAULT 5,
  ADD COLUMN "late_fee_grace_days" INTEGER NOT NULL DEFAULT 5;

ALTER TABLE "late_fees"
  ADD COLUMN "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "late_fees"
SET "paid_amount" = "amount"
WHERE "paid" = true;

CREATE UNIQUE INDEX "late_fees_schedule_id_key" ON "late_fees"("schedule_id");
