-- Add a stable, human-readable global loan number while preserving UUID primary keys.
CREATE SEQUENCE "loans_loan_number_seq" START 1;

ALTER TABLE "loans" ADD COLUMN "loan_number" INTEGER;

WITH numbered_loans AS (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS "loan_number"
    FROM "loans"
)
UPDATE "loans"
SET "loan_number" = numbered_loans."loan_number"
FROM numbered_loans
WHERE "loans"."id" = numbered_loans."id";

SELECT setval(
    '"loans_loan_number_seq"',
    COALESCE((SELECT MAX("loan_number") FROM "loans"), 0) + 1,
    false
);

ALTER TABLE "loans"
    ALTER COLUMN "loan_number" SET DEFAULT nextval('"loans_loan_number_seq"'),
    ALTER COLUMN "loan_number" SET NOT NULL;

CREATE UNIQUE INDEX "loans_loan_number_key" ON "loans"("loan_number");
