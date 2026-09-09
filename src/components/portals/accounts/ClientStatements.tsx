import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDragScroll } from '@/hooks/useDragScroll';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, ArrowLeft, RefreshCw, Printer, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { displayLocation } from '@/lib/locationDisplay';

// Helper to work with untyped table
const fromTable = (tableName: string) => supabase.from(tableName as any);

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  child_name: string;
  registration_id: string;
  camp_type?: string;
  location?: string;
  amount_due: number;
  amount_paid: number;
  payment_status: string;
  parent_name: string;
  email: string;
  phone: string;
  paid_at?: string;
  /** true when this is the first (charge-bearing) record for a child but no amount could be resolved */
  charge_missing?: boolean;
  /** true when the row is a ledger item with no matching attendance record */
  ledger_only?: boolean;
}

const normalizeName = (name: string) => (name || '').trim().toLowerCase();
const ledgerKey = (registrationId: string, childName: string) =>
  `${registrationId}::${normalizeName(childName)}`;


interface ActionItemRecord {
  id: string;
  registration_id: string;
  child_name: string;
  parent_name: string;
  email?: string;
  phone?: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  camp_type?: string;
  created_at: string;
}

interface ClientSummary {
  parentName: string;
  email: string;
  phone: string;
  totalVisits: number;
  totalCharged: number;
  totalPaid: number;
  balanceDue: number;
  children: string[];
  records: AttendanceRecord[];
  // Outstanding from accounts_action_items (source of truth)
  actionItemsOutstanding: number;
  actionItemsPending: number;
  /** true when at least one charge could not be resolved (data gap) */
  chargesMissing?: boolean;
}


interface StatementLine {
  date: string;
  description: string;
  charges: number;
  payments: number;
  balance: number;
}

const formatKes = (amount: number) => `KES ${Math.abs(Math.round(amount)).toLocaleString()}`;
const balanceLabel = (balance: number) =>
  balance > 0 ? formatKes(balance) : balance < 0 ? `${formatKes(balance)} credit` : 'KES 0';

const buildStatementLines = (client: ClientSummary): StatementLine[] => {

  const sortedRecords = [...client.records].sort(
    (a, b) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime()
  );

  const lines: StatementLine[] = [];
  const seenPaymentKeys = new Set<string>();

  sortedRecords.forEach(record => {
    const campLabel = record.camp_type || 'Camp';
    if (record.amount_due > 0) {
      // Charge line — only the first record per registration + child carries a charge
      lines.push({
        date: record.check_in_time,
        description: `${record.child_name} — ${campLabel}${record.location ? ` at ${displayLocation(record.location) || record.location}` : ''}`,
        charges: record.amount_due,
        payments: 0,
        balance: 0,
      });
    } else if (record.charge_missing) {
      // Charge could not be resolved from the ledger or the registration — flag it
      lines.push({
        date: record.check_in_time,
        description: `${record.child_name} — ${campLabel} (amount not recorded)`,
        charges: 0,
        payments: 0,
        balance: 0,
      });
    } else if (!record.ledger_only) {
      // Subsequent check-in — informational only, no monetary impact
      lines.push({
        date: record.check_in_time,
        description: `${record.child_name} — check-in (${campLabel})`,
        charges: 0,
        payments: 0,
        balance: 0,
      });
    }

    // Add payment line once per registration + child (avoid double-counting)
    const payKey = `${record.registration_id}::${(record.child_name || '').trim().toLowerCase()}`;
    if (!seenPaymentKeys.has(payKey) && record.amount_paid > 0) {
      seenPaymentKeys.add(payKey);
      const paymentDate = record.paid_at || record.check_in_time;
      lines.push({
        date: paymentDate,
        description: `Payment received — ${record.child_name} — Ref: ${record.registration_id.slice(0, 8)}`,
        charges: 0,
        payments: record.amount_paid,
        balance: 0,
      });
    }
  });


  lines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recalculate running balance
  let bal = 0;
  lines.forEach(line => {
    bal += line.charges - line.payments;
    line.balance = bal;
  });

  return lines;
};

