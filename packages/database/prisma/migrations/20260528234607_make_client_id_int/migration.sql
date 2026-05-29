-- Migration: make client id auto-incrementing integer
-- Converts existing UUIDs to sequential integers (1, 2, 3...)

-- 1. Drop foreign key constraints referencing clients.id
ALTER TABLE "loan_requests" DROP CONSTRAINT "loan_requests_client_id_fkey";
ALTER TABLE "loans" DROP CONSTRAINT "loans_client_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT "payments_client_id_fkey";
ALTER TABLE "documents" DROP CONSTRAINT "documents_client_id_fkey";

-- 2. Clients: add new SERIAL column, drop old UUID PK, rename
ALTER TABLE "clients" ADD COLUMN "id_new" SERIAL;
ALTER TABLE "clients" DROP CONSTRAINT "clients_pkey" CASCADE;
ALTER TABLE "clients" DROP COLUMN "id";
ALTER TABLE "clients" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "clients" ADD PRIMARY KEY ("id");

-- 3. Loans: add new FK column, map data, drop old column, rename
ALTER TABLE "loans" ADD COLUMN "client_id_new" INTEGER;
UPDATE "loans" SET "client_id_new" = "clients"."id" FROM "clients" WHERE "loans"."client_id" = "clients"."id"::text;
ALTER TABLE "loans" DROP COLUMN "client_id";
ALTER TABLE "loans" RENAME COLUMN "client_id_new" TO "client_id";
ALTER TABLE "loans" ALTER COLUMN "client_id" SET NOT NULL;

-- 4. Payments: add new FK column, map data, drop old column, rename
ALTER TABLE "payments" ADD COLUMN "client_id_new" INTEGER;
UPDATE "payments" SET "client_id_new" = "clients"."id" FROM "clients" WHERE "payments"."client_id" = "clients"."id"::text;
ALTER TABLE "payments" DROP COLUMN "client_id";
ALTER TABLE "payments" RENAME COLUMN "client_id_new" TO "client_id";
ALTER TABLE "payments" ALTER COLUMN "client_id" SET NOT NULL;

-- 5. Loan requests: add new FK column, map data, drop old column, rename
ALTER TABLE "loan_requests" ADD COLUMN "client_id_new" INTEGER;
UPDATE "loan_requests" SET "client_id_new" = "clients"."id" FROM "clients" WHERE "loan_requests"."client_id" = "clients"."id"::text;
ALTER TABLE "loan_requests" DROP COLUMN "client_id";
ALTER TABLE "loan_requests" RENAME COLUMN "client_id_new" TO "client_id";

-- 6. Documents: add new FK column, map data, drop old column, rename
ALTER TABLE "documents" ADD COLUMN "client_id_new" INTEGER;
UPDATE "documents" SET "client_id_new" = "clients"."id" FROM "clients" WHERE "documents"."client_id" = "clients"."id"::text;
ALTER TABLE "documents" DROP COLUMN "client_id";
ALTER TABLE "documents" RENAME COLUMN "client_id_new" TO "client_id";

-- 7. Restore foreign keys
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loans" ADD CONSTRAINT "loans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
