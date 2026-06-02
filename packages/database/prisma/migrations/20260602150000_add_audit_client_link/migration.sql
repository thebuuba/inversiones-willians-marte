ALTER TABLE "audit_logs" ADD COLUMN "client_id" INTEGER;

CREATE INDEX "audit_logs_client_id_created_at_idx" ON "audit_logs"("client_id", "created_at");

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "clients"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
