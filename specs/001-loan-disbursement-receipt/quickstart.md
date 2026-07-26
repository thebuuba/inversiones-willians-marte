# Quickstart validation

## Prerequisites

1. Apply the database migration and regenerate the database client.
2. Start backend on port 3000 and frontend on port 3001.
3. Sign in as administrator or collector.

## Scenario 1: automatic generation

1. Open **Nuevo préstamo**.
2. Confirm **Generar recibo** is selected.
3. Create a valid loan.
4. Verify the receipt preview opens and matches the client, loan and amounts.

Expected: one receipt exists and the user can choose autocopiante, original suelto o copia suelta.

## Scenario 2: opt out and later generation

1. Create another loan with **Generar recibo** cleared.
2. Open its loan detail.
3. Select **Generar recibo** twice.

Expected: both actions resolve to the same receipt number; no duplicate is created.

## Scenario 3: print and reprint

1. Open an issued receipt.
2. Print **Autocopiante**.
3. Reopen it from the loan detail and print again.

Expected: one 76 mm impact print transfers identical financial data and signature lines from the
white original to the yellow copy; the receipt number is unchanged.

## Commands

```sh
pnpm --filter @inversiones/database generate
pnpm --filter backend test -- --runInBand
pnpm --filter @inversiones/frontend test
pnpm --filter backend build
pnpm --filter @inversiones/frontend build
```

## Validation completed

- Database migration applied and Prisma client generated.
- Backend: 48 suites and 195 tests passed; production build passed.
- Frontend: 131 tests passed; lint, TypeScript and production build passed.
- Browser: loan creation, loan detail receipt action and company receipt fields verified on localhost.
