import { FieldErrors } from 'react-hook-form';

/**
 * Recursively finds the first leaf error key path from a react-hook-form errors object.
 * Returns a dotted/bracket path suitable for matching a form field `name`
 * (e.g. "children.0.selectedDates" or "parentName").
 */
const findFirstErrorPath = (errors: any, prefix = ''): string | null => {
  if (!errors || typeof errors !== 'object') return null;

  if (
    typeof errors.message === 'string' ||
    (typeof errors.type === 'string' && !Array.isArray(errors) && !hasNestedFieldErrors(errors))
  ) {
    return prefix || null;
  }

  if (Array.isArray(errors)) {
    for (let i = 0; i < errors.length; i++) {
      const child = errors[i];
      if (!child) continue;
      const path = findFirstErrorPath(child, prefix ? `${prefix}.${i}` : String(i));
      if (path) return path;
    }
    return null;
  }

  for (const key of Object.keys(errors)) {
    if (key === 'ref' || key === 'message' || key === 'type' || key === 'types') continue;
    const path = findFirstErrorPath(errors[key], prefix ? `${prefix}.${key}` : key);
    if (path) return path;
  }
  return null;
};

const hasNestedFieldErrors = (obj: any) => {
  return Object.keys(obj).some(
    (k) => !['ref', 'message', 'type', 'types'].includes(k) && obj[k] && typeof obj[k] === 'object'
  );
};

const cssEscape = (value: string) => {
  if (typeof CSS !== 'undefined' && typeof (CSS as any).escape === 'function') {
    return (CSS as any).escape(value);
  }
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
};

/**
 * Locate the best DOM target for a given RHF error path. Tries (in order):
 * 1. element with exact [name="path"]
 * 2. element with [name^="path"] (covers nested controls/registers)
 * 3. element with id matching path, or any segment of it (root, root.0, ...)
 * 4. ref attached by RHF Controller via data-rhf-name (if any)
 */
const findTargetForPath = (path: string): HTMLElement | null => {
  const exact = document.querySelector<HTMLElement>(`[name="${cssEscape(path)}"]`);
  if (exact) return exact;
  const prefix = document.querySelector<HTMLElement>(`[name^="${cssEscape(path)}"]`);
  if (prefix) return prefix;

  // Try id candidates: full path, then progressively shorter prefixes.
  const parts = path.split('.');
  for (let i = parts.length; i > 0; i--) {
    const candidate = parts.slice(0, i).join('.');
    const byId = document.getElementById(candidate);
    if (byId) return byId;
  }
  return null;
};

const findFallbackInvalid = (): HTMLElement | null => {
  // Common cues an input is in error state.
  const aria = document.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (aria) return aria;
  // Rendered error messages used across the forms.
  const msg = document.querySelector<HTMLElement>(
    '.text-destructive, .text-red-500, [data-error="true"], [role="alert"]'
  );
  return msg;
};

const scrollElementIntoView = (el: HTMLElement) => {
  // Find the nearest scrollable ancestor (in case the form is inside an overflow container).
  let parent: HTMLElement | null = el.parentElement;
  let scrollable: HTMLElement | null = null;
  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
      scrollable = parent;
      break;
    }
    parent = parent.parentElement;
  }

  if (scrollable) {
    const elRect = el.getBoundingClientRect();
    const parentRect = scrollable.getBoundingClientRect();
    const offset = elRect.top - parentRect.top + scrollable.scrollTop - scrollable.clientHeight / 2 + el.clientHeight / 2;
    scrollable.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    try {
      el.focus({ preventScroll: true });
    } catch {
      el.focus();
    }
  }
};

/**
 * Scrolls to (and focuses if possible) the first invalid field.
 * Falls back to the first aria-invalid / rendered error message in the DOM
 * when a name-based target cannot be located.
 */
export const scrollToFirstError = (errors: FieldErrors) => {
  // Defer so React has a chance to render error states / messages first.
  setTimeout(() => {
    const path = findFirstErrorPath(errors);
    const target = (path && findTargetForPath(path)) || findFallbackInvalid();
    if (!target) return;
    scrollElementIntoView(target);
  }, 50);
};
