import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { AccountsActionItem } from "@/services/accountsActionService";
import { supabase } from "@/integrations/supabase/client";
import { displayLocation } from "@/lib/locationDisplay";

/**
 * Fetch participation dates per registration_id from camp_attendance.
 * Returns map registration_id -> sorted unique YYYY-MM-DD strings.
 */
async function fetchParticipationDates(registrationIds: string[]): Promise<Record<string, string[]>> {
  const map: Record<string, string[]> = {};
  const ids = Array.from(new Set(registrationIds.filter(Boolean)));
  if (ids.length === 0) return map;
  try {
    const { data, error } = await (supabase.from("camp_attendance" as any) as any)
      .select("registration_id, attendance_date")
      .in("registration_id", ids);
    if (error || !data) return map;
    for (const row of data as Array<{ registration_id: string; attendance_date: string }>) {
      if (!row.registration_id || !row.attendance_date) continue;
      const set = (map[row.registration_id] = map[row.registration_id] || []);
      if (!set.includes(row.attendance_date)) set.push(row.attendance_date);
    }
    Object.keys(map).forEach((k) => map[k].sort());
  } catch (e) {
    console.warn("fetchParticipationDates failed", e);
  }
  return map;
}

function formatDateList(dates: string[]): string {
  if (!dates || dates.length === 0) return "—";
  return dates
    .map((d) => {
      const [y, m, day] = d.split("-").map(Number);
      const dt = new Date(y, (m || 1) - 1, day || 1);
      return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    })
    .join(", ");
}

const COMPANY = {
  name: "Amuse Kenya",
  email: "accounts@amusekenya.co.ke",
  phone: "+254 114 705763",
  address: "Sigiria Karura Forest Gate F entrance (Sigiria coffee house), Nairobi",
};

/**
 * Generate a single-row invoice PDF for a pending-collection item.
 * Per-row download so admin/accounts can hand it to a parent independently.
 */
