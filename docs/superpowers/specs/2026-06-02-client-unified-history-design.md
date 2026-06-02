# Client Unified History Design

## Objective

Enable the client `Historial` tab as a complete timeline of activity related to a client, including client edits, loans, payments, documents, and notes.

## Scope

This change covers:

- A client-specific history endpoint.
- Reconstructed historical events from existing persisted entities.
- New audit records for future client-related actions.
- Field-level client edit summaries.
- A frontend timeline consuming the unified history endpoint.

This change does not recover historical deletions that were never persisted, expose full note contents in audit history, or change payment and loan business rules.

## Timeline Events

The timeline is ordered newest first and contains:

- Client created.
- Client edited, with changed fields summarized as previous value to new value.
- Loan created, including visible `Préstamo #<loanNumber>`.
- Payment registered, including amount and loan number.
- Document uploaded, including document name.
- Document deleted, including document name.
- Note created, edited, or deleted, without storing or showing full note content.

## Historical Reconstruction

Build events from existing persisted entities:

- Client creation from `clients.createdAt`.
- Loan creation from `loans.createdAt`.
- Payment registration from `payments.createdAt`.
- Existing document uploads from `documents.createdAt`.

Existing deletions and edits cannot be reconstructed when no previous audit exists. They appear only for actions recorded after this change.

## Audit Storage

Add optional `clientId` to `AuditLog`:

- PostgreSQL column: `client_id`.
- Type: integer.
- Relation: optional reference to `clients.id`.
- Index: `client_id, created_at`.

Audit records use action names:

- `CLIENT_UPDATED`
- `DOCUMENT_DELETED`
- `NOTE_CREATED`
- `NOTE_UPDATED`
- `NOTE_DELETED`

Entity creation events that are already reconstructible do not need duplicate audit rows. The unified endpoint may also consume compatible audit records if later flows add them.

## Client Edit Details

When updating a client:

- Load the previous client record.
- Compare only fields present in the request.
- Exclude full `notes` payload from ordinary field details.
- Store changed non-note fields as `{ field, before, after }`.
- If `notes` changed, detect note IDs to emit summarized note create, update, and delete audit records.

The controller passes the authenticated user ID to the service so audit records identify the actor.

## Document Deletion

Before deleting a document:

- Load the document.
- Delete it.
- If it belongs to a client, record `DOCUMENT_DELETED` with document name and client ID.

The document controller passes the authenticated user ID to the service.

## Client History Endpoint

Add:

```text
GET /audit/client/:clientId/history
```

Roles: `ADMIN`, `COLLECTOR`.

The endpoint returns normalized events:

```ts
{
  id: string;
  type: 'Cliente' | 'Préstamo' | 'Pago' | 'Documento' | 'Nota';
  title: string;
  detail?: string;
  amount?: number;
  author: string;
  createdAt: string;
}
```

The service merges reconstructed events with audit events, removes duplicates by stable event key, and sorts newest first.

## Frontend

The client detail page requests `/audit/client/:clientId/history`.

The timeline:

- Displays localized dates.
- Formats payment amounts as currency.
- Shows event details below the title.
- Keeps the empty state when no events exist.
- Uses distinct tones for client, loan, payment, document, and note activity.

## Testing

Add backend tests for:

- Unified history includes reconstructed client, loan, payment, and document events.
- Unified history includes audit-backed edits and deletions.
- Unified history sorts newest first.
- Client update logs changed fields and summarized note events.
- Document deletion logs the client document name.

Run focused backend tests, backend build, frontend build, scoped frontend lint, and `git diff --check`.
