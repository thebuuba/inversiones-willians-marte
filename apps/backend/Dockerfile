FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @inversiones/database generate
RUN pnpm --filter @inversiones/shared build
RUN pnpm --filter @inversiones/database build
RUN pnpm --filter backend build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
