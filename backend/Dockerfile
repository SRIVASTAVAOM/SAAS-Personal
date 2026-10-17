# Multi-stage Dockerfile for School ERP Backend
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY src/db/migrations ./src/db/migrations

EXPOSE 5001
CMD ["sh", "-c", "node dist/src/db/migrate.js && node dist/src/db/seed.js && node dist/src/server.js"]
