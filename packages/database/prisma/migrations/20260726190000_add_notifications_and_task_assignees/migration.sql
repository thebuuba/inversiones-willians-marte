ALTER TABLE "tasks" ADD COLUMN "assigned_to" TEXT;

UPDATE "tasks"
SET "assigned_to" = "created_by"
WHERE "assigned_to" IS NULL;

ALTER TABLE "tasks" ALTER COLUMN "assigned_to" SET NOT NULL;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_assigned_to_fkey"
FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "tasks_assigned_to_status_due_date_idx"
ON "tasks"("assigned_to", "status", "due_date");

CREATE TABLE "notification_reads" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_reads_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "notification_reads_user_id_key_key"
ON "notification_reads"("user_id", "key");

CREATE INDEX "notification_reads_user_id_read_at_idx"
ON "notification_reads"("user_id", "read_at");
