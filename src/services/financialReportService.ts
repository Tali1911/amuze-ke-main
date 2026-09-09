import { supabase, isSupabaseAvailable } from './supabaseService';
import { Invoice, Payment, Expense, Budget, FinancialService } from './financialService';
import { campRegistrationService } from './campRegistrationService';
import { format, parseISO, differenceInDays, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { matchesActivity, ACTIVITY_CATEGORIES } from '@/lib/activityCategories';
import { getRegistrationEventDates, registrationInDateWindow } from '@/utils/registrationDate';

const financialService = FinancialService.getInstance();

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilters {
  dateRange: DateRange;
  activities?: string[]; // camp_type or program_name filter
}

export interface ProfitLossData {
  revenue: {
    invoices: number;
    payments: number;
    campRegistrations: number;
    /** Total billed (collected + pending collection) — money owed for selected activity/camp */
    total: number;
    /** Amount actually received */
    collected: number;
    /** Outstanding balance from unpaid invoices / unpaid camp registrations */
    pendingCollection: number;
  };
  expenses: {
    byCategory: Record<string, number>;
    total: number;
  };
  netProfit: number;
  period: DateRange;
}

export interface ARAgingItem {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  childName?: string;
  activityName?: string;
  referenceId?: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  daysOverdue: number;
  agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  source: 'invoice' | 'collection';
}

export interface AROrphanItem {
  id: string;
  registrationId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  childName: string;
  activityName: string;
  balanceDue: number;
  createdAt: string;
  daysOld: number;
  reason: 'registration-missing' | 'registration-cancelled' | 'quote-stage' | 'no-registration-link';
  reasonLabel: string;
}

export interface ARAgingSummary {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
  items: ARAgingItem[];
  // Attended-but-unpaid collections (matches Dashboard "Total Outstanding")
  attendedUnpaidTotal: number;
  attendedUnpaidCount: number;
  // Invoice-only subtotal (formal AR)
  invoicedTotal: number;
  invoicedCount: number;
  // Orphaned receivables — pending action items pointing at missing/cancelled
  // registrations or quote-stage bookings. Excluded from aging buckets, but
  // surfaced as an exemption section so totals reconcile with the Dashboard.
  orphanedItems: AROrphanItem[];
  orphanedTotal: number;
  // total + orphanedTotal — reconciles to Dashboard "Total Outstanding"
  grandTotal: number;
}

export interface RevenueReportData {
  totalRevenue: number;
  paymentsRevenue: number;
  campRegistrationsRevenue: number;
  bySource: Array<{ source: string; amount: number; count: number }>;
  byActivity: Array<{ activity: string; amount: number; count: number }>;
  byMethod: Array<{ method: string; amount: number; count: number }>;
  trend: Array<{ date: string; amount: number }>;
  period: DateRange;
}

export interface ExpenseReportData {
  totalExpenses: number;
  byCategory: Array<{ category: string; amount: number; count: number; percentage: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
  byVendor: Array<{ vendor: string; amount: number; count: number }>;
  trend: Array<{ date: string; amount: number }>;
  topExpenses: Array<{ description: string; category: string; amount: number; date: string }>;
  period: DateRange;
}

export interface DailySalesData {
  date: string;
  invoicesCreated: number;
  invoicesAmount: number;
  paymentsReceived: number;
  paymentsAmount: number;
  campRegistrations: number;
  campRevenue: number;
  /** Total amount billed that day (manual invoices + system invoices/quotations raised that day) */
  billedAmount: number;
  /** Total amount collected that day (completed payments + paid-camp-reg without payment row) */
  collectedAmount: number;
  /** Back-compat: equals billedAmount */
  totalRevenue: number;
}

/**
 * Resolve the date a registration was "billed" on. This is the date the invoice or
 * quotation was actually raised — `converted_to_invoice_at` when the registration
 * was converted to an invoice (e.g. via check-in), otherwise `created_at`.
 *
 * Using this everywhere ensures Camp Registrations, Sales, P&L, and AR Aging all
 * agree on which day an invoice belongs to.
 */
export const billingEventDate = (reg: any): Date | null => {
  const raw = reg?.converted_to_invoice_at || reg?.created_at;
  if (!raw) return null;
  try {
    return parseISO(raw);
  } catch {
    return null;
  }
};

/**
 * Internal helpers — single source of truth for "regs in window" + "collected".
 * Every reconcilable card (P&L, Sales, AR Aging) routes through these so the
 * cards tie out exactly: Collected + Pending == Billed, Billed - Collected == AR Total.
 */
const regsInWindow = (regs: any[], dateRange?: DateRange) => {
  if (!dateRange) return regs;
  return regs.filter(r =>
    registrationInDateWindow(r, dateRange.startDate, dateRange.endDate)
  );
};

const buildPaymentsByReg = (payments: any[]): Record<string, number> => {
  const map: Record<string, number> = {};
  payments.forEach(p => {
    if (p.registration_id && p.status === 'completed') {
      map[p.registration_id] = (map[p.registration_id] || 0) + Number(p.amount);
    }
  });
  return map;
};

/** Paid against a registration: max(sum of completed payments, total if marked paid), capped at total. */
const paidForReg = (reg: any, paymentsByReg: Record<string, number>): number => {
  const total = Number(reg?.total_amount || 0);
  const fromPayments = paymentsByReg[reg?.id] || 0;
  const fromStatus = reg?.payment_status === 'paid' ? total : 0;
  return Math.min(total, Math.max(fromPayments, fromStatus));
};

/**
 * Normalize a date range so both ends span full local days. Without this, a
 * single-day pick lands at 00:00…00:00 and `isWithinInterval` excludes every
 * record created later in the day.
 */
const normalizeDateRange = (range: DateRange): DateRange => ({
  startDate: startOfDay(range.startDate),
  endDate: endOfDay(range.endDate),
});

/**
 * Drop payments whose parent record has been deleted or cancelled, so reports
 * never count orphaned amounts. A payment is kept when:
 *   - it links to a still-active invoice, OR
 *   - it links to a still-active camp registration, OR
 *   - it has no parent link at all (truly manual / standalone payment).
 * Camp-tagged payments (`source === 'camp_registration'`) with no matching
 * registration are dropped — that registration was deleted.
 */
const dropOrphanedPayments = (
  payments: Payment[],
  activeInvoiceIds: Set<string>,
  activeRegIds: Set<string>,
): Payment[] => {
  return payments.filter(p => {
    if (p.invoice_id) return activeInvoiceIds.has(p.invoice_id);
    if (p.registration_id) return activeRegIds.has(p.registration_id);
    // Camp-tagged payment with no surviving registration → orphaned
    if (p.source === 'camp_registration') return false;
    return true;
  });
};

export const financialReportService = {
  // Fetch all financial data for a date range with optional activity filter
  async fetchFinancialData(dateRange: DateRange, activities?: string[]) {
    const [invoices, payments, expenses, budgets, campRegistrations] = await Promise.all([
      financialService.getInvoices(),
      financialService.getPayments(),
      financialService.getExpenses(),
      financialService.getBudgets(),
      // Fetch ALL camp registrations (no date filter at the source). Downstream functions
      // filter by the correct date field (billing event vs creation vs payment date) so
      // registrations created earlier but billed/paid within the range are not lost.
      campRegistrationService.getAllRegistrations({}),
    ]);

    // Apply activity filter if provided (alias-aware)
    const hasActivityFilter = activities && activities.length > 0;
    const filteredCampRegistrations = hasActivityFilter
      ? campRegistrations.filter(r => matchesActivity((r as any).camp_type, activities!))
      : campRegistrations;

    // Build "active" ID sets so we can drop payments / action items whose
    // parent invoice or registration was deleted or cancelled.
    const activeInvoiceIds = new Set(
      invoices.filter(i => i.status !== 'cancelled').map(i => i.id),
    );
    const activeRegIds = new Set(
      filteredCampRegistrations
        .filter(r => (r as any).status !== 'cancelled')
        .map(r => r.id!)
        .filter(Boolean),
    );

    // First drop orphaned payments (deleted/cancelled parent), then apply
    // the optional activity filter.
    const nonOrphanPayments = dropOrphanedPayments(payments, activeInvoiceIds, activeRegIds);

    const filteredPayments = hasActivityFilter
      ? nonOrphanPayments.filter(p => {
          // Include payments linked to filtered registrations, or matching program_name
          if (p.registration_id) {
            return filteredCampRegistrations.some(r => r.id === p.registration_id);
          }
          if (p.program_name) {
            return matchesActivity(p.program_name, activities!);
          }
          // Include unlinked payments only when no activity filter
          return false;
        })
      : nonOrphanPayments;

    const filteredExpenses = hasActivityFilter
      ? expenses.filter(e => matchesActivity(e.category, activities!))
      : expenses;

    return {
      invoices,
      payments: filteredPayments,
      expenses: filteredExpenses,
      budgets,
      campRegistrations: filteredCampRegistrations,
      activeInvoiceIds,
      activeRegIds,
    };
  },

  // Generate Profit & Loss Statement
  // Registration-anchored rule: a reg counts in window iff any of its event dates
  // (getRegistrationEventDates) fall in the window. Collected & Pending are derived
  // from those regs, so the figures tie out exactly with Sales and AR Aging.
  async generateProfitLoss(dateRange: DateRange, activities?: string[]): Promise<ProfitLossData> {
    dateRange = normalizeDateRange(dateRange);
    const { invoices, payments, expenses, campRegistrations } = await this.fetchFinancialData(dateRange, activities);

    // Manual (non-camp) invoices — bucket by created_at as before
    const filteredInvoices = invoices.filter(inv => {
      const date = parseISO(inv.created_at);
      return isWithinInterval(date, { start: dateRange.startDate, end: dateRange.endDate });
    });

    const filteredExpenses = expenses.filter(e => {
      const date = parseISO(e.expense_date);
      return isWithinInterval(date, { start: dateRange.startDate, end: dateRange.endDate }) &&
             (e.status === 'approved' || e.status === 'paid');
    });

    // --- Camp Collected (payment-date anchored — matches Sales exactly) ---
    const campRegIds = new Set(campRegistrations.map(r => r.id));
    const paymentLinkedRegIds = new Set<string>();
    let campCollected = 0;
    payments.forEach(p => {
      if (p.status !== 'completed') return;
      const inWin = isWithinInterval(parseISO(p.payment_date), { start: dateRange.startDate, end: dateRange.endDate });
      if (!inWin) return;
      const isCamp = (p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration';
      if (!isCamp) return;
      campCollected += Number(p.amount || 0);
      if (p.registration_id) paymentLinkedRegIds.add(p.registration_id);
    });
    // Fallback: paid camp regs with no payments row — bucket by billing date in window
    campRegistrations.forEach(reg => {
      if ((reg as any).status === 'cancelled') return;
      if ((reg as any).payment_status !== 'paid') return;
      if (paymentLinkedRegIds.has(reg.id!)) return;
      const billDate = billingEventDate(reg);
      if (!billDate) return;
      if (!isWithinInterval(billDate, { start: dateRange.startDate, end: dateRange.endDate })) return;
      campCollected += Number((reg as any).total_amount || 0);
    });

    // Manual invoices revenue (reference) + collected
    const invoiceRevenue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
    const manualInvoiceCollected = filteredInvoices.reduce(
      (sum, i) => sum + Number((i as any).amount_paid || 0), 0,
    );

    // Pending Collection = Total Billed in window − Collected in window
    // (computed after campBilled below)


    // Other (non-camp) payments in window — breakdown only
    const otherPaymentRevenue = payments
      .filter(p => {
        if (p.status !== 'completed') return false;
        const inWin = isWithinInterval(parseISO(p.payment_date), { start: dateRange.startDate, end: dateRange.endDate });
        if (!inWin) return false;
        const isCamp = (p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration';
        return !isCamp;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Expenses
    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const category = exp.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(exp.amount);
    });
    const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

    const collected = campCollected + manualInvoiceCollected;
    // Total Revenue = Total Billed in window (matches Sales "Total Billed"):
    // manual invoices created in window + camp regs (invoice/paid) whose billing
    // event date falls in window.
    let campBilled = 0;
    campRegistrations.forEach(reg => {
      const docType = (reg as any).billing_doc_type;
      if (docType !== 'invoice' && docType !== 'paid') return;
      if ((reg as any).status === 'cancelled') return;
      const billDate = billingEventDate(reg);
      if (!billDate) return;
      if (!isWithinInterval(billDate, { start: dateRange.startDate, end: dateRange.endDate })) return;
      campBilled += Number((reg as any).total_amount || 0);
    });
    const totalRevenue = invoiceRevenue + campBilled;
    const pendingCollection = Math.max(0, totalRevenue - collected);

    return {
      revenue: {
        invoices: invoiceRevenue,
        payments: otherPaymentRevenue,
        campRegistrations: campCollected,
        total: totalRevenue,
        collected,
        pendingCollection,
      },
      expenses: {
        byCategory: expensesByCategory,
        total: totalExpenses,
      },
      netProfit: collected - totalExpenses,
      period: dateRange,
    };
  },

  // Generate AR Aging Report — combines invoice-based AR + attended-but-unpaid collections,
  // each aged into proper buckets so 90+ days reflects real overdue items
  async generateARAgingReport(activities?: string[], dateRange?: DateRange): Promise<ARAgingSummary> {
    if (dateRange) dateRange = normalizeDateRange(dateRange);
    const bucketize = (daysOverdue: number): ARAgingItem['agingBucket'] => {
      if (daysOverdue <= 0) return 'current';
      if (daysOverdue <= 30) return '1-30';
      if (daysOverdue <= 60) return '31-60';
      if (daysOverdue <= 90) return '61-90';
      return '90+';
    };

    const hasActivityFilter = activities && activities.length > 0;
    const itemMatchesActivity = (activity?: string) =>
      !hasActivityFilter || matchesActivity(activity, activities!);

    const invoices = await financialService.getInvoices();
    const payments = await financialService.getPayments();
    const today = new Date();

    // Map invoice -> linked registration to enrich activity/child info
    let invoiceRegMap: Record<string, any> = {};
    if (isSupabaseAvailable() && supabase) {
      const invoiceIds = invoices.map(i => i.id).filter(Boolean);
      if (invoiceIds.length > 0) {
        const { data: regsForInvoices } = await supabase
          .from('camp_registrations' as any)
          .select('id, invoice_id, camp_type, child_name, parent_phone, parent_email')
          .in('invoice_id', invoiceIds);
        ((regsForInvoices || []) as any[]).forEach((r: any) => {
          if (r.invoice_id) invoiceRegMap[r.invoice_id] = r;
        });
      }
    }

    // ---- 1) Build invoice-based aging items
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');
    const invoiceItems: ARAgingItem[] = unpaidInvoices.map(inv => {
      const invoicePayments = payments.filter(p => p.invoice_id === inv.id && p.status === 'completed');
      const paidAmount = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceDue = Number(inv.total_amount) - paidAmount;
      const dueDate = parseISO(inv.due_date);
      const daysOverdue = differenceInDays(today, dueDate);
      const bucket = bucketize(daysOverdue);
      const linkedReg = invoiceRegMap[inv.id];
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        customerName: inv.customer_name,
        customerEmail: inv.customer_email || linkedReg?.parent_email || '',
        customerPhone: linkedReg?.parent_phone || '',
        childName: linkedReg?.child_name || '',
        activityName: linkedReg?.camp_type || (inv as any).description || '',
        referenceId: linkedReg?.id || inv.id,
        totalAmount: Number(inv.total_amount),
        paidAmount,
        balanceDue,
        dueDate: inv.due_date,
        daysOverdue: Math.max(0, daysOverdue),
        agingBucket: bucket,
        source: 'invoice' as const,
      };
    }).filter(item => item.balanceDue > 0);

    // ---- 2) Build attended-but-unpaid collection items from camp_registrations
    //        (single source of truth — `accounts_action_items` is NOT used as an
    //        independent row source anymore, it was double-counting vs P&L).
    //        Aging is anchored to getRegistrationEventDates() so it matches
    //        Sales / P&L windows exactly.
    const collectionItems: ARAgingItem[] = [];
    const orphanedItems: AROrphanItem[] = [];
    const seenRegIds = new Set<string>();
    let attendedUnpaidTotal = 0;
    let attendedUnpaidCount = 0;
    if (isSupabaseAvailable() && supabase) {
      const { data: sysInvoices } = await (supabase as any)
        .from('camp_registrations')
        .select('id, registration_number, invoice_number, parent_name, email, phone, camp_type, children, total_amount, created_at, converted_to_invoice_at, payment_date, payment_status, billing_doc_type, status')
        .eq('billing_doc_type', 'invoice')
        .neq('status', 'cancelled');

      const paymentsByReg = buildPaymentsByReg(payments);

      ((sysInvoices || []) as any[]).forEach((r: any) => {
        if (r.payment_status === 'paid') return;
        const total = Number(r.total_amount || 0);
        if (total <= 0) return;
        const paid = paidForReg(r, paymentsByReg);
        const balance = Math.max(0, total - paid);
        if (balance <= 0) return;
        // Anchor date = first event date from the registration-anchored helper,
        // falling back to converted_to_invoice_at, then created_at.
        const eventDates = getRegistrationEventDates(r);
        const refDate = eventDates[0]
          || (r.converted_to_invoice_at ? parseISO(r.converted_to_invoice_at) : null)
          || (r.created_at ? parseISO(r.created_at) : today);
        const daysOverdue = differenceInDays(today, refDate);
        const bucket = bucketize(daysOverdue);
        const childName = Array.isArray(r.children) && r.children[0]?.childName ? r.children[0].childName : '';
        collectionItems.push({
          invoiceId: r.id,
          invoiceNumber: r.invoice_number || r.registration_number || `REG-${String(r.id).slice(0, 8)}`,
          customerName: r.parent_name || 'Unknown',
          customerEmail: r.email || '',
          customerPhone: r.phone || '',
          childName,
          activityName: r.camp_type || '',
          referenceId: r.id,
          totalAmount: total,
          paidAmount: paid,
          balanceDue: balance,
          dueDate: refDate.toISOString(),
          daysOverdue: Math.max(0, daysOverdue),
          agingBucket: bucket,
          source: 'collection' as const,
          _eventDates: eventDates,
        } as any);
        seenRegIds.add(r.id);
      });

      // Build active reg-id set so legacy action items whose source registration
      // was deleted/cancelled feed the ORPHAN list instead of inflating aging.
      const activeRegIdSet = new Set(((sysInvoices || []) as any[]).map(r => r.id));

      // Also load cancelled registrations so we can label orphans precisely.
      const { data: cancelledRegs } = await (supabase as any)
        .from('camp_registrations')
        .select('id, billing_doc_type, status')
        .or('status.eq.cancelled,billing_doc_type.neq.invoice');
      const cancelledRegMap = new Map<string, { status: string; billing_doc_type: string }>();
      ((cancelledRegs || []) as any[]).forEach((r: any) => {
        cancelledRegMap.set(r.id, { status: r.status, billing_doc_type: r.billing_doc_type });
      });

      // Legacy / manual action items not already covered above
      const { data: collections } = await (supabase as any)
        .from('accounts_action_items')
        .select('id, registration_id, parent_name, child_name, email, phone, amount_due, amount_paid, created_at, camp_type')
        .eq('status', 'pending');
      ((collections || []) as any[]).forEach((c: any) => {
        if (c.registration_id && seenRegIds.has(c.registration_id)) return;
        const balance = Number(c.amount_due || 0) - Number(c.amount_paid || 0);
        if (balance <= 0) return;
        const created = c.created_at ? parseISO(c.created_at) : today;
        const daysOld = differenceInDays(today, created);

        // Diagnostic-only orphan classification — these items are STILL aged
        // into buckets below so AR Aging matches Pending Collections exactly.
        // The orphan list is informational (review/triage), not exclusionary.
        const linkedActive = c.registration_id && activeRegIdSet.has(c.registration_id);
        if (!linkedActive) {
          let reason: AROrphanItem['reason'] = 'no-registration-link';
          let reasonLabel = 'No registration link';
          if (c.registration_id) {
            const meta = cancelledRegMap.get(c.registration_id);
            if (!meta) {
              reason = 'registration-missing';
              reasonLabel = 'Registration deleted';
            } else if (meta.status === 'cancelled') {
              reason = 'registration-cancelled';
              reasonLabel = 'Registration cancelled';
            } else if (meta.billing_doc_type !== 'invoice') {
              reason = 'quote-stage';
              reasonLabel = 'Quote — not invoiced';
            }
          }
          orphanedItems.push({
            id: c.id,
            registrationId: c.registration_id || null,
            customerName: c.parent_name || c.child_name || 'Unknown',
            customerEmail: c.email || '',
            customerPhone: c.phone || '',
            childName: c.child_name || '',
            activityName: c.camp_type || '',
            balanceDue: balance,
            createdAt: c.created_at || today.toISOString(),
            daysOld: Math.max(0, daysOld),
            reason,
            reasonLabel,
          });
          // fall through — also include in aging
        }

        const bucket = bucketize(daysOld);
        collectionItems.push({
          invoiceId: c.id,
          invoiceNumber: `COLL-${String(c.id).slice(0, 8)}`,
          customerName: c.parent_name || c.child_name || 'Unknown',
          customerEmail: c.email || '',
          customerPhone: c.phone || '',
          childName: c.child_name || '',
          activityName: c.camp_type || '',
          referenceId: c.registration_id || c.id,
          totalAmount: Number(c.amount_due || 0),
          paidAmount: Number(c.amount_paid || 0),
          balanceDue: balance,
          dueDate: c.created_at || today.toISOString(),
          daysOverdue: Math.max(0, daysOld),
          agingBucket: bucket,
          source: 'collection' as const,
        });
      });
    }



    // ---- 3) Combine + apply activity filter
    let items = [...invoiceItems, ...collectionItems];
    if (hasActivityFilter) {
      items = items.filter(it => itemMatchesActivity(it.activityName));
    }
    // Always restrict AR Aging to the selected date window when one is provided.
    // For camp-reg collection items, use any of the registration event dates;
    // for manual invoice items, fall back to dueDate.
    if (dateRange) {
      items = items.filter((it: any) => {
        if (it.source === 'collection' && Array.isArray(it._eventDates) && it._eventDates.length > 0) {
          return it._eventDates.some((d: Date) =>
            isWithinInterval(d, { start: dateRange.startDate, end: dateRange.endDate })
          );
        }
        if (!it.dueDate) return false;
        try {
          const d = parseISO(it.dueDate);
          return isWithinInterval(d, { start: dateRange.startDate, end: dateRange.endDate });
        } catch {
          return false;
        }
      });
    }
    // Drop the internal _eventDates field before returning
    items = items.map((it: any) => {
      const { _eventDates, ...rest } = it;
      return rest as ARAgingItem;
    });
    items.sort((a, b) => b.daysOverdue - a.daysOverdue);


    // Recompute attended-unpaid totals respecting the filter
    items.filter(i => i.source === 'collection').forEach(i => {
      attendedUnpaidTotal += i.balanceDue;
      attendedUnpaidCount += 1;
    });

    const filteredInvoiceItems = items.filter(i => i.source === 'invoice');
    const invoicedTotal = filteredInvoiceItems.reduce((s, i) => s + i.balanceDue, 0);

    // Apply activity filter to orphans too, so totals make sense per-activity
    const filteredOrphans = hasActivityFilter
      ? orphanedItems.filter(o => itemMatchesActivity(o.activityName))
      : orphanedItems;
    const orphanedTotal = filteredOrphans.reduce((s, o) => s + o.balanceDue, 0);

    const summary: ARAgingSummary = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
      total: 0,
      items,
      attendedUnpaidTotal,
      attendedUnpaidCount,
      invoicedTotal,
      invoicedCount: filteredInvoiceItems.length,
      orphanedItems: filteredOrphans,
      orphanedTotal,
      grandTotal: 0,
    };

    items.forEach(item => {
      summary.total += item.balanceDue;
      switch (item.agingBucket) {
        case 'current': summary.current += item.balanceDue; break;
        case '1-30': summary.days1to30 += item.balanceDue; break;
        case '31-60': summary.days31to60 += item.balanceDue; break;
        case '61-90': summary.days61to90 += item.balanceDue; break;
        case '90+': summary.days90plus += item.balanceDue; break;
      }
    });
    // Orphans are already included in `items` (aged into buckets); the orphan
    // list is informational only, so grandTotal == aging total — no double-count.
    summary.grandTotal = summary.total;

    return summary;
  },

  // Export an aging bucket subset (clicked card) to CSV
  exportAgingBucketToCSV(items: ARAgingItem[], bucketLabel: string, filename?: string) {
    const headers = ['Source', 'Reference', 'Customer', 'Phone', 'Email', 'Child', 'Activity', 'Due/Created Date', 'Days Overdue', 'Total', 'Paid', 'Balance Due'];
    const rows = items.map(i => [
      i.source,
      i.invoiceNumber,
      i.customerName,
      i.customerPhone || '',
      i.customerEmail || '',
      i.childName || '',
      i.activityName || '',
      i.dueDate ? format(parseISO(i.dueDate), 'yyyy-MM-dd') : '',
      i.daysOverdue.toString(),
      i.totalAmount.toFixed(2),
      i.paidAmount.toFixed(2),
      i.balanceDue.toFixed(2),
    ]);
    const total = items.reduce((s, i) => s + i.balanceDue, 0);
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', 'TOTAL', '', '', total.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `ar-aging-${bucketLabel.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  // Export an aging bucket subset (clicked card) to PDF
  exportAgingBucketToPDF(items: ARAgingItem[], bucketLabel: string, filename?: string) {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`AR Aging — ${bucketLabel}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 25);
    const total = items.reduce((s, i) => s + i.balanceDue, 0);
    doc.text(`Items: ${items.length}  •  Total Outstanding: KES ${total.toLocaleString()}`, 14, 31);
    autoTable(doc, {
      head: [['Source', 'Reference', 'Customer', 'Phone', 'Child', 'Activity', 'Days', 'Balance']],
      body: items.map(i => [
        i.source,
        i.invoiceNumber,
        i.customerName.substring(0, 22),
        i.customerPhone || '',
        (i.childName || '').substring(0, 18),
        (i.activityName || '').substring(0, 22),
        i.daysOverdue.toString(),
        i.balanceDue.toLocaleString(),
      ]),
      startY: 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 53, 69] },
    });
    doc.save(filename || `ar-aging-${bucketLabel.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  // Generate Daily Sales Summary
  async generateDailySalesSummary(dateRange: DateRange, activities?: string[]): Promise<DailySalesData[]> {
    dateRange = normalizeDateRange(dateRange);
    const { invoices, payments, campRegistrations } = await this.fetchFinancialData(dateRange, activities);

    // Create a map for each day in range
    const dailyData: Record<string, DailySalesData> = {};
    let currentDate = new Date(dateRange.startDate);
    
    while (currentDate <= dateRange.endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyData[dateKey] = {
        date: dateKey,
        invoicesCreated: 0,
        invoicesAmount: 0,
        paymentsReceived: 0,
        paymentsAmount: 0,
        campRegistrations: 0,
        campRevenue: 0,
        billedAmount: 0,
        collectedAmount: 0,
        totalRevenue: 0,
      };
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }

    // 1) Manual invoices (from invoices table) — bucket by created_at
    invoices.forEach(inv => {
      const dateKey = format(parseISO(inv.created_at), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        dailyData[dateKey].invoicesCreated++;
        dailyData[dateKey].invoicesAmount += Number(inv.total_amount);
      }
    });

    // 2) System invoices/quotations from camp_registrations — bucket by BILLING EVENT date.
    //    This matches the InvoiceManagement page and the "today's invoices" count in Camp
    //    Registrations, so a registration created earlier but converted to an invoice today
    //    (via check-in) lands in today, not its creation day.
    const campRegIds = new Set(campRegistrations.map(r => r.id));
    campRegistrations.forEach(reg => {
      const docType = (reg as any).billing_doc_type;
      // Count invoices + paid (system-issued docs). Quotations are tracked separately below.
      if (docType !== 'invoice' && docType !== 'paid') return;
      const billDate = billingEventDate(reg);
      if (!billDate) return;
      const dateKey = format(billDate, 'yyyy-MM-dd');
      if (!dailyData[dateKey]) return;
      dailyData[dateKey].invoicesCreated++;
      dailyData[dateKey].invoicesAmount += Number((reg as any).total_amount || 0);
    });

    // 3) Payments — collected revenue, bucket by payment_date.
    // IMPORTANT: only count a reg as "payment-linked" when its payment falls in the
    // selected window. Otherwise a paid reg whose payment is outside the window is
    // both excluded here AND from the paid-reg fallback below, under-counting Sales
    // Collected vs P&L Collected (the bug behind "109,350 vs 89,350").
    const paymentLinkedRegIds = new Set<string>();
    payments.filter(p => p.status === 'completed').forEach(p => {
      const dateKey = format(parseISO(p.payment_date), 'yyyy-MM-dd');
      const inWindow = !!dailyData[dateKey];
      if (inWindow && p.registration_id && campRegIds.has(p.registration_id)) {
        paymentLinkedRegIds.add(p.registration_id);
      }
      if (inWindow) {
        dailyData[dateKey].paymentsReceived++;
        dailyData[dateKey].paymentsAmount += Number(p.amount);
        if ((p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration') {
          dailyData[dateKey].campRevenue += Number(p.amount);
        }
      }
    });

    // 4) New registrations created that day (per-creation-date count) + paid-camp-reg
    //    revenue without a payments row (matches Dashboard cash collected).
    campRegistrations.forEach(reg => {
      if (!reg.created_at) return;
      const createdKey = format(parseISO(reg.created_at), 'yyyy-MM-dd');
      if (dailyData[createdKey]) {
        dailyData[createdKey].campRegistrations++;
      }
      // Paid revenue collected via the registration itself (no payments row) — bucket by
      // BILLING EVENT date so payment day matches what users see in Accounts.
      if ((reg as any).payment_status === 'paid' && !paymentLinkedRegIds.has(reg.id!)) {
        const billDate = billingEventDate(reg);
        if (!billDate) return;
        const billKey = format(billDate, 'yyyy-MM-dd');
        if (!dailyData[billKey]) return;
        const amt = Number((reg as any).total_amount || 0);
        dailyData[billKey].campRevenue += amt;
        dailyData[billKey].paymentsAmount += amt;
      }
    });

    // 5) Derived totals — billed vs collected. totalRevenue is now BILLED (matches card label).
    Object.values(dailyData).forEach(day => {
      day.billedAmount = day.invoicesAmount;
      day.collectedAmount = day.paymentsAmount;
      day.totalRevenue = day.billedAmount;
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Camp-only KPI totals for the period — mirrors the admin Camp Analytics tab so
   * the Sales tab can show camp-scoped Total / Paid / Outstanding side by side
   * with the whole-business figures.
   *
   *  - registrations / revenue / paid: bucketed by registration billing event
   *    (`registrationInDateWindow` — same as P&L and AR Aging).
   *  - childrenExpected: counts every child whose `selectedDates` falls in the
   *    window, regardless of when the registration was billed — matches
   *    AttendanceMarkingTab's "Expected" count.
   */
  async getCampPeriodTotals(dateRange: DateRange, activities?: string[]) {
    dateRange = normalizeDateRange(dateRange);
    const { payments, campRegistrations } = await this.fetchFinancialData(dateRange, activities);

    // Same rule as P&L / AR Aging.
    const regsInRange = campRegistrations.filter(r =>
      (r as any).status !== 'cancelled' &&
      registrationInDateWindow(r, dateRange.startDate, dateRange.endDate)
    );

    const paymentsByReg = buildPaymentsByReg(payments as any[]);

    let totalRevenue = 0;
    let paidRevenue = 0;
    regsInRange.forEach(reg => {
      const total = Number((reg as any).total_amount || 0);
      totalRevenue += total;
      paidRevenue += paidForReg(reg, paymentsByReg);
    });
    const outstandingRevenue = Math.max(0, totalRevenue - paidRevenue);

    // Children expected — across ALL active registrations regardless of bill date.
    const fromMs = startOfDay(dateRange.startDate).getTime();
    const toMs = endOfDay(dateRange.endDate).getTime();
    let childrenExpected = 0;
    campRegistrations.forEach(reg => {
      if ((reg as any).status === 'cancelled') return;
      const kids = Array.isArray((reg as any).children) ? (reg as any).children : [];
      for (const c of kids) {
        const selected: string[] = Array.isArray(c?.selectedDates) ? c.selectedDates : [];
        if (selected.length === 0) continue;
        const hit = selected.some(d => {
          if (typeof d !== 'string') return false;
          // Parse YYYY-MM-DD as local date to avoid EAT tz drift.
          const [y, m, day] = d.split('-').map(Number);
          if (!y || !m || !day) return false;
          const t = new Date(y, m - 1, day).getTime();
          return t >= fromMs && t <= toMs;
        });
        if (hit) childrenExpected += 1;
      }
    });

    return {
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      registrations: regsInRange.length,
      childrenExpected,
      period: dateRange,
    };
  },



  // Export functions
  exportProfitLossToCSV(data: ProfitLossData, filename?: string) {
    const rows = [
      ['Profit & Loss Statement'],
      [`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`],
      [''],
      ['REVENUE'],
      ['Total Revenue (Billed)', data.revenue.total.toFixed(2)],
      ['  Collected', data.revenue.collected.toFixed(2)],
      ['  Pending Collection', data.revenue.pendingCollection.toFixed(2)],
      ['Payments Received', data.revenue.payments.toFixed(2)],
      ['Camp Registrations (Collected)', data.revenue.campRegistrations.toFixed(2)],
      [''],
      ['EXPENSES'],
      ...Object.entries(data.expenses.byCategory).map(([cat, amt]) => [cat, (amt as number).toFixed(2)]),
      ['Total Expenses', data.expenses.total.toFixed(2)],
      [''],
      ['NET PROFIT (Cash Basis: Collected - Expenses)', data.netProfit.toFixed(2)],
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportProfitLossToPDF(data: ProfitLossData, filename?: string) {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Profit & Loss Statement', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 34);

    // Revenue section
    autoTable(doc, {
      head: [['Revenue', 'Amount (KES)']],
      body: [
        ['Total Revenue (Billed)', data.revenue.total.toLocaleString()],
        ['  Collected', data.revenue.collected.toLocaleString()],
        ['  Pending Collection', data.revenue.pendingCollection.toLocaleString()],
        ['Payments Received', data.revenue.payments.toLocaleString()],
        ['Camp Registrations (Collected)', data.revenue.campRegistrations.toLocaleString()],
      ],
      startY: 42,
      headStyles: { fillColor: [34, 139, 34] },
    });

    // Expenses section
    const expenseRows = Object.entries(data.expenses.byCategory).map(([cat, amt]) => [cat, (amt as number).toLocaleString()]);
    expenseRows.push(['Total Expenses', data.expenses.total.toLocaleString()]);

    autoTable(doc, {
      head: [['Expenses', 'Amount (KES)']],
      body: expenseRows,
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [220, 53, 69] },
    });

    // Net profit
    autoTable(doc, {
      head: [['Summary', 'Amount (KES)']],
      body: [['Net Profit (Collected - Expenses)', data.netProfit.toLocaleString()]],
      startY: (doc as any).lastAutoTable.finalY + 10,
      headStyles: { fillColor: [0, 123, 255] },
    });

    doc.save(filename || `profit-loss-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportARAgingToCSV(data: ARAgingSummary, filename?: string) {
    const headers = ['Invoice #', 'Customer', 'Email', 'Total Amount', 'Paid', 'Balance Due', 'Due Date', 'Days Overdue', 'Aging Bucket'];
    const rows = data.items.map(item => [
      item.invoiceNumber,
      item.customerName,
      item.customerEmail,
      item.totalAmount.toFixed(2),
      item.paidAmount.toFixed(2),
      item.balanceDue.toFixed(2),
      item.dueDate,
      item.daysOverdue.toString(),
      item.agingBucket,
    ]);

    // Add summary
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Current', '', '', '', '', data.current.toFixed(2)]);
    rows.push(['1-30 Days', '', '', '', '', data.days1to30.toFixed(2)]);
    rows.push(['31-60 Days', '', '', '', '', data.days31to60.toFixed(2)]);
    rows.push(['61-90 Days', '', '', '', '', data.days61to90.toFixed(2)]);
    rows.push(['90+ Days', '', '', '', '', data.days90plus.toFixed(2)]);
    rows.push(['Total Outstanding', '', '', '', '', data.total.toFixed(2)]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `ar-aging-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportARAgingToPDF(data: ARAgingSummary, filename?: string) {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Accounts Receivable Aging Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);
    doc.text(`Total Outstanding: KES ${data.total.toLocaleString()}`, 14, 34);

    // Summary
    autoTable(doc, {
      head: [['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total']],
      body: [[
        data.current.toLocaleString(),
        data.days1to30.toLocaleString(),
        data.days31to60.toLocaleString(),
        data.days61to90.toLocaleString(),
        data.days90plus.toLocaleString(),
        data.total.toLocaleString(),
      ]],
      startY: 40,
      headStyles: { fillColor: [255, 193, 7] },
    });

    // Detail table
    autoTable(doc, {
      head: [['Invoice #', 'Customer', 'Total', 'Paid', 'Balance', 'Due Date', 'Overdue', 'Bucket']],
      body: data.items.map(item => [
        item.invoiceNumber,
        item.customerName.substring(0, 20),
        item.totalAmount.toLocaleString(),
        item.paidAmount.toLocaleString(),
        item.balanceDue.toLocaleString(),
        item.dueDate,
        item.daysOverdue.toString(),
        item.agingBucket,
      ]),
      startY: (doc as any).lastAutoTable.finalY + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 53, 69] },
    });

    doc.save(filename || `ar-aging-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportDailySalesToCSV(data: DailySalesData[], filename?: string) {
    const headers = ['Date', 'Invoices Raised', 'Invoice Amount (Billed)', 'Payments Received', 'Collected Amount', 'New Registrations', 'Camp Collected', 'Total Billed', 'Total Collected'];
    const rows = data.map(day => [
      day.date,
      day.invoicesCreated.toString(),
      day.invoicesAmount.toFixed(2),
      day.paymentsReceived.toString(),
      day.paymentsAmount.toFixed(2),
      day.campRegistrations.toString(),
      day.campRevenue.toFixed(2),
      day.billedAmount.toFixed(2),
      day.collectedAmount.toFixed(2),
    ]);

    // Add totals
    const totals = data.reduce(
      (acc, day) => ({
        invoicesCreated: acc.invoicesCreated + day.invoicesCreated,
        invoicesAmount: acc.invoicesAmount + day.invoicesAmount,
        paymentsReceived: acc.paymentsReceived + day.paymentsReceived,
        paymentsAmount: acc.paymentsAmount + day.paymentsAmount,
        campRegistrations: acc.campRegistrations + day.campRegistrations,
        campRevenue: acc.campRevenue + day.campRevenue,
        billedAmount: acc.billedAmount + day.billedAmount,
        collectedAmount: acc.collectedAmount + day.collectedAmount,
      }),
      { invoicesCreated: 0, invoicesAmount: 0, paymentsReceived: 0, paymentsAmount: 0, campRegistrations: 0, campRevenue: 0, billedAmount: 0, collectedAmount: 0 }
    );

    rows.push([
      'TOTAL',
      totals.invoicesCreated.toString(),
      totals.invoicesAmount.toFixed(2),
      totals.paymentsReceived.toString(),
      totals.paymentsAmount.toFixed(2),
      totals.campRegistrations.toString(),
      totals.campRevenue.toFixed(2),
      totals.billedAmount.toFixed(2),
      totals.collectedAmount.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `daily-sales-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  // Generate Activity-level Profit & Loss with both ACTUAL (collected) and
  // POTENTIAL (billed/expected) revenue per activity. Activities are rolled
  // up using the alias-aware matcher so DB values like "mid-term-feb-march"
  // are grouped under "Mid-Term Camp".
  async generateActivityProfitLoss(
    dateRange: DateRange,
    activities?: string[],
  ): Promise<Array<{
    activity: string;
    revenue: number;        // alias for actualRevenue (back-compat)
    actualRevenue: number;
    potentialRevenue: number;
    outstanding: number;
    expenses: number;
    netProfit: number;        // actual - expenses
    potentialNetProfit: number; // potential - expenses
  }>> {
    dateRange = normalizeDateRange(dateRange);
    const { payments, expenses, campRegistrations, activeRegIds } = await this.fetchFinancialData(dateRange, activities);

    // Pull pending collections (attended-but-unpaid) for outstanding by activity.
    // Exclude rows whose registration_id no longer exists in active camp_registrations
    // (i.e. the source registration was deleted/cancelled) — those amounts must not
    // contribute to report totals.
    let pendingCollections: Array<{ camp_type: string | null; amount_due: number; amount_paid: number; registration_id?: string | null }> = [];
    if (isSupabaseAvailable() && supabase) {
      const { data } = await supabase
        .from('accounts_action_items' as any)
        .select('camp_type, amount_due, amount_paid, registration_id')
        .eq('status', 'pending');
      pendingCollections = ((data || []) as any[]).filter(
        c => !c.registration_id || activeRegIds.has(c.registration_id),
      );
    }

    // Resolve a raw activity value (e.g. "mid-term-feb-march") to the friendly
    // category label managed by the admin (e.g. "Mid-Term Camp"). Falls back
    // to the raw value if no managed category matches.
    const knownLabels = [...ACTIVITY_CATEGORIES];
    const resolveLabel = (raw?: string | null): string => {
      const v = (raw || '').trim();
      if (!v) return 'Other';
      const hit = knownLabels.find(label => matchesActivity(v, [label]));
      return hit || v;
    };

    const ensure = (
      bucket: Record<string, { actualRevenue: number; potentialRevenue: number; expenses: number; outstanding: number }>,
      key: string,
    ) => {
      if (!bucket[key]) bucket[key] = { actualRevenue: 0, potentialRevenue: 0, expenses: 0, outstanding: 0 };
      return bucket[key];
    };

    const byActivity: Record<string, { actualRevenue: number; potentialRevenue: number; expenses: number; outstanding: number }> = {};

    // Build registration_id -> activity label map from camp registrations
    const regActivityMap: Record<string, string> = {};
    campRegistrations.forEach(reg => {
      regActivityMap[reg.id!] = resolveLabel((reg as any).camp_type);
    });

    // ---- ACTUAL revenue: completed payments in range
    const completedPayments = payments.filter(
      p => p.status === 'completed' &&
        isWithinInterval(parseISO(p.payment_date), { start: dateRange.startDate, end: dateRange.endDate }),
    );
    const paymentLinkedRegIds = new Set<string>();
    completedPayments.forEach(p => {
      let label = 'Other';
      if (p.registration_id && regActivityMap[p.registration_id]) {
        label = regActivityMap[p.registration_id];
        paymentLinkedRegIds.add(p.registration_id);
      } else if (p.program_name) {
        label = resolveLabel(p.program_name);
      }
      ensure(byActivity, label).actualRevenue += Number(p.amount);
    });

    // Add paid camp registrations not yet linked to a payment row.
    // Bucket by BILLING EVENT date (converted_to_invoice_at ?? created_at) — NOT
    // created_at — so this matches P&L's "Collected" exactly. Previously this
    // ignored the date window and summed every paid reg in the activity set,
    // producing Activity P&L Actual = 111,350 vs P&L Collected = 89,350.
    campRegistrations.forEach(r => {
      if ((r as any).payment_status !== 'paid') return;
      if (paymentLinkedRegIds.has(r.id!)) return;
      const billDate = billingEventDate(r);
      if (!billDate || !isWithinInterval(billDate, { start: dateRange.startDate, end: dateRange.endDate })) return;
      const label = regActivityMap[r.id!] || 'Other';
      ensure(byActivity, label).actualRevenue += Number((r as any).total_amount || 0);
    });

    // ---- POTENTIAL revenue: every registration's billed total (created in range)
    campRegistrations.forEach(r => {
      const created = r.created_at ? parseISO(r.created_at) : null;
      if (!created || !isWithinInterval(created, { start: dateRange.startDate, end: dateRange.endDate })) return;
      const label = regActivityMap[r.id!] || 'Other';
      ensure(byActivity, label).potentialRevenue += Number((r as any).total_amount || 0);
    });

    // ---- OUTSTANDING per activity from pending collections (alias-aware)
    pendingCollections.forEach(c => {
      const balance = Number(c.amount_due || 0) - Number(c.amount_paid || 0);
      if (balance <= 0) return;
      // Honor the activity filter if one was applied
      if (activities && activities.length > 0 && !matchesActivity(c.camp_type, activities)) return;
      const label = resolveLabel(c.camp_type);
      ensure(byActivity, label).outstanding += balance;
    });

    // ---- Expenses by category (already filtered upstream by activity)
    expenses
      .filter(e => (e.status === 'approved' || e.status === 'paid') &&
        isWithinInterval(parseISO(e.expense_date), { start: dateRange.startDate, end: dateRange.endDate }))
      .forEach(exp => {
        const label = resolveLabel(exp.category);
        ensure(byActivity, label).expenses += Number(exp.amount);
      });

    // Merge & shape
    const result = Object.entries(byActivity).map(([activity, v]) => ({
      activity,
      revenue: v.actualRevenue, // back-compat
      actualRevenue: v.actualRevenue,
      potentialRevenue: v.potentialRevenue,
      outstanding: v.outstanding,
      expenses: v.expenses,
      netProfit: v.actualRevenue - v.expenses,
      potentialNetProfit: v.potentialRevenue - v.expenses,
    }));

    return result.sort((a, b) => Math.max(b.actualRevenue, b.potentialRevenue) - Math.max(a.actualRevenue, a.potentialRevenue));
  },


  // Generate Potential vs Actual revenue analysis
  // Outstanding now uses accounts_action_items (matches Dashboard "Total Outstanding")
  async generatePotentialVsActual(dateRange: DateRange, activities?: string[]): Promise<{ potentialRevenue: number; actualRevenue: number; outstanding: number; collectionRate: number }> {
    dateRange = normalizeDateRange(dateRange);
    const { payments, campRegistrations, activeRegIds } = await this.fetchFinancialData(dateRange, activities);

    // Potential = total_amount of ALL registrations in period
    const potentialRevenue = campRegistrations.reduce((sum, r) => sum + r.total_amount, 0);

    // Actual = from payments table + paid camp registrations not yet in payments (matches Dashboard)
    const campRegIds = new Set(campRegistrations.map(r => r.id));
    const linkedPayments = payments
      .filter(p => p.status === 'completed' && isWithinInterval(parseISO(p.payment_date), { start: dateRange.startDate, end: dateRange.endDate }))
      .filter(p => (p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration');
    const paymentLinkedRegIds = new Set(
      linkedPayments.filter(p => p.registration_id).map(p => p.registration_id as string)
    );
    const paymentRevenue = linkedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    // Paid regs whose payment isn't in the payments table: bucket by BILLING EVENT date
    // (matches P&L). Previously this used no date filter at all → over-counted.
    const paidRegRevenue = campRegistrations
      .filter(r => {
        if ((r as any).payment_status !== 'paid') return false;
        if (paymentLinkedRegIds.has(r.id!)) return false;
        const billDate = billingEventDate(r);
        return billDate ? isWithinInterval(billDate, { start: dateRange.startDate, end: dateRange.endDate }) : false;
      })
      .reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const actualRevenue = paymentRevenue + paidRegRevenue;

    // Outstanding = attended-but-unpaid from accounts_action_items.
    // CRITICAL: restrict to the registrations matching the selected activity label
    // (exact, e.g. "Mid-Term Camp (May/June)"). Previously this summed every
    // pending action item across the org, ignoring the activity filter.
    let outstanding = 0;
    if (isSupabaseAvailable() && supabase) {
      const hasFilter = !!(activities && activities.length > 0);
      const filteredRegIds = campRegistrations.map(r => r.id).filter(Boolean) as string[];

      if (hasFilter && filteredRegIds.length === 0) {
        outstanding = 0;
      } else {
        let query: any = supabase
          .from('accounts_action_items' as any)
          .select('amount_due, amount_paid, registration_id')
          .eq('status', 'pending');
        if (hasFilter) {
          query = query.in('registration_id', filteredRegIds);
        }
        const { data: collections } = await query;
        // Exclude rows whose source registration was deleted/cancelled.
        outstanding = ((collections || []) as any[])
          .filter((c: any) => !c.registration_id || activeRegIds.has(c.registration_id))
          .reduce(
            (sum: number, c: any) =>
              sum + Math.max(0, Number(c.amount_due || 0) - Number(c.amount_paid || 0)),
            0
          );
      }
    }

    const collectionRate = potentialRevenue > 0 ? (actualRevenue / potentialRevenue) * 100 : 0;

    return { potentialRevenue, actualRevenue, outstanding, collectionRate };
  },

  // Generate Revenue Report — detailed breakdown of all revenue sources
  async generateRevenueReport(dateRange: DateRange, activities?: string[]): Promise<RevenueReportData> {
    dateRange = normalizeDateRange(dateRange);
    const { payments, campRegistrations } = await this.fetchFinancialData(dateRange, activities);

    const inRange = (d: Date) => isWithinInterval(d, { start: dateRange.startDate, end: dateRange.endDate });

    // Filter completed payments in range
    const completedPayments = payments.filter(
      p => p.status === 'completed' && inRange(parseISO(p.payment_date))
    );

    const campRegIds = new Set(campRegistrations.map(r => r.id));
    const paymentLinkedRegIds = new Set(
      completedPayments.filter(p => p.registration_id && campRegIds.has(p.registration_id))
        .map(p => p.registration_id as string)
    );

    // Paid registrations not represented in payments
    const paidRegs = campRegistrations.filter(
      r => (r as any).payment_status === 'paid'
        && !paymentLinkedRegIds.has(r.id!)
        && r.created_at && inRange(parseISO(r.created_at))
    );

    // Source totals
    const campPaymentRevenue = completedPayments
      .filter(p => (p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration')
      .reduce((s, p) => s + Number(p.amount), 0);
    const otherPaymentRevenue = completedPayments
      .filter(p => !((p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration'))
      .reduce((s, p) => s + Number(p.amount), 0);
    const paidRegRevenue = paidRegs.reduce((s, r) => s + Number(r.total_amount || 0), 0);

    const campRegistrationsRevenue = campPaymentRevenue + paidRegRevenue;
    const paymentsRevenue = otherPaymentRevenue;
    const totalRevenue = campRegistrationsRevenue + paymentsRevenue;

    // By source
    const bySource = [
      { source: 'Camp Registration Payments', amount: campPaymentRevenue, count: completedPayments.filter(p => (p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration').length },
      { source: 'Direct Paid Registrations', amount: paidRegRevenue, count: paidRegs.length },
      { source: 'Other Payments', amount: otherPaymentRevenue, count: completedPayments.filter(p => !((p.registration_id && campRegIds.has(p.registration_id)) || p.source === 'camp_registration')).length },
    ].filter(s => s.amount > 0);

    // By activity (camp_type)
    const byActivityMap: Record<string, { amount: number; count: number }> = {};
    const regActivityMap: Record<string, string> = {};
    campRegistrations.forEach(r => {
      regActivityMap[r.id!] = (r as any).camp_type || 'Other';
    });
    completedPayments.forEach(p => {
      let act = 'Other';
      if (p.registration_id && regActivityMap[p.registration_id]) act = regActivityMap[p.registration_id];
      else if (p.program_name) act = p.program_name;
      if (!byActivityMap[act]) byActivityMap[act] = { amount: 0, count: 0 };
      byActivityMap[act].amount += Number(p.amount);
      byActivityMap[act].count += 1;
    });
    paidRegs.forEach(r => {
      const act = (r as any).camp_type || 'Other';
      if (!byActivityMap[act]) byActivityMap[act] = { amount: 0, count: 0 };
      byActivityMap[act].amount += Number(r.total_amount || 0);
      byActivityMap[act].count += 1;
    });
    const byActivity = Object.entries(byActivityMap)
      .map(([activity, v]) => ({ activity, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // By payment method
    const byMethodMap: Record<string, { amount: number; count: number }> = {};
    completedPayments.forEach(p => {
      const m = (p as any).payment_method || 'Unknown';
      if (!byMethodMap[m]) byMethodMap[m] = { amount: 0, count: 0 };
      byMethodMap[m].amount += Number(p.amount);
      byMethodMap[m].count += 1;
    });
    if (paidRegs.length > 0) {
      byMethodMap['Direct (Registration)'] = {
        amount: paidRegRevenue,
        count: paidRegs.length,
      };
    }
    const byMethod = Object.entries(byMethodMap)
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // Trend (daily)
    const trendMap: Record<string, number> = {};
    let cursor = new Date(dateRange.startDate);
    while (cursor <= dateRange.endDate) {
      trendMap[format(cursor, 'yyyy-MM-dd')] = 0;
      cursor = new Date(cursor.getTime() + 86400000);
    }
    completedPayments.forEach(p => {
      const k = format(parseISO(p.payment_date), 'yyyy-MM-dd');
      if (k in trendMap) trendMap[k] += Number(p.amount);
    });
    paidRegs.forEach(r => {
      const k = format(parseISO(r.created_at!), 'yyyy-MM-dd');
      if (k in trendMap) trendMap[k] += Number(r.total_amount || 0);
    });
    const trend = Object.entries(trendMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue,
      paymentsRevenue,
      campRegistrationsRevenue,
      bySource,
      byActivity,
      byMethod,
      trend,
      period: dateRange,
    };
  },

  // Generate Expense Report — detailed breakdown of all expenses
  async generateExpenseReport(dateRange: DateRange, activities?: string[]): Promise<ExpenseReportData> {
    dateRange = normalizeDateRange(dateRange);
    const { expenses } = await this.fetchFinancialData(dateRange, activities);
    const inRange = (d: Date) => isWithinInterval(d, { start: dateRange.startDate, end: dateRange.endDate });

    const filtered = expenses.filter(e => inRange(parseISO(e.expense_date)));
    const totalExpenses = filtered
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .reduce((s, e) => s + Number(e.amount), 0);

    // By category (only approved/paid count toward totals)
    const byCategoryMap: Record<string, { amount: number; count: number }> = {};
    filtered
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .forEach(e => {
        const c = e.category || 'Uncategorized';
        if (!byCategoryMap[c]) byCategoryMap[c] = { amount: 0, count: 0 };
        byCategoryMap[c].amount += Number(e.amount);
        byCategoryMap[c].count += 1;
      });
    const byCategory = Object.entries(byCategoryMap)
      .map(([category, v]) => ({
        category,
        ...v,
        percentage: totalExpenses > 0 ? (v.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // By status (all statuses)
    const byStatusMap: Record<string, { amount: number; count: number }> = {};
    filtered.forEach(e => {
      const s = e.status || 'pending';
      if (!byStatusMap[s]) byStatusMap[s] = { amount: 0, count: 0 };
      byStatusMap[s].amount += Number(e.amount);
      byStatusMap[s].count += 1;
    });
    const byStatus = Object.entries(byStatusMap)
      .map(([status, v]) => ({ status, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // By vendor
    const byVendorMap: Record<string, { amount: number; count: number }> = {};
    filtered
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .forEach(e => {
        const v = (e as any).vendor || (e as any).vendor_name || 'Direct';
        if (!byVendorMap[v]) byVendorMap[v] = { amount: 0, count: 0 };
        byVendorMap[v].amount += Number(e.amount);
        byVendorMap[v].count += 1;
      });
    const byVendor = Object.entries(byVendorMap)
      .map(([vendor, v]) => ({ vendor, ...v }))
      .sort((a, b) => b.amount - a.amount);

    // Trend (daily)
    const trendMap: Record<string, number> = {};
    let cursor = new Date(dateRange.startDate);
    while (cursor <= dateRange.endDate) {
      trendMap[format(cursor, 'yyyy-MM-dd')] = 0;
      cursor = new Date(cursor.getTime() + 86400000);
    }
    filtered
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .forEach(e => {
        const k = format(parseISO(e.expense_date), 'yyyy-MM-dd');
        if (k in trendMap) trendMap[k] += Number(e.amount);
      });
    const trend = Object.entries(trendMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 10 expenses
    const topExpenses = filtered
      .filter(e => e.status === 'approved' || e.status === 'paid')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10)
      .map(e => ({
        description: e.description || 'Expense',
        category: e.category || 'Uncategorized',
        amount: Number(e.amount),
        date: e.expense_date,
      }));

    return {
      totalExpenses,
      byCategory,
      byStatus,
      byVendor,
      trend,
      topExpenses,
      period: dateRange,
    };
  },

  exportRevenueReportToCSV(data: RevenueReportData, filename?: string) {
    const rows: (string | number)[][] = [
      ['Revenue Report'],
      [`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`],
      [''],
      ['SUMMARY'],
      ['Total Revenue', data.totalRevenue.toFixed(2)],
      ['Camp Registrations Revenue', data.campRegistrationsRevenue.toFixed(2)],
      ['Other Payments Revenue', data.paymentsRevenue.toFixed(2)],
      [''],
      ['BY SOURCE'],
      ['Source', 'Amount', 'Count'],
      ...data.bySource.map(s => [s.source, s.amount.toFixed(2), s.count]),
      [''],
      ['BY ACTIVITY'],
      ['Activity', 'Amount', 'Count'],
      ...data.byActivity.map(a => [a.activity, a.amount.toFixed(2), a.count]),
      [''],
      ['BY PAYMENT METHOD'],
      ['Method', 'Amount', 'Count'],
      ...data.byMethod.map(m => [m.method, m.amount.toFixed(2), m.count]),
    ];
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportRevenueReportToPDF(data: RevenueReportData, filename?: string) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Revenue Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Total Revenue: KES ${data.totalRevenue.toLocaleString()}`, 14, 34);

    autoTable(doc, {
      head: [['Source', 'Amount (KES)', 'Count']],
      body: data.bySource.map(s => [s.source, s.amount.toLocaleString(), s.count.toString()]),
      startY: 42,
      headStyles: { fillColor: [34, 139, 34] },
    });
    autoTable(doc, {
      head: [['Activity', 'Amount (KES)', 'Count']],
      body: data.byActivity.map(a => [a.activity, a.amount.toLocaleString(), a.count.toString()]),
      startY: (doc as any).lastAutoTable.finalY + 8,
      headStyles: { fillColor: [0, 123, 255] },
    });
    autoTable(doc, {
      head: [['Payment Method', 'Amount (KES)', 'Count']],
      body: data.byMethod.map(m => [m.method, m.amount.toLocaleString(), m.count.toString()]),
      startY: (doc as any).lastAutoTable.finalY + 8,
      headStyles: { fillColor: [255, 152, 0] },
    });
    doc.save(filename || `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportExpenseReportToCSV(data: ExpenseReportData, filename?: string) {
    const rows: (string | number)[][] = [
      ['Expense Report'],
      [`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`],
      [''],
      ['Total Expenses', data.totalExpenses.toFixed(2)],
      [''],
      ['BY CATEGORY'],
      ['Category', 'Amount', 'Count', '% of Total'],
      ...data.byCategory.map(c => [c.category, c.amount.toFixed(2), c.count, c.percentage.toFixed(1) + '%']),
      [''],
      ['BY STATUS'],
      ['Status', 'Amount', 'Count'],
      ...data.byStatus.map(s => [s.status, s.amount.toFixed(2), s.count]),
      [''],
      ['BY VENDOR'],
      ['Vendor', 'Amount', 'Count'],
      ...data.byVendor.map(v => [v.vendor, v.amount.toFixed(2), v.count]),
      [''],
      ['TOP EXPENSES'],
      ['Date', 'Description', 'Category', 'Amount'],
      ...data.topExpenses.map(e => [e.date, e.description, e.category, e.amount.toFixed(2)]),
    ];
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename || `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  },

  exportExpenseReportToPDF(data: ExpenseReportData, filename?: string) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Expense Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${format(data.period.startDate, 'dd MMM yyyy')} - ${format(data.period.endDate, 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Total Expenses: KES ${data.totalExpenses.toLocaleString()}`, 14, 34);

    autoTable(doc, {
      head: [['Category', 'Amount (KES)', 'Count', '%']],
      body: data.byCategory.map(c => [c.category, c.amount.toLocaleString(), c.count.toString(), c.percentage.toFixed(1) + '%']),
      startY: 42,
      headStyles: { fillColor: [220, 53, 69] },
    });
    autoTable(doc, {
      head: [['Status', 'Amount (KES)', 'Count']],
      body: data.byStatus.map(s => [s.status, s.amount.toLocaleString(), s.count.toString()]),
      startY: (doc as any).lastAutoTable.finalY + 8,
      headStyles: { fillColor: [108, 117, 125] },
    });
    autoTable(doc, {
      head: [['Vendor', 'Amount (KES)', 'Count']],
      body: data.byVendor.map(v => [v.vendor, v.amount.toLocaleString(), v.count.toString()]),
      startY: (doc as any).lastAutoTable.finalY + 8,
      headStyles: { fillColor: [0, 123, 255] },
    });
    doc.save(filename || `expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },

  exportDailySalesToPDF(data: DailySalesData[], filename?: string) {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Daily Sales Summary', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 28);

    autoTable(doc, {
      head: [['Date', 'Inv. Raised', 'Billed', 'Payments', 'Collected', 'New Regs', 'Camp Coll.', 'Total Billed', 'Total Coll.']],
      body: data.map(day => [
        day.date,
        day.invoicesCreated.toString(),
        day.invoicesAmount.toLocaleString(),
        day.paymentsReceived.toString(),
        day.paymentsAmount.toLocaleString(),
        day.campRegistrations.toString(),
        day.campRevenue.toLocaleString(),
        day.billedAmount.toLocaleString(),
        day.collectedAmount.toLocaleString(),
      ]),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 139, 34] },
    });

    doc.save(filename || `daily-sales-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  },
};
