# Loan receipt API contract

## Create loan

`POST /loans`

Adds optional request field:

```json
{ "generateReceipt": true }
```

The response remains the created loan and includes `receipt` when generated.

## Generate or retrieve

`POST /loans/:id/receipt`

- Roles: ADMIN, COLLECTOR
- Creates the receipt if absent.
- Returns the existing receipt if already present.
- Never changes the receipt number or snapshot.

## Read

`GET /loans/:id/receipt`

- Roles: ADMIN, COLLECTOR
- Returns the receipt.
- Returns not found when the loan has no receipt.

## Loan detail

`GET /loans/:id` includes nullable `receipt` metadata and snapshot so the detail screen can show
**Generar recibo** or **Ver recibo** without another exploratory request.
