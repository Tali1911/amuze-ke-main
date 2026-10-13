import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, FileSpreadsheet, FileText, Printer, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDragScroll } from '@/hooks/useDragScroll';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  buildClientStatements,
  ClientStatement,
  formatStatementDate,
  StatementActionItem,
  StatementAttendance,
  StatementCompany,
  StatementInvoice,
  StatementLine,
  StatementPayment,
  StatementRegistration,
} from '@/utils/clientStatement';

const fromTable = (tableName: string) => supabase.from(tableName as never);
const fetchAllRows = async (tableName: string, columns: string) => {
  const rows: unknown[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await (supabase as any)
      .from(tableName)
      .select(columns)
      .range(start, start + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
};
const DEFAULT_COMPANY: StatementCompany = {
  company_name: 'Amuse Kenya',
  physical_address: '',
  city: 'Nairobi',
  country: 'Kenya',
  phone_number: '',
  email_address: '',
  currency: 'KES',
};

const formatMoney = (amount: number) => `KES ${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const balanceLabel = (amount: number) => amount < 0 ? `${formatMoney(amount)} account credit` : formatMoney(amount);
const filename = (client: ClientStatement, extension: string) =>
  `Statement_${client.parentName.replace(/[^a-z0-9]+/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.${extension}`;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character));
const displayAmount = (amount: number) => amount ? formatMoney(amount) : '—';
const companyAddress = (company: StatementCompany) =>
  [company.physical_address, company.city, company.country].filter(Boolean).join(', ');

const statementTableRows = (client: ClientStatement) => client.lines.map(line => [
  formatStatementDate(line.date),
  line.reference,
  line.description,
  formatStatementDate(line.dueDate),
  displayAmount(line.charges),
  displayAmount(line.payments),
  displayAmount(line.credits),
  balanceLabel(line.balance),
]);

const addStatementPdf = (
  doc: jsPDF,
  client: ClientStatement,
  company: StatementCompany,
  startNewPage = false
) => {
  if (startNewPage) doc.addPage();
  doc.setFontSize(18);
  doc.text(company.company_name || 'Amuse Kenya', 14, 18);
  doc.setFontSize(9);
  const address = companyAddress(company);
  if (address) doc.text(address, 14, 24);
  if (company.phone_number || company.email_address) {
    doc.text([company.phone_number, company.email_address].filter(Boolean).join(' | '), 14, 29);
  }
  doc.setFontSize(15);
  doc.text('CLIENT STATEMENT', 196, 18, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Statement date: ${format(new Date(), 'dd MMM yyyy')}`, 196, 24, { align: 'right' });
  doc.text('Period: All account history', 196, 29, { align: 'right' });

  doc.setFontSize(10);
  doc.text(`Client: ${client.parentName}`, 14, 39);
  doc.text(`Email: ${client.email || '—'}`, 14, 45);
  doc.text(`Phone: ${client.phone || '—'}`, 14, 51);
  doc.text(`Children: ${client.children.join(', ') || '—'}`, 14, 57);

  autoTable(doc, {
    startY: 64,
    head: [['Opening Balance', 'Charges / Invoices', 'Payments Received', 'Credits / Adjustments', client.balanceDue < 0 ? 'Account Credit' : 'Amount Due']],
    body: [[
      formatMoney(client.openingBalance), formatMoney(client.totalCharged), formatMoney(client.totalPaid),
      formatMoney(client.totalCredits), balanceLabel(client.balanceDue),
    ]],
    styles: { fontSize: 8, halign: 'right' },
    headStyles: { fillColor: [34, 87, 60], halign: 'center' },
  });

  const summaryTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  autoTable(doc, {
    startY: (summaryTable.lastAutoTable?.finalY || 82) + 8,
    head: [['Date', 'Transaction / Reference', 'Description', 'Due Date', 'Charges', 'Payments', 'Credits', 'Running Balance']],
    body: statementTableRows(client),
    foot: [[
      '', '', 'Totals', '', formatMoney(client.totalCharged), formatMoney(client.totalPaid),
      formatMoney(client.totalCredits), balanceLabel(client.balanceDue),
    ]],
    styles: { fontSize: 6.7, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [34, 87, 60], fontSize: 6.5 },
    footStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 18 }, 1: { cellWidth: 23 }, 2: { cellWidth: 49 }, 3: { cellWidth: 18 },
      4: { cellWidth: 21, halign: 'right' }, 5: { cellWidth: 21, halign: 'right' },
      6: { cellWidth: 19, halign: 'right' }, 7: { cellWidth: 23, halign: 'right' },
    },
    didParseCell: hook => {
      if (hook.section !== 'body') return;
      const line = client.lines[hook.row.index];
      if (line?.kind === 'visit') {
        hook.cell.styles.fillColor = [247, 250, 248];
        hook.cell.styles.textColor = [75, 85, 79];
        if (hook.column.index === 2) hook.cell.styles.cellPadding = { top: 1.5, right: 1.5, bottom: 1.5, left: 5 };
      }
      if (line?.kind === 'warning') hook.cell.styles.textColor = [180, 83, 9];
    },
  });

  const transactionTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const ageingY = (transactionTable.lastAutoTable?.finalY || 230) + 8;
  if (ageingY > 275) doc.addPage();
  const actualAgeingY = ageingY > 275 ? 20 : ageingY;
  autoTable(doc, {
    startY: actualAgeingY,
    head: [['AGEING SUMMARY', 'Current', '1–30 Days', '31–60 Days', '61–90 Days', 'Over 90 Days', 'No Due Date']],
    body: [['Outstanding', formatMoney(client.ageing.current), formatMoney(client.ageing.days1To30), formatMoney(client.ageing.days31To60), formatMoney(client.ageing.days61To90), formatMoney(client.ageing.over90), formatMoney(client.ageing.noDueDate)]],
    styles: { fontSize: 7, halign: 'right' },
    headStyles: { fillColor: [34, 87, 60], halign: 'center' },
  });
};

