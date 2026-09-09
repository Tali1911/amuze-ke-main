import { CampRegistration } from '@/types/campRegistration';

export const resolveCampAmountPaid = (
  registration: CampRegistration,
  paymentsAmount: number,
  netTotal: number
): number => {
  if (paymentsAmount > 0) return paymentsAmount;
  if (registration.payment_status === 'paid' || registration.billing_doc_type === 'paid') return netTotal;

  const notesPaid = parsePaidAmountFromNotes(registration.admin_notes || '');
  return notesPaid > 0 ? notesPaid : 0;
};

const parsePaidAmountFromNotes = (notes: string): number => {
  const match = notes.match(/Paid:\s*(?:KES|KSH|Ksh)?\s*([\d,]+(?:\.\d+)?)\s*\/\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) return 0;

  return Number(match[1].replace(/,/g, '')) || 0;
};