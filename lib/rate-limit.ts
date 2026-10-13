// Rate-limit settings and small pure helpers (tested in lib/rate-limit.test.ts).
// The actual counting happens in the database function consume_rate_limit,
// called from the checkout Server Action.

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const RATE_LIMITS = {
  // Per visitor (identified by a hash of their IP address).
  perVisitor: { limit: 5, windowSeconds: 10 * 60 },
  // Whole shop, all visitors combined. A backstop that can't be dodged by
  // faking the IP header (see README → Rate limiting).
  global: { limit: 50, windowSeconds: 10 * 60 },
} as const;

export const GLOBAL_RATE_LIMIT_KEY = "checkout:global";

// Picks the visitor's IP from the x-forwarded-for header.
// The header can hold a list ("client, proxy1, proxy2"); the first entry is
// the original client. Anything that isn't a valid IP is ignored.
//
// Note: this header is only trustworthy when a hosting platform sets it.
// Locally anyone can send a fake one — which is why the global limit exists.
export function getClientIp(forwardedFor: string | null): string {
  const first = forwardedFor?.split(",")[0]?.trim() ?? "";
  return isIP(first) ? first : "unknown";
}

// Turns an IP into a key we can store without storing the IP itself.
// HMAC = a hash mixed with a secret: without the secret, nobody can work
// out which IP produced it (a plain hash of an IPv4 address could be
// reversed by simply trying all ~4 billion addresses).
export function visitorRateLimitKey(ip: string, secret: string): string {
  const hash = createHmac("sha256", secret).update(ip).digest("base64url");
  return `checkout:ip:${hash}`;
}

// 204 seconds → 4 minutes (always rounded up, at least 1).
export function minutesToWait(retryAfterSeconds: number): number {
  return Math.max(1, Math.ceil(retryAfterSeconds / 60));
}