export function downloadPendingInvoicePDF(item: AccountsActionItem) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const balance = (item.amount_due || 0) - (item.amount_paid || 0);
  const invoiceNo = `PC-${(item.id || "").slice(0, 8).toUpperCase()}`;
  const issued = new Date().toLocaleDateString();

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 14, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 14, 27);
  doc.text(`${COMPANY.email} • ${COMPANY.phone}`, 14, 32);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`No: ${invoiceNo}`, pageWidth - 14, 27, { align: "right" });
  doc.text(`Date: ${issued}`, pageWidth - 14, 32, { align: "right" });
  doc.text(`Status: ${item.status?.toUpperCase()}`, pageWidth - 14, 37, { align: "right" });

  // Bill to
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.text(item.parent_name || "—", 14, 54);
  if (item.email) doc.text(item.email, 14, 59);
  if (item.phone) doc.text(item.phone, 14, 64);

  // Line item table
  autoTable(doc, {
    startY: 75,
    head: [["Child", "Program", "Location", "Amount Due (KES)", "Paid (KES)", "Balance (KES)"]],
    body: [
      [
        item.child_name || "",
        item.camp_type || "",
        displayLocation((item as any).location || ""),
        (item.amount_due || 0).toLocaleString(),
        (item.amount_paid || 0).toLocaleString(),
        balance.toLocaleString(),
      ],
    ],
    headStyles: { fillColor: [34, 87, 50] },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 90;

  // Totals
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Outstanding Balance: KES ${balance.toLocaleString()}`, pageWidth - 14, finalY + 12, { align: "right" });

  // Footer / notes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const noteY = finalY + 24;
  doc.text("Payment Instructions:", 14, noteY);
  doc.text("BuyGoods Till: 4572520", 14, noteY + 5);
  doc.text(`Reference: ${invoiceNo}`, 14, noteY + 10);
  if (item.notes) {
    doc.text(`Notes: ${item.notes}`, 14, noteY + 18);
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "This invoice was generated from the Pending Collections system.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  doc.save(`Invoice-${invoiceNo}-${(item.child_name || "child").replace(/\s+/g, "_")}.pdf`);
}

/**
 * Generate a consolidated family invoice PDF covering every pending item for a parent.
 * Use when accounts/admin want to send/hand-off one document for the whole family.
 */
export async function downloadFamilyInvoicePDF(items: AccountsActionItem[]) {
  if (!items || items.length === 0) return;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const first = items[0];
  const totalDue = items.reduce((s, i) => s + (i.amount_due || 0), 0);
  const totalPaid = items.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const balance = totalDue - totalPaid;
  const familyKey = (first.phone || first.email || first.parent_name || "FAM")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  const invoiceNo = `FAM-${familyKey}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  const issued = new Date().toLocaleDateString();

  // Fetch participation dates per registration (best-effort)
  const datesByReg = await fetchParticipationDates(items.map((i) => i.registration_id));
  const allDates = Array.from(new Set(Object.values(datesByReg).flat())).sort();
  const periodLabel =
    allDates.length === 0
      ? "—"
      : allDates.length === 1
        ? formatDateList(allDates)
        : `${formatDateList([allDates[0]])} – ${formatDateList([allDates[allDates.length - 1]])}`;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 14, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 14, 27);
  doc.text(`${COMPANY.email} • ${COMPANY.phone}`, 14, 32);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FAMILY INVOICE", pageWidth - 14, 20, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`No: ${invoiceNo}`, pageWidth - 14, 27, { align: "right" });
  doc.text(`Date: ${issued}`, pageWidth - 14, 32, { align: "right" });
  doc.text(`Children: ${items.length}`, pageWidth - 14, 37, { align: "right" });

  // Bill to
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.text(first.parent_name || "—", 14, 54);
  if (first.email) doc.text(first.email, 14, 59);
  if (first.phone) doc.text(first.phone, 14, 64);

  // Billing Summary section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Billing Summary", 14, 75);
  doc.setDrawColor(34, 87, 50);
  doc.setLineWidth(0.4);
  doc.line(14, 77, pageWidth - 14, 77);

  autoTable(doc, {
    startY: 80,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55 },
      1: { cellWidth: "auto" },
    },
    body: [
      ["Account / Family", first.parent_name || "—"],
      ["Children Billed", String(items.length)],
      ["Service Period", periodLabel],
      ["Total Participation Days", String(allDates.length)],
      ["Total Amount Due", `KES ${totalDue.toLocaleString()}`],
      ["Total Paid", `KES ${totalPaid.toLocaleString()}`],
      ["Outstanding Balance", `KES ${balance.toLocaleString()}`],
    ],
  });

  // Per-child line items with participation dates
  const lineStartY = ((doc as any).lastAutoTable.finalY || 110) + 8;
  autoTable(doc, {
    startY: lineStartY,
    head: [["Child", "Program", "Location", "Participation Dates", "Due", "Paid", "Balance"]],
    body: items.map((i) => [
      i.child_name || "",
      i.camp_type || "",
      displayLocation((i as any).location || ""),
      formatDateList(datesByReg[i.registration_id] || []),
      (i.amount_due || 0).toLocaleString(),
      (i.amount_paid || 0).toLocaleString(),
      ((i.amount_due || 0) - (i.amount_paid || 0)).toLocaleString(),
    ]),
    foot: [
      [
        { content: "TOTAL (KES)", colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
        { content: totalDue.toLocaleString(), styles: { fontStyle: "bold" } },
        { content: totalPaid.toLocaleString(), styles: { fontStyle: "bold" } },
        { content: balance.toLocaleString(), styles: { fontStyle: "bold" } },
      ],
    ],
    headStyles: { fillColor: [34, 87, 50] },
    footStyles: { fillColor: [240, 240, 240], textColor: 20 },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      3: { cellWidth: 50 },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 90;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Outstanding Balance: KES ${balance.toLocaleString()}`, pageWidth - 14, finalY + 12, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const noteY = finalY + 24;
  doc.text("Payment Instructions:", 14, noteY);
  doc.text("BuyGoods Till: 4572520", 14, noteY + 5);
  doc.text(`Reference: ${invoiceNo}`, 14, noteY + 10);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Consolidated family invoice generated from the Pending Collections system.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" },
  );

  doc.save(`FamilyInvoice-${invoiceNo}-${(first.parent_name || "family").replace(/\s+/g, "_")}.pdf`);
}

/**
 * Bulk CSV export of pending-collection items.
 */
export function exportPendingCollectionsCSV(items: AccountsActionItem[], filename = "pending-collections.csv") {
  const headers = [
    "Child Name",
    "Parent Name",
    "Email",
    "Phone",
    "Program",
    "Location",
    "Amount Due (KES)",
    "Amount Paid (KES)",
    "Balance (KES)",
    "Status",
    "Invoice Sent",
    "Invoice Sent At",
    "Created At",
    "Completed At",
    "Notes",
  ];

  const rows = items.map((i) => [
    i.child_name || "",
    i.parent_name || "",
    i.email || "",
    i.phone || "",
    i.camp_type || "",
    displayLocation((i as any).location || ""),
    i.amount_due ?? 0,
    i.amount_paid ?? 0,
    (i.amount_due || 0) - (i.amount_paid || 0),
    i.status || "",
    i.invoice_sent ? "Yes" : "No",
    i.invoice_sent_at ? new Date(i.invoice_sent_at).toLocaleString() : "",
    i.created_at ? new Date(i.created_at).toLocaleString() : "",
    i.completed_at ? new Date(i.completed_at).toLocaleString() : "",
    (i.notes || "").replace(/"/g, '""'),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}
