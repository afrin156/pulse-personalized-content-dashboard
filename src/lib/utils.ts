import { MAX_HASHTAGS } from './constants';

/** Small, stable string hash (djb2). Used to build ids and placeholder colours. */
export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** "#Web Dev!" -> "webdev". Returns "" when nothing usable is left. */
export function normalizeHashtag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
}

/** Normalises, de-duplicates and caps a list of hashtags. */
export function sanitizeHashtags(list: string[]): string[] {
  const out: string[] = [];
  for (const raw of list) {
    const tag = normalizeHashtag(raw);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= MAX_HASHTAGS) break;
  }
  return out;
}

/** Round-robin merge: [[a1,a2],[b1],[c1,c2]] -> [a1,b1,c1,a2,c2] */
export function interleave<T>(lists: T[][]): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (i < list.length) result.push(list[i]);
    }
  }
  return result;
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function paginate<T>(list: T[], page: number, size: number) {
  const start = (page - 1) * size;
  return { items: list.slice(start, start + size), hasMore: start + size < list.length };
}

export function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function clampInt(value: string | null | undefined, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function stripHtml(text: string | null | undefined): string {
  return (text ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** Deterministic gradient (as a data URI) for items without an image. */
export function placeholderImage(seed: string): string {
  const h = hashString(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 60)) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="none">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue1} 55% 38%)"/><stop offset="1" stop-color="hsl(${hue2} 60% 24%)"/>` +
    `</linearGradient></defs><rect width="320" height="180" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
