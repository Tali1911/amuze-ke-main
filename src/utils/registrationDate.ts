import { parseLocalDate } from '@/utils/dateUtils';
import { CampRegistration } from '@/types/campRegistration';

/**
 * Returns the array of dates a registration is "expected/billable" against.
 *
 * Business rules (see plan in .lovable/plan.md):
 *  - QUOTATION (registered, unpaid, not yet attended): bucket by the dates the
 *    family booked to come (`children[*].selectedDates`). Falls back to
 *    `created_at` only if no selectedDates exist.
 *  - INVOICE (attended, unpaid): bucket by `converted_to_invoice_at`.
 *  - PAID: bucket by `converted_to_invoice_at` if present, otherwise
 *    `payment_date`/`created_at`.
 *
 * Using one helper everywhere guarantees that the Admin "All" page,
 * Attendance, Pending Collection, Sales, P&L, and AR Aging always agree on
 * which day a registration belongs to.
 */
export function getRegistrationEventDates(reg: CampRegistration | any): Date[] {
  const docType: 'quotation' | 'invoice' | 'paid' =
    reg?.billing_doc_type ||
    (reg?.payment_status === 'paid' ? 'paid' : 'quotation');

  if (docType === 'quotation') {
    const dates: string[] = [];
    const children = Array.isArray(reg?.children) ? reg.children : [];
    for (const c of children) {
      const cd: string[] = Array.isArray(c?.selectedDates) ? c.selectedDates : [];
      for (const d of cd) {
        if (typeof d === 'string') dates.push(d);
      }
    }
    if (dates.length > 0) {
      // Dedupe + parse safely (no tz drift)
      return Array.from(new Set(dates)).map(parseLocalDate);
    }
    // Fallback to created_at so legacy rows without selectedDates still appear
    return reg?.created_at ? [new Date(reg.created_at)] : [];
  }

  // invoice / paid
  const raw =
    reg?.converted_to_invoice_at || reg?.payment_date || reg?.created_at;
  return raw ? [new Date(raw)] : [];
}

/**
 * Convenience: does this registration belong in the [from, to] window?
 * `from` / `to` may be undefined to mean open-ended.
 */
export function registrationInDateWindow(
  reg: CampRegistration | any,
  from?: Date,
  to?: Date
): boolean {
  const dates = getRegistrationEventDates(reg);
  if (dates.length === 0) return false;
  const fromMs = from ? new Date(from).setHours(0, 0, 0, 0) : -Infinity;
  const toMs = to ? new Date(to).setHours(23, 59, 59, 999) : Infinity;
  return dates.some(d => {
    const t = d.getTime();
    return t >= fromMs && t <= toMs;
  });
}
