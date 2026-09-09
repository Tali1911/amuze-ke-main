import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, AlertTriangle, Clock, AlertCircle, XCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { financialReportService, ARAgingSummary, ARAgingItem } from '@/services/financialReportService';
import { format, parseISO } from 'date-fns';
import AgingBucketDialog from './AgingBucketDialog';

const AGING_COLORS = {
  current: 'hsl(142, 76%, 36%)',
  '1-30': 'hsl(47, 96%, 53%)',
  '31-60': 'hsl(25, 95%, 53%)',
  '61-90': 'hsl(14, 90%, 55%)',
  '90+': 'hsl(0, 84%, 60%)',
};

type BucketKey = ARAgingItem['agingBucket'];

interface ARAgingReportProps {
  activities?: string[];
  dateRange?: { startDate: Date; endDate: Date };
}

const ARAgingReport: React.FC<ARAgingReportProps> = ({ activities = [], dateRange }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ARAgingSummary | null>(null);
  const [openBucket, setOpenBucket] = useState<BucketKey | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activities), dateRange?.startDate?.toISOString(), dateRange?.endDate?.toISOString()]);

  const loadData = async () => {
    setLoading(true);
    try {
      // AR Aging is "as of today, what's outstanding for this activity".
      // Honor the activity filter, but don't restrict by the narrow date window
      // (P&L/Sales own the window — AR is a point-in-time view).
      const agingData = await financialReportService.generateARAgingReport(
        activities,
      );
      setData(agingData);
    } catch (error) {
      console.error('Error loading AR aging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExportCSV = () => {
    if (data) {
      financialReportService.exportARAgingToCSV(data);
    }
  };

  const handleExportPDF = () => {
    if (data) {
      financialReportService.exportARAgingToPDF(data);
    }
  };

  const getAgingBadge = (bucket: string) => {
    switch (bucket) {
      case 'current':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Current</Badge>;
      case '1-30':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">1-30 Days</Badge>;
      case '31-60':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">31-60 Days</Badge>;
      case '61-90':
        return <Badge variant="outline" className="bg-red-400/10 text-red-500 border-red-400/30">61-90 Days</Badge>;
      case '90+':
        return <Badge variant="destructive">90+ Days</Badge>;
      default:
        return <Badge variant="secondary">{bucket}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No AR aging data available
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Current', amount: data.current, fill: AGING_COLORS.current },
    { name: '1-30 Days', amount: data.days1to30, fill: AGING_COLORS['1-30'] },
    { name: '31-60 Days', amount: data.days31to60, fill: AGING_COLORS['31-60'] },
    { name: '61-90 Days', amount: data.days61to90, fill: AGING_COLORS['61-90'] },
    { name: '90+ Days', amount: data.days90plus, fill: AGING_COLORS['90+'] },
  ];

  const overduePercentage = data.total > 0 
    ? (((data.days1to30 + data.days31to60 + data.days61to90 + data.days90plus) / data.total) * 100).toFixed(1)
    : '0';

  const itemsByBucket: Record<BucketKey, ARAgingItem[]> = {
    current: data.items.filter(i => i.agingBucket === 'current'),
    '1-30': data.items.filter(i => i.agingBucket === '1-30'),
    '31-60': data.items.filter(i => i.agingBucket === '31-60'),
    '61-90': data.items.filter(i => i.agingBucket === '61-90'),
    '90+': data.items.filter(i => i.agingBucket === '90+'),
  };

  const bucketLabels: Record<BucketKey, string> = {
    current: 'Current (Not Yet Due)',
    '1-30': '1-30 Days Overdue',
    '31-60': '31-60 Days Overdue',
    '61-90': '61-90 Days Overdue',
    '90+': '90+ Days Overdue',
  };

  const filterLabel = activities.length > 0 ? activities.join(', ') : 'All activities';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">AR Aging Report</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {filterLabel} • {overduePercentage}% overdue • Click a bucket for details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Aging Buckets Summary - clickable */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 sm:grid-cols-5">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setOpenBucket('current')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenBucket('current')}
          className="border-primary/30 cursor-pointer transition hover:ring-2 hover:ring-primary/40 hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Current
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-primary">{formatCurrency(data.current)}</div>
            <p className="text-xs text-muted-foreground">{itemsByBucket.current.length} item{itemsByBucket.current.length === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setOpenBucket('1-30')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenBucket('1-30')}
          className="border-yellow-500/30 cursor-pointer transition hover:ring-2 hover:ring-yellow-500/40 hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              1-30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{formatCurrency(data.days1to30)}</div>
            <p className="text-xs text-muted-foreground">{itemsByBucket['1-30'].length} item{itemsByBucket['1-30'].length === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setOpenBucket('31-60')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenBucket('31-60')}
          className="border-orange-500/30 cursor-pointer transition hover:ring-2 hover:ring-orange-500/40 hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              31-60 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(data.days31to60)}</div>
            <p className="text-xs text-muted-foreground">{itemsByBucket['31-60'].length} item{itemsByBucket['31-60'].length === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setOpenBucket('61-90')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenBucket('61-90')}
          className="border-red-400/30 cursor-pointer transition hover:ring-2 hover:ring-red-400/40 hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              61-90 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-500">{formatCurrency(data.days61to90)}</div>
            <p className="text-xs text-muted-foreground">{itemsByBucket['61-90'].length} item{itemsByBucket['61-90'].length === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={() => setOpenBucket('90+')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpenBucket('90+')}
          className="border-destructive/50 cursor-pointer transition hover:ring-2 hover:ring-destructive/40 hover:shadow-md"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              90+ Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatCurrency(data.days90plus)}</div>
            <p className="text-xs text-muted-foreground">{itemsByBucket['90+'].length} item{itemsByBucket['90+'].length === 1 ? '' : 's'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation row: Aging total + Orphan exemption + Grand total */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        <Card className="bg-muted/30 border-destructive/50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">AR Aging Total</p>
            <p className="text-3xl font-bold text-destructive">{formatCurrency(data.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sum of all aging buckets above. Matches the Pending Collections total and Dashboard "Total Outstanding".
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-yellow-500/40">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Flagged for Review</p>
            <p className="text-3xl font-bold text-yellow-600">{formatCurrency(data.orphanedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.orphanedItems.length} item{data.orphanedItems.length === 1 ? '' : 's'} linked to cancelled, deleted, or quote-stage registrations. Already included in aging above — listed below for triage.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 border-primary/50">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Grand Total Outstanding</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(data.grandTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Equals AR Aging Total. Reconciles to the Accounts Dashboard "Total Outstanding".
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice/collection composition of the active aging total */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Invoiced AR</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.invoicedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.invoicedCount} formal invoice{data.invoicedCount === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Attended-Unpaid Collections</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.attendedUnpaidTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.attendedUnpaidCount} pending collection{data.attendedUnpaidCount === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground -mt-2 px-1">
        Aging buckets include both invoiced AR and attended-unpaid collections, aged from invoice due date or collection creation date. Orphaned items are listed separately so unpaid balances are never hidden.
      </p>

      {/* Chart and Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging Distribution</CardTitle>
            <CardDescription>Outstanding amounts by aging bucket</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding Invoices</CardTitle>
            <CardDescription>Detailed list of unpaid invoices</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[340px]">
              {data.items.length > 0 ? (
                <div className="divide-y divide-border">
                  {data.items.map((item) => (
                    <div key={item.invoiceId} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{item.invoiceNumber}</span>
                            {getAgingBadge(item.agingBucket)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{item.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(parseISO(item.dueDate), 'dd MMM yyyy')}
                            {item.daysOverdue > 0 && ` • ${item.daysOverdue} days overdue`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-foreground">{formatCurrency(item.balanceDue)}</p>
                          <p className="text-xs text-muted-foreground">
                            of {formatCurrency(item.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  No outstanding invoices - all accounts current!
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Orphaned / exempt receivables — unpaid balances that don't fit an active aging bucket */}
      {data.orphanedItems.length > 0 && (
        <Card className="border-yellow-500/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Orphaned / Exempt Receivables
            </CardTitle>
            <CardDescription>
              Pending balances linked to cancelled, deleted, or quote-stage registrations.
              Excluded from aging buckets but still owed — review and either re-link, write off, or convert to invoice.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="divide-y divide-border">
                {data.orphanedItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{item.customerName}</span>
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                            {item.reasonLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.childName ? `${item.childName} • ` : ''}{item.activityName || 'No activity'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {format(parseISO(item.createdAt), 'dd MMM yyyy')} • {item.daysOld} day{item.daysOld === 1 ? '' : 's'} old
                          {item.customerPhone ? ` • ${item.customerPhone}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-yellow-700">{formatCurrency(item.balanceDue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}



      <AgingBucketDialog
        open={openBucket !== null}
        onOpenChange={(v) => !v && setOpenBucket(null)}
        bucketLabel={openBucket ? bucketLabels[openBucket] : ''}
        items={openBucket ? itemsByBucket[openBucket] : []}
      />
    </div>
  );
};

export default ARAgingReport;
