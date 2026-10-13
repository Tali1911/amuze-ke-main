import { format, differenceInCalendarDays } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';

export interface StatementRegistration {
  id: string;
  registration_number?: string | null;
  invoice_number?: string | null;
  parent_name?: string | null;
  email?: string | null;
  phone?: string | null;
  camp_type?: string | null;
  location?: string | null;
  children?: unknown;
  total_amount?: number | null;
  billing_doc_type?: string | null;
  created_at?: string | null;
}

export interface StatementAttendance {
  id: string;
  registration_id: string;
  child_name: string;
  check_in_time: string;
}

export interface StatementActionItem {
  id: string;
  registration_id: string;
  child_name: string;
  parent_name?: string | null;
  email?: string | null;
  phone?: string | null;
  camp_type?: string | null;
  amount_due: number;
  amount_paid: number;
  status: string;
  created_at: string;
  invoice_id?: string | null;
}

export interface StatementInvoice {
  id: string;
  registration_id?: string | null;
  invoice_number: string;
  due_date?: string | null;
  payment_terms?: string | null;
  created_at: string;
  total_amount: number;
  status: string;
}

export interface StatementPayment {
  id: string;
  registration_id?: string | null;
  invoice_id?: string | null;
  amount: number;
  payment_date?: string | null;
  created_at: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  status: string;
}

export interface StatementCompany {
  company_name: string;
  physical_address: string;
  city: string;
  country: string;
  phone_number: string;
  email_address: string;
  currency: string;
}

export type StatementLineKind = 'charge' | 'visit' | 'payment' | 'credit' | 'warning';

export interface StatementLine {
  id: string;
  kind: StatementLineKind;
  date: string;
  reference: string;
  description: string;
  dueDate?: string;
  charges: number;
  payments: number;
  credits: number;
  balance: number;
  registrationId?: string;
}

export interface StatementAgeing {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  over90: number;
  noDueDate: number;
}

export interface ClientStatement {
  key: string;
  parentName: string;
  email: string;
  phone: string;
  children: string[];
  totalVisits: number;
  openingBalance: number;
  totalCharged: number;
  totalPaid: number;
  totalCredits: number;
  balanceDue: number;
  lines: StatementLine[];
  ageing: StatementAgeing;
  chargesMissing: boolean;
}

export interface StatementSource {
  registrations: StatementRegistration[];
  attendance: StatementAttendance[];
  actionItems: StatementActionItem[];
  invoices: StatementInvoice[];
  payments: StatementPayment[];
}

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
const money = (value: unknown) => Number(value) || 0;
const toTimestamp = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return parseLocalDate(value).getTime();
  return new Date(value).getTime();
};

export const formatStatementDate = (value?: string | null, pattern = 'dd MMM yyyy') => {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseLocalDate(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, pattern);
};

export const statementClientKey = (
  phone?: string | null,
  email?: string | null,
  parentName?: string | null,
  registrationId?: string
) => {
  if (phone?.trim()) return `p:${phone.trim()}`;
  if (email?.trim()) return `e:${normalize(email)}`;
  if (parentName?.trim() && normalize(parentName) !== 'unknown') return `n:${normalize(parentName)}`;
  return `r:${registrationId || 'unknown'}`;
};

