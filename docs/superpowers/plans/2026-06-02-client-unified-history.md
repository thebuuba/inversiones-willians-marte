# Client Unified History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable a unified client history timeline covering client changes, loans, payments, documents, and notes.

**Architecture:** Add optional client linkage to audit records. Reconstruct durable historical activity from existing entities, merge it with audit-only events, and expose a normalized client timeline endpoint consumed by the existing tab.

**Tech Stack:** Prisma, PostgreSQL migrations, NestJS, Jest, Next.js, React, TypeScript.

---

### Task 1: Audit Client Link

**Files:**
- Modify: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/20260602150000_add_audit_client_link/migration.sql`
- Modify: `apps/backend/src/modules/audit/audit.service.ts`

- [x] Add optional `clientId` relation and index to `AuditLog`.
- [x] Extend `AuditService.log` with optional `clientId`.
- [x] Generate Prisma client.

### Task 2: Unified History Endpoint

**Files:**
- Create: `apps/backend/src/modules/audit/audit.service.spec.ts`
- Modify: `apps/backend/src/modules/audit/audit.service.ts`
- Modify: `apps/backend/src/modules/audit/audit.controller.ts`

- [x] Write failing tests for reconstruction, merge, and descending sort.
- [x] Run tests to verify RED.
- [x] Implement `findClientHistory(clientId)`.
- [x] Add `GET /audit/client/:clientId/history` for `ADMIN` and `COLLECTOR`.
- [x] Run tests to verify GREEN.

### Task 3: Client Update Auditing

**Files:**
- Modify: `apps/backend/src/modules/clients/clients.module.ts`
- Modify: `apps/backend/src/modules/clients/clients.controller.ts`
- Modify: `apps/backend/src/modules/clients/clients.service.ts`
- Modify: `apps/backend/src/modules/clients/clients.service.spec.ts`

- [x] Write failing tests for field edits and summarized note actions.
- [x] Inject `AuditService`.
- [x] Pass authenticated user ID from controller update.
- [x] Log `CLIENT_UPDATED`, `NOTE_CREATED`, `NOTE_UPDATED`, and `NOTE_DELETED`.
- [x] Run focused tests.

### Task 4: Document Deletion Auditing

**Files:**
- Modify: `apps/backend/src/modules/documents/documents.module.ts`
- Modify: `apps/backend/src/modules/documents/documents.controller.ts`
- Modify: `apps/backend/src/modules/documents/documents.service.ts`
- Create: `apps/backend/src/modules/documents/documents.service.spec.ts`

- [x] Write failing deletion audit test.
- [x] Inject `AuditService`.
- [x] Load document before deletion and log `DOCUMENT_DELETED`.
- [x] Pass authenticated user ID from controller.
- [x] Run focused tests.

### Task 5: Frontend Timeline

**Files:**
- Modify: `apps/frontend/src/components/clients/client-detail-page.tsx`

- [x] Replace legacy `/audit` request with `/audit/client/:clientId/history`.
- [x] Map normalized event details, currency amounts, and tones.
- [x] Preserve empty state.

### Task 6: Verification

- [x] Apply migration.
- [x] Run focused backend tests.
- [x] Run backend build.
- [x] Run frontend build.
- [x] Run scoped frontend lint.
- [x] Run `git diff --check`.
