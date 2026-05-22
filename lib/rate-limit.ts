const store = new Map<string, { count: number; start: number }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.start > WINDOW_MS) {
    store.set(key, { count: 1, start: now });
    return true;
  }

  if (entry.count >= MAX_PER_WINDOW) return false;

  entry.count++;
  return true;
}
