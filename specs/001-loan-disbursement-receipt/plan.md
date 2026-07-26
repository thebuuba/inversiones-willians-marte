# Implementation Plan: Recibo de desembolso de préstamo

**Branch**: `[001-loan-disbursement-receipt]` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-loan-disbursement-receipt/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add an optional, default-enabled receipt generation step to loan creation. The backend creates a
single immutable receipt snapshot atomically with the loan, exposes idempotent generation and
read endpoints, and includes it in loan details. The frontend reuses the existing receipt/PDF
pattern with a 76 mm print layout, supports original/copy/both, and offers generation or
reprinting from the loan detail. Company identity is persisted through the existing settings
surface.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x, Node.js 22+

**Primary Dependencies**: Next.js 16, React 19, NestJS 11, Prisma, html2pdf.js, Lucide

**Storage**: PostgreSQL through Prisma; receipt data stored as an immutable JSON snapshot

**Testing**: Jest for backend, Node test runner through tsx for frontend/shared

**Target Platform**: Web application in modern desktop browsers; print target is 76 mm receipt paper

**Project Type**: Monorepo web application with frontend, backend API, shared types and database package

**Performance Goals**: Receipt preview available immediately after loan creation; no extra data entry

**Constraints**: Receipt creation must be idempotent, loan creation must remain atomic, historical
snapshots must not change, print flow must not depend on printer-specific browser APIs

**Scale/Scope**: One receipt per loan; admin and collector roles; original and client copy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The project constitution is still an unratified template, so it defines no enforceable gates.
- Financial writes remain transactional and have focused tests.
- No new dependency is added; the existing PDF/print stack is reused.
- Receipt generation is idempotent and protected by a unique loan relationship.
- PASS before research and after design.

## Project Structure

### Documentation (this feature)

```text
specs/001-loan-disbursement-receipt/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
packages/database/
└── prisma/
    ├── schema.prisma
    └── migrations/

packages/shared/
└── src/index.ts

apps/backend/src/modules/
├── loans/
│   ├── dto/create-loan.dto.ts
│   ├── loans.controller.ts
│   ├── loans.service.ts
│   └── loans.service.spec.ts
└── settings/
    ├── dto/update-settings.dto.ts
    ├── settings.controller.ts
    └── settings.service.ts

apps/frontend/src/
├── components/loans/
│   ├── loan-disbursement-receipt-modal.tsx
│   ├── loan-disbursement-receipt.helpers.ts
│   ├── new-loan-page.tsx
│   └── loan-detail-page.tsx
└── lib/api/
    ├── loans.ts
    └── settings.ts
```

**Structure Decision**: Extend the existing monorepo modules and receipt patterns. No new package,
service layer, PDF engine or printer integration abstraction is introduced.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
