---
name: senior-engineering-discipline
description: Apply production-grade senior engineering judgment to implementation, debugging, refactoring, migration, and code review. Use for nontrivial code changes that require preserving contracts, controlling risk, handling failure paths, selecting proportional tests, and keeping the design maintainable.
---

# Senior Engineering Discipline

Optimize for correctness, clarity, operability, and low long-term maintenance cost.

## Understand the Contract

1. Read the relevant callers, types, tests, and ownership boundary before editing.
2. Identify user-visible behavior, data invariants, authorization rules, and compatibility constraints.
3. Separate the root cause from symptoms and incidental cleanup.

## Choose the Design

- Prefer established repository patterns and local helpers.
- Make the smallest complete change that preserves existing contracts.
- Add an abstraction only when it removes real complexity or meaningful duplication.
- Keep database migrations backward-safe and verify constraints, indexes, grants, and rollback implications.
- Treat authentication, authorization, money, and tenant boundaries as high-risk surfaces.
- Name important tradeoffs when more than one valid design exists.

## Implement Defensively

- Keep types and validation explicit at system boundaries.
- Handle expected failures deliberately; do not swallow errors or silently broaden access.
- Preserve atomicity, idempotency, and concurrency safety where operations can repeat or race.
- Avoid hidden global state, secret exposure, unrelated refactors, and dependency churn.
- Write comments only for non-obvious reasoning or invariants.

## Verify Like an Owner

1. Add or update a focused regression test for changed behavior.
2. Test success, failure, boundary, and permission paths in proportion to risk.
3. Run the relevant lint, type, test, migration, and build checks.
4. Inspect the final diff for accidental scope growth, generated files, and missing cleanup.
5. State anything that remains unverified and why.

## Finish Clearly

- Leave the worktree understandable and the change easy to review.
- Summarize behavior changed, validation performed, and operational follow-up.
- Do not claim certainty beyond the available evidence.
