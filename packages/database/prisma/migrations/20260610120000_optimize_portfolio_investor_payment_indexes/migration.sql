-- Optimize portfolio loan listings ordered by creation date.
DROP INDEX IF EXISTS "loans_portfolio_id_idx";
CREATE INDEX "loans_portfolio_id_created_at_idx" ON "loans"("portfolio_id", "created_at");

-- Optimize investor payment history ordered by period.
DROP INDEX IF EXISTS "investor_payments_investor_id_idx";
CREATE INDEX "investor_payments_investor_id_period_year_period_month_idx"
  ON "investor_payments"("investor_id", "period_year" DESC, "period_month" DESC);
