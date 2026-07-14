# Operations Troubleshooting

## Request IDs

Every backend request gets an `x-request-id` response header. If the client sends `x-request-id`, the backend reuses it; otherwise it generates one.

When reporting a production issue, capture:

- user action
- approximate time
- URL or screen
- `x-request-id`
- user id, if known

## Backend Logs

Backend exception logs include:

- HTTP method
- route
- status code
- request id
- authenticated user id when available

Production responses hide unexpected exception text. Check Cloudflare Workers observability with the request id instead of exposing raw backend errors to users.

## Common Checks

1. Health check:

```bash
curl -i https://<backend-host>/api/v1/health
```

2. Frontend API URL:

```bash
NEXT_PUBLIC_API_URL=https://<backend-host>/api/v1
```

3. Backend CORS origin:

```bash
FRONTEND_URL=https://<frontend-host>
```

4. Database migrations:

```bash
pnpm db:migrate:deploy
```

5. Supabase connectivity:

```bash
pnpm --filter @inversiones/database exec prisma migrate status --schema ../../packages/database/prisma/schema.prisma
```

## When Login Fails

- Confirm the backend health endpoint responds.
- Confirm `JWT_SECRET` did not change unexpectedly.
- Confirm the user is still active.
- Check backend logs using the request id from the failed response.

## When Data Looks Stale

- Check whether the PWA shows the offline/backend-unavailable banner.
- Confirm `/api/` requests are not cached by the service worker.
- Check the backend Worker health endpoint and Cloudflare observability for cold-start or origin errors.
