FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && npx turbo build --filter backend
EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]
