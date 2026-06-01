-- CreateTable Portfolios (Carteras)
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#5FA37D',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add portfolio_id to loans
ALTER TABLE "loans" ADD COLUMN "portfolio_id" TEXT;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
