CREATE TABLE "loan_capital_movements" (
  "id" TEXT NOT NULL,
  "loan_id" TEXT NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "effective_date" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_capital_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_capital_movements_loan_id_effective_date_idx"
ON "loan_capital_movements"("loan_id", "effective_date");

ALTER TABLE "loan_capital_movements"
ADD CONSTRAINT "loan_capital_movements_loan_id_fkey"
FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_capital_movements"
ADD CONSTRAINT "loan_capital_movements_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
