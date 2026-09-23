ALTER TABLE "loan_requests"
  ALTER COLUMN "first_name" DROP NOT NULL,
  ALTER COLUMN "last_name" DROP NOT NULL,
  ALTER COLUMN "amount" DROP NOT NULL;

CREATE TABLE "loan_request_photos" (
  "id" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "file_key" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loan_request_photos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_request_photos_request_id_idx" ON "loan_request_photos"("request_id");
ALTER TABLE "loan_request_photos" ADD CONSTRAINT "loan_request_photos_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "loan_request_photos" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "loan_request_photos" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "loan_request_photos" FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_backend') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "loan_request_photos" TO app_backend;
    CREATE POLICY app_backend_full_access ON "loan_request_photos"
      TO app_backend USING (true) WITH CHECK (true);
  END IF;
END $$;
