-- Create InvestorPayment model
CREATE TABLE "investor_payments" (
    "id"            TEXT         NOT NULL,
    "receipt_number" INTEGER     NOT NULL,
    "investor_id"   TEXT         NOT NULL,
    "amount"        DECIMAL      NOT NULL,
    "period_month"  INTEGER      NOT NULL,
    "period_year"   INTEGER      NOT NULL,
    "payment_date"  TIMESTAMPTZ  NOT NULL,
    "payment_method" TEXT,
    "reference"     TEXT,
    "notes"         TEXT,
    "received_by"   TEXT         NOT NULL,
    "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "investor_payments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investor_payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investor_payments_investor_id_period_month_period_year_key" UNIQUE ("investor_id", "period_month", "period_year")
);

CREATE INDEX "investor_payments_receipt_number_idx" ON "investor_payments"("receipt_number");
CREATE INDEX "investor_payments_investor_id_idx" ON "investor_payments"("investor_id");
CREATE INDEX "investor_payments_payment_date_idx" ON "investor_payments"("payment_date");
