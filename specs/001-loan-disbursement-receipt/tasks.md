# Tasks: Recibo de desembolso de préstamo

## Phase 1: Setup

- [x] T001 Verify existing receipt, loan and settings patterns in apps/frontend/src/components/investors/payment-receipt-modal.tsx, apps/backend/src/modules/loans/loans.service.ts and apps/backend/src/modules/settings/settings.service.ts

## Phase 2: Foundational

- [x] T002 Add LoanReceipt and company setting fields in packages/database/prisma/schema.prisma and a migration under packages/database/prisma/migrations/
- [x] T003 [P] Extend shared loan receipt and settings contracts in packages/shared/src/index.ts
- [x] T004 [P] Add focused amount-in-words tests and helper in apps/frontend/src/components/loans/loan-disbursement-receipt.helpers.test.ts and apps/frontend/src/components/loans/loan-disbursement-receipt.helpers.ts
- [x] T005 Persist company information through apps/backend/src/modules/settings/ and apps/frontend/src/lib/api/settings.ts

## Phase 3: User Story 1 - Create loan and receipt together

- [x] T006 [US1] Add backend receipt creation tests in apps/backend/src/modules/loans/loans.service.spec.ts
- [x] T007 [US1] Implement transactional receipt snapshot generation in apps/backend/src/modules/loans/loans.service.ts and apps/backend/src/modules/loans/dto/create-loan.dto.ts
- [x] T008 [US1] Add the accessible default-enabled receipt option and open preview after creation in apps/frontend/src/components/loans/new-loan-page.tsx

## Phase 4: User Story 2 - Print original and copy

- [x] T009 [US2] Build the reusable 76 mm original/copy receipt modal in apps/frontend/src/components/loans/loan-disbursement-receipt-modal.tsx

## Phase 5: User Story 3 - Generate and reprint later

- [x] T010 [US3] Add idempotent receipt read/generate endpoints in apps/backend/src/modules/loans/loans.controller.ts and apps/backend/src/modules/loans/loans.service.ts
- [x] T011 [P] [US3] Add receipt API types and calls in apps/frontend/src/lib/api/loans.ts
- [x] T012 [US3] Add Generate/View receipt action and modal to apps/frontend/src/components/loans/loan-detail-page.tsx

## Phase 6: User Story 4 - Save digital copy

- [x] T013 [US4] Add PDF download for selected receipt copies in apps/frontend/src/components/loans/loan-disbursement-receipt-modal.tsx

## Phase 7: Polish and validation

- [x] T014 Update company settings UI in apps/frontend/src/components/settings/settings-page.tsx
- [x] T015 Run database generation, focused tests, lint/build checks and complete specs/001-loan-disbursement-receipt/quickstart.md

## Dependencies

- T002-T005 depend on T001.
- T006-T008 depend on T002-T005.
- T009 depends on T003-T004 and T008.
- T010-T012 depend on T002-T003 and T007.
- T013 depends on T009.
- T014 depends on T005.
- T015 depends on all implementation tasks.

## Parallel opportunities

- T003 and T004 touch independent shared/frontend helper files.
- T011 can run after the backend contract is fixed without touching backend files.

## Implementation strategy

The minimum viable slice is T001-T009: create a loan and immediately print its original and copy.
T010-T013 add later generation, reprinting and PDF. T014 completes company identity management.
