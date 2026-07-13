CREATE TYPE "CashMovementType" AS ENUM ('IN', 'OUT');

CREATE TABLE "cash_movements" (
    "id" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "person" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "movement_date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "payment_method" TEXT,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cash_movements_movement_date_idx" ON "cash_movements"("movement_date" DESC);
CREATE INDEX "cash_movements_type_movement_date_idx" ON "cash_movements"("type", "movement_date" DESC);

ALTER TABLE "cash_movements"
ADD CONSTRAINT "cash_movements_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cash_movements" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "cash_movements" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "cash_movements" FROM authenticated;
  END IF;
END $$;
