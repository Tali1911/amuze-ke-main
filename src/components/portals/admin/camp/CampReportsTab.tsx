import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, Calendar as CalendarIcon, Filter, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { exportService } from '@/services/exportService';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, isWithinInterval, subDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { registrationInDateWindow } from '@/utils/registrationDate';
import { parseLocalDate } from '@/utils/dateUtils';

// Count children whose booked attendance dates (selectedDates) fall inside the
// window. Mirrors AttendanceMarkingTab's "Expected" logic so totals agree.
const countChildrenInWindow = (reg: CampRegistration, start?: Date, end?: Date): number => {
  const children = Array.isArray((reg as any).children) ? (reg as any).children : [];
  if (!start && !end) {
    // No window → count every child on every registration.
    return children.reduce((sum: number, c: any) => sum + 1, 0);
  }
  const fromMs = start ? startOfDay(start).getTime() : -Infinity;
  const toMs = end ? endOfDay(end).getTime() : Infinity;

  let total = 0;
  let sawAnySelectedDates = false;
  for (const c of children) {
    const selected: string[] = Array.isArray(c?.selectedDates) ? c.selectedDates : [];
    if (selected.length > 0) {
      sawAnySelectedDates = true;
      const inWindow = selected.some(d => {
        if (typeof d !== 'string') return false;
        const t = parseLocalDate(d).getTime();
        return t >= fromMs && t <= toMs;
      });
      if (inWindow) total += 1;
    }
  }
  // Legacy fallback: registration has no selectedDates anywhere → bucket by created_at
  if (!sawAnySelectedDates) {
    const createdMs = reg.created_at ? new Date(reg.created_at).getTime() : NaN;
    if (!Number.isNaN(createdMs) && createdMs >= fromMs && createdMs <= toMs) {
      return children.length;
    }
    return 0;
  }
  return total;
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

type DatePreset = 'all' | 'today' | 'yesterday' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year' | 'custom';

interface PeriodMetrics {
  totalRevenue: number;
  totalRegistrations: number;
  totalChildren: number;
  paidRevenue: number;
  unpaidRevenue: number;
  partialRevenue: number;
  averagePerRegistration: number;
}

const calculatePeriodMetrics = (
  registrations: CampRegistration[],
  start?: Date,
  end?: Date,
): PeriodMetrics => {
  if (registrations.length === 0) {
    return {
      totalRevenue: 0,
      totalRegistrations: 0,
      totalChildren: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
      partialRevenue: 0,
      averagePerRegistration: 0,
    };
  }
  const summary = exportService.calculateSummary(registrations);
  // Count children whose booked attendance dates fall in the window — keeps
  // this in sync with AttendanceMarkingTab's "Expected" count.
  const totalChildren = registrations.reduce(
    (sum, reg) => sum + countChildrenInWindow(reg, start, end),
    0,
  );
  return {
    totalRevenue: summary?.totalRevenue || 0,
    totalRegistrations: summary?.totalRegistrations || 0,
    totalChildren,
    paidRevenue: summary?.paidRevenue || 0,
    unpaidRevenue: summary?.unpaidRevenue || 0,
    partialRevenue: summary?.partialRevenue || 0,
    averagePerRegistration: summary?.averagePerRegistration || 0,
  };
};


const getPercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const ChangeIndicator: React.FC<{ current: number; previous: number }> = ({ current, previous }) => {
  const change = getPercentageChange(current, previous);
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isPositive ? "text-green-600" : isNeutral ? "text-muted-foreground" : "text-red-600"
    )}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>{Math.abs(change).toFixed(1)}%</span>
      <span className="text-muted-foreground font-normal">vs prev</span>
    </div>
  );
};

