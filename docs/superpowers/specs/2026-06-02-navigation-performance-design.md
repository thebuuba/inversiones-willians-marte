# Navigation Performance Design

## Objective

Reduce the delay perceived when navigating between application panels and remove the broken monthly collections request from the dashboard.

## Scope

This change covers:

- Fixing the monthly collections report query.
- Keeping recently loaded list data visible when returning to clients, loans, and investors.
- Revalidating cached list data in the background after navigation.
- Limiting list animation delays so long lists finish entering quickly.
- Adding PostgreSQL indexes for existing relation, filtering, and ordering patterns.
- Measuring authenticated API latency again after applying the database migration.

This change does not redesign pages, add new product behavior, or introduce a new data-fetching dependency.

## Backend Report Fix

The monthly collections query must pass `sixMonthsAgo` through Prisma tagged-template interpolation instead of using an unbound `$1` placeholder.

## Frontend Cache

Extend the existing client cache into a small stale-while-revalidate hook:

- Return valid cached data immediately.
- Keep stale cached data visible while refreshing it.
- Deduplicate in-flight requests for the same key.
- Expose loading only when no usable data exists.
- Adopt it in clients, loans, and investors with cache keys that include filters and pagination.

## Animation Limits

Use one helper for list-entry delay:

- Preserve a short stagger for the first visible rows.
- Cap the stagger so later rows do not wait seconds to appear.
- Apply it to index-based list animations without changing layout or hover behavior.

## Database Indexes

Add conservative indexes aligned with current access patterns:

- Foreign-key indexes on referencing columns used by joins and relation counts.
- Composite indexes for loans ordered by creation time and optionally filtered by status.
- Schedule indexes for loan lookup, due-date windows, and status-aware due-date queries.
- Payment indexes for loan/client history and date-based reports.
- Allocation indexes used by the monthly collections joins.

## Testing And Verification

- Add a backend regression test for monthly collections interpolation.
- Add frontend helper tests for bounded animation delay and cache primitives where viable.
- Run focused tests, lint, builds, Prisma validation, migration application, `git diff --check`, and authenticated latency measurements.
