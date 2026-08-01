CREATE TABLE "cash_ledger_exclusions" (
    "id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_ledger_exclusions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cash_ledger_exclusions_source_type_source_id_key"
    ON "cash_ledger_exclusions"("source_type", "source_id");
CREATE INDEX "cash_ledger_exclusions_created_at_idx"
    ON "cash_ledger_exclusions"("created_at" DESC);

ALTER TABLE "cash_ledger_exclusions"
    ADD CONSTRAINT "cash_ledger_exclusions_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
