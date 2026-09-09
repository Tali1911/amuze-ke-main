/**
 * Display-only mapping for location names.
 *
 * IMPORTANT: The underlying stored value in the database remains
 * `Kurura Gate F` (misspelt historically). Do NOT change the stored value,
 * filter comparators, or Select `value` props — only the visible label
 * should read `Karura Gate F`.
 */
const DISPLAY_MAP: Record<string, string> = {
  'Kurura Gate F': 'Karura Gate F',
};

export function displayLocation(value?: string | null): string {
  if (!value) return '';
  return DISPLAY_MAP[value] ?? value;
}
