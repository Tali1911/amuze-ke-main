import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingDown, Receipt, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell,
} from 'recharts';
import { financialReportService, ExpenseReportData, DateRange } from '@/services/financialReportService';
import { format, parseISO } from 'date-fns';

const COLORS = [
  'hsl(0, 84%, 60%)',
  'hsl(25, 95%, 53%)',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(346, 77%, 49%)',
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(199, 89%, 48%)',
];

interface Props {
  dateRange: DateRange;
  activities?: string[];
}

const ExpenseReport: React.FC<Props> = ({ dateRange, activities }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpenseReportData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    financialReportService.generateExpenseReport(dateRange, activities)
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => console.error('Error loading expense report:', err))
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
    return <Card><CardContent className="py-10 text-center text-muted-foreground">No expense data available</CardContent></Card>;
  }

  const pendingExpenses = data.byStatus.find(s => s.status === 'pending')?.amount || 0;
  const dailyAvg = data.trend.length > 0 ? data.totalExpenses / data.trend.length : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Expense Report</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => financialReportService.exportExpenseReportToCSV(data)}>
            <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => financialReportService.exportExpenseReportToPDF(data)}>
            <Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved + Paid only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4" />Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dailyAvg)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.byCategory.length} categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Trend</CardTitle>
          <CardDescription>Daily expenses over the selected period</CardDescription>
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
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  labelFormatter={(d) => format(parseISO(d as string), 'dd MMM yyyy')}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Category + Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
            <CardDescription>Where the money is going</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byCategory.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.byCategory} dataKey="amount" nameKey="category"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}
                      label={({ category, percent }) => `${category.substring(0, 12)} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
            <CardTitle className="text-base">By Status</CardTitle>
            <CardDescription>Approval and payment workflow</CardDescription>
          </CardHeader>
          <CardContent>
            {data.byStatus.length > 0 ? (
              <div className="space-y-3">
                {data.byStatus.map((s, i) => {
                  const total = data.byStatus.reduce((acc, x) => acc + x.amount, 0);
                  const pct = total > 0 ? (s.amount / total) * 100 : 0;
                  return (
                    <div key={s.status} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground capitalize">{s.status}</span>
                        <span className="text-foreground">{formatCurrency(s.amount)} <span className="text-xs text-muted-foreground">({s.count})</span></span>
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

      {/* By Vendor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By Vendor</CardTitle>
          <CardDescription>Top vendors by spend</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byVendor.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byVendor.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="vendor" width={130} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="amount" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-muted-foreground py-10">No data</p>}
        </CardContent>
      </Card>

      {/* Top Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Expenses</CardTitle>
          <CardDescription>Largest individual line items</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.topExpenses.length > 0 ? (
            <div className="divide-y divide-border">
              {data.topExpenses.map((e, idx) => (
                <div key={idx} className="p-3 sm:p-4 hover:bg-muted/50 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{e.description}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{e.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(parseISO(e.date), 'dd MMM yyyy')}</p>
                  </div>
                  <p className="font-bold text-destructive flex-shrink-0">{formatCurrency(e.amount)}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-muted-foreground py-10">No expenses recorded</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseReport;
