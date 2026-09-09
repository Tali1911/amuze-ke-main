import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  CreditCard,
  Smartphone,
  Landmark,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  paystackPaymentsService,
  PaymentHistoryRow,
} from '@/services/paystackPaymentsService';

const PAGE_SIZE = 50;

const channelIcon = (method?: string | null) => {
  const m = (method || '').toLowerCase();
  if (m === 'mpesa' || m === 'mobile_money') return <Smartphone className="h-3.5 w-3.5" />;
  if (m === 'bank' || m === 'bank_transfer') return <Landmark className="h-3.5 w-3.5" />;
  return <CreditCard className="h-3.5 w-3.5" />;
};

const formatKES = (n: number) =>
  new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return d;
  }
};

export const PaymentHistoryTab: React.FC = () => {
  const [scope, setScope] = useState<'all' | 'camp'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [scope, debouncedSearch, from, to]);

  const load = async () => {
    setLoading(true);
    try {
      const { rows, total } = await paystackPaymentsService.listLocalPayments({
        scope,
        search: debouncedSearch,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(rows);
      setTotal(total);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, debouncedSearch, from, to, page]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await paystackPaymentsService.syncFromPaystack({
        from: from || undefined,
        to: to || undefined,
        perPage: 100,
        page: 1,
      });
      toast.success(
        `Synced ${res.fetched} from Paystack — ${res.inserted} added, ${res.skipped} already on file`
      );
      await load();
    } catch (err: any) {
      console.error(err);
      const message = err?.message || 'Failed to sync from Paystack';
      setSyncError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalAmount = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
    [rows]
  );

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            Paystack transactions recorded via webhook, plus on-demand sync.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync from Paystack'}
        </Button>
      </div>

      {syncError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {syncError}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <label className="text-xs text-muted-foreground mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, customer, program…"
              className="pl-8"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Scope</label>
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => v && setScope(v as 'all' | 'camp')}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="camp">Camp only</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration #</TableHead>
              <TableHead>Parent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payments found. Try widening the date range or click “Sync from Paystack”.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const isCamp = !!r.registration_id;
                const status = (r.status || '').toLowerCase();
                const statusVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
                  status === 'completed' || status === 'paid'
                    ? 'default'
                    : status === 'pending'
                    ? 'secondary'
                    : status === 'failed'
                    ? 'destructive'
                    : 'outline';
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(r.payment_date || r.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.customer_name || '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.program_name || ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatKES(r.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 text-sm">
                        {channelIcon(r.payment_method)}
                        <span className="capitalize">
                          {(r.payment_method || 'card').replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.payment_reference || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant} className="capitalize">
                        {r.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isCamp ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs">
                          {r.registration_number || r.registration_id?.slice(0, 8)}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-xs">External</Badge>
                      )}
                    </TableCell>
                    <TableCell>{r.parent_name || '—'}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {loading
            ? 'Loading…'
            : `Showing ${rows.length} of ${total} · Page total ${formatKES(totalAmount)}`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
