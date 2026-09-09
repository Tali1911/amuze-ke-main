import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CampRegistration } from '@/types/campRegistration';
import { saveAs } from 'file-saver';
import { displayLocation } from '@/lib/locationDisplay';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { toast } from 'sonner';

type ColumnKey =
  | 'registration_number' | 'created_at' | 'updated_at'
  | 'parent_name' | 'email' | 'phone' | 'emergency_contact'
  | 'camp_type' | 'location' | 'registration_type' | 'status'
  | 'payment_status' | 'payment_method' | 'payment_reference'
  | 'billing_doc_type' | 'quote_number' | 'invoice_number' | 'converted_to_invoice_at'
  | 'total_amount' | 'discount_amount' | 'net_amount'
  | 'children_count' | 'children_names' | 'children_ages' | 'children_dobs'
  | 'children_special_needs' | 'children_dates' | 'children_sessions' | 'children_activity_types'
  | 'admin_notes' | 'consent_given' | 'participation_consent' | 'qr_code_data'
  // per-child mode only
  | 'child_name' | 'child_dob' | 'child_age_range' | 'child_special_needs'
  | 'child_selected_dates' | 'child_selected_sessions' | 'child_activity_type' | 'child_price';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  group: string;
  perChildOnly?: boolean;
  aggregateOnly?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: 'registration_number', label: 'Registration #', group: 'Registration' },
  { key: 'created_at', label: 'Date Created', group: 'Registration' },
  { key: 'updated_at', label: 'Last Updated', group: 'Registration' },
  { key: 'status', label: 'Status', group: 'Registration' },
  { key: 'registration_type', label: 'Registration Type', group: 'Registration' },
  { key: 'camp_type', label: 'Camp Type', group: 'Registration' },
  { key: 'location', label: 'Location', group: 'Registration' },
  { key: 'consent_given', label: 'Consent Given', group: 'Registration' },
  { key: 'participation_consent', label: 'Permission Form Accepted', group: 'Registration' },
  { key: 'admin_notes', label: 'Admin Notes', group: 'Registration' },
  { key: 'qr_code_data', label: 'QR Code Data', group: 'Registration' },

  { key: 'parent_name', label: 'Parent Name', group: 'Parent / Contact' },
  { key: 'email', label: 'Email', group: 'Parent / Contact' },
  { key: 'phone', label: 'Phone', group: 'Parent / Contact' },
  { key: 'emergency_contact', label: 'Emergency Contact', group: 'Parent / Contact' },

  { key: 'payment_status', label: 'Payment Status', group: 'Billing' },
  { key: 'payment_method', label: 'Payment Method', group: 'Billing' },
  { key: 'payment_reference', label: 'Payment Reference', group: 'Billing' },
  { key: 'billing_doc_type', label: 'Doc Type (Quote/Invoice/Paid)', group: 'Billing' },
  { key: 'quote_number', label: 'Quote Number', group: 'Billing' },
  { key: 'invoice_number', label: 'Invoice Number', group: 'Billing' },
  { key: 'converted_to_invoice_at', label: 'Converted To Invoice At', group: 'Billing' },
  { key: 'total_amount', label: 'Total Amount (KES)', group: 'Billing' },
  { key: 'discount_amount', label: 'Discount (KES)', group: 'Billing' },
  { key: 'net_amount', label: 'Net Amount (KES)', group: 'Billing' },

  { key: 'children_count', label: 'Children Count', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_names', label: 'Children Names', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_ages', label: 'Children Age Ranges', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_dobs', label: 'Children DOBs', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_special_needs', label: 'Children Special Needs', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_dates', label: 'Children Selected Dates', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_sessions', label: 'Children Sessions', group: 'Children (Summary)', aggregateOnly: true },
  { key: 'children_activity_types', label: 'Children Activity Types', group: 'Children (Summary)', aggregateOnly: true },

  { key: 'child_name', label: 'Child Name', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_dob', label: 'Child DOB', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_age_range', label: 'Child Age Range', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_special_needs', label: 'Child Special Needs', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_selected_dates', label: 'Child Selected Dates', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_selected_sessions', label: 'Child Sessions', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_activity_type', label: 'Child Activity Type', group: 'Child (Per-Row)', perChildOnly: true },
  { key: 'child_price', label: 'Child Price (KES)', group: 'Child (Per-Row)', perChildOnly: true },
];

