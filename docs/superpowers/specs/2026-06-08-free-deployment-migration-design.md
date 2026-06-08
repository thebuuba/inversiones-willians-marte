# Free Deployment Migration Design

## Goal

Move the app off the expired Railway trial onto a no-cost deployment path using Vercel for the Next.js frontend, Koyeb for the NestJS backend, and Supabase Postgres for the database.

## Architecture

The frontend remains a standalone Next.js app in `apps/frontend` and reads its API origin from `NEXT_PUBLIC_API_URL`. The backend remains a Dockerized NestJS service in `apps/backend`, reads Supabase through `DATABASE_URL`, and accepts browser calls only from `FRONTEND_URL`. Prisma migrations are run explicitly against Supabase before or after backend deploys instead of being run automatically at container startup.

## Components

- Vercel project: deploys `apps/frontend` from the monorepo and sets `NEXT_PUBLIC_API_URL` to the Koyeb backend URL with `/api/v1`.
- Koyeb service: builds from the repository root using `apps/backend/Dockerfile`, exposes the service on `$PORT`, and sets `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.
- Supabase project: provides the managed Postgres database used by Prisma. The app does not use Supabase Auth or client SDKs.
- Backend health check: exposes `GET /api/v1/health` so Koyeb and manual checks can verify the container is serving traffic.

## Data Flow

The browser loads the frontend from Vercel, stores the app JWT in `localStorage`, and sends API requests to the Koyeb backend using `NEXT_PUBLIC_API_URL`. The backend validates JWTs, handles API routes under `/api/v1`, and connects to Supabase Postgres through Prisma.

## Error Handling

Deployment failures should be isolated by layer: Vercel build failures are frontend/package issues, Koyeb boot failures are backend/env issues, and Prisma migration failures are database/schema issues. The health route returns a simple JSON payload without database access so container health can be separated from database connectivity.

## Verification

Run the production build, backend tests, frontend lint, backend lint, frontend `node:test` files, and backend e2e test. After deployment, manually check the Koyeb health endpoint and configure Vercel with the final backend URL.