const ClientStatements: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [actionItems, setActionItems] = useState<ActionItemRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const mainTableScroll = useDragScroll();
  const statementTableScroll = useDragScroll();

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all data sources in parallel
      const [attendanceResult, actionItemsPendingResult, actionItemsAllResult, paymentsResult] = await Promise.all([
        supabase
          .from('camp_attendance')
          .select('id, check_in_time, child_name, registration_id')
          .order('check_in_time', { ascending: false }),
        fromTable('accounts_action_items')
          .select('*')
          .eq('status', 'pending'),
        fromTable('accounts_action_items')
          .select('id, registration_id, child_name, parent_name, email, phone, camp_type, amount_due, amount_paid, status, created_at'),
        fromTable('payments')
          .select('id, registration_id, amount, created_at')
          .order('created_at', { ascending: false }),
      ]);

      // Process action items (always available - source of truth for outstanding)
      const aiData = (actionItemsPendingResult.data || []) as unknown as ActionItemRecord[];
      setActionItems(aiData);

      // Build parent-info map keyed by registration_id from ALL action items (any status)
      // Used to enrich attendance records when camp_registrations RLS blocks the join
      const aiAllData = ((actionItemsAllResult.data || []) as unknown as ActionItemRecord[]);
      const aiSource = aiAllData.length > 0 ? aiAllData : aiData;
      const parentInfoByRegId = new Map<string, { parent_name: string; email: string; phone: string; camp_type: string }>();
      aiSource.forEach(item => {
        if (!item.registration_id) return;
        if (parentInfoByRegId.has(item.registration_id)) return;
        parentInfoByRegId.set(item.registration_id, {
          parent_name: item.parent_name || '',
          email: item.email || '',
          phone: item.phone || '',
          camp_type: item.camp_type || '',
        });
      });

      // Build actual payments map: registration_id -> total paid
      const paymentsData = (paymentsResult.data || []) as any[];
      const paymentsByRegId = new Map<string, { totalPaid: number; paidAt: string | null }>();
      paymentsData.forEach((p: any) => {
        const existing = paymentsByRegId.get(p.registration_id) || { totalPaid: 0, paidAt: null };
        existing.totalPaid += Number(p.amount) || 0;
        if (!existing.paidAt || p.created_at > existing.paidAt) {
          existing.paidAt = p.created_at;
        }
        paymentsByRegId.set(p.registration_id, existing);
      });

      // Process attendance data
      const attendance = attendanceResult.data || [];
      console.log('camp_attendance records:', attendance.length, 'action_items pending:', aiData.length, 'payments:', paymentsData.length, 'parent-info map size:', parentInfoByRegId.size);


      if (attendance.length > 0) {
        // Primary path: load from camp_attendance + registrations
        const regIds = [...new Set(attendance.map(a => a.registration_id))];
        const { data: registrations, error: regError } = await supabase
          .from('camp_registrations')
          .select('id, parent_name, email, phone, camp_type, total_amount, payment_status, children, updated_at, location')
          .in('id', regIds);

        if (regError) {
          console.error('Error loading registrations:', regError);
        }

        const regMap = new Map((registrations || []).map((r: any) => [r.id, r]));
        console.log('Registrations loaded:', (registrations || []).length, 'for', regIds.length, 'unique IDs');

        // Ledger (accounts_action_items) is the source of truth for charges/payments.
        const ledgerByKey = new Map<string, ActionItemRecord>();
        aiAllData.forEach(item => {
          if (!item.registration_id) return;
          const key = ledgerKey(item.registration_id, item.child_name || '');
          const existing = ledgerByKey.get(key);
          // Prefer the item with the highest amount_due (most complete record)
          if (!existing || Number(item.amount_due) > Number(existing.amount_due)) {
            ledgerByKey.set(key, item);
          }
        });

        // Deduplicate by parent+child+camp_type to handle duplicate registrations from retries
        const seenChargeKeys = new Set<string>();
        const usedLedgerKeys = new Set<string>();

        const records: AttendanceRecord[] = attendance.map(att => {
          const reg = regMap.get(att.registration_id) as any;
          let childAmount = 0;
          let childrenCount = 1;
          if (reg?.children) {
            try {
              const children = typeof reg.children === 'string' ? JSON.parse(reg.children) : reg.children;
              childrenCount = Array.isArray(children) ? Math.max(1, children.length) : 1;
              const childEntry = children.find((c: any) => c.name === att.child_name || c.childName === att.child_name);
              if (childEntry) {
                childAmount = childEntry.price || childEntry.amount || 0;
              }
            } catch { /* ignore */ }
          }
          // Fallback: divide total_amount by number of children
          if (childAmount === 0 && reg) {
            childAmount = Math.round((Number(reg.total_amount) || 0) / childrenCount);
          }

          // Enrich from action-items map when the camp_registrations join is blocked/missing
          const aiInfo = parentInfoByRegId.get(att.registration_id);
          const parentName = reg?.parent_name || aiInfo?.parent_name || 'Unknown';
          const parentEmail = reg?.email || aiInfo?.email || '';
          const parentPhoneVal = reg?.phone || aiInfo?.phone || '';
          const campTypeVal = reg?.camp_type || aiInfo?.camp_type || '';

          // Deduplicate: use parent_phone+child_name+camp_type to prevent duplicate charges from retry registrations
          const chargeKey = `${parentPhoneVal}::${att.child_name}::${campTypeVal}`;
          const isFirstCharge = !seenChargeKeys.has(chargeKey);
          seenChargeKeys.add(chargeKey);

          // Ledger item for this registration + child (authoritative charge)
          const lKey = ledgerKey(att.registration_id, att.child_name);
          const ledgerItem = ledgerByKey.get(lKey);
          if (ledgerItem) usedLedgerKeys.add(lKey);

          const ledgerDue = Number(ledgerItem?.amount_due) || 0;
          const resolvedCharge = ledgerDue > 0 ? ledgerDue : childAmount;
          const amountDue = isFirstCharge ? resolvedCharge : 0;

          // Payments: prefer the ledger's recorded amount_paid, then the payments table
          let amountPaid = 0;
          if (isFirstCharge) {
            const paymentInfo = paymentsByRegId.get(att.registration_id);
            const ledgerPaid = Number(ledgerItem?.amount_paid) || 0;
            if (reg?.payment_status === 'paid') {
              amountPaid = resolvedCharge; // Fully paid
            } else if (ledgerPaid > 0) {
              amountPaid = Math.min(ledgerPaid, resolvedCharge || ledgerPaid);
            } else if (paymentInfo && paymentInfo.totalPaid > 0) {
              // Distribute actual payment amount per child
              amountPaid = Math.round(paymentInfo.totalPaid / childrenCount);
            }
          }

          return {
            id: att.id,
            check_in_time: att.check_in_time,
            child_name: att.child_name,
            registration_id: att.registration_id,
            camp_type: campTypeVal,
            location: reg?.location || 'Kurura Gate F',
            amount_due: amountDue,
            amount_paid: amountPaid,
            payment_status: reg?.payment_status || 'unpaid',
            parent_name: parentName,
            email: parentEmail,
            phone: parentPhoneVal,
            paid_at: reg?.payment_status === 'paid' ? reg?.updated_at : (paymentsByRegId.get(att.registration_id)?.paidAt || undefined),
            charge_missing: isFirstCharge && resolvedCharge === 0,
          };
        });

        // Include ledger items that never matched an attendance row so statement
        // charges reconcile with Pending Collections / Total Outstanding.
        aiAllData.forEach(item => {
          if (!item.registration_id) return;
          const lKey = ledgerKey(item.registration_id, item.child_name || '');
          if (usedLedgerKeys.has(lKey)) return;
          usedLedgerKeys.add(lKey);
          const reg = regMap.get(item.registration_id) as any;
          const amountDue = Number(item.amount_due) || 0;
          const amountPaid = reg?.payment_status === 'paid' ? amountDue : (Number(item.amount_paid) || 0);
          records.push({
            id: `ledger-${item.id}`,
            check_in_time: item.created_at || new Date().toISOString(),
            child_name: item.child_name || 'Unknown',
            registration_id: item.registration_id,
            camp_type: reg?.camp_type || item.camp_type || '',
            location: reg?.location || '',
            amount_due: amountDue,
            amount_paid: amountPaid,
            payment_status: reg?.payment_status || item.status || 'pending',
            parent_name: reg?.parent_name || item.parent_name || 'Unknown',
            email: reg?.email || item.email || '',
            phone: reg?.phone || item.phone || '',
            paid_at: reg?.payment_status === 'paid' ? reg?.updated_at : undefined,
            charge_missing: amountDue === 0,
            ledger_only: true,
          });
        });

        setAttendanceData(records);

      } else if (aiData.length > 0) {
        // Fallback: build records from accounts_action_items if attendance table is empty/restricted
        console.log('Falling back to accounts_action_items for attendance data');
        const regIds = [...new Set(aiData.map(a => a.registration_id).filter(Boolean))];

        let registrations: any[] = [];
        if (regIds.length > 0) {
          const { data: regs } = await supabase
            .from('camp_registrations')
            .select('id, parent_name, email, phone, camp_type, total_amount, payment_status, children, updated_at, location')
            .in('id', regIds);
          registrations = regs || [];
        }

        const regMap = new Map(registrations.map((r: any) => [r.id, r]));

        const records: AttendanceRecord[] = aiData.map(item => {
          const reg = regMap.get(item.registration_id) as any;
          const amountDue = Number(item.amount_due) || 0;
          let amountPaid = Number(item.amount_paid) || 0;
          if (reg?.payment_status === 'paid') {
            amountPaid = amountDue;
          }
          return {
            id: item.id,
            check_in_time: item.created_at || new Date().toISOString(),
            child_name: item.child_name || 'Unknown',
            registration_id: item.registration_id || '',
            camp_type: reg?.camp_type || item.camp_type || '',
            location: reg?.location || 'Kurura Gate F',
            amount_due: amountDue,
            amount_paid: amountPaid,
            payment_status: reg?.payment_status || item.status || 'pending',
            parent_name: item.parent_name || reg?.parent_name || 'Unknown',
            email: item.email || reg?.email || '',
            phone: item.phone || reg?.phone || '',
            paid_at: reg?.payment_status === 'paid' ? reg?.updated_at : undefined,
          };
        });

        setAttendanceData(records);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load client statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: build a stable grouping key for a parent
  const getParentKey = (phone: string, email: string, parentName: string, registrationId?: string) => {
    // Prefer phone, then email, then a real parent name.
    // Never collapse all unknown/blank records into one group — fall back to registration_id.
    if (phone) return `p:${phone}`;
    if (email) return `e:${email.toLowerCase()}`;
    if (parentName && parentName.trim() && parentName.trim().toLowerCase() !== 'unknown') {
      return `n:${parentName.trim().toLowerCase()}`;
    }
    if (registrationId) return `r:${registrationId}`;
    return `x:unknown-${Math.random().toString(36).slice(2)}`;
  };


  // Build per-parent outstanding from accounts_action_items (source of truth, matches Pending Collections)
  const parentOutstandingMap = useMemo(() => {
    const map = new Map<string, { totalDue: number; totalPaid: number; itemCount: number }>();
    actionItems.forEach(item => {
      const key = getParentKey(item.phone || '', item.email || '', item.parent_name, item.registration_id);
      const existing = map.get(key) || { totalDue: 0, totalPaid: 0, itemCount: 0 };
      existing.totalDue += Number(item.amount_due) || 0;
      existing.totalPaid += Number(item.amount_paid) || 0;
      existing.itemCount += 1;
      map.set(key, existing);
    });
    return map;
  }, [actionItems]);

  const clientSummaries = useMemo(() => {
    const clientMap = new Map<string, ClientSummary>();

    attendanceData.forEach(record => {
      const key = getParentKey(record.phone, record.email, record.parent_name, record.registration_id);
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          parentName: record.parent_name,
          email: record.email,
          phone: record.phone,
          totalVisits: 0,
          totalCharged: 0,
          totalPaid: 0,
          balanceDue: 0,
          children: [],
          records: [],
          actionItemsOutstanding: 0,
          actionItemsPending: 0,
        });
      }
      const client = clientMap.get(key)!;
      if (!record.ledger_only) client.totalVisits += 1;
      // Only count charges from first-occurrence records (amount_due > 0)
      client.totalCharged += record.amount_due;
      client.records.push(record);
      if (!client.children.includes(record.child_name)) {
        client.children.push(record.child_name);
      }
    });

    // Calculate payments (deduplicate per registration + child) and derive balance from ledger
    clientMap.forEach((client, key) => {
      const seenPaymentKeys = new Set<string>();
      client.records.forEach(r => {
        const k = ledgerKey(r.registration_id, r.child_name);
        if (!seenPaymentKeys.has(k)) {
          seenPaymentKeys.add(k);
          client.totalPaid += r.amount_paid;
        }
      });

      // Balance = charges - payments. Kept signed so credits/data gaps are visible
      // instead of being silently hidden as "KES 0".
      client.balanceDue = client.totalCharged - client.totalPaid;
      client.chargesMissing = client.records.some(r => r.charge_missing);

      // Track action items info for display badges
      const actionData = parentOutstandingMap.get(key);
      if (actionData) {
        client.actionItemsOutstanding = actionData.totalDue - actionData.totalPaid;
        client.actionItemsPending = actionData.itemCount;
      }
    });


    // Sort: clients with balance first, then alphabetically
    return Array.from(clientMap.values()).sort((a, b) => {
      if (a.balanceDue > 0 && b.balanceDue === 0) return -1;
      if (a.balanceDue === 0 && b.balanceDue > 0) return 1;
      return b.balanceDue - a.balanceDue || a.parentName.localeCompare(b.parentName);
    });
  }, [attendanceData, parentOutstandingMap]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientSummaries;
    const search = searchTerm.toLowerCase();
    return clientSummaries.filter(c =>
      c.parentName.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.phone.includes(search) ||
      c.children.some(ch => ch.toLowerCase().includes(search))
    );
  }, [clientSummaries, searchTerm]);

  // Total Outstanding uses action items (same source as Pending Collections)
  const totalOutstanding = actionItems.reduce((sum, item) => sum + (Number(item.amount_due) - Number(item.amount_paid)), 0);
  const totalClients = clientSummaries.length;
  const clientsWithBalance = clientSummaries.filter(c => c.balanceDue > 0).length;

  // Export functions
  const handleExportPDF = (client: ClientSummary) => {
    const lines = buildStatementLines(client);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Client Statement', 14, 20);

    doc.setFontSize(10);
    doc.text(`Client: ${client.parentName}`, 14, 30);
    doc.text(`Email: ${client.email}`, 14, 36);
    doc.text(`Phone: ${client.phone}`, 14, 42);
    doc.text(`Children: ${client.children.join(', ')}`, 14, 48);
    doc.text(`Statement Date: ${format(new Date(), 'dd MMM yyyy')}`, 14, 54);

    doc.setFontSize(11);
    doc.text(`Total Charges: KES ${client.totalCharged.toLocaleString()}`, 130, 30);
    doc.text(`Total Payments: KES ${client.totalPaid.toLocaleString()}`, 130, 36);
    doc.text(`Balance Due: ${balanceLabel(client.balanceDue)}`, 130, 42);

    autoTable(doc, {
      startY: 62,
      head: [['Date', 'Description', 'Charges', 'Payments', 'Balance']],
      body: lines.map(line => [
        format(new Date(line.date), 'dd MMM yyyy'),
        line.description,
        line.charges > 0 ? `KES ${line.charges.toLocaleString()}` : '—',
        line.payments > 0 ? `KES ${line.payments.toLocaleString()}` : '—',
        `KES ${line.balance.toLocaleString()}`,
      ]),
      foot: [['', 'Totals', `KES ${client.totalCharged.toLocaleString()}`, `KES ${client.totalPaid.toLocaleString()}`, balanceLabel(client.balanceDue)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 87, 60] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save(`Statement_${client.parentName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF statement downloaded');
  };

  const handleExportCSV = (client: ClientSummary) => {
    const lines = buildStatementLines(client);
    const csvRows = [
      ['Date', 'Description', 'Charges', 'Payments', 'Balance'],
      ...lines.map(line => [
        format(new Date(line.date), 'yyyy-MM-dd'),
        `"${line.description}"`,
        line.charges > 0 ? line.charges.toString() : '',
        line.payments > 0 ? line.payments.toString() : '',
        line.balance.toString(),
      ]),
      ['', 'Totals', client.totalCharged.toString(), client.totalPaid.toString(), client.balanceDue.toString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([`Client: ${client.parentName}\nEmail: ${client.email}\nPhone: ${client.phone}\nStatement Date: ${format(new Date(), 'dd MMM yyyy')}\n\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_${client.parentName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV statement downloaded');
  };

  const handleDownloadAllStatementsPDF = () => {
    if (filteredClients.length === 0) {
      toast.error('No client statements to export');
      return;
    }

    const doc = new jsPDF();

    // Cover page
    doc.setFontSize(18);
    doc.text('All Client Statements', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Total Clients: ${filteredClients.length}`, 14, 34);

    const grandCharged = filteredClients.reduce((s, c) => s + c.totalCharged, 0);
    const grandPaid = filteredClients.reduce((s, c) => s + c.totalPaid, 0);
    const grandBalance = filteredClients.reduce((s, c) => s + c.balanceDue, 0);

    doc.text(`Total Charged: KES ${grandCharged.toLocaleString()}`, 130, 28);
    doc.text(`Total Paid: KES ${grandPaid.toLocaleString()}`, 130, 34);
    doc.text(`Total Outstanding: KES ${grandBalance.toLocaleString()}`, 130, 40);

    // Summary table
    autoTable(doc, {
      startY: 48,
      head: [['Parent Name', 'Phone', 'Children', 'Charged', 'Paid', 'Balance']],
      body: filteredClients.map(c => [
        c.parentName,
        c.phone,
        c.children.join(', '),
        `KES ${c.totalCharged.toLocaleString()}`,
        `KES ${c.totalPaid.toLocaleString()}`,
        balanceLabel(c.balanceDue),
      ]),
      foot: [['', '', 'Totals', `KES ${grandCharged.toLocaleString()}`, `KES ${grandPaid.toLocaleString()}`, `KES ${grandBalance.toLocaleString()}`]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 87, 60] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    // Individual statements
    filteredClients.forEach(client => {
      doc.addPage();
      const lines = buildStatementLines(client);

      doc.setFontSize(14);
      doc.text(`Statement — ${client.parentName}`, 14, 20);
      doc.setFontSize(9);
      doc.text(`Email: ${client.email}  |  Phone: ${client.phone}`, 14, 28);
      doc.text(`Children: ${client.children.join(', ')}`, 14, 34);
      doc.text(`Charges: KES ${client.totalCharged.toLocaleString()}  |  Paid: KES ${client.totalPaid.toLocaleString()}  |  Balance: ${balanceLabel(client.balanceDue)}`, 14, 40);

      autoTable(doc, {
        startY: 46,
        head: [['Date', 'Description', 'Charges', 'Payments', 'Balance']],
        body: lines.map(line => [
          format(new Date(line.date), 'dd MMM yyyy'),
          line.description,
          line.charges > 0 ? `KES ${line.charges.toLocaleString()}` : '—',
          line.payments > 0 ? `KES ${line.payments.toLocaleString()}` : '—',
          `KES ${line.balance.toLocaleString()}`,
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [34, 87, 60] },
      });
    });

    doc.save(`All_Client_Statements_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('All client statements downloaded');
  };

  const handlePrint = (client: ClientSummary) => {
    const lines = buildStatementLines(client);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <html>
      <head>
        <title>Statement - ${client.parentName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info { font-size: 12px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background: #22573c; color: white; }
          .text-right { text-align: right; }
          .totals { background: #f5f5f5; font-weight: bold; }
          .payment-row { background: #f0fff4; }
          .red { color: #dc2626; }
          .green { color: #16a34a; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Client Statement</h1>
        <div class="header">
          <div class="info">
            <strong>${client.parentName}</strong><br/>
            ${client.email}<br/>
            ${client.phone}<br/>
            Children: ${client.children.join(', ')}
          </div>
          <div class="info" style="text-align:right">
            Statement Date: ${format(new Date(), 'dd MMM yyyy')}<br/>
            Total Charges: KES ${client.totalCharged.toLocaleString()}<br/>
            Total Payments: <span class="green">KES ${client.totalPaid.toLocaleString()}</span><br/>
            Balance Due: <span class="${client.balanceDue > 0 ? 'red' : 'green'}">${balanceLabel(client.balanceDue)}</span>
          </div>
        </div>
        <table>
          <thead><tr><th>Date</th><th>Description</th><th class="text-right">Charges</th><th class="text-right">Payments</th><th class="text-right">Balance</th></tr></thead>
          <tbody>
            ${lines.map(line => `
              <tr class="${line.payments > 0 ? 'payment-row' : ''}">
                <td>${format(new Date(line.date), 'dd MMM yyyy')}</td>
                <td>${line.description}</td>
                <td class="text-right">${line.charges > 0 ? `KES ${line.charges.toLocaleString()}` : '—'}</td>
                <td class="text-right green">${line.payments > 0 ? `KES ${line.payments.toLocaleString()}` : '—'}</td>
                <td class="text-right ${line.balance > 0 ? 'red' : 'green'}">KES ${line.balance.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="totals">
              <td colspan="2" class="text-right">Totals</td>
              <td class="text-right">KES ${client.totalCharged.toLocaleString()}</td>
              <td class="text-right green">KES ${client.totalPaid.toLocaleString()}</td>
              <td class="text-right ${client.balanceDue > 0 ? 'red' : 'green'}">${balanceLabel(client.balanceDue)}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderStatementDetail = (client: ClientSummary) => {
    const lines = buildStatementLines(client);

    return (
      <div className="space-y-4" ref={statementRef}>
        {/* Export Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => handlePrint(client)}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportPDF(client)}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportCSV(client)}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>

        {/* Statement Header */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">{client.parentName}</h3>
              <p className="text-sm text-muted-foreground">{client.email}</p>
              <p className="text-sm text-muted-foreground">{client.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Statement Date</p>
              <p className="font-medium">{format(new Date(), 'dd MMM yyyy')}</p>
              <p className="text-sm text-muted-foreground mt-1">Children: {client.children.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Charges</div>
            <div className="text-lg font-bold">KES {client.totalCharged.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Amount owed for camp days booked</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Total Payments</div>
            <div className="text-lg font-bold text-green-600">KES {client.totalPaid.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Money received from this family</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground">Balance Due</div>
            <div className={`text-lg font-bold ${client.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balanceLabel(client.balanceDue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Charges minus payments</div>
            {client.actionItemsPending > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {client.actionItemsPending} pending item{client.actionItemsPending > 1 ? 's' : ''} · outstanding {formatKes(client.actionItemsOutstanding)}
              </div>
            )}
          </Card>
        </div>

        {client.chargesMissing && (
          <div className="text-xs rounded-md border border-destructive/40 bg-destructive/5 p-2 text-destructive">
            Some charges could not be resolved for this client (no amount recorded on the registration or
            the pending-collections ledger), so Total Charges may be understated.
          </div>
        )}


        {/* Statement Table */}
          <Table
            containerRef={statementTableScroll.ref}
            containerProps={statementTableScroll.handlers}
            containerClassName="max-h-[50vh] overflow-x-scroll overflow-y-auto overscroll-contain touch-pan-y border rounded-lg cursor-grab active:cursor-grabbing [scrollbar-gutter:stable_both-edges] sm:max-h-[55vh]"
            className="min-w-[52rem]"
          >
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead className="text-right">Payments</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={index} className={line.payments > 0 ? 'bg-green-50/50 dark:bg-green-950/10' : ''}>
                  <TableCell className="text-sm">{format(new Date(line.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-sm">{line.description}</TableCell>
                  <TableCell className="text-right text-sm">
                    {line.charges > 0 ? `KES ${line.charges.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-600">
                    {line.payments > 0 ? `KES ${line.payments.toLocaleString()}` : '—'}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-medium ${line.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    KES {line.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2} className="text-right">Totals</TableCell>
                <TableCell className="text-right">KES {client.totalCharged.toLocaleString()}</TableCell>
                <TableCell className="text-right text-green-600">KES {client.totalPaid.toLocaleString()}</TableCell>
                <TableCell className={`text-right ${client.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {balanceLabel(client.balanceDue)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </div>
    );
  };

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Client Statements
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadAllStatementsPDF}>
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by parent name, email, phone, or child name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <Card className="p-3">
              <div className="text-xl font-bold">{totalClients}</div>
              <div className="text-xs text-muted-foreground">Total Clients</div>
            </Card>
            <Card className="p-3">
              <div className="text-xl font-bold">{attendanceData.length}</div>
              <div className="text-xs text-muted-foreground">Total Visits</div>
            </Card>
            <Card className="p-3">
              <div className="text-xl font-bold text-red-600">{clientsWithBalance}</div>
              <div className="text-xs text-muted-foreground">With Balance Due</div>
            </Card>
            <Card className="p-3">
              <div className="text-xl font-bold text-red-600">KES {totalOutstanding.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Outstanding</div>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading client statements...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No clients found matching your search' : 'No attendance records found'}
            </div>
          ) : (
              <Table
                containerRef={mainTableScroll.ref}
                containerProps={mainTableScroll.handlers}
                containerClassName="max-h-[60vh] overflow-x-scroll overflow-y-auto overscroll-contain touch-pan-y cursor-grab active:cursor-grabbing [scrollbar-gutter:stable_both-edges] sm:max-h-[65vh] lg:max-h-[70vh]"
                className="min-w-[68rem]"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Charged</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, idx) => (
                    <TableRow key={idx} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedClient(client)}>
                      <TableCell className="font-medium">{client.parentName}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">{client.phone}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{client.children.join(', ')}</div>
                      </TableCell>
                      <TableCell className="text-right">{client.totalVisits}</TableCell>
                      <TableCell className="text-right text-sm">KES {client.totalCharged.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm text-green-600">KES {client.totalPaid.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {client.balanceDue > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {balanceLabel(client.balanceDue)}
                          </Badge>
                        ) : client.balanceDue < 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {balanceLabel(client.balanceDue)}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs bg-green-600">Paid</Badge>
                        )}

                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Client Statement — {selectedClient?.parentName}
            </DialogTitle>
          </DialogHeader>
          {selectedClient && renderStatementDetail(selectedClient)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientStatements;
