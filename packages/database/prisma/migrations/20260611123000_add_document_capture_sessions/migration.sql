CREATE TABLE "document_capture_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_capture_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "document_capture_sessions_token_key" ON "document_capture_sessions"("token");
CREATE INDEX "document_capture_sessions_client_id_created_at_idx" ON "document_capture_sessions"("client_id", "created_at");
CREATE INDEX "document_capture_sessions_token_expires_at_idx" ON "document_capture_sessions"("token", "expires_at");

ALTER TABLE "document_capture_sessions" ADD CONSTRAINT "document_capture_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_capture_sessions" ADD CONSTRAINT "document_capture_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