const childNames = (registration?: StatementRegistration) => {
  const raw = registration?.children;
  if (!raw) return [] as string[];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(child => String(child?.childName || child?.name || '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const campLabel = (value?: string | null) => {
  if (!value) return 'Programme';
  return value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
};

const methodLabel = (value?: string | null) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Payment';

const addAgeing = (ageing: StatementAgeing, amount: number, dueDate?: string | null) => {
  if (amount <= 0) return;
  if (!dueDate) {
    ageing.noDueDate += amount;
    return;
  }
  const due = /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? parseLocalDate(dueDate) : new Date(dueDate);
  const days = differenceInCalendarDays(new Date(), due);
  if (days <= 0) ageing.current += amount;
  else if (days <= 30) ageing.days1To30 += amount;
  else if (days <= 60) ageing.days31To60 += amount;
  else if (days <= 90) ageing.days61To90 += amount;
  else ageing.over90 += amount;
};

const FULL_DAY_RATE = 2500;
const HALF_DAY_RATE = 1500;

const localDateKey = (value: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
};

const visitRate = (registration: StatementRegistration, visit: StatementAttendance) => {
  let parsed: unknown = registration.children;
  try { if (typeof parsed === 'string') parsed = JSON.parse(parsed); } catch { parsed = []; }
  const list = Array.isArray(parsed) ? parsed as Array<Record<string, unknown>> : [];
  const child = list.find(c => normalize(String(c?.childName || c?.name || '')) === normalize(visit.child_name));
  const dateKey = localDateKey(visit.check_in_time);
  const sessions = child?.selectedSessions;
  if (sessions && !Array.isArray(sessions) && typeof sessions === 'object') {
    const session = (sessions as Record<string, string>)[dateKey];
    if (session === 'half') return { amount: HALF_DAY_RATE, label: 'Half Day' };
    if (session === 'full') return { amount: FULL_DAY_RATE, label: 'Full Day' };
  }
  const dates = Array.isArray(child?.selectedDates) ? (child?.selectedDates as unknown[]).length : 0;
  const price = money(child?.price);
  if (price > 0 && dates > 0) return { amount: Math.round(price / dates), label: 'Day session' };
  return { amount: FULL_DAY_RATE, label: 'Full Day' };
};


export const buildClientStatements = (source: StatementSource): ClientStatement[] => {
  const registrations = new Map(source.registrations.map(registration => [registration.id, registration]));
  const invoices = new Map(source.invoices.map(invoice => [invoice.id, invoice]));
  const invoiceByRegistration = new Map<string, StatementInvoice>();
  source.invoices.forEach(invoice => {
    if (!invoice.registration_id) return;
    const current = invoiceByRegistration.get(invoice.registration_id);
    if (!current || toTimestamp(invoice.created_at) > toTimestamp(current.created_at)) {
      invoiceByRegistration.set(invoice.registration_id, invoice);
    }
  });

  const groups = new Map<string, {
    registrations: Set<string>;
    actionItems: StatementActionItem[];
    attendance: StatementAttendance[];
  }>();

  const ensureGroup = (registrationId: string, fallback?: StatementActionItem) => {
    const registration = registrations.get(registrationId);
    const key = statementClientKey(
      registration?.phone || fallback?.phone,
      registration?.email || fallback?.email,
      registration?.parent_name || fallback?.parent_name,
      registrationId
    );
    if (!groups.has(key)) groups.set(key, { registrations: new Set(), actionItems: [], attendance: [] });
    const group = groups.get(key);
    if (!group) return null;
    group.registrations.add(registrationId);
    return group;
  };

  const actionItemsByChild = new Map<string, StatementActionItem>();
  source.actionItems.forEach(item => {
    const key = `${item.registration_id}::${normalize(item.child_name)}`;
    const current = actionItemsByChild.get(key);
    if (!current || money(item.amount_due) > money(current.amount_due)) actionItemsByChild.set(key, item);
  });
  actionItemsByChild.forEach(item => ensureGroup(item.registration_id, item)?.actionItems.push(item));
  source.attendance.forEach(visit => ensureGroup(visit.registration_id)?.attendance.push(visit));
  source.invoices.forEach(invoice => {
    if (invoice.registration_id) ensureGroup(invoice.registration_id);
  });
  source.payments.forEach(payment => {
    const invoice = payment.invoice_id ? invoices.get(payment.invoice_id) : undefined;
    const registrationId = payment.registration_id || invoice?.registration_id;
    if (registrationId) ensureGroup(registrationId);
  });

  return Array.from(groups.entries()).map(([key, group]) => {
    const groupRegistrations = Array.from(group.registrations)
      .map(id => registrations.get(id))
      .filter((registration): registration is StatementRegistration => Boolean(registration));
    const contactRegistration = groupRegistrations.find(registration => registration.parent_name || registration.email || registration.phone);
    const contactAction = group.actionItems.find(item => item.parent_name || item.email || item.phone);
    const parentName = contactRegistration?.parent_name || contactAction?.parent_name || 'Unknown';
    const email = contactRegistration?.email || contactAction?.email || '';
    const phone = contactRegistration?.phone || contactAction?.phone || '';
    const children = new Set<string>();
    groupRegistrations.flatMap(childNames).forEach(name => children.add(name));
    group.attendance.forEach(visit => children.add(visit.child_name));
    group.actionItems.forEach(item => children.add(item.child_name));

    const visitsByRegistration = new Map<string, StatementAttendance[]>();
    group.attendance.forEach(visit => {
      const list = visitsByRegistration.get(visit.registration_id) || [];
      list.push(visit);
      visitsByRegistration.set(visit.registration_id, list);
    });

    const financialLines: StatementLine[] = [];
    const chargeTotalsByRegistration = new Map<string, number>();
    const visitBilledRegistrations = new Set<string>();
    let chargesMissing = false;

    // Attendance-based billing: each visit is charged on the day it happened.
    visitsByRegistration.forEach((visits, registrationId) => {
      const registration = registrations.get(registrationId);
      if (!registration) return;
      visitBilledRegistrations.add(registrationId);
      let total = 0;
      visits.forEach(visit => {
        const { amount, label } = visitRate(registration, visit);
        total += amount;
        financialLines.push({
          id: `visit-charge-${visit.id}`,
          kind: 'charge',
          date: visit.check_in_time,
          reference: registration.invoice_number || registration.registration_number || registrationId.slice(0, 8),
          description: `${visit.child_name} — ${label}, ${campLabel(registration.camp_type)}${registration.location ? ` at ${registration.location}` : ''}`,
          charges: amount,
          payments: 0,
          credits: 0,
          balance: 0,
          registrationId,
        });
      });
      chargeTotalsByRegistration.set(registrationId, total);
    });

    group.actionItems.forEach(item => {
      if (visitBilledRegistrations.has(item.registration_id)) return;
      const registration = registrations.get(item.registration_id);
      const invoice = (item.invoice_id ? invoices.get(item.invoice_id) : undefined)
        || invoiceByRegistration.get(item.registration_id);
      const amount = money(item.amount_due);
      chargesMissing ||= amount <= 0;
      chargeTotalsByRegistration.set(item.registration_id, (chargeTotalsByRegistration.get(item.registration_id) || 0) + amount);
      financialLines.push({
        id: `charge-${item.id}`,
        kind: amount > 0 ? 'charge' : 'warning',
        date: invoice?.created_at || registration?.created_at || item.created_at,
        reference: invoice?.invoice_number || registration?.invoice_number || registration?.registration_number || item.registration_id.slice(0, 8),
        description: amount > 0
          ? `${item.child_name} — ${campLabel(registration?.camp_type || item.camp_type)}`
          : `${item.child_name} — charge amount not recorded`,
        dueDate: invoice?.due_date || undefined,
        charges: amount,
        payments: 0,
        credits: 0,
        balance: 0,
        registrationId: item.registration_id,
      });
    });

    groupRegistrations.forEach(registration => {
      if (chargeTotalsByRegistration.has(registration.id)) return;
      const amount = money(registration.total_amount);
      if (amount <= 0) return;
      const invoice = invoiceByRegistration.get(registration.id);
      // Online bookings are quotations until attended or paid; exclude unattended, unpaid quotations.
      const hasPayment = source.payments.some(p => p.status === 'completed' && p.registration_id === registration.id);
      const isBilled = registration.billing_doc_type === 'invoice' || registration.billing_doc_type === 'paid';
      if (!invoice && !hasPayment && !isBilled) return;
      chargeTotalsByRegistration.set(registration.id, amount);
      financialLines.push({
        id: `charge-registration-${registration.id}`,
        kind: 'charge',
        date: invoice?.created_at || registration.created_at || new Date().toISOString(),
        reference: invoice?.invoice_number || registration.invoice_number || registration.registration_number || registration.id.slice(0, 8),
        description: `${campLabel(registration.camp_type)} registration`,
        dueDate: invoice?.due_date || undefined,
        charges: amount,
        payments: 0,
        credits: 0,
        balance: 0,
        registrationId: registration.id,
      });
    });

    const groupPayments = source.payments.filter(payment => {
      if (payment.registration_id && group.registrations.has(payment.registration_id)) return true;
      const invoice = payment.invoice_id ? invoices.get(payment.invoice_id) : undefined;
      return Boolean(invoice?.registration_id && group.registrations.has(invoice.registration_id));
    });
    const paymentRegistrationIds = new Set<string>();
    groupPayments.forEach(payment => {
      const invoice = payment.invoice_id ? invoices.get(payment.invoice_id) : undefined;
      const registrationId = payment.registration_id || invoice?.registration_id || undefined;
      if (registrationId) paymentRegistrationIds.add(registrationId);
      const amount = money(payment.amount);
      if (amount <= 0 || payment.status !== 'completed') return;
      financialLines.push({
        id: `payment-${payment.id}`,
        kind: 'payment',
        date: payment.payment_date || payment.created_at,
        reference: payment.payment_reference || invoice?.invoice_number || (registrationId ? registrations.get(registrationId)?.registration_number : '') || payment.id.slice(0, 8),
        description: `Payment received — ${methodLabel(payment.payment_method)}`,
        charges: 0,
        payments: amount,
        credits: 0,
        balance: 0,
        registrationId,
      });
    });

    group.actionItems.forEach(item => {
      const paid = money(item.amount_paid);
      if (paid <= 0 || paymentRegistrationIds.has(item.registration_id)) return;
      const registration = registrations.get(item.registration_id);
      financialLines.push({
        id: `payment-ledger-${item.id}`,
        kind: 'payment',
        date: item.created_at,
        reference: registration?.registration_number || item.registration_id.slice(0, 8),
        description: `Payment recorded — ${item.child_name}`,
        charges: 0,
        payments: paid,
        credits: 0,
        balance: 0,
        registrationId: item.registration_id,
      });
    });

    financialLines.sort((left, right) => {
      const dateDifference = toTimestamp(left.date) - toTimestamp(right.date);
      if (dateDifference !== 0) return dateDifference;
      if (left.kind === 'charge' && right.kind !== 'charge') return -1;
      if (right.kind === 'charge' && left.kind !== 'charge') return 1;
      return left.id.localeCompare(right.id);
    });

    const lines: StatementLine[] = [];
    const insertedVisits = new Set<string>();
    let balance = 0;
    visitBilledRegistrations.forEach(id => insertedVisits.add(id));
    financialLines.forEach(line => {
      balance += line.charges - line.payments - line.credits;
      line.balance = balance;
      lines.push(line);
      if (line.kind !== 'charge' || !line.registrationId || insertedVisits.has(line.registrationId)) return;
      insertedVisits.add(line.registrationId);
      const registration = registrations.get(line.registrationId);
      const visits = [...(visitsByRegistration.get(line.registrationId) || [])]
        .sort((left, right) => toTimestamp(left.check_in_time) - toTimestamp(right.check_in_time));
      visits.forEach(visit => lines.push({
        id: `visit-${visit.id}`,
        kind: 'visit',
        date: visit.check_in_time,
        reference: 'Visit',
        description: `${visit.child_name} — attended ${campLabel(registration?.camp_type)}${registration?.location ? ` at ${registration.location}` : ''}`,
        charges: 0,
        payments: 0,
        credits: 0,
        balance,
        registrationId: line.registrationId,
      }));
    });

    group.attendance.forEach(visit => {
      if (insertedVisits.has(visit.registration_id)) return;
      chargesMissing = true;
      lines.push({
        id: `visit-unlinked-${visit.id}`,
        kind: 'warning',
        date: visit.check_in_time,
        reference: 'Unlinked visit',
        description: `${visit.child_name} — visit recorded but no charge was found`,
        charges: 0,
        payments: 0,
        credits: 0,
        balance,
        registrationId: visit.registration_id,
      });
    });

    const totalCharged = financialLines.reduce((sum, line) => sum + line.charges, 0);
    const totalPaid = financialLines.reduce((sum, line) => sum + line.payments, 0);
    const totalCredits = financialLines.reduce((sum, line) => sum + line.credits, 0);
    const ageing: StatementAgeing = { current: 0, days1To30: 0, days31To60: 0, days61To90: 0, over90: 0, noDueDate: 0 };
    const paymentsByRegistration = new Map<string, number>();
    financialLines.filter(line => line.kind === 'payment').forEach(line => {
      if (!line.registrationId) return;
      paymentsByRegistration.set(line.registrationId, (paymentsByRegistration.get(line.registrationId) || 0) + line.payments);
    });
    const chargeLinesByRegistration = new Map<string, StatementLine[]>();
    financialLines.filter(line => line.kind === 'charge').forEach(line => {
      if (!line.registrationId) return;
      const list = chargeLinesByRegistration.get(line.registrationId) || [];
      list.push(line);
      chargeLinesByRegistration.set(line.registrationId, list);
    });
    chargeLinesByRegistration.forEach((chargeLines, registrationId) => {
      let paidRemaining = paymentsByRegistration.get(registrationId) || 0;
      chargeLines.forEach(charge => {
        const outstanding = Math.max(0, charge.charges - paidRemaining);
        paidRemaining = Math.max(0, paidRemaining - charge.charges);
        addAgeing(ageing, outstanding, charge.dueDate);
      });
    });

    return {
      key,
      parentName,
      email,
      phone,
      children: Array.from(children).filter(Boolean).sort(),
      totalVisits: group.attendance.length,
      openingBalance: 0,
      totalCharged,
      totalPaid,
      totalCredits,
      balanceDue: totalCharged - totalPaid - totalCredits,
      lines,
      ageing,
      chargesMissing,
    };
  }).sort((left, right) => right.balanceDue - left.balanceDue || left.parentName.localeCompare(right.parentName));
};
