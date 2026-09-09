import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { financialReportService, DateRange } from '@/services/financialReportService';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ActivityPLItem {
  activity: string;
  revenue: number;
  actualRevenue: number;
  potentialRevenue: number;
  outstanding: number;
  expenses: number;
  netProfit: number;
  potentialNetProfit: number;
}

export interface PotentialVsActual {
  potentialRevenue: number;
  actualRevenue: number;
  outstanding: number;
  collectionRate: number;
}

interface Props {
  dateRange: DateRange;
  activities?: string[];
}

type RevenueMode = 'collected' | 'potential';
type ChartStyle = 'grouped' | 'stacked';

// SVG diagonal-line pattern used to render the "Outstanding" portion as hatched
const HatchPattern: React.FC = () => (
  <defs>
    <pattern id="outstanding-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="hsl(var(--destructive) / 0.15)" />
      <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(var(--destructive))" strokeWidth="2" />
    </pattern>
  </defs>
);

const ActivityProfitLoss: React.FC<Props> = ({ dateRange, activities }) => {
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<ActivityPLItem[]>([]);
  const [potentialVsActual, setPotentialVsActual] = useState<PotentialVsActual | null>(null);
  const [mode, setMode] = useState<RevenueMode>(() => {
    if (typeof window === 'undefined') return 'collected';
    const v = localStorage.getItem('activityPL.mode');
    return v === 'potential' || v === 'collected' ? v : 'collected';
  });
  const [chartStyle, setChartStyle] = useState<ChartStyle>(() => {
    if (typeof window === 'undefined') return 'grouped';
    const v = localStorage.getItem('activityPL.chartStyle');
    return v === 'stacked' || v === 'grouped' ? v : 'grouped';
  });

  useEffect(() => {
    try { localStorage.setItem('activityPL.mode', mode); } catch {}
  }, [mode]);

  useEffect(() => {
    try { localStorage.setItem('activityPL.chartStyle', chartStyle); } catch {}
  }, [chartStyle]);

  useEffect(() => {
    loadData();
  }, [dateRange, activities]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activityPL, pva] = await Promise.all([
        financialReportService.generateActivityProfitLoss(dateRange, activities),
        financialReportService.generatePotentialVsActual(dateRange, activities),
      ]);
      setActivityData(activityPL);
      setPotentialVsActual(pva);
    } catch (error) {
      console.error('Error loading Activity P&L:', error);
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

  // Mode-aware view of each row used by chart, table and exports
  const view = activityData.map(item => ({
    activity: item.activity,
    revenue: mode === 'collected' ? item.actualRevenue : item.potentialRevenue,
    expenses: item.expenses,
    netProfit: mode === 'collected' ? item.netProfit : item.potentialNetProfit,
    outstanding: item.outstanding,
    actualRevenue: item.actualRevenue,
    potentialRevenue: item.potentialRevenue,
  })).sort((a, b) => b.revenue - a.revenue);

  const modeLabel = mode === 'collected' ? 'Collected' : 'Potential (Billed)';

  const handleExportCSV = () => {
    const headers = ['Activity', `${modeLabel} Revenue (KES)`, 'Expenses (KES)', 'Net Profit (KES)', 'Collected (KES)', 'Potential (KES)', 'Outstanding (KES)'];
    const rows = view.map(item => [
      item.activity,
      item.revenue.toFixed(2),
      item.expenses.toFixed(2),
      item.netProfit.toFixed(2),
      item.actualRevenue.toFixed(2),
      item.potentialRevenue.toFixed(2),
      item.outstanding.toFixed(2),
    ]);
    if (potentialVsActual) {
      rows.push([]);
      rows.push(['POTENTIAL VS ACTUAL']);
      rows.push(['Potential Revenue', potentialVsActual.potentialRevenue.toFixed(2)]);
      rows.push(['Actual Revenue', potentialVsActual.actualRevenue.toFixed(2)]);
      rows.push(['Outstanding', potentialVsActual.outstanding.toFixed(2)]);
      rows.push(['Collection Rate', `${potentialVsActual.collectionRate.toFixed(1)}%`]);
    }
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `activity-pl-${mode}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Activity P&L — ${modeLabel}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${format(dateRange.startDate, 'dd MMM yyyy')} - ${format(dateRange.endDate, 'dd MMM yyyy')}`, 14, 28);

    autoTable(doc, {
      head: [['Activity', `${modeLabel}`, 'Expenses', 'Net Profit', 'Collected', 'Potential', 'Outstanding']],
      body: view.map(item => [
        item.activity,
        item.revenue.toLocaleString(),
        item.expenses.toLocaleString(),
        item.netProfit.toLocaleString(),
        item.actualRevenue.toLocaleString(),
        item.potentialRevenue.toLocaleString(),
        item.outstanding.toLocaleString(),
      ]),
      startY: 35,
      headStyles: { fillColor: [34, 139, 34] },
      styles: { fontSize: 8 },
    });

    if (potentialVsActual) {
      autoTable(doc, {
        head: [['Metric', 'Amount']],
        body: [
          ['Potential Revenue', potentialVsActual.potentialRevenue.toLocaleString()],
          ['Actual Revenue', potentialVsActual.actualRevenue.toLocaleString()],
          ['Outstanding', potentialVsActual.outstanding.toLocaleString()],
          ['Collection Rate', `${potentialVsActual.collectionRate.toFixed(1)}%`],
        ],
        startY: (doc as any).lastAutoTable.finalY + 10,
        headStyles: { fillColor: [0, 123, 255] },
      });
    }

    doc.save(`activity-pl-${mode}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const totalRevenue = view.reduce((sum, d) => sum + d.revenue, 0);
  const totalExpenses = view.reduce((sum, d) => sum + d.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Activity Profit & Loss</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')}
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

      {/* Potential vs Actual Summary */}
      {potentialVsActual && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Potential Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(potentialVsActual.potentialRevenue)}</div>
              <p className="text-xs text-muted-foreground">If all registrations paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Actual Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(potentialVsActual.actualRevenue)}</div>
              <p className="text-xs text-muted-foreground">Current amount in accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-destructive">{formatCurrency(potentialVsActual.outstanding)}</div>
              <p className="text-xs text-muted-foreground">Still to be collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{potentialVsActual.collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Of total potential</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mode toggle */}
      {activityData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">View revenue as</p>
            <p className="text-xs text-muted-foreground">
              {mode === 'collected'
                ? 'Money already received (payments + paid registrations)'
                : 'Money expected (every registration billed in this period — paid or not)'}
            </p>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as RevenueMode)}>
            <TabsList>
              <TabsTrigger value="collected">Collected</TabsTrigger>
              <TabsTrigger value="potential">Potential (Billed)</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Activity P&L Chart */}
      {view.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{modeLabel} Revenue vs Expenses by Activity</CardTitle>
                  <CardDescription>
                    {chartStyle === 'stacked'
                      ? 'Each bar stacks Collected (solid) + Outstanding (hatched) so you see expected vs received at a glance'
                      : mode === 'collected'
                        ? 'Per-activity actual collections vs expenses'
                        : 'Per-activity expected billings vs expenses (includes unpaid)'}
                  </CardDescription>
                </div>
                <Tabs value={chartStyle} onValueChange={(v) => setChartStyle(v as ChartStyle)}>
                  <TabsList>
                    <TabsTrigger value="grouped">Grouped</TabsTrigger>
                    <TabsTrigger value="stacked">Stacked</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view} layout="vertical">
                    <HatchPattern />
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="activity"
                      width={120}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                    <Legend />
                    {chartStyle === 'stacked' ? (
                      <>
                        <Bar dataKey="actualRevenue" stackId="rev" name="Collected" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="outstanding" stackId="rev" name="Outstanding" fill="url(#outstanding-hatch)" stroke="hsl(var(--destructive))" strokeWidth={1} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="revenue" name={`${modeLabel} Revenue`} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Detail Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Breakdown ({modeLabel})</CardTitle>
              <CardDescription>
                Detailed profit and loss per activity. Always shows Collected, Potential and Outstanding for transparency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Activity</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">{modeLabel}</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Expenses</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Net Profit</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Collected</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Potential</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Outstanding</th>
                      <th className="text-center py-2 px-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.map((item) => (
                      <tr key={item.activity} className="border-b border-border/50">
                        <td className="py-2 px-3 font-medium">{item.activity}</td>
                        <td className="py-2 px-3 text-right text-primary">{formatCurrency(item.revenue)}</td>
                        <td className="py-2 px-3 text-right text-destructive">{formatCurrency(item.expenses)}</td>
                        <td className={`py-2 px-3 text-right font-medium ${item.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatCurrency(item.netProfit)}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground hidden md:table-cell">{formatCurrency(item.actualRevenue)}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground hidden md:table-cell">{formatCurrency(item.potentialRevenue)}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground hidden md:table-cell">{formatCurrency(item.outstanding)}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={item.netProfit >= 0 ? 'default' : 'destructive'} className="text-xs">
                            {item.netProfit >= 0 ? 'Profit' : 'Loss'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-bold">
                      <td className="py-2 px-3">Total</td>
                      <td className="py-2 px-3 text-right text-primary">{formatCurrency(totalRevenue)}</td>
                      <td className="py-2 px-3 text-right text-destructive">{formatCurrency(totalExpenses)}</td>
                      <td className={`py-2 px-3 text-right ${totalProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(totalProfit)}
                      </td>
                      <td className="py-2 px-3 text-right hidden md:table-cell">{formatCurrency(view.reduce((s, d) => s + d.actualRevenue, 0))}</td>
                      <td className="py-2 px-3 text-right hidden md:table-cell">{formatCurrency(view.reduce((s, d) => s + d.potentialRevenue, 0))}</td>
                      <td className="py-2 px-3 text-right hidden md:table-cell">{formatCurrency(view.reduce((s, d) => s + d.outstanding, 0))}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={totalProfit >= 0 ? 'default' : 'destructive'}>
                          {totalProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No activity data available for the selected period
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityProfitLoss;
