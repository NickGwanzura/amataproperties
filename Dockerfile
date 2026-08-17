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
# The startup schema bootstrap runs outside Next's traced server bundle.
# Include its postgres client explicitly in the standalone runtime image.
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres
COPY drizzle/0000_initial.sql ./drizzle/0000_initial.sql
COPY scripts/bootstrap-db.mjs ./scripts/bootstrap-db.mjs

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health?probe=liveness || exit 1

CMD ["sh", "-c", "until node scripts/bootstrap-db.mjs; do echo 'Waiting for PostgreSQL schema bootstrap...'; sleep 5; done; exec node server.js"]
