-- Receipt numbers are user-facing financial identifiers and must never be duplicated.
CREATE UNIQUE INDEX "investor_payments_receipt_number_key"
ON "investor_payments"("receipt_number");
