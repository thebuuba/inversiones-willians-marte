# Client Document Smart Crop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic client document type detection and processing status metadata to the existing document upload flow.

**Architecture:** Keep uploads in the existing `DocumentsController`, move classification/processing decisions into a focused `DocumentProcessingService`, and persist processing metadata on `Document`. The first implementation is conservative: it classifies from MIME type and filename, marks images for review until a crop engine is added, and keeps original files downloadable.

**Tech Stack:** NestJS, Prisma, TypeScript, Jest, Next.js/React.

---

### Task 1: Database And Shared Types

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Add: `packages/database/prisma/migrations/20260611120000_add_document_processing_metadata/migration.sql`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Extend Prisma model**

Add these fields to `model Document` after `mimeType`:

```prisma
  originalFileUrl     String? @map("original_file_url")
  processedFileUrl    String? @map("processed_file_url")
  documentType        String  @default("otro") @map("document_type")
  detectionConfidence Int     @default(0) @map("detection_confidence")
  processingStatus    String  @default("not_applicable") @map("processing_status")
  processingNotes     String? @map("processing_notes")
```

Add indexes:

```prisma
  @@index([documentType])
  @@index([processingStatus])
```

- [ ] **Step 2: Add migration SQL**

Create the migration:

```sql
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
```

- [ ] **Step 3: Update shared TypeScript types**

Add shared unions and optional fields:

```ts
export type DocumentType = 'cedula' | 'recibo' | 'acto_notarial' | 'otro';
export type DocumentProcessingStatus = 'pending' | 'processed' | 'needs_review' | 'failed' | 'not_applicable';
```

Extend `DocumentItem`:

```ts
  originalFileUrl?: string;
  processedFileUrl?: string;
  documentType?: DocumentType;
  detectionConfidence?: number;
  processingStatus?: DocumentProcessingStatus;
  processingNotes?: string;
```

### Task 2: Backend Processing Service

**Files:**
- Add: `apps/backend/src/modules/documents/document-processing.service.ts`
- Add: `apps/backend/src/modules/documents/document-processing.service.spec.ts`
- Modify: `apps/backend/src/modules/documents/documents.module.ts`

- [ ] **Step 1: Write failing classification tests**

Test cases:

```ts
it('detects cedula documents from filename hints', () => {});
it('detects recibo documents from filename hints', () => {});
it('detects acto notarial documents from filename hints', () => {});
it('marks unknown images as needs_review', () => {});
it('marks PDFs as not_applicable for crop processing', () => {});
```

Run:

```bash
pnpm --filter backend test -- document-processing.service.spec.ts
```

Expected: fail because the service does not exist.

- [ ] **Step 2: Implement service**

Create:

```ts
export interface UploadedDocumentFile {
  originalname: string;
  filename: string;
  mimetype: string;
}

export interface DocumentProcessingResult {
  originalFileUrl: string;
  processedFileUrl?: string;
  documentType: 'cedula' | 'recibo' | 'acto_notarial' | 'otro';
  detectionConfidence: number;
  processingStatus: 'processed' | 'needs_review' | 'failed' | 'not_applicable';
  processingNotes?: string;
}
```

Classify by normalized filename first, then MIME type. Return `needs_review` for images without a high-confidence type and `not_applicable` for non-images.

- [ ] **Step 3: Register provider**

Add `DocumentProcessingService` to `DocumentsModule.providers`.

### Task 3: Persist Processing Metadata

**Files:**
- Modify: `apps/backend/src/modules/documents/documents.service.ts`
- Modify: `apps/backend/src/modules/documents/documents.controller.ts`
- Modify: `apps/backend/src/modules/documents/documents.service.spec.ts`

- [ ] **Step 1: Write failing service test**

Add a test proving `DocumentsService.create` persists `documentType`, `processingStatus`, `detectionConfidence`, `originalFileUrl`, and `processingNotes`.

- [ ] **Step 2: Inject processing service**

Update `DocumentsService` constructor:

```ts
constructor(
  private audit: AuditService,
  private documentProcessing: DocumentProcessingService,
) {}
```

- [ ] **Step 3: Process file before persistence**

Pass the uploaded file metadata into `DocumentsService.create`, call `documentProcessing.analyze(file)`, and merge the result into `prisma.document.create`.

### Task 4: Client Documents UI

**Files:**
- Modify: `apps/frontend/src/components/clients/client-detail-page.tsx`

- [ ] **Step 1: Stop forcing category general**

Remove:

```ts
fd.append('category', 'general');
```

- [ ] **Step 2: Render document type and status badges**

Use `doc.documentType ?? doc.category ?? 'otro'` for the type badge and `doc.processingStatus` for the status badge. Legacy documents without metadata continue to render.

### Task 5: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused backend tests**

```bash
pnpm --filter backend test -- document-processing.service.spec.ts documents.service.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run build/type checks**

```bash
pnpm --filter @inversiones/shared build
pnpm --filter backend build
pnpm --filter @inversiones/frontend lint
```

Expected: commands complete without type or lint errors.
