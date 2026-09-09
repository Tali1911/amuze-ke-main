import { CampRegistration } from '@/types/campRegistration';
import { resolveCampAmountPaid } from '@/utils/campPayment';
import { formatShortDate } from '@/utils/dateMapper';

interface ReceiptOptions {
  registration: CampRegistration;
  amountPaid: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
}

export function printCampReceipt(opts: ReceiptOptions) {
  const { registration, amountPaid, totalAmount, discountAmount, paymentMethod, paymentReference } = opts;
  const netTotal = Math.max(0, totalAmount - (discountAmount || 0));
  const resolvedAmountPaid = resolveCampAmountPaid(registration, amountPaid, netTotal);
  const balance = Math.max(0, netTotal - resolvedAmountPaid);
  const refundDue = Math.max(0, resolvedAmountPaid - netTotal);
  const status = resolvedAmountPaid <= 0
    ? 'UNPAID'
    : resolvedAmountPaid > netTotal
      ? 'OVERPAID'
      : resolvedAmountPaid >= netTotal ? 'PAID' : 'PARTIAL';
  const receiptNo = `RCPT-${(registration.registration_number || '').replace(/\W+/g, '')}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
  const issuedAt = new Date().toLocaleString();
  const method = (paymentMethod || registration.payment_method || '').replace('_', ' ');
  const ref = paymentReference || registration.payment_reference || '';

  const childrenRows = (registration.children || [])
    .map((c) => {
      const dates = (c.selectedDates || [])
        .map((d) => formatShortDate(d))
        .join(', ');
      const sessions = Array.isArray(c.selectedSessions)
        ? (c.selectedSessions as string[]).join(', ')
        : Object.entries((c.selectedSessions || {}) as Record<string, string>)
            .map(([d, s]) => `${formatShortDate(d)}:${s}`)
            .join(', ');
      return `<tr>
        <td>${escapeHtml(c.childName)}</td>
        <td>${escapeHtml(c.ageRange || '')}</td>
        <td>${escapeHtml(dates)}</td>
        <td>${escapeHtml(sessions)}</td>
        <td class="num">${Number(c.price || 0).toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Receipt ${receiptNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 24px; }
  .wrap { max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2f5d3a; padding-bottom: 12px; margin-bottom: 16px; }
  .brand { font-size: 22px; font-weight: 700; color: #2f5d3a; letter-spacing: 0.3px; }
  .brand small { display:block; font-weight:400; font-size:11px; color:#555; letter-spacing:0; }
  .meta { text-align: right; font-size: 12px; color: #333; }
  .meta strong { display:block; font-size: 14px; color:#1a1a1a; }
  h2 { font-size: 16px; margin: 18px 0 8px; color:#2f5d3a; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 13px; }
  .grid div span { color:#666; display:inline-block; min-width: 90px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
  th { background:#f4f7f4; color:#2f5d3a; font-weight:600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 12px; margin-left: auto; width: 280px; font-size: 13px; }
  .totals div { display:flex; justify-content:space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #2f5d3a; padding-top: 6px; margin-top: 4px; font-weight:700; font-size:15px; color:#2f5d3a; }
  .badge { display:inline-block; padding:3px 10px; border-radius: 999px; font-size:11px; font-weight:700; letter-spacing:0.5px; }
  .badge.PAID { background:#d8efdf; color:#1f7a3a; }
  .badge.PARTIAL { background:#fff2cf; color:#8a6500; }
  .badge.UNPAID { background:#fadcdc; color:#8a1f1f; }
  .badge.OVERPAID { background:#ffe4b5; color:#8a4500; }
  .footer { margin-top: 28px; text-align:center; font-size: 11px; color:#666; border-top:1px dashed #ccc; padding-top: 10px; }
  .sign { margin-top: 36px; display:flex; justify-content: space-between; font-size: 12px; }
  .sign div { width: 45%; border-top: 1px solid #999; padding-top: 4px; text-align:center; color:#555; }
  @media print { body { padding: 0; } .noprint { display:none; } }
  .noprint { text-align:right; margin-bottom: 12px; }
  .noprint button { background:#2f5d3a; color:#fff; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:13px; }
</style></head>
<body>
<div class="wrap">
  <div class="noprint"><button onclick="window.print()">Print Receipt</button></div>
  <div class="header">
    <div class="brand">Amuse Bush Camp Kenya<small>Karura Forest / Ngong Road Forest Sanctuary</small></div>
    <div class="meta">
      <strong>RECEIPT</strong>
      <div>#${escapeHtml(receiptNo)}</div>
      <div>Issued: ${escapeHtml(issuedAt)}</div>
      <div>Status: <span class="badge ${status}">${status}</span></div>
    </div>
  </div>

  <div class="grid">
    <div><span>Parent:</span> ${escapeHtml(registration.parent_name || '')}</div>
    <div><span>Reg #:</span> ${escapeHtml(registration.registration_number || '')}</div>
    <div><span>Email:</span> ${escapeHtml(registration.email || '')}</div>
    <div><span>Phone:</span> ${escapeHtml(registration.phone || '')}</div>
    <div><span>Camp:</span> ${escapeHtml((registration.camp_type || '').replace(/-/g, ' '))}</div>
    <div><span>Method:</span> ${escapeHtml(method || '—')}</div>
    ${ref ? `<div><span>Reference:</span> ${escapeHtml(ref)}</div>` : ''}
  </div>

  <h2>Children & Sessions</h2>
  <table>
    <thead><tr><th>Child</th><th>Age</th><th>Dates</th><th>Sessions</th><th class="num">Amount (KES)</th></tr></thead>
    <tbody>${childrenRows || '<tr><td colspan="5">No children listed</td></tr>'}</tbody>
  </table>

  <div class="totals">
    <div><span>Gross Total</span><span>KES ${totalAmount.toFixed(2)}</span></div>
    ${discountAmount > 0 ? `<div><span>Discount</span><span>− KES ${discountAmount.toFixed(2)}</span></div>` : ''}
    <div><span>Net Total</span><span>KES ${netTotal.toFixed(2)}</span></div>
    <div><span>Amount Paid</span><span>KES ${resolvedAmountPaid.toFixed(2)}</span></div>
    ${refundDue > 0
      ? `<div class="grand" style="color:#8a4500;border-top-color:#8a4500;"><span>Refund Due</span><span>KES ${refundDue.toFixed(2)}</span></div>`
      : `<div class="grand"><span>${balance > 0 ? 'Balance Due' : 'Settled'}</span><span>KES ${balance.toFixed(2)}</span></div>`}
  </div>

  <div class="sign">
    <div>Received By</div>
    <div>Customer Signature</div>
  </div>

  <div class="footer">
    Thank you for choosing Amuse Bush Camp Kenya. For queries: accounts@amusekenya.co.ke
  </div>
</div>
<script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=820,height=900');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups to print the receipt.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string));
}
