-- CreateTable
CREATE TABLE "user_portfolios" (
    "user_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_portfolios_pkey" PRIMARY KEY ("user_id","portfolio_id")
);

-- CreateIndex
CREATE INDEX "user_portfolios_portfolio_id_idx" ON "user_portfolios"("portfolio_id");

-- AddForeignKey
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
