CREATE TABLE "client_photo_capture_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "client_id" INTEGER,
    "created_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "uploaded_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "photo_data" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_photo_capture_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_photo_capture_sessions_token_key"
ON "client_photo_capture_sessions"("token");

CREATE INDEX "client_photo_capture_sessions_client_id_created_at_idx"
ON "client_photo_capture_sessions"("client_id", "created_at");

CREATE INDEX "client_photo_capture_sessions_token_expires_at_idx"
ON "client_photo_capture_sessions"("token", "expires_at");

ALTER TABLE "client_photo_capture_sessions"
ADD CONSTRAINT "client_photo_capture_sessions_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "client_photo_capture_sessions"
ADD CONSTRAINT "client_photo_capture_sessions_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
