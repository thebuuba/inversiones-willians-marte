ALTER TABLE "documents" ADD COLUMN "original_file_url" TEXT;
ALTER TABLE "documents" ADD COLUMN "processed_file_url" TEXT;
ALTER TABLE "documents" ADD COLUMN "document_type" TEXT NOT NULL DEFAULT 'otro';
ALTER TABLE "documents" ADD COLUMN "detection_confidence" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "documents" ADD COLUMN "processing_status" TEXT NOT NULL DEFAULT 'not_applicable';
ALTER TABLE "documents" ADD COLUMN "processing_notes" TEXT;

UPDATE "documents"
SET "original_file_url" = "file_url"
WHERE "original_file_url" IS NULL;

CREATE INDEX "documents_document_type_idx" ON "documents"("document_type");
CREATE INDEX "documents_processing_status_idx" ON "documents"("processing_status");
