import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, TrendingUp, TrendingDown, Minus, DollarSign, Users, Receipt } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { financialReportService, DailySalesData, DateRange } from '@/services/financialReportService';
import { format, parseISO } from 'date-fns';

interface Props {
  dateRange: DateRange;
  activities?: string[];
}

const DailySalesSummary: React.FC<Props> = ({ dateRange, activities }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailySalesData[]>([]);
  const [campTotals, setCampTotals] = useState<{
    totalRevenue: number;
    paidRevenue: number;
    outstandingRevenue: number;
    registrations: number;
    childrenExpected: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [dateRange, activities]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, camp] = await Promise.all([
        financialReportService.generateDailySalesSummary(dateRange, activities),
        financialReportService.getCampPeriodTotals(dateRange, activities),
      ]);
      setData(salesData);
      setCampTotals(camp);
    } catch (error) {
      console.error('Error loading daily sales data:', error);
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
    financialReportService.exportDailySalesToCSV(data);
  };

  const handleExportPDF = () => {
    financialReportService.exportDailySalesToPDF(data);
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, day) => ({
      billedAmount: acc.billedAmount + day.billedAmount,
      collectedAmount: acc.collectedAmount + day.collectedAmount,
      paymentsAmount: acc.paymentsAmount + day.paymentsAmount,
      paymentsReceived: acc.paymentsReceived + day.paymentsReceived,
      campRevenue: acc.campRevenue + day.campRevenue,
      campRegistrations: acc.campRegistrations + day.campRegistrations,
      invoicesAmount: acc.invoicesAmount + day.invoicesAmount,
      invoicesCreated: acc.invoicesCreated + day.invoicesCreated,
    }),
    { billedAmount: 0, collectedAmount: 0, paymentsAmount: 0, paymentsReceived: 0, campRevenue: 0, campRegistrations: 0, invoicesAmount: 0, invoicesCreated: 0 }
  );

  // Calculate daily average over BILLED amount (matches the Total Billed card)
  const daysWithData = data.filter(d => d.billedAmount > 0).length;
  const avgDailyBilled = daysWithData > 0 ? totals.billedAmount / daysWithData : 0;

  // Trend over billed amount (first half vs second half)
  const halfIndex = Math.floor(data.length / 2);
  const firstHalfBilled = data.slice(0, halfIndex).reduce((sum, d) => sum + d.billedAmount, 0);
  const secondHalfBilled = data.slice(halfIndex).reduce((sum, d) => sum + d.billedAmount, 0);
  const trend = firstHalfBilled > 0 ? ((secondHalfBilled - firstHalfBilled) / firstHalfBilled) * 100 : 0;

  // Format chart data for better display
  const chartData = data.map(d => ({
    ...d,
    displayDate: format(parseISO(d.date), 'dd MMM'),
  }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Daily Sales Summary</h3>
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

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totals.billedAmount)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totals.invoicesCreated} invoice{totals.invoicesCreated === 1 ? '' : 's'} raised in period
            </p>
            <div className="flex items-center gap-1 mt-1">
              {trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : trend < 0 ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={`text-xs ${trend > 0 ? 'text-primary' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% trend
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-accent" />
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(totals.collectedAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.paymentsReceived} payment{totals.paymentsReceived === 1 ? '' : 's'} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary-foreground" />
              New Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{totals.campRegistrations}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totals.campRevenue)} camp collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Average Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(avgDailyBilled)}</div>
            <p className="text-xs text-muted-foreground mt-1">{daysWithData} days with billing</p>
          </CardContent>
        </Card>
      </div>

      {/* Camp Activity strip — mirrors the admin Camp Analytics tab so the same
          words (Total Revenue / Paid Revenue / Outstanding) line up exactly. */}
      {campTotals && (
        <div className="space-y-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-semibold text-foreground">Camp Activity (this period)</h4>
            <p className="text-xs text-muted-foreground">
              Figures above cover the whole business (manual invoices, vendor bills, non‑camp payments).
              The strip below is camp registrations only — matches the Camp Analytics tab and Attendance.
            </p>
          </div>
          <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Camp Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(campTotals.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {campTotals.registrations} registration{campTotals.registrations === 1 ? '' : 's'} in period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Camp Paid Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(campTotals.paidRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {campTotals.totalRevenue > 0
                    ? `${Math.round((campTotals.paidRevenue / campTotals.totalRevenue) * 100)}% of camp total`
                    : '0% of camp total'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-destructive" />
                  Camp Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(campTotals.outstandingRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">Unpaid + Partial</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-secondary-foreground" />
                  Children Expected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{campTotals.childrenExpected}</div>
                <p className="text-xs text-muted-foreground mt-1">Matches Attendance page</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}



      {/* Billed vs Collected Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billed vs Collected Trend</CardTitle>
          <CardDescription>Daily billed (invoices raised) compared with cash collected</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="billedAmount"
                    name="Billed"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorBilled)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collectedAmount"
                    name="Collected"
                    stroke="hsl(var(--accent))"
                    fillOpacity={1}
                    fill="url(#colorCollected)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              No revenue data for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Sources Comparison</CardTitle>
          <CardDescription>Payments vs Camp Registrations</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    interval={Math.floor(chartData.length / 10)}
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="paymentsAmount"
                    name="Payments"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="campRevenue"
                    name="Camp Revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Breakdown</CardTitle>
          <CardDescription>Detailed daily transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="min-w-full">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground" title="Invoices raised that day (system + manual)">Invoices Raised</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Payments</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground" title="Registrations created that day">New Regs</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Billed</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((day) => (
                    <tr key={day.date} className="hover:bg-muted/30">
                      <td className="p-3 text-sm font-medium text-foreground">
                        {format(parseISO(day.date), 'EEE, dd MMM')}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.invoicesCreated > 0 && (
                          <span>{day.invoicesCreated} ({formatCurrency(day.invoicesAmount)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.paymentsReceived > 0 && (
                          <span>{day.paymentsReceived} ({formatCurrency(day.paymentsAmount)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground">
                        {day.campRegistrations > 0 && (
                          <span>{day.campRegistrations} ({formatCurrency(day.campRevenue)})</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-right font-medium text-foreground">
                        {day.billedAmount > 0 ? formatCurrency(day.billedAmount) : '-'}
                      </td>
                      <td className="p-3 text-sm text-right font-medium text-accent">
                        {day.collectedAmount > 0 ? formatCurrency(day.collectedAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailySalesSummary;
