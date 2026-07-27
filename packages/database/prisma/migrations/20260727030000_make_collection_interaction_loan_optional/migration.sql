ALTER TABLE "collection_interactions"
DROP CONSTRAINT "collection_interactions_loan_id_fkey";

ALTER TABLE "collection_interactions"
ALTER COLUMN "loan_id" DROP NOT NULL;

ALTER TABLE "collection_interactions"
ADD CONSTRAINT "collection_interactions_loan_id_fkey"
FOREIGN KEY ("loan_id") REFERENCES "loans"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
