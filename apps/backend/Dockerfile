FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @inversiones/shared build && \
    pnpm --filter @inversiones/database build && \
    pnpm --filter backend build
EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
