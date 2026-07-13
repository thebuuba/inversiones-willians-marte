-- CreateEnum
CREATE TYPE "CollectionChannel" AS ENUM ('CALL', 'WHATSAPP', 'VISIT', 'SMS', 'EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "CollectionResult" AS ENUM ('CONTACTED', 'NO_ANSWER', 'WRONG_NUMBER', 'PAYMENT_PROMISE', 'EXTENSION_REQUEST', 'DISPUTE', 'REFUSED', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentPromiseStatus" AS ENUM ('PENDING', 'PARTIAL', 'FULFILLED', 'BROKEN', 'CANCELLED');

-- CreateTable
CREATE TABLE "collection_interactions" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "channel" "CollectionChannel" NOT NULL,
    "result" "CollectionResult" NOT NULL,
    "notes" TEXT NOT NULL,
    "next_follow_up_date" DATE,
    "next_follow_up_time" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_promises" (
    "id" TEXT NOT NULL,
    "interaction_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "fulfilled_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due_date" DATE NOT NULL,
    "status" "PaymentPromiseStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_promises_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "client_id" INTEGER,
ADD COLUMN "loan_id" TEXT,
ADD COLUMN "collection_interaction_id" TEXT;

-- Protect backend-owned tables from direct Data API access.
ALTER TABLE "collection_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_promises" ENABLE ROW LEVEL SECURITY;

-- CreateIndex
CREATE INDEX "collection_interactions_loan_id_created_at_idx" ON "collection_interactions"("loan_id", "created_at" DESC);
CREATE INDEX "collection_interactions_client_id_created_at_idx" ON "collection_interactions"("client_id", "created_at" DESC);
CREATE INDEX "collection_interactions_next_follow_up_date_idx" ON "collection_interactions"("next_follow_up_date");
CREATE UNIQUE INDEX "payment_promises_interaction_id_key" ON "payment_promises"("interaction_id");
CREATE INDEX "payment_promises_loan_id_status_due_date_idx" ON "payment_promises"("loan_id", "status", "due_date");
CREATE INDEX "payment_promises_client_id_created_at_idx" ON "payment_promises"("client_id", "created_at" DESC);
CREATE INDEX "payment_promises_status_due_date_idx" ON "payment_promises"("status", "due_date");
CREATE UNIQUE INDEX "tasks_collection_interaction_id_key" ON "tasks"("collection_interaction_id");
CREATE INDEX "tasks_client_id_status_idx" ON "tasks"("client_id", "status");
CREATE INDEX "tasks_loan_id_status_idx" ON "tasks"("loan_id", "status");

-- AddForeignKey
ALTER TABLE "collection_interactions" ADD CONSTRAINT "collection_interactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collection_interactions" ADD CONSTRAINT "collection_interactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collection_interactions" ADD CONSTRAINT "collection_interactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "collection_interactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_collection_interaction_id_fkey" FOREIGN KEY ("collection_interaction_id") REFERENCES "collection_interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