const DEFAULTS_AGG: ColumnKey[] = [
  'registration_number', 'created_at', 'parent_name', 'email', 'phone',
  'camp_type', 'location', 'children_count', 'children_names',
  'children_special_needs',
  'total_amount', 'discount_amount', 'net_amount',
  'payment_status', 'payment_method', 'billing_doc_type',
];

const DEFAULTS_PER_CHILD: ColumnKey[] = [
  'registration_number', 'created_at', 'parent_name', 'email', 'phone',
  'camp_type', 'location',
  'child_name', 'child_age_range', 'child_special_needs',
  'child_selected_dates', 'child_selected_sessions', 'child_price',
  'total_amount', 'payment_status',
];

const fmtSessions = (s: any): string => {
  if (!s) return '';
  if (Array.isArray(s)) return s.join(', ');
  if (typeof s === 'object') return Object.entries(s).map(([d, v]) => `${d}:${v}`).join('; ');
  return String(s);
};

const val = (reg: CampRegistration, key: ColumnKey, child?: any): string => {
  const netAmt = Math.max(0, (reg.total_amount || 0) - (Number((reg as any).discount_amount) || 0));
  switch (key) {
    case 'registration_number': return reg.registration_number || '';
    case 'created_at': return reg.created_at ? new Date(reg.created_at).toLocaleString() : '';
    case 'updated_at': return reg.updated_at ? new Date(reg.updated_at).toLocaleString() : '';
    case 'status': return reg.status || '';
    case 'registration_type': return reg.registration_type || '';
    case 'camp_type': return reg.camp_type || '';
    case 'location': return displayLocation(reg.location || 'Kurura Gate F');
    case 'consent_given': return reg.consent_given ? 'Yes' : 'No';
    case 'participation_consent':
      return (reg as any).participation_consent_given
        ? `Yes${(reg as any).participation_consent_at ? ` (${new Date((reg as any).participation_consent_at).toLocaleDateString()})` : ''}`
        : 'Not recorded';
    case 'admin_notes': return reg.admin_notes || '';
    case 'qr_code_data': return reg.qr_code_data || '';
    case 'parent_name': return reg.parent_name || '';
    case 'email': return reg.email || '';
    case 'phone': return reg.phone || '';
    case 'emergency_contact': return reg.emergency_contact || '';
    case 'payment_status': return reg.payment_status || '';
    case 'payment_method': return reg.payment_method || '';
    case 'payment_reference': return reg.payment_reference || '';
    case 'billing_doc_type': return reg.billing_doc_type || (reg.payment_status === 'paid' ? 'paid' : 'quotation');
    case 'quote_number': return reg.quote_number || '';
    case 'invoice_number': return reg.invoice_number || '';
    case 'converted_to_invoice_at': return reg.converted_to_invoice_at ? new Date(reg.converted_to_invoice_at).toLocaleString() : '';
    case 'total_amount': return String(reg.total_amount ?? 0);
    case 'discount_amount': return String(Number((reg as any).discount_amount) || 0);
    case 'net_amount': return String(netAmt);
    case 'children_count': return String(reg.children?.length || 0);
    case 'children_names': return (reg.children || []).map(c => c.childName).join('; ');
    case 'children_ages': return (reg.children || []).map(c => c.ageRange).join('; ');
    case 'children_dobs': return (reg.children || []).map(c => c.dateOfBirth).join('; ');
    case 'children_special_needs': return (reg.children || []).map(c => c.specialNeeds || '').join('; ');
    case 'children_dates': return (reg.children || []).map(c => (c.selectedDates || []).join(',')).join(' | ');
    case 'children_sessions': return (reg.children || []).map(c => fmtSessions(c.selectedSessions)).join(' | ');
    case 'children_activity_types': return (reg.children || []).map(c => c.activityType || 'camp').join('; ');
    case 'child_name': return child?.childName || '';
    case 'child_dob': return child?.dateOfBirth || '';
    case 'child_age_range': return child?.ageRange || '';
    case 'child_special_needs': return child?.specialNeeds || '';
    case 'child_selected_dates': return (child?.selectedDates || []).join(', ');
    case 'child_selected_sessions': return fmtSessions(child?.selectedSessions);
    case 'child_activity_type': return child?.activityType || 'camp';
    case 'child_price': return String(child?.price ?? '');
    default: return '';
  }
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  registrations: CampRegistration[];
}

