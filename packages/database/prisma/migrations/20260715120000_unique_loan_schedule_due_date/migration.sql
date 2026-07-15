-- A loan can only have one scheduled installment on a given due date.
-- This makes rolling indefinite schedules safe under concurrent requests.
DROP INDEX IF EXISTS "payment_schedule_loan_id_due_date_idx";
CREATE UNIQUE INDEX "payment_schedule_loan_id_due_date_key"
ON "payment_schedule"("loan_id", "due_date");
