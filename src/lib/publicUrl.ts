/**
 * Canonical public host for the site. All external-facing links, share URLs,
 * OAuth callbacks and email redirects should use this domain instead of the
 * Lovable preview/published host so that links shared with users always land
 * on the production website.
 */
export const PUBLIC_SITE_ORIGIN = 'https://amusekenya.co.ke';

/**
 * Returns the base URL to use when building an external-facing link.
 * - On Lovable preview/published hosts, returns the canonical production origin.
 * - On localhost or any other host (custom domains, dev), returns the current origin.
 */
export function getPublicBase(): string {
  if (typeof window === 'undefined') return PUBLIC_SITE_ORIGIN;
  const host = window.location.hostname;
  const isLovableHost = host.endsWith('lovable.app') || host.endsWith('lovable.dev');
  if (isLovableHost) return PUBLIC_SITE_ORIGIN;
  return `${window.location.protocol}//${window.location.host}`;
}

/**
 * Build a full URL for a given path using the canonical public base.
 * Accepts absolute paths ("/foo") or path fragments ("foo").
 */
export function publicUrl(path: string = '/'): string {
  const base = getPublicBase();
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