export const CustomExportDialog: React.FC<Props> = ({ open, onOpenChange, registrations }) => {
  const [rowMode, setRowMode] = useState<'aggregate' | 'per_child'>('aggregate');
  const [fmt, setFmt] = useState<'csv' | 'pdf'>('csv');
  const [selected, setSelected] = useState<Set<ColumnKey>>(new Set(DEFAULTS_AGG));

  const availableColumns = useMemo(
    () => COLUMNS.filter(c => rowMode === 'per_child' ? !c.aggregateOnly : !c.perChildOnly),
    [rowMode]
  );

  const groups = useMemo(() => {
    const g: Record<string, ColumnDef[]> = {};
    availableColumns.forEach(c => { (g[c.group] ||= []).push(c); });
    return g;
  }, [availableColumns]);

  const toggle = (k: ColumnKey) => {
    const n = new Set(selected);
    n.has(k) ? n.delete(k) : n.add(k);
    setSelected(n);
  };

  const setRowModeAndDefaults = (m: 'aggregate' | 'per_child') => {
    setRowMode(m);
    setSelected(new Set(m === 'aggregate' ? DEFAULTS_AGG : DEFAULTS_PER_CHILD));
  };

  const selectAllInGroup = (grp: string, on: boolean) => {
    const n = new Set(selected);
    groups[grp].forEach(c => on ? n.add(c.key) : n.delete(c.key));
    setSelected(n);
  };

  const buildRows = (): { headers: string[]; rows: string[][] } => {
    const cols = availableColumns.filter(c => selected.has(c.key));
    const headers = cols.map(c => c.label);
    const rows: string[][] = [];
    if (rowMode === 'per_child') {
      registrations.forEach(reg => {
        const kids = reg.children?.length ? reg.children : [undefined];
        kids.forEach(child => rows.push(cols.map(c => val(reg, c.key, child))));
      });
    } else {
      registrations.forEach(reg => rows.push(cols.map(c => val(reg, c.key))));
    }
    return { headers, rows };
  };

  const handleExport = () => {
    if (selected.size === 0) { toast.error('Select at least one column'); return; }
    if (registrations.length === 0) { toast.error('No registrations to export'); return; }
    const { headers, rows } = buildRows();
    const stamp = format(new Date(), 'yyyy-MM-dd');
    const base = `registrations-${rowMode === 'per_child' ? 'per-child-' : ''}${stamp}`;

    if (fmt === 'csv') {
      const csv = [headers, ...rows]
        .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${base}.csv`);
    } else {
      const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });
      doc.setFontSize(14);
      doc.text('Camp Registrations Export', 14, 15);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString()} | Rows: ${rows.length}`, 14, 22);
      autoTable(doc, {
        head: [headers], body: rows, startY: 28,
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [34, 139, 34] },
      });
      doc.save(`${base}.pdf`);
    }
    toast.success(`Exported ${rows.length} row(s) with ${headers.length} column(s)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Custom Export</DialogTitle>
          <DialogDescription>
            Choose which columns to include, then export to CSV or PDF. Exports {registrations.length} registration(s).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Row Mode</Label>
            <RadioGroup value={rowMode} onValueChange={(v) => setRowModeAndDefaults(v as any)} className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="aggregate" id="rm-agg" />
                <Label htmlFor="rm-agg" className="text-sm font-normal">One row per registration</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="per_child" id="rm-child" />
                <Label htmlFor="rm-child" className="text-sm font-normal">One row per child</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label className="text-sm font-medium">Format</Label>
            <RadioGroup value={fmt} onValueChange={(v) => setFmt(v as any)} className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="csv" id="fmt-csv" />
                <Label htmlFor="fmt-csv" className="text-sm font-normal">CSV (Excel-compatible)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="fmt-pdf" />
                <Label htmlFor="fmt-pdf" className="text-sm font-normal">PDF</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{selected.size} column(s) selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set(availableColumns.map(c => c.key)))}>Select All</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[45vh] pr-3 border rounded-md p-3">
          <div className="space-y-4">
            {Object.entries(groups).map(([grp, cols]) => {
              const allOn = cols.every(c => selected.has(c.key));
              return (
                <div key={grp}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{grp}</h4>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => selectAllInGroup(grp, !allOn)}
                    >
                      {allOn ? 'Deselect group' : 'Select group'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1">
                    {cols.map(c => (
                      <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={selected.has(c.key)} onCheckedChange={() => toggle(c.key)} />
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}>Export {fmt.toUpperCase()}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