const ClientStatements: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<ClientStatement[]>([]);
  const [pendingOutstanding, setPendingOutstanding] = useState(0);
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [company, setCompany] = useState<StatementCompany>(DEFAULT_COMPANY);
  const statementRef = useRef<HTMLDivElement>(null);
  const mainTableScroll = useDragScroll();
  const statementTableScroll = useDragScroll();

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendanceRows, actionRows, registrationRows, invoiceRows, paymentRows, companyResult] = await Promise.all([
        fetchAllRows('camp_attendance', 'id, check_in_time, child_name, registration_id'),
        fetchAllRows('accounts_action_items', 'id, registration_id, child_name, parent_name, email, phone, camp_type, amount_due, amount_paid, status, created_at, invoice_id'),
        fetchAllRows('camp_registrations', 'id, registration_number, invoice_number, parent_name, email, phone, camp_type, location, children, total_amount, billing_doc_type, created_at'),
        fetchAllRows('invoices', 'id, registration_id, invoice_number, due_date, payment_terms, created_at, total_amount, status'),
        fetchAllRows('payments', 'id, registration_id, invoice_id, amount, payment_date, created_at, payment_method, payment_reference, status'),
        fromTable('company_settings').select('key, value'),
      ]);
      const actionItems = actionRows as StatementActionItem[];
      const statements = buildClientStatements({
        attendance: attendanceRows as StatementAttendance[],
        actionItems,
        registrations: registrationRows as StatementRegistration[],
        invoices: invoiceRows as StatementInvoice[],
        payments: paymentRows as StatementPayment[],
      });
      setClients(statements);
      setPendingOutstanding(actionItems
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + Number(item.amount_due || 0) - Number(item.amount_paid || 0), 0));

      if (!companyResult.error && companyResult.data) {
        const settings = { ...DEFAULT_COMPANY };
        (companyResult.data as unknown as { key: string; value: string }[]).forEach(row => {
          if (row.key in settings) settings[row.key as keyof StatementCompany] = row.value || settings[row.key as keyof StatementCompany];
        });
        setCompany(settings);
      }
    } catch (error) {
      console.error('Error loading client statements:', error);
      toast.error('Failed to load client statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const selectedClient = clients.find(client => client.key === selectedClientKey) || null;
  const filteredClients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return clients;
    return clients.filter(client => [client.parentName, client.email, client.phone, ...client.children]
      .some(value => value.toLowerCase().includes(search)));
  }, [clients, searchTerm]);

  const handleExportPDF = (client: ClientStatement) => {
    const doc = new jsPDF();
    addStatementPdf(doc, client, company);
    doc.save(filename(client, 'pdf'));
    toast.success('PDF statement downloaded');
  };

  const handleExportXlsx = (client: ClientStatement) => {
    const workbook = XLSX.utils.book_new();
    const money = '"KES "#,##0.00;("KES "#,##0.00);-';
    const rows: unknown[][] = [
      [company.company_name], [companyAddress(company)], [company.phone_number, company.email_address], [],
      ['CLIENT STATEMENT'], ['Client', client.parentName], ['Email', client.email], ['Phone', client.phone],
      ['Children', client.children.join(', ')], ['Statement Date', format(new Date(), 'dd MMM yyyy')], ['Period', 'All account history'], [],
      ['ACCOUNT SUMMARY'], ['Opening Balance'], ['Charges / Invoices'], ['Payments Received'], ['Credits / Adjustments'],
      [client.balanceDue < 0 ? 'Account Credit' : 'Amount Due'], [],
      ['TRANSACTION DETAILS'],
      ['Date', 'Type', 'Transaction / Reference', 'Description', 'Due Date', 'Charges', 'Payments', 'Credits', 'Running Balance'],
    ];
    const firstTx = rows.length + 1;
    client.lines.forEach((line, index) => {
      const r = firstTx + index;
      const prev = index === 0 ? 'B14' : `I${r - 1}`;
      rows.push([
        formatStatementDate(line.date, 'yyyy-MM-dd'), line.kind, line.reference, line.description,
        line.dueDate ? formatStatementDate(line.dueDate, 'yyyy-MM-dd') : '', line.charges || '',
        line.payments || '', line.credits || '',
        { t: 'n', v: line.balance, f: `${prev}+F${r}-G${r}-H${r}`, z: money },
      ]);
    });
    const lastTx = Math.max(firstTx, rows.length);
    rows.push([], ['AGEING SUMMARY', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90 Days', 'No Due Date'],
      ['Outstanding', client.ageing.current, client.ageing.days1To30, client.ageing.days31To60, client.ageing.days61To90, client.ageing.over90, client.ageing.noDueDate]);
    const ageRow = rows.length;
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet.B14 = { t: 'n', v: client.openingBalance, z: money };
    sheet.B15 = { t: 'n', v: client.totalCharged, f: `SUM(F${firstTx}:F${lastTx})`, z: money };
    sheet.B16 = { t: 'n', v: client.totalPaid, f: `SUM(G${firstTx}:G${lastTx})`, z: money };
    sheet.B17 = { t: 'n', v: client.totalCredits, f: `SUM(H${firstTx}:H${lastTx})`, z: money };
    sheet.B18 = { t: 'n', v: client.balanceDue, f: 'B14+B15-B16-B17', z: money };
    for (let r = firstTx; r <= lastTx; r += 1) ['F', 'G', 'H'].forEach(c => { if (sheet[`${c}${r}`]) sheet[`${c}${r}`].z = money; });
    ['B', 'C', 'D', 'E', 'F', 'G'].forEach(c => { if (sheet[`${c}${ageRow}`]) sheet[`${c}${ageRow}`].z = money; });
    sheet['!cols'] = [
      { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 58 }, { wch: 13 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Client Statement');
    workbook.Workbook = { ...(workbook.Workbook || {}), CalcPr: { fullCalcOnLoad: true } } as typeof workbook.Workbook;
    XLSX.writeFile(workbook, filename(client, 'xlsx'));
    toast.success('Excel statement downloaded');
  };

  const handleDownloadAllStatementsPDF = () => {
    if (filteredClients.length === 0) return toast.error('No client statements to export');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ALL CLIENT STATEMENTS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 28);
    autoTable(doc, {
      startY: 36,
      head: [['Client', 'Phone', 'Children', 'Charges', 'Payments', 'Credits', 'Balance']],
      body: filteredClients.map(client => [
        client.parentName, client.phone, client.children.join(', '), formatMoney(client.totalCharged),
        formatMoney(client.totalPaid), formatMoney(client.totalCredits), balanceLabel(client.balanceDue),
      ]),
      headStyles: { fillColor: [34, 87, 60] },
      styles: { fontSize: 7 },
    });
    filteredClients.forEach(client => addStatementPdf(doc, client, company, true));
    doc.save(`All_Client_Statements_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('All client statements downloaded');
  };

  const handlePrint = (client: ClientStatement) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Please allow popups to print');
    const rows = client.lines.map(line => `
      <tr class="${line.kind}"><td>${formatStatementDate(line.date)}</td><td>${escapeHtml(line.reference)}</td>
      <td>${escapeHtml(line.description)}</td><td>${formatStatementDate(line.dueDate)}</td>
      <td class="number">${displayAmount(line.charges)}</td><td class="number">${displayAmount(line.payments)}</td>
      <td class="number">${displayAmount(line.credits)}</td><td class="number">${balanceLabel(line.balance)}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><title>Statement - ${escapeHtml(client.parentName)}</title><style>
      body{font-family:Arial,sans-serif;color:#1f2937;margin:24px;font-size:11px}h1{font-size:20px;margin:0}.top{display:flex;justify-content:space-between}.right{text-align:right}
      .client{margin:24px 0;line-height:1.6}.summary,.ageing{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid #d1d5db;margin-bottom:18px}.summary div,.ageing div{padding:8px;border-right:1px solid #d1d5db}.summary strong,.ageing strong{display:block;margin-top:4px}
      table{width:100%;border-collapse:collapse;font-size:9px}th,td{border:1px solid #d1d5db;padding:5px}th{background:#22573c;color:#fff}.number{text-align:right}.visit{background:#f7faf8;color:#4b5563}.visit td:nth-child(3){padding-left:18px}.warning{color:#b45309}tfoot{font-weight:bold;background:#f3f4f6}@media print{body{margin:0}}
    </style></head><body><div class="top"><div><h1>${escapeHtml(company.company_name)}</h1><div>${escapeHtml(companyAddress(company))}</div><div>${escapeHtml([company.phone_number, company.email_address].filter(Boolean).join(' | '))}</div></div><div class="right"><h1>CLIENT STATEMENT</h1><div>Statement date: ${format(new Date(), 'dd MMM yyyy')}</div><div>Period: All account history</div></div></div>
    <div class="client"><strong>${escapeHtml(client.parentName)}</strong><br>${escapeHtml(client.email || '—')}<br>${escapeHtml(client.phone || '—')}<br>Children: ${escapeHtml(client.children.join(', ') || '—')}</div>
    <div class="summary"><div>Opening Balance<strong>${formatMoney(client.openingBalance)}</strong></div><div>Charges / Invoices<strong>${formatMoney(client.totalCharged)}</strong></div><div>Payments Received<strong>${formatMoney(client.totalPaid)}</strong></div><div>Credits / Adjustments<strong>${formatMoney(client.totalCredits)}</strong></div><div>${client.balanceDue < 0 ? 'Account Credit' : 'Amount Due'}<strong>${balanceLabel(client.balanceDue)}</strong></div></div>
    <table><thead><tr><th>Date</th><th>Transaction / Reference</th><th>Description</th><th>Due Date</th><th>Charges</th><th>Payments</th><th>Credits</th><th>Running Balance</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="4">Totals</td><td class="number">${formatMoney(client.totalCharged)}</td><td class="number">${formatMoney(client.totalPaid)}</td><td class="number">${formatMoney(client.totalCredits)}</td><td class="number">${balanceLabel(client.balanceDue)}</td></tr></tfoot></table>
    <h3>AGEING SUMMARY</h3><div class="ageing"><div>Current<strong>${formatMoney(client.ageing.current)}</strong></div><div>1–30 Days<strong>${formatMoney(client.ageing.days1To30)}</strong></div><div>31–60 Days<strong>${formatMoney(client.ageing.days31To60)}</strong></div><div>61–90 Days<strong>${formatMoney(client.ageing.days61To90)}</strong></div><div>Over 90 Days<strong>${formatMoney(client.ageing.over90)}</strong></div></div></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const renderStatement = (client: ClientStatement) => (
    <div className="space-y-4" ref={statementRef}>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => handlePrint(client)}><Printer className="mr-1 h-4 w-4" />Print</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportPDF(client)}><Download className="mr-1 h-4 w-4" />PDF</Button>
        <Button variant="outline" size="sm" onClick={() => handleExportXlsx(client)}><FileSpreadsheet className="mr-1 h-4 w-4" />Excel</Button>
      </div>
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <div><h3 className="text-lg font-bold">{company.company_name}</h3><p className="text-sm text-muted-foreground">{companyAddress(company)}</p><p className="text-sm text-muted-foreground">{[company.phone_number, company.email_address].filter(Boolean).join(' · ')}</p></div>
          <div className="sm:text-right"><p className="font-semibold">Client Statement</p><p className="text-sm text-muted-foreground">{format(new Date(), 'dd MMM yyyy')}</p><p className="text-xs text-muted-foreground">All account history</p></div>
        </div>
        <div className="mt-4 border-t pt-3"><p className="font-semibold">{client.parentName}</p><p className="text-sm text-muted-foreground">{client.email || 'No email'} · {client.phone || 'No phone'}</p><p className="text-sm text-muted-foreground">Children: {client.children.join(', ') || '—'}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Opening Balance', client.openingBalance], ['Charges / Invoices', client.totalCharged],
          ['Payments Received', client.totalPaid], ['Credits / Adjustments', client.totalCredits],
          [client.balanceDue < 0 ? 'Account Credit' : 'Amount Due', client.balanceDue],
        ].map(([label, value]) => <Card className="p-3" key={String(label)}><div className="text-xs text-muted-foreground">{label}</div><div className="text-base font-bold">{label === 'Account Credit' ? balanceLabel(Number(value)) : formatMoney(Number(value))}</div></Card>)}
      </div>
      {client.chargesMissing && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">Some visits have no matching charge. They are marked for review and are not included in Amount Due.</div>}
      <Table containerRef={statementTableScroll.ref} containerProps={statementTableScroll.handlers} containerClassName="max-h-[52vh] overflow-x-scroll overflow-y-auto overscroll-contain touch-pan-y rounded-lg border cursor-grab active:cursor-grabbing [scrollbar-gutter:stable_both-edges]" className="min-w-[78rem]">
        <TableHeader><TableRow className="bg-muted/50"><TableHead>Date</TableHead><TableHead>Transaction / Reference</TableHead><TableHead>Description</TableHead><TableHead>Due Date</TableHead><TableHead className="text-right">Charges</TableHead><TableHead className="text-right">Payments</TableHead><TableHead className="text-right">Credits</TableHead><TableHead className="text-right">Running Balance</TableHead></TableRow></TableHeader>
        <TableBody>{client.lines.map(line => <TableRow key={line.id} className={line.kind === 'visit' ? 'bg-muted/20 text-muted-foreground' : line.kind === 'warning' ? 'text-destructive' : ''}>
          <TableCell>{formatStatementDate(line.date)}</TableCell><TableCell className="font-medium">{line.reference}</TableCell><TableCell className={line.kind === 'visit' ? 'pl-8' : ''}>{line.description}</TableCell><TableCell>{formatStatementDate(line.dueDate)}</TableCell>
          <TableCell className="text-right">{displayAmount(line.charges)}</TableCell><TableCell className="text-right">{displayAmount(line.payments)}</TableCell><TableCell className="text-right">{displayAmount(line.credits)}</TableCell><TableCell className="text-right font-medium">{balanceLabel(line.balance)}</TableCell>
        </TableRow>)}<TableRow className="bg-muted/50 font-bold"><TableCell colSpan={4} className="text-right">Totals</TableCell><TableCell className="text-right">{formatMoney(client.totalCharged)}</TableCell><TableCell className="text-right">{formatMoney(client.totalPaid)}</TableCell><TableCell className="text-right">{formatMoney(client.totalCredits)}</TableCell><TableCell className="text-right">{balanceLabel(client.balanceDue)}</TableCell></TableRow></TableBody>
      </Table>
      <div><h4 className="mb-2 font-semibold">Ageing Summary</h4><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{[
        ['Current', client.ageing.current], ['1–30 Days', client.ageing.days1To30], ['31–60 Days', client.ageing.days31To60],
        ['61–90 Days', client.ageing.days61To90], ['Over 90 Days', client.ageing.over90], ['No Due Date', client.ageing.noDueDate],
      ].map(([label, value]) => <div className="rounded-md border p-2" key={String(label)}><div className="text-xs text-muted-foreground">{label}</div><div className="font-semibold">{formatMoney(Number(value))}</div></div>)}</div></div>
    </div>
  );

  const totalVisits = clients.reduce((sum, client) => sum + client.totalVisits, 0);
  const clientsWithBalance = clients.filter(client => client.balanceDue > 0).length;
  return <div className="min-w-0 max-w-full space-y-4">
    <Card><CardHeader className="pb-3"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" />Client Statements</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleDownloadAllStatementsPDF}><Download className="mr-1 h-4 w-4" />Download All</Button><Button variant="outline" size="sm" onClick={() => void loadData()}><RefreshCw className="mr-1 h-4 w-4" />Refresh</Button></div></div></CardHeader>
      <CardContent><div className="mb-4 flex gap-2"><Input placeholder="Search by parent name, email, phone, or child name..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className="flex-1" /><Button variant="outline" aria-label="Search statements"><Search className="h-4 w-4" /></Button></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Total Clients', clients.length], ['Total Visits', totalVisits], ['With Balance Due', clientsWithBalance], ['Total Outstanding', formatMoney(pendingOutstanding)]].map(([label, value]) => <Card className="p-3" key={String(label)}><div className="text-xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div>{label === 'Total Outstanding' && <div className="mt-1 text-xs text-muted-foreground">Across all clients, from pending collections</div>}</Card>)}</div></CardContent></Card>
    <Card><CardContent className="p-0">{loading ? <div className="py-8 text-center text-muted-foreground">Loading client statements...</div> : filteredClients.length === 0 ? <div className="py-8 text-center text-muted-foreground">{searchTerm ? 'No clients found matching your search' : 'No account records found'}</div> :
      <Table containerRef={mainTableScroll.ref} containerProps={mainTableScroll.handlers} containerClassName="max-h-[70vh] overflow-x-scroll overflow-y-auto overscroll-contain touch-pan-y cursor-grab active:cursor-grabbing [scrollbar-gutter:stable_both-edges]" className="min-w-[72rem]"><TableHeader><TableRow><TableHead>Parent Name</TableHead><TableHead>Contact</TableHead><TableHead>Children</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Charges</TableHead><TableHead className="text-right">Payments</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{filteredClients.map(client => <TableRow key={client.key} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedClientKey(client.key)}><TableCell className="font-medium">{client.parentName}</TableCell><TableCell><div>{client.phone}</div><div className="text-xs text-muted-foreground">{client.email}</div></TableCell><TableCell>{client.children.join(', ')}</TableCell><TableCell className="text-right">{client.totalVisits}</TableCell><TableCell className="text-right">{formatMoney(client.totalCharged)}</TableCell><TableCell className="text-right">{formatMoney(client.totalPaid)}</TableCell><TableCell className="text-right">{client.balanceDue > 0 ? <Badge variant="destructive">{balanceLabel(client.balanceDue)}</Badge> : client.balanceDue < 0 ? <Badge variant="secondary">{balanceLabel(client.balanceDue)}</Badge> : <Badge>Paid</Badge>}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={event => { event.stopPropagation(); setSelectedClientKey(client.key); }}>View</Button></TableCell></TableRow>)}</TableBody></Table>}
    </CardContent></Card>
    <Dialog open={Boolean(selectedClient)} onOpenChange={open => { if (!open) setSelectedClientKey(null); }}><DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><Button variant="ghost" size="sm" aria-label="Back to client list" onClick={() => setSelectedClientKey(null)}><ArrowLeft className="h-4 w-4" /></Button>Client Statement — {selectedClient?.parentName}</DialogTitle></DialogHeader>{selectedClient && renderStatement(selectedClient)}</DialogContent></Dialog>
  </div>;
};

export default ClientStatements;