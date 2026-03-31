const store = new Map<number, { count: number; windowStart: number }>();

const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000;

export function checkRateLimit(userId: number): { allowed: boolean } {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    store.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}
