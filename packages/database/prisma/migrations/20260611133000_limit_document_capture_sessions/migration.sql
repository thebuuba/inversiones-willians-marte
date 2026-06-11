ALTER TABLE "document_capture_sessions" ADD COLUMN "closed_at" TIMESTAMP(3);
ALTER TABLE "document_capture_sessions" ADD COLUMN "upload_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "document_capture_sessions" ADD COLUMN "max_uploads" INTEGER NOT NULL DEFAULT 5;
