import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, TrendingUp, TrendingDown, DollarSign, Wallet, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { financialReportService, ProfitLossData, DateRange } from '@/services/financialReportService';
import { format } from 'date-fns';

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

const ProfitLossStatement: React.FC<Props> = ({ dateRange, activities }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [openAR, setOpenAR] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [dateRange, activities]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plData, arData] = await Promise.all([
        financialReportService.generateProfitLoss(dateRange, activities),
        financialReportService.generateARAgingReport(activities).catch(() => null),
      ]);
      setData(plData);
      setOpenAR(arData ? arData.total : null);
    } catch (error) {
      console.error('Error loading P&L data:', error);
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
      financialReportService.exportProfitLossToCSV(data);
    }
  };

  const handleExportPDF = () => {
    if (data) {
      financialReportService.exportProfitLossToPDF(data);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No data available for the selected period
        </CardContent>
      </Card>
    );
  }

  const revenueData = [
    { name: 'Payments', value: data.revenue.payments },
    { name: 'Camp Registrations', value: data.revenue.campRegistrations },
  ].filter(d => d.value > 0);

  const expenseData = Object.entries(data.expenses.byCategory).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const comparisonData = [
    { name: 'Collected', amount: data.revenue.collected, fill: 'hsl(var(--primary))' },
    { name: 'Pending', amount: data.revenue.pendingCollection, fill: 'hsl(var(--accent))' },
    { name: 'Expenses', amount: data.expenses.total, fill: 'hsl(var(--destructive))' },
  ];

  const profitMargin = data.revenue.collected > 0
    ? ((data.netProfit / data.revenue.collected) * 100).toFixed(1)
    : '0';

  const collectionRate = data.revenue.total > 0
    ? ((data.revenue.collected / data.revenue.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with export buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Profit & Loss Statement</h3>
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(data.revenue.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total billed in period (Collected + Pending)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(data.revenue.collected)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Received in period · {collectionRate}% of billed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Billed − Collected (period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-foreground">{formatCurrency(data.revenue.pendingCollection)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Timing gap: billed in window minus collected in window. Not the same as AR.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              Open AR (as of today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {openAR === null ? '—' : formatCurrency(openAR)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Matches AR Aging tab · what customers actually still owe today
            </p>
          </CardContent>
        </Card>

        <Card className={data.netProfit >= 0 ? 'border-primary/50' : 'border-destructive/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(data.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected − Expenses ({profitMargin}% margin)
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground -mt-2 px-1">
        "Billed − Collected" is a period timing figure (some bills are paid before/after the window).
        "Open AR" is what customers actually still owe today and matches the AR Aging tab.
      </p>


      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
            <CardDescription>Comparison of total amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Breakdown</CardTitle>
            <CardDescription>Sources of revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {revenueData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expense Breakdown by Category</CardTitle>
          <CardDescription>Detailed view of expense distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseData.length > 0 ? (
            <div className="grid gap-3">
              {expenseData.map((category, index) => {
                const percentage = data.expenses.total > 0 
                  ? ((category.value / data.expenses.total) * 100).toFixed(1)
                  : '0';
                return (
                  <div key={category.name} className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground truncate">{category.name}</span>
                        <span className="font-medium text-foreground">{formatCurrency(category.value)}</span>
                      </div>
                      <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No expenses recorded for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitLossStatement;
