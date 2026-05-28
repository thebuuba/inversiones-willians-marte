FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/database/package.json packages/database/
COPY packages/database/prisma ./packages/database/prisma
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @inversiones/database generate

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY . .
RUN pnpm --filter @inversiones/shared build
RUN pnpm --filter @inversiones/database build
RUN pnpm --filter backend build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend/.env.example ./apps/backend/.env.example
RUN pnpm install --frozen-lockfile --prod

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
