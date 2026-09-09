import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Smartphone, Banknote, Save, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { tillReconciliationService, periodRange } from '@/services/tillReconciliationService';
import type {
  TillStream,
  PeriodType,
  TillStatement,
  TillReconciliation as TillReconciliationRec,
  PaymentRow,
} from '@/services/tillReconciliationService';

const STREAMS: { id: TillStream; label: string; icon: React.ElementType }[] = [
  { id: 'mpesa', label: 'M-Pesa Till', icon: Smartphone },
  { id: 'cash', label: 'Cash Drawer', icon: Banknote },
];

function fmtKES(n: number) {
  return `KES ${Math.round(Number(n) || 0).toLocaleString()}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => {
    const s = String(c ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface StreamPanelProps {
  stream: TillStream;
  periodType: PeriodType;
  anchorDate: string; // YYYY-MM-DD
  onReconciled: () => void;
}

const StreamPanel: React.FC<StreamPanelProps> = ({ stream, periodType, anchorDate, onReconciled }) => {
  const [systemTotal, setSystemTotal] = useState(0);
  const [statements, setStatements] = useState<TillStatement[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [declaredInput, setDeclaredInput] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const range = useMemo(() => {
    const [y, m, d] = anchorDate.split('-').map(Number);
    return periodRange(periodType, new Date(y, m - 1, d));
  }, [anchorDate, periodType]);

  const declaredTotal = useMemo(
    () => statements.reduce((s, r) => s + Number(r.declared_total || 0), 0),
    [statements]
  );

  const variance = declaredTotal - systemTotal;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sysT, stmts, pays] = await Promise.all([
        tillReconciliationService.getSystemTotal(stream, range.start, range.end),
        tillReconciliationService.getDeclaredTotals(stream, range.start, range.end),
        tillReconciliationService.getPayments(stream, range.start, range.end),
      ]);
      setSystemTotal(sysT);
      setStatements(stmts);
      setPayments(pays);
      if (periodType === 'day') {
        const existing = stmts[0];
        setDeclaredInput(existing ? String(existing.declared_total) : '');
        setReference(existing?.reference || '');
        setNotes(existing?.notes || '');
      } else {
        setDeclaredInput('');
        setReference('');
        setNotes('');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [stream, range.start, range.end, periodType]);

  useEffect(() => { load(); }, [load]);

  const handleSaveDeclared = async () => {
    if (periodType !== 'day') return;
    setSaving(true);
    try {
      await tillReconciliationService.upsertDeclaredTotal(
        anchorDate, stream, parseFloat(declaredInput) || 0, reference || undefined, notes || undefined
      );
      toast({ title: 'Saved', description: 'Declared total updated.' });
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReconcile = async () => {
    setSaving(true);
    try {
      await tillReconciliationService.createReconciliation({
        period_type: periodType,
        period_start: range.start,
        period_end: range.end,
        stream,
        system_total: systemTotal,
        declared_total: declaredTotal,
        variance,
        status: Math.abs(variance) < 1 ? 'reconciled' : 'disputed',
        notes: notes || undefined,
      });
      toast({ title: 'Reconciled', description: `${stream === 'mpesa' ? 'M-Pesa' : 'Cash'} ${periodType} snapshot saved.` });
      onReconciled();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const exportPayments = () => {
    const head = ['Date', 'Reference', 'Customer', 'Method', 'Source', 'Amount'];
    const rows = payments.map(p => [
      p.payment_date, p.payment_reference || '', p.customer_name || '',
      p.payment_method, p.source || '', p.amount,
    ]);
    downloadCSV(`till-${stream}-${range.start}_to_${range.end}.csv`, [head, ...rows]);
  };

  const varClass =
    Math.abs(variance) < 1 ? 'bg-green-100 text-green-800'
    : Math.abs(variance) < 100 ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {stream === 'mpesa' ? <Smartphone className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
          {stream === 'mpesa' ? 'M-Pesa Till' : 'Cash Drawer'}
        </CardTitle>
        <CardDescription className="text-xs">
          {range.start === range.end ? range.start : `${range.start} → ${range.end}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded border">
            <div className="text-xs text-muted-foreground">System Total</div>
            <div className="text-lg font-semibold">{loading ? '…' : fmtKES(systemTotal)}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-xs text-muted-foreground">Declared</div>
            <div className="text-lg font-semibold">{loading ? '…' : fmtKES(declaredTotal)}</div>
          </div>
          <div className="p-3 rounded border">
            <div className="text-xs text-muted-foreground">Variance</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{fmtKES(variance)}</div>
              <Badge className={varClass}>
                {Math.abs(variance) < 1 ? 'OK' : variance > 0 ? 'Over' : 'Short'}
              </Badge>
            </div>
          </div>
        </div>

        {periodType === 'day' ? (
          <div className="space-y-2 border-t pt-3">
            <Label className="text-xs">Declared total for {anchorDate}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0"
                value={declaredInput}
                onChange={(e) => setDeclaredInput(e.target.value)}
              />
              <Input
                placeholder="Reference (e.g. M-Pesa stmt #)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <Textarea
              rows={2}
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button size="sm" onClick={handleSaveDeclared} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save Declared
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground border-t pt-3">
            Declared total is summed from daily entries. Switch to Day to edit a specific day.
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={handleReconcile} disabled={saving || loading}>
            {Math.abs(variance) < 1 ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
            Mark as Reconciled
          </Button>
          <Button size="sm" variant="outline" onClick={exportPayments} disabled={payments.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Show {payments.length} payment{payments.length === 1 ? '' : 's'} contributing to system total
          </summary>
          <div className="mt-2 max-h-64 overflow-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Ref</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{p.payment_date}</TableCell>
                    <TableCell className="text-xs">{p.payment_reference || '—'}</TableCell>
                    <TableCell className="text-xs">{p.customer_name || '—'}</TableCell>
                    <TableCell className="text-xs text-right">{fmtKES(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

const TillReconciliation: React.FC = () => {
  const [periodType, setPeriodType] = useState<PeriodType>('day');
  const [anchorDate, setAnchorDate] = useState<string>(todayISO());
  const [history, setHistory] = useState<TillReconciliationRec[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadHistory = async () => {
    try {
      const list = await tillReconciliationService.listReconciliations();
      setHistory(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadHistory(); }, [refreshKey]);

  const onReconciled = () => setRefreshKey(k => k + 1);

  const dateInputType =
    periodType === 'day' ? 'date' : periodType === 'month' ? 'month' : 'number';

  const dateInputValue =
    periodType === 'day' ? anchorDate
    : periodType === 'month' ? anchorDate.slice(0, 7)
    : anchorDate.slice(0, 4);

  const handleDateChange = (val: string) => {
    if (periodType === 'day') setAnchorDate(val);
    else if (periodType === 'month') setAnchorDate(`${val}-01`);
    else setAnchorDate(`${val}-01-01`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Till Reconciliation</h2>
        <p className="text-sm text-muted-foreground">Compare system payments against declared M-Pesa till and physical cash totals.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Period</Label>
              <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <Label className="text-xs">{periodType === 'day' ? 'Date' : periodType === 'month' ? 'Month' : 'Year'}</Label>
              <Input
                type={dateInputType as any}
                value={dateInputValue}
                onChange={(e) => handleDateChange(e.target.value)}
                min={periodType === 'year' ? 2020 : undefined}
                max={periodType === 'year' ? 2100 : undefined}
                className="w-44"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STREAMS.map(s => (
          <StreamPanel
            key={s.id + periodType + anchorDate + refreshKey}
            stream={s.id}
            periodType={periodType}
            anchorDate={anchorDate}
            onReconciled={onReconciled}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reconciliation History</CardTitle>
          <CardDescription className="text-xs">Recent locked snapshots</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {history.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No reconciliations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reconciled</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead className="text-right">System</TableHead>
                    <TableHead className="text-right">Declared</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.reconciled_at).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{r.stream}</TableCell>
                      <TableCell className="capitalize">{r.period_type}</TableCell>
                      <TableCell className="text-xs">{r.period_start} → {r.period_end}</TableCell>
                      <TableCell className="text-right">{fmtKES(r.system_total)}</TableCell>
                      <TableCell className="text-right">{fmtKES(r.declared_total)}</TableCell>
                      <TableCell className="text-right">{fmtKES(r.variance)}</TableCell>
                      <TableCell>
                        <Badge className={r.status === 'reconciled' ? 'bg-green-100 text-green-800' : r.status === 'disputed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TillReconciliation;
