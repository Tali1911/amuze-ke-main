import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, TrendingUp, DollarSign, CreditCard, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend,
} from 'recharts';
import { financialReportService, RevenueReportData, DateRange } from '@/services/financialReportService';
import { format, parseISO } from 'date-fns';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(142, 76%, 36%)',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(25, 95%, 53%)',
  'hsl(346, 77%, 49%)',
];

interface Props {
  dateRange: DateRange;
  activities?: string[];
}

const RevenueReport: React.FC<Props> = ({ dateRange, activities }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueReportData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    financialReportService.generateRevenueReport(dateRange, activities)
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => console.error('Error loading revenue report:', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dateRange, activities]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-KE', {
    style: 'currency', currency: 'KES', minimumFractionDigits: 0,
  }).format(v);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!data) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground">No revenue data available</CardContent></Card>;
  }

  const dailyAvg = data.trend.length > 0 ? data.totalRevenue / data.trend.length : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Revenue Report</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')} • Matches Dashboard total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => financialReportService.exportRevenueReportToCSV(data)}>
            <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => financialReportService.exportRevenueReportToPDF(data)}>
            <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All sources combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />Camp Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.campRegistrationsRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments + paid registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dailyAvg)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.trend.length} days in period</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
          <CardDescription>Daily revenue over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(d) => format(parseISO(d), 'dd MMM')}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(d) => format(parseISO(d as string), 'dd MMM yyyy')}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Source + By Method */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Source</CardTitle>
            <CardDescription>Breakdown by revenue origin</CardDescription>
          </CardHeader>
          <CardContent>
            {data.bySource.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.bySource}
                      dataKey="amount"
                      nameKey="source"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={90}
                      paddingAngle={2}
                      label={({ source, percent }) => `${source.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data.bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" />Revenue by Payment Method</CardTitle>
            <CardDescription>How customers paid</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byMethod.length > 0 ? (
              <div className="space-y-3">
                {data.byMethod.map((m, i) => {
                  const pct = data.totalRevenue > 0 ? (m.amount / data.totalRevenue) * 100 : 0;
                  return (
                    <div key={m.method} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground capitalize">{m.method}</span>
                        <span className="text-foreground">{formatCurrency(m.amount)} <span className="text-xs text-muted-foreground">({m.count})</span></span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-muted-foreground py-10">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* By Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Activity</CardTitle>
          <CardDescription>Performance per camp / program</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byActivity.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="activity" width={130} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-muted-foreground py-10">No data</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueReport;
