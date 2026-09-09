import { supabase } from '@/integrations/supabase/client';

export type DiscountType = 'percentage' | 'fixed_amount' | 'fixed_price_per_child_day';
export type DiscountStatus = 'active' | 'revoked' | 'used' | 'expired';

export interface ClientDiscount {
  id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  discount_type: DiscountType;
  discount_value: number;
  camp_type: string | null;
  valid_from: string | null;
  valid_to: string | null;
  min_total: number | null;
  min_children: number | null;
  single_use: boolean;
  status: DiscountStatus;
  used_at: string | null;
  used_registration_id: string | null;
  used_amount: number | null;
  reason: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewClientDiscount {
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  camp_type?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  min_total?: number | null;
  min_children?: number | null;
  single_use?: boolean;
  reason?: string | null;
}

export interface DiscountApplication {
  discount: ClientDiscount;
  originalTotal: number;
  finalTotal: number;
  discountAmount: number;
  description: string;
}

const normEmail = (v?: string | null) => (v || '').trim().toLowerCase() || null;
const normPhone = (v?: string | null) => (v || '').replace(/\s|-/g, '').trim() || null;

// Anon client uses a thin wrapper around supabase to bypass generated types.
const db: any = supabase;

export const discountService = {
  async list(): Promise<ClientDiscount[]> {
    const { data, error } = await db
      .from('client_discounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ClientDiscount[];
  },

  async create(input: NewClientDiscount): Promise<ClientDiscount> {
    const payload = {
      ...input,
      client_email: normEmail(input.client_email),
      client_phone: normPhone(input.client_phone),
      single_use: input.single_use ?? true,
    };
    const { data, error } = await db
      .from('client_discounts')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    const created = data as ClientDiscount;
    logAudit({
      discount_id: created.id,
      event_type: 'created',
      client_email: created.client_email,
      client_phone: created.client_phone,
      camp_type: created.camp_type,
      reason: describeDiscount(created),
    });
    return created;
  },

  async revoke(id: string): Promise<void> {
    const { error } = await db
      .from('client_discounts')
      .update({ status: 'revoked' })
      .eq('id', id);
    if (error) throw error;
    logAudit({ discount_id: id, event_type: 'revoked' });
  },

  async markEmailSent(id: string): Promise<void> {
    await db
      .from('client_discounts')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('id', id);
  },

  /**
   * Find the BEST applicable, currently-active discount for a client/booking.
   * Returns null if none.
   */
  async findApplicable(params: {
    email?: string;
    phone?: string;
    campType: string;
    totalBeforeDiscount: number;
    numChildren: number;
    audit?: boolean; // when true, write audit log entries for previews / rejections
  }): Promise<DiscountApplication | null> {
    const email = normEmail(params.email);
    const phone = normPhone(params.phone);
    if (!email && !phone) return null;

    const today = new Date().toISOString().slice(0, 10);

    let query = db
      .from('client_discounts')
      .select('*')
      .eq('status', 'active');

    const filters: string[] = [];
    if (email) filters.push(`client_email.eq.${email}`);
    if (phone) filters.push(`client_phone.eq.${phone}`);
    query = query.or(filters.join(','));

    const { data, error } = await query;
    if (error || !data) return null;

    const all = data as ClientDiscount[];
    const candidates: ClientDiscount[] = [];
    const rejections: { d: ClientDiscount; reason: string }[] = [];

    for (const d of all) {
      let reject: string | null = null;
      if (d.camp_type && d.camp_type !== params.campType)
        reject = `Camp mismatch (requires ${d.camp_type}, got ${params.campType})`;
      else if (d.valid_from && d.valid_from > today)
        reject = `Not yet valid (starts ${d.valid_from})`;
      else if (d.valid_to && d.valid_to < today)
        reject = `Expired on ${d.valid_to}`;
      else if (d.min_total != null && params.totalBeforeDiscount < d.min_total)
        reject = `Below minimum total (need KES ${d.min_total}, got ${params.totalBeforeDiscount})`;
      else if (d.min_children != null && params.numChildren < d.min_children)
        reject = `Below minimum children (need ${d.min_children}, got ${params.numChildren})`;
      if (reject) rejections.push({ d, reason: reject });
      else candidates.push(d);
    }

    const evaluated = candidates.map((d) => {
      const calc = computeDiscount(d, params.totalBeforeDiscount, params.numChildren);
      return { d, ...calc };
    });
    evaluated.sort((a, b) => b.discountAmount - a.discountAmount);
    const best = evaluated[0];

    if (params.audit) {
      // Log rejections + losing candidates + winning preview
      for (const r of rejections) {
        logAudit({
          discount_id: r.d.id,
          event_type: 'rejected',
          client_email: email,
          client_phone: phone,
          camp_type: params.campType,
          total_before: params.totalBeforeDiscount,
          reason: r.reason,
        });
      }
      if (best && best.discountAmount > 0) {
        logAudit({
          discount_id: best.d.id,
          event_type: 'previewed',
          client_email: email,
          client_phone: phone,
          camp_type: params.campType,
          total_before: params.totalBeforeDiscount,
          total_after: best.finalTotal,
          discount_amount: best.discountAmount,
          reason: describeDiscount(best.d),
        });
      }
    }

    if (!best || best.discountAmount <= 0) return null;

    return {
      discount: best.d,
      originalTotal: params.totalBeforeDiscount,
      finalTotal: best.finalTotal,
      discountAmount: best.discountAmount,
      description: describeDiscount(best.d),
    };
  },

  async markUsed(discountId: string, registrationId: string, amount: number) {
    const { data } = await db
      .from('client_discounts')
      .select('single_use, client_email, client_phone, camp_type')
      .eq('id', discountId)
      .maybeSingle();

    const updates: any = {
      used_at: new Date().toISOString(),
      used_registration_id: registrationId,
      used_amount: amount,
    };
    if (data?.single_use) updates.status = 'used';

    await db.from('client_discounts').update(updates).eq('id', discountId);

    logAudit({
      discount_id: discountId,
      event_type: 'applied',
      client_email: data?.client_email ?? null,
      client_phone: data?.client_phone ?? null,
      camp_type: data?.camp_type ?? null,
      discount_amount: amount,
      registration_id: registrationId,
    });
  },

  async sendNotification(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.functions.invoke('send-discount-notification', {
        body: { discountId: id },
      });
      if (error) throw error;
      await this.markEmailSent(id);
      logAudit({ discount_id: id, event_type: 'email_sent' });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send email' };
    }
  },

  async listAudit(limit = 200): Promise<DiscountAuditEntry[]> {
    const { data, error } = await db
      .from('discount_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as DiscountAuditEntry[];
  },
};

export interface DiscountAuditEntry {
  id: string;
  discount_id: string | null;
  event_type: 'previewed' | 'applied' | 'rejected' | 'revoked' | 'created' | 'email_sent';
  client_email: string | null;
  client_phone: string | null;
  camp_type: string | null;
  total_before: number | null;
  total_after: number | null;
  discount_amount: number | null;
  reason: string | null;
  registration_id: string | null;
  metadata: any;
  created_at: string;
}

function logAudit(entry: Partial<DiscountAuditEntry>) {
  // Fire-and-forget; never throws.
  db.from('discount_audit_log').insert(entry).then(
    () => {},
    (e: any) => console.warn('discount audit log failed', e?.message)
  );
}

/**
 * Validate a discount's date window. Returns a list of human-readable
 * warnings/issues — empty array means the window is fine.
 */
export function validateDiscountDates(
  validFrom: string | null | undefined,
  validTo: string | null | undefined,
  options: { warnDaysToExpiry?: number } = {}
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warnDays = options.warnDaysToExpiry ?? 7;

  const parse = (s?: string | null) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const f = parse(validFrom);
  const t = parse(validTo);

  if (f && t && t < f) errors.push('Valid-to date is before Valid-from.');
  if (t && t < today) errors.push(`Already expired on ${validTo}.`);
  if (f && f > today) warnings.push(`Not active yet — starts ${validFrom}.`);
  if (t && t >= today) {
    const days = Math.ceil((t.getTime() - today.getTime()) / 86400000);
    if (days <= warnDays) warnings.push(`Expires in ${days} day${days === 1 ? '' : 's'}.`);
  }
  return { errors, warnings };
}

export function computeDiscount(
  d: ClientDiscount,
  total: number,
  numChildren: number
): { finalTotal: number; discountAmount: number } {
  let finalTotal = total;
  if (d.discount_type === 'percentage') {
    finalTotal = Math.max(0, total * (1 - d.discount_value / 100));
  } else if (d.discount_type === 'fixed_amount') {
    finalTotal = Math.max(0, total - d.discount_value);
  } else if (d.discount_type === 'fixed_price_per_child_day') {
    // Approximate: we don't know per-child-day count here, caller may
    // provide a better estimate via numChildren only; assume original total
    // is built from variable per-day prices and clamp to value * children.
    // This branch is best handled at submission time where we know dates.
    finalTotal = Math.min(total, d.discount_value * Math.max(1, numChildren));
  }
  finalTotal = Math.round(finalTotal);
  return { finalTotal, discountAmount: Math.max(0, total - finalTotal) };
}

export function describeDiscount(d: ClientDiscount): string {
  if (d.discount_type === 'percentage') return `${d.discount_value}% off`;
  if (d.discount_type === 'fixed_amount') return `KES ${d.discount_value.toLocaleString()} off`;
  return `KES ${d.discount_value.toLocaleString()} per child/day`;
}