export const CampReportsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showComparison, setShowComparison] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await campRegistrationService.getAllRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    switch (datePreset) {
      case 'today':
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case 'yesterday': {
        const y = subDays(now, 1);
        setStartDate(startOfDay(y));
        setEndDate(endOfDay(y));
        break;
      }
      case 'this-month':
        setStartDate(startOfMonth(now));
        setEndDate(endOfDay(endOfMonth(now)));
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfDay(endOfMonth(lastMonth)));
        break;
      case 'last-3-months':
        setStartDate(startOfMonth(subMonths(now, 2)));
        setEndDate(endOfDay(endOfMonth(now)));
        break;
      case 'this-year':
        setStartDate(startOfYear(now));
        setEndDate(endOfDay(endOfYear(now)));
        break;
      case 'all':
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  }, [datePreset]);

  const previousPeriod = useMemo(() => {
    if (!startDate || !endDate) return { start: undefined, end: undefined };
    const periodLength = differenceInDays(endDate, startDate) + 1;
    const prevEnd = subDays(startDate, 1);
    const prevStart = subDays(prevEnd, periodLength - 1);
    return { start: prevStart, end: prevEnd };
  }, [startDate, endDate]);

  const filterByDateRange = (regs: CampRegistration[], start?: Date, end?: Date) => {
    if (!start && !end) return regs;
    return regs.filter(reg => registrationInDateWindow(reg, start, end));
  };


  const filteredRegistrations = useMemo(() => 
    filterByDateRange(registrations, startDate, endDate),
    [registrations, startDate, endDate]
  );

  const previousRegistrations = useMemo(() => 
    filterByDateRange(registrations, previousPeriod.start, previousPeriod.end),
    [registrations, previousPeriod]
  );

  const currentMetrics = useMemo(() => calculatePeriodMetrics(filteredRegistrations, startDate, endDate), [filteredRegistrations, startDate, endDate]);
  const previousMetrics = useMemo(() => calculatePeriodMetrics(previousRegistrations, previousPeriod.start, previousPeriod.end), [previousRegistrations, previousPeriod]);

  // Children EXPECTED (attendance) — counted across ALL registrations whose
  // children[*].selectedDates falls in the window, regardless of when the
  // registration was billed/paid. Matches AttendanceMarkingTab's "Expected".
  const currentExpectedChildren = useMemo(
    () => registrations.reduce((sum, reg) => sum + countChildrenInWindow(reg, startDate, endDate), 0),
    [registrations, startDate, endDate]
  );
  const previousExpectedChildren = useMemo(
    () => registrations.reduce((sum, reg) => sum + countChildrenInWindow(reg, previousPeriod.start, previousPeriod.end), 0),
    [registrations, previousPeriod]
  );

  const summary = useMemo(() => {
    if (filteredRegistrations.length === 0) return null;
    return exportService.calculateSummary(filteredRegistrations);
  }, [filteredRegistrations]);

  const handlePresetChange = (preset: DatePreset) => setDatePreset(preset);

  const handleCustomDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    setDatePreset('custom');
    if (type === 'start') setStartDate(date);
    else setEndDate(date);
  };

  const clearFilters = () => {
    setDatePreset('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const canShowComparison = startDate && endDate && showComparison;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  const campTypeData = summary ? Object.entries(summary.campTypeCounts).map(([name, count]) => ({
    name: name.replace('-', ' ').toUpperCase(),
    count,
  })) : [];

  const paymentStatusData = summary ? [
    { name: 'Paid', value: summary.paidRevenue, count: filteredRegistrations.filter(r => r.payment_status === 'paid').length },
    { name: 'Unpaid', value: summary.unpaidRevenue, count: filteredRegistrations.filter(r => r.payment_status === 'unpaid').length },
    { name: 'Partial', value: summary.partialRevenue, count: filteredRegistrations.filter(r => r.payment_status === 'partial').length },
  ].filter(item => item.count > 0) : [];

  const revenueByType = summary ? Object.keys(summary.campTypeCounts).map(campType => {
    const currentRegs = filteredRegistrations.filter(r => r.camp_type === campType);
    const prevRegs = previousRegistrations.filter(r => r.camp_type === campType);
    return {
      name: campType.replace('-', ' ').toUpperCase(),
      current: Math.round(currentRegs.reduce((sum, r) => sum + r.total_amount, 0)),
      previous: Math.round(prevRegs.reduce((sum, r) => sum + r.total_amount, 0)),
    };
  }) : [];

  const ageDistribution: Record<string, number> = {};
  filteredRegistrations.forEach(reg => {
    reg.children.forEach(child => {
      const age = child.ageRange || 'Unknown';
      ageDistribution[age] = (ageDistribution[age] || 0) + 1;
    });
  });
  const ageData = Object.entries(ageDistribution).map(([age, count]) => ({ age, count }));

  const registrationTypeData = [
    { name: 'Online Only', count: filteredRegistrations.filter(r => r.registration_type === 'online_only').length },
    { name: 'Online Paid', count: filteredRegistrations.filter(r => r.registration_type === 'online_paid').length },
    { name: 'Ground', count: filteredRegistrations.filter(r => r.registration_type === 'ground_registration').length },
  ].filter(item => item.count > 0);

  return (
    <div className="space-y-6">
      {/* Date Range Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription>Filter analytics by attendance date (matches the Attendance page)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Select</label>
              <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={(date) => handleCustomDateChange('start', date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={(date) => handleCustomDateChange('end', date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="comparison-mode" checked={showComparison} onCheckedChange={setShowComparison} />
              <Label htmlFor="comparison-mode">Compare periods</Label>
            </div>

            {(startDate || endDate) && (
              <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>

          {(startDate || endDate) && (
            <div className="mt-3 space-y-1">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Current:</span> {filteredRegistrations.length} registrations booked for this period
                {startDate && endDate && ` (${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")})`}
              </div>
              {canShowComparison && previousPeriod.start && previousPeriod.end && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Previous:</span> {previousRegistrations.length} registrations booked for the previous period
                  {` (${format(previousPeriod.start, "MMM d")} - ${format(previousPeriod.end, "MMM d, yyyy")})`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {currentMetrics.totalRevenue.toLocaleString()}</div>
            {canShowComparison && <ChangeIndicator current={currentMetrics.totalRevenue} previous={previousMetrics.totalRevenue} />}
            <p className="text-xs text-muted-foreground mt-1">
              Avg: KES {Math.round(currentMetrics.averagePerRegistration).toLocaleString()} per registration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.totalRegistrations}</div>
            {canShowComparison && <ChangeIndicator current={currentMetrics.totalRegistrations} previous={previousMetrics.totalRegistrations} />}
            <p className="text-xs text-muted-foreground mt-1">{currentExpectedChildren} children expected (attendance)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">KES {currentMetrics.paidRevenue.toLocaleString()}</div>
            {canShowComparison && <ChangeIndicator current={currentMetrics.paidRevenue} previous={previousMetrics.paidRevenue} />}
            <p className="text-xs text-muted-foreground mt-1">
              {currentMetrics.totalRevenue > 0 ? `${Math.round((currentMetrics.paidRevenue / currentMetrics.totalRevenue) * 100)}% of total` : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <CalendarIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">KES {currentMetrics.unpaidRevenue.toLocaleString()}</div>
            {canShowComparison && <ChangeIndicator current={currentMetrics.unpaidRevenue} previous={previousMetrics.unpaidRevenue} />}
            <p className="text-xs text-muted-foreground mt-1">
              Unpaid + Partial: KES {(currentMetrics.unpaidRevenue + currentMetrics.partialRevenue).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quote vs Invoice KPIs */}
      {(() => {
        const quote = filteredRegistrations.filter(r => (r.billing_doc_type || (r.payment_status === 'paid' ? 'paid' : 'quotation')) === 'quotation');
        const invoice = filteredRegistrations.filter(r => r.billing_doc_type === 'invoice');
        const paidRegs = filteredRegistrations.filter(r => r.payment_status === 'paid');
        const sum = (arr: CampRegistration[]) => arr.reduce((s, r) => s + (r.total_amount || 0), 0);
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-muted-foreground/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quotations Outstanding</CardTitle>
                <CardDescription className="text-xs">Registered, not paid, not attended — prospective no-shows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quote.length}</div>
                <p className="text-xs text-muted-foreground mt-1">KES {sum(quote).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Invoices Outstanding</CardTitle>
                <CardDescription className="text-xs">Attended but unpaid — real receivables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-700">{invoice.length}</div>
                <p className="text-xs text-muted-foreground mt-1">KES {sum(invoice).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Paid Registrations</CardTitle>
                <CardDescription className="text-xs">Fully collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{paidRegs.length}</div>
                <p className="text-xs text-muted-foreground mt-1">KES {sum(paidRegs).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Comparison Summary Card */}
      {canShowComparison && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Period Comparison Summary</CardTitle>
            <CardDescription>
              {startDate && format(startDate, "MMM d")} - {endDate && format(endDate, "MMM d, yyyy")} vs{' '}
              {previousPeriod.start && format(previousPeriod.start, "MMM d")} - {previousPeriod.end && format(previousPeriod.end, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Revenue Change</div>
                <div className={cn("text-xl font-bold", getPercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue) >= 0 ? "text-green-600" : "text-red-600")}>
                  {getPercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue) >= 0 ? '+' : ''}
                  {getPercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue).toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Registration Change</div>
                <div className={cn("text-xl font-bold", getPercentageChange(currentMetrics.totalRegistrations, previousMetrics.totalRegistrations) >= 0 ? "text-green-600" : "text-red-600")}>
                  {getPercentageChange(currentMetrics.totalRegistrations, previousMetrics.totalRegistrations) >= 0 ? '+' : ''}
                  {getPercentageChange(currentMetrics.totalRegistrations, previousMetrics.totalRegistrations).toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Children Change</div>
                <div className={cn("text-xl font-bold", getPercentageChange(currentExpectedChildren, previousExpectedChildren) >= 0 ? "text-green-600" : "text-red-600")}>
                  {getPercentageChange(currentExpectedChildren, previousExpectedChildren) >= 0 ? '+' : ''}
                  {getPercentageChange(currentExpectedChildren, previousExpectedChildren).toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-background rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Avg. Booking Value</div>
                <div className={cn("text-xl font-bold", getPercentageChange(currentMetrics.averagePerRegistration, previousMetrics.averagePerRegistration) >= 0 ? "text-green-600" : "text-red-600")}>
                  {getPercentageChange(currentMetrics.averagePerRegistration, previousMetrics.averagePerRegistration) >= 0 ? '+' : ''}
                  {getPercentageChange(currentMetrics.averagePerRegistration, previousMetrics.averagePerRegistration).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Camp Type</CardTitle>
            <CardDescription>{canShowComparison ? 'Current vs Previous period' : 'Total revenue per camp type'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="current" fill="#22c55e" name="Current Period (KES)" />
                {canShowComparison && <Bar dataKey="previous" fill="#94a3b8" name="Previous Period (KES)" />}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status Distribution</CardTitle>
            <CardDescription>Revenue breakdown by payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value, count }) => `${name}: KES ${value.toLocaleString()} (${count})`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {paymentStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => `KES ${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrations by Camp Type</CardTitle>
            <CardDescription>Number of registrations per camp</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Registrations" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Children Age Distribution</CardTitle>
            <CardDescription>Number of children by age range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Children" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Type Breakdown</CardTitle>
          <CardDescription>Distribution of online vs ground registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={registrationTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, count }) => `${name}: ${count}`} outerRadius={100} fill="#8884d8" dataKey="count">
                {registrationTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};