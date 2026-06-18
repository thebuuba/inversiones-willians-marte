# Permissions

The backend has two roles:

- `ADMIN`: can manage configuration, users, investor capital, and deletes.
- `COLLECTOR`: can run daily operational workflows without destructive access.

## Public Routes

- `POST /api/v1/auth/login`
- `GET /api/v1/documents/capture-sessions/:token`
- `POST /api/v1/documents/capture-sessions/:token/upload`

## Admin-Only Operations

- User management:
  - `POST /api/v1/users`
  - `POST /api/v1/users/:id/toggle-active`
  - `POST /api/v1/auth/register`
- Product configuration:
  - `POST /api/v1/loan-products`
  - `PATCH /api/v1/loan-products/:id`
  - `DELETE /api/v1/loan-products/:id`
- Investor capital and profile changes:
  - `POST /api/v1/investors`
  - `PATCH /api/v1/investors/:id`
  - `DELETE /api/v1/investors/:id`
  - `POST /api/v1/investors/:investorId/investments`
  - `POST /api/v1/investments/:investmentId/capital-additions`
- Deletes:
  - `DELETE /api/v1/clients/:id`
  - `DELETE /api/v1/documents/:id`
  - `DELETE /api/v1/portfolios/:id`
  - `DELETE /api/v1/tasks/:id`
- Full audit log:
  - `GET /api/v1/audit`

## Admin And Collector Operations

- Client create, read, update.
- Loan create and read.
- Payment create and read.
- Document upload, list, and download.
- Request list, count, approve, and reject.
- Dashboard and report reads.
- Portfolio create and read.
- Investor and investment reads.
- Investor payment create and read.
- Task create, read, count, and update.

## Implementation Rule

Protected controllers should use `@UseGuards(JwtAuthGuard, RolesGuard)` and method-level `@Roles(...)`. Routes without `@Roles(...)` are intentionally available to any authenticated user only when that behavior is documented here.
