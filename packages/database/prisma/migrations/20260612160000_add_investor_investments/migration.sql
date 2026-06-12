-- Create investment-specific enums
CREATE TYPE "InvestorInvestmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');
CREATE TYPE "InvestorInvestmentMovementType" AS ENUM ('CAPITAL_ADDITION');

-- Create investments owned by an investor/person
CREATE TABLE "investor_investments" (
    "id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capital" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthly_payment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "term" TEXT,
    "status" "InvestorInvestmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_investments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "investor_investments_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "investors"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investor_investments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "investor_investments_code_key" ON "investor_investments"("code");
CREATE INDEX "investor_investments_investor_id_idx" ON "investor_investments"("investor_id");
CREATE INDEX "investor_investments_created_at_idx" ON "investor_investments"("created_at");

-- Create capital movement history for each investment
CREATE TABLE "investor_investment_movements" (
    "id" TEXT NOT NULL,
    "investment_id" TEXT NOT NULL,
    "type" "InvestorInvestmentMovementType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "movement_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investor_investment_movements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "investor_investment_movements_investment_id_fkey" FOREIGN KEY ("investment_id") REFERENCES "investor_investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "investor_investment_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "investor_investment_movements_investment_id_movement_date_idx"
    ON "investor_investment_movements"("investment_id", "movement_date" DESC);

-- Backfill one initial investment per existing investor.
INSERT INTO "investor_investments" (
    "id",
    "investor_id",
    "code",
    "capital",
    "monthly_payment",
    "rate",
    "start_date",
    "term",
    "status",
    "notes",
    "created_by",
    "created_at",
    "updated_at"
)
SELECT
    'invst-' || "id",
    "id",
    "code" || '-01',
    "capital",
    "monthly_payment",
    "rate",
    "start_date",
    "term",
    CASE
        WHEN "status" = 'PAUSED' THEN 'PAUSED'::"InvestorInvestmentStatus"
        WHEN "status" = 'WITHDRAWN' THEN 'CLOSED'::"InvestorInvestmentStatus"
        ELSE 'ACTIVE'::"InvestorInvestmentStatus"
    END,
    "notes",
    "created_by",
    "created_at",
    "updated_at"
FROM "investors"
ON CONFLICT ("code") DO NOTHING;

-- Link existing investor payments to their initial investment.
ALTER TABLE "investor_payments" ADD COLUMN "investment_id" TEXT;

UPDATE "investor_payments" AS payment
SET "investment_id" = investment."id"
FROM "investor_investments" AS investment
WHERE investment."investor_id" = payment."investor_id";

ALTER TABLE "investor_payments"
    ADD CONSTRAINT "investor_payments_investment_id_fkey"
    FOREIGN KEY ("investment_id") REFERENCES "investor_investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "investor_payments_investor_id_period_year_period_month_idx";
DROP INDEX IF EXISTS "investor_payments_investor_id_idx";
ALTER TABLE "investor_payments" DROP CONSTRAINT IF EXISTS "investor_payments_investor_id_period_month_period_year_key";

CREATE UNIQUE INDEX "investor_payments_investment_id_period_month_period_year_key"
    ON "investor_payments"("investment_id", "period_month", "period_year");
CREATE INDEX "investor_payments_investor_id_period_year_period_month_idx"
    ON "investor_payments"("investor_id", "period_year" DESC, "period_month" DESC);
CREATE INDEX "investor_payments_investment_id_period_year_period_month_idx"
    ON "investor_payments"("investment_id", "period_year" DESC, "period_month" DESC);
