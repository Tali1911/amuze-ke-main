// Shared activity-based categories for Budget & Expense forms and Financial Reports.
//
// IMPORTANT: The values exported here are the *initial / fallback* values used
// before the live config is fetched from `content_items` (slug='activity-categories').
// At runtime, `useActivityCategories` calls `setActivityCategoryCache(...)` to
// replace the in-memory copies so every existing import (including the synchronous
// `matchesActivity` helper) automatically reflects admin-managed changes.

export const DEFAULT_ACTIVITY_CATEGORIES: string[] = [
  'Mid-Term Camp',
  'Mid-Term Camp (Feb/March)',
  'Mid-Term Camp (May/June)',
  'Mid-Term Camp (October)',
  'Easter Camp',
  'Summer Camp',
  'End Year Camp',
  'Day Camps',
  'Little Explorers',
  'Kenyan Experiences',
  'Homeschooling',
  'Archery',
  'Birthday Parties',
  'Corporate Events',
  'Kitty',
  'Others',
];

export const DEFAULT_ACTIVITY_ALIASES: Record<string, string[]> = {
  'mid-term camp': [
    'mid-term camp', 'mid term camp', 'midterm camp',
    'mid-term-feb', 'mid-term-feb-march',
    'mid-term-may', 'mid-term-may-june',
    'mid-term-oct', 'mid-term-october',
    'mid-term feb/march', 'mid-term may/june', 'mid-term october',
    'feb/march camp', 'may/june camp', 'october camp',
  ],
  'mid-term camp (feb/march)': [
    'mid-term-feb', 'mid-term-feb-march', 'mid-term feb/march', 'feb/march camp',
  ],
  'mid-term camp (may/june)': [
    'mid-term-may', 'mid-term-may-june', 'mid-term may/june', 'may/june camp',
  ],
  'mid-term camp (october)': [
    'mid-term-oct', 'mid-term-october', 'mid-term october', 'october camp',
  ],
  'easter camp': ['easter camp', 'easter-camp', 'easter'],
  'summer camp': ['summer camp', 'summer-camp', 'summer'],
  'end year camp': ['end year camp', 'end-year-camp', 'end-of-year-camp', 'end year'],
  'day camps': ['day camps', 'day-camps', 'nairobi day camps'],
  'little explorers': ['little explorers', 'little-explorers', 'little forest', 'little-forest'],
  'kenyan experiences': ['kenyan experiences', 'kenyan-experiences'],
  'homeschooling': ['homeschooling', 'homeschool', 'home-schooling'],
  'archery': ['archery'],
  'birthday parties': ['birthday parties', 'parties', 'parties & events', 'birthday-parties'],
  'corporate events': ['corporate events', 'team building', 'team-building', 'corporate'],
  'kitty': ['kitty'],
  'others': ['others', 'other', 'uncategorized'],
};

// ---- Mutable in-memory cache (kept in sync with the DB by useActivityCategories) ----
let _categories: string[] = [...DEFAULT_ACTIVITY_CATEGORIES];
let _aliases: Record<string, string[]> = { ...DEFAULT_ACTIVITY_ALIASES };

/**
 * Replace the in-memory cache. Call this when the live config loads or changes.
 * `categories` is a list of active labels (already sorted). `aliases` is keyed
 * by normalized category label (lowercase, single-spaced).
 */
export const setActivityCategoryCache = (
  categories: string[],
  aliases: Record<string, string[]>,
): void => {
  _categories = categories.length > 0 ? categories : [...DEFAULT_ACTIVITY_CATEGORIES];
  _aliases = aliases && Object.keys(aliases).length > 0 ? aliases : { ...DEFAULT_ACTIVITY_ALIASES };
};

/**
 * Live-bound proxy: importers like `import { ACTIVITY_CATEGORIES } from ...`
 * keep working and automatically see the latest values after hydration.
 * (We use a Proxy so existing array methods like `.map`, `.includes`, length etc.
 * always read from the current `_categories` array.)
 */
export const ACTIVITY_CATEGORIES: string[] = new Proxy([] as string[], {
  get(_target, prop) {
    return (_categories as any)[prop];
  },
  has(_target, prop) {
    return prop in _categories;
  },
  ownKeys() {
    return Reflect.ownKeys(_categories);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(_categories, prop);
  },
}) as string[];

export const ACTIVITY_ALIASES: Record<string, string[]> = new Proxy({} as Record<string, string[]>, {
  get(_target, prop) {
    return (_aliases as any)[prop];
  },
  has(_target, prop) {
    return prop in _aliases;
  },
  ownKeys() {
    return Reflect.ownKeys(_aliases);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(_aliases, prop);
  },
}) as Record<string, string[]>;

export const DEPARTMENT_LIST = [
  'Administration',
  'Programs',
  'Marketing',
  'Operations',
  'HR',
  'Others',
];

const normalize = (v: string): string =>
  v.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Returns true if `candidate` (e.g. a DB camp_type like "mid-term-feb-march")
 * matches any of the selected category labels (e.g. "Mid-Term Camp").
 * Handles aliases, hyphen/space variants, and substring fall-back.
 */
export const matchesActivity = (
  candidate: string | null | undefined,
  selectedCategories: string[],
): boolean => {
  if (!selectedCategories || selectedCategories.length === 0) return true;
  if (!candidate) return false;
  const cand = normalize(candidate);
  const candNoHyphen = cand.replace(/-/g, ' ');

  return selectedCategories.some(cat => {
    const catKey = normalize(cat);
    if (cand === catKey || candNoHyphen === catKey) return true;

    const aliases = _aliases[catKey] || [catKey];
    return aliases.some(a => {
      const an = normalize(a);
      const anNoHyphen = an.replace(/-/g, ' ');
      return (
        cand === an ||
        candNoHyphen === an ||
        cand === anNoHyphen ||
        cand.includes(an) ||
        an.includes(cand) ||
        candNoHyphen.includes(anNoHyphen) ||
        anNoHyphen.includes(candNoHyphen)
      );
    });
  });
};

/** Smart capitalize: first letter of each word uppercase, rest lowercase. */
export const smartCapitalize = (value: string): string =>
  value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
