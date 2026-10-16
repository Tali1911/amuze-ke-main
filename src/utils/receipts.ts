// Multiple receipts are stored in the existing expenses.receipt_url column,
// one URL per line, so no schema change is needed and old single URLs still work.
export const parseReceiptUrls = (value?: string | null): string[] =>
  (value || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

export const joinReceiptUrls = (urls: string[]): string =>
  urls.map(s => s.trim()).filter(Boolean).join('\n');

export const receiptLabel = (url: string, index: number): string => {
  try {
    const name = decodeURIComponent(url.split('/').pop() || '');
    const cleaned = name.replace(/^\d+-[a-z0-9]{6}-/, '');
    return cleaned || `Receipt ${index + 1}`;
  } catch {
    return `Receipt ${index + 1}`;
  }
};
