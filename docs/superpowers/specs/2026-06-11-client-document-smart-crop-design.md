# Client Document Smart Crop Design

## Goal

Add assisted document processing to the client document upload flow. Users upload a photo, image, or PDF from the client profile's Documents tab without selecting a document type. The system detects the likely type, prepares a cleaned/cropped version when possible, and stores enough metadata to support future OCR.

## Scope

Initial supported document types:

- `cedula`
- `recibo`
- `acto_notarial`
- `otro`

The first implementation is assisted processing, not full AI extraction. It should classify and prepare metadata deterministically where possible, keep the original upload, and expose review state in the UI. OCR fields can be added later without changing the upload contract.

## User Flow

1. The user opens a client profile and enters the Documents tab.
2. The user uploads a file from phone camera, phone storage, or desktop.
3. The frontend sends the file with the `clientId`; it does not require a category.
4. The backend stores the original file.
5. The backend analyzes the file:
   - Images are eligible for assisted processing.
   - PDFs and office documents are classified by filename/MIME metadata for now and marked as not cropped.
6. The backend saves:
   - detected document type
   - detection confidence
   - processing status
   - original file reference
   - processed file reference if generated
   - processing notes
7. The frontend reloads the document list and shows type/status badges.

## Backend Design

Extend the existing `Document` model with processing metadata:

- `documentType`: detected type, defaults to `otro`
- `detectionConfidence`: integer 0-100
- `processingStatus`: `pending`, `processed`, `needs_review`, `failed`, `not_applicable`
- `processedFileUrl`: optional processed image filename
- `originalFileUrl`: original uploaded filename
- `processingNotes`: optional human-readable explanation

Keep `fileUrl` pointing at the primary downloadable file for compatibility. For now, `fileUrl` remains the original upload. When image processing is fully enabled, the UI can offer both original and processed downloads.

Add a `DocumentProcessingService` used by `DocumentsService.create`. The service returns a processing result object and owns all classification/cropping decisions. This keeps upload handling, persistence, and processing responsibilities separate.

Initial classification rules:

- MIME type and filename hints identify likely `cedula`, `recibo`, or `acto_notarial`.
- Image files with unknown names are marked `otro` with lower confidence.
- PDFs/office documents can be classified by filename but receive `not_applicable` for crop.

Cropping approach:

- Add the data model and service boundary now.
- Use a conservative first processor that can mark images as `needs_review` when no safe crop engine is configured.
- Prepare the dependency boundary so a later image engine such as Sharp/OpenCV or a cloud vision/OCR service can generate `processedFileUrl` without controller changes.

## Frontend Design

In the client Documents tab:

- Remove the hardcoded `general` category behavior for client uploads.
- Show a document type badge using friendly labels:
  - Cedula
  - Recibo
  - Acto notarial
  - Otro
- Show a processing status badge:
  - Procesado
  - Revisar
  - No aplica
  - Fallo
- Keep the existing download and delete actions.

Upload remains simple: choose a file, optional name, and submit.

## Error Handling

- Upload validation remains in the controller.
- If processing fails, the original file is still saved with `processingStatus = failed`.
- If a file cannot be classified confidently, it is saved as `otro` and `needs_review`.
- Processing notes are stored for operators but should not expose stack traces.

## Testing

Backend unit tests should cover:

- filename/MIME classification for cedula, recibo, acto notarial, and unknown files
- image unknown path marked for review
- PDF/office files classified but not cropped
- `DocumentsService.create` persists processing metadata

Frontend verification should cover:

- client document uploads no longer force category `general`
- document cards render detected type/status fields when present
- legacy documents without new metadata still render correctly

## Future OCR Expansion

Later C-level intelligence can be added by extending `DocumentProcessingService`:

- OCR extraction per document type
- blur/dark/incomplete image checks
- auto-save when confidence is high
- manual crop adjustment UI when confidence is low
- structured fields for cedula number, receipt amount/reference, notarial act metadata
