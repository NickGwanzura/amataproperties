# syntax=docker/dockerfile:1

# ── deps ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build does not need DATABASE_URL — all DB-backed pages are
# `dynamic = "force-dynamic"` and skip static generation.
RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
# Drizzle Kit is used once at container start to create/update the production
# schema. The database service may come up after the app, so the command below
# retries until Postgres is reachable.
COPY --from=deps /app/node_modules ./node_modules
COPY drizzle.config.ts ./drizzle.config.ts
COPY lib/db ./lib/db

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health?probe=liveness || exit 1

CMD ["sh", "-c", "until ./node_modules/.bin/drizzle-kit push --config drizzle.config.ts; do echo 'Waiting for PostgreSQL schema migration...'; sleep 5; done; exec node server.js"]
