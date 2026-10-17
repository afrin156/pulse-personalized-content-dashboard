import {
  clampInt,
  interleave,
  normalizeHashtag,
  paginate,
  parseList,
  placeholderImage,
  sanitizeHashtags,
  stripHtml,
  timeAgo,
  uniqueById,
} from '@/lib/utils';

describe('normalizeHashtag', () => {
  it('strips #, spaces, punctuation and lowercases', () => {
    expect(normalizeHashtag('#Web Dev!')).toBe('webdev');
    expect(normalizeHashtag('  ##AI ')).toBe('ai');
  });
  it('returns empty string when nothing usable is left', () => {
    expect(normalizeHashtag('###')).toBe('');
    expect(normalizeHashtag('   ')).toBe('');
  });
});

describe('sanitizeHashtags', () => {
  it('de-duplicates and drops empty values', () => {
    expect(sanitizeHashtags(['#AI', 'ai', '', 'react'])).toEqual(['ai', 'react']);
  });
  it('caps the list at 10 tags', () => {
    const many = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    expect(sanitizeHashtags(many)).toHaveLength(10);
  });
});

describe('interleave', () => {
  it('merges lists round-robin and handles uneven lengths', () => {
    expect(interleave([['a1', 'a2'], ['b1'], ['c1', 'c2', 'c3']])).toEqual(['a1', 'b1', 'c1', 'a2', 'c2', 'c3']);
  });
  it('returns an empty array for no input', () => {
    expect(interleave([])).toEqual([]);
    expect(interleave([[], []])).toEqual([]);
  });
});

describe('uniqueById', () => {
  it('keeps the first occurrence', () => {
    const out = uniqueById([{ id: 'a', v: 1 }, { id: 'b', v: 2 }, { id: 'a', v: 3 }]);
    expect(out).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
  });
});

describe('paginate', () => {
  const list = [1, 2, 3, 4, 5];
  it('slices pages and reports hasMore', () => {
    expect(paginate(list, 1, 2)).toEqual({ items: [1, 2], hasMore: true });
    expect(paginate(list, 3, 2)).toEqual({ items: [5], hasMore: false });
  });
  it('returns nothing past the end', () => {
    expect(paginate(list, 9, 2)).toEqual({ items: [], hasMore: false });
  });
});

describe('timeAgo', () => {
  const now = new Date('2025-01-10T12:00:00Z').getTime();
  it('formats minutes, hours and days', () => {
    expect(timeAgo('2025-01-10T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2025-01-10T11:30:00Z', now)).toBe('30m ago');
    expect(timeAgo('2025-01-10T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2025-01-08T12:00:00Z', now)).toBe('2d ago');
  });
  it('returns an empty string for invalid dates', () => {
    expect(timeAgo('not a date', now)).toBe('');
  });
});

describe('parsing helpers', () => {
  it('parseList splits and trims', () => {
    expect(parseList('a, b ,,c')).toEqual(['a', 'b', 'c']);
    expect(parseList(null)).toEqual([]);
    expect(parseList('')).toEqual([]);
  });
  it('clampInt falls back and clamps', () => {
    expect(clampInt('abc', 4, 1, 20)).toBe(4);
    expect(clampInt('999', 4, 1, 20)).toBe(20);
    expect(clampInt('-5', 4, 1, 20)).toBe(1);
    expect(clampInt('7', 4, 1, 20)).toBe(7);
    expect(clampInt(null, 4, 1, 20)).toBe(4);
  });
  it('stripHtml removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world');
    expect(stripHtml(null)).toBe('');
  });
});

describe('placeholderImage', () => {
  it('is deterministic per seed and differs between seeds', () => {
    expect(placeholderImage('a')).toBe(placeholderImage('a'));
    expect(placeholderImage('a')).not.toBe(placeholderImage('b'));
    expect(placeholderImage('a').startsWith('data:image/svg+xml')).toBe(true);
  });
});
