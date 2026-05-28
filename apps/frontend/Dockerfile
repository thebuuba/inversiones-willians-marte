FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @inversiones/shared build
RUN pnpm --filter frontend build
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "cd apps/frontend && npx next start --port ${PORT:-3001}"]
