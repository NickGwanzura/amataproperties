/**
 * Rate limiter with Postgres support for production and in-memory development
 * fallback.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
};

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g. IP address, email, or combination)
 * @param options.maxRequests - Maximum requests allowed in the window (default: 5)
 * @param options.windowSeconds - Time window in seconds (default: 60)
 */
export async function checkRateLimit(
  key: string,
  options: { maxRequests?: number; windowSeconds?: number } = {},
): Promise<RateLimitResult> {
  const maxRequests = options.maxRequests ?? 5;
  const windowSeconds = options.windowSeconds ?? 60;

  if (process.env.DATABASE_URL) {
    return checkPostgresRateLimit(key, { maxRequests, windowSeconds });
  }

  if (process.env.NODE_ENV === "production") {
    return { allowed: false, remaining: 0, resetInSeconds: windowSeconds };
  }

  return checkMemoryRateLimit(key, { maxRequests, windowSeconds });
}

function checkMemoryRateLimit(
  key: string,
  options: { maxRequests: number; windowSeconds: number },
): RateLimitResult {
  const { maxRequests, windowSeconds } = options;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // First request or window expired — reset
    store.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: true, remaining: maxRequests - entry.count, resetInSeconds };
}

let postgresTableReady: Promise<void> | null = null;

async function ensurePostgresRateLimitTable() {
  if (!postgresTableReady) {
    postgresTableReady = (async () => {
      const { default: postgres } = await import("postgres");
      const sql = postgres(process.env.DATABASE_URL!);
      await sql`
        create table if not exists app_rate_limits (
          key text primary key,
          count integer not null,
          reset_at timestamptz not null
        )
      `;
      await sql`create index if not exists app_rate_limits_reset_at_idx on app_rate_limits (reset_at)`;
    })();
  }
  return postgresTableReady;
}

async function checkPostgresRateLimit(
  key: string,
  options: { maxRequests: number; windowSeconds: number },
): Promise<RateLimitResult> {
  await ensurePostgresRateLimitTable();

  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL!);
  const [row] = await sql`
    with upsert as (
      insert into app_rate_limits (key, count, reset_at)
      values (${key}, 1, now() + (${options.windowSeconds} * interval '1 second'))
      on conflict (key) do update
      set
        count = case
          when app_rate_limits.reset_at <= now() then 1
          else app_rate_limits.count + 1
        end,
        reset_at = case
          when app_rate_limits.reset_at <= now() then excluded.reset_at
          else app_rate_limits.reset_at
        end
      returning count, reset_at
    )
    select
      count,
      greatest(1, ceil(extract(epoch from reset_at - now())))::integer as reset_in_seconds
    from upsert
  `;

  const typedRow = row as { count?: number | string; reset_in_seconds?: number | string } | undefined;
  const count = Number(typedRow?.count ?? 1);
  const resetInSeconds = Number(typedRow?.reset_in_seconds ?? options.windowSeconds);
  return {
    allowed: count <= options.maxRequests,
    remaining: Math.max(0, options.maxRequests - count),
    resetInSeconds,
  };
}

/**
 * Extract a client IP from a Request object, checking common proxy headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "127.0.0.1";
}

/**
 * Apply rate limiting to an API route response.
 * Returns a Response (rate limited) or null (allowed).
 */
export async function applyRateLimit(
  request: Request,
  key?: string,
  options?: { maxRequests?: number; windowSeconds?: number },
): Promise<Response | null> {
  const clientIp = getClientIp(request);
  const rateLimitKey = key ?? `ratelimit:${clientIp}`;
  const result = await checkRateLimit(rateLimitKey, options);

  if (!result.allowed) {
    const retryAfter = Math.ceil(result.resetInSeconds);
    return new Response(
      JSON.stringify({
        error: { message: `Too many requests. Please try again in ${retryAfter} seconds.` },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + retryAfter),
        },
      },
    );
  }

  return null;
}
