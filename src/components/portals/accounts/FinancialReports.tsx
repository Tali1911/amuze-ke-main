import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, PieChart, BarChart3, Calendar as CalendarIcon, FileText, Clock, Activity, Filter, X, ClipboardList } from 'lucide-react';
import { CampRegistrationsManager } from '../admin/CampRegistrationsManager';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from '@/services/financialReportService';
import { ACTIVITY_CATEGORIES } from '@/lib/activityCategories';
import { useActivityCategories } from '@/hooks/useActivityCategories';
import ProfitLossStatement from './reports/ProfitLossStatement';
import ARAgingReport from './reports/ARAgingReport';
import DailySalesSummary from './reports/DailySalesSummary';
import ActivityProfitLoss from './reports/ActivityProfitLoss';
import RevenueReport from './reports/RevenueReport';
import ExpenseReport from './reports/ExpenseReport';
import { cn } from '@/lib/utils';

const FinancialReports: React.FC = () => {
  // Subscribe to live activity-category updates so the dropdown stays in sync
  // with the admin-managed config in `content_items`.
  useActivityCategories();

  const DATE_KEY = 'financialReports.dateRange';
  const ACTIVITIES_KEY = 'financialReports.selectedActivities';

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (typeof window === 'undefined') {
      return { startDate: subDays(new Date(), 30), endDate: new Date() };
    }
    try {
      const raw = localStorage.getItem(DATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const start = new Date(parsed.startDate);
        const end = new Date(parsed.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          return { startDate: start, endDate: end };
        }
      }
    } catch {
      // ignore corrupt storage
    }
    return { startDate: subDays(new Date(), 30), endDate: new Date() };
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isActivityFilterOpen, setIsActivityFilterOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(ACTIVITIES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        DATE_KEY,
        JSON.stringify({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }, [dateRange]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(selectedActivities));
    } catch {
      // ignore
    }
  }, [selectedActivities]);

  const presetRanges = [
    { label: 'Today', value: () => ({ startDate: startOfDay(new Date()), endDate: endOfDay(new Date()) }) },
    { label: 'Yesterday', value: () => ({ startDate: startOfDay(subDays(new Date(), 1)), endDate: endOfDay(subDays(new Date(), 1)) }) },
    { label: 'Last 7 days', value: () => ({ startDate: startOfDay(subDays(new Date(), 7)), endDate: endOfDay(new Date()) }) },
    { label: 'Last 30 days', value: () => ({ startDate: startOfDay(subDays(new Date(), 30)), endDate: endOfDay(new Date()) }) },
    { label: 'Last 90 days', value: () => ({ startDate: startOfDay(subDays(new Date(), 90)), endDate: endOfDay(new Date()) }) },
    { label: 'This month', value: () => ({ startDate: startOfMonth(new Date()), endDate: endOfDay(new Date()) }) },
    { label: 'Last month', value: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfDay(endOfMonth(subMonths(new Date(), 1))) }) },
    { label: 'Last 6 months', value: () => ({ startDate: startOfDay(subMonths(new Date(), 6)), endDate: endOfDay(new Date()) }) },
    { label: 'Year to date', value: () => ({ startDate: new Date(new Date().getFullYear(), 0, 1), endDate: endOfDay(new Date()) }) },
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    setDateRange(preset.value());
    setIsCalendarOpen(false);
  };

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const clearActivities = () => setSelectedActivities([]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Financial Reports</h2>
          <p className="text-sm text-muted-foreground">Financial analysis and reporting</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Activity Filter */}
          <Popover open={isActivityFilterOpen} onOpenChange={setIsActivityFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal">
                <Filter className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {selectedActivities.length === 0
                    ? 'All Activities'
                    : `${selectedActivities.length} selected`}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Filter by Activity</p>
                  {selectedActivities.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearActivities} className="h-auto p-1 text-xs text-muted-foreground">
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {[...ACTIVITY_CATEGORIES].map((activity) => (
                    <label key={activity} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded p-1">
                      <Checkbox
                        checked={selectedActivities.includes(activity)}
                        onCheckedChange={() => toggleActivity(activity)}
                      />
                      <span className="text-foreground">{activity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Range Picker */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto sm:min-w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {format(dateRange.startDate, 'dd MMM')} - {format(dateRange.endDate, 'dd MMM yyyy')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <div className="border-b sm:border-b-0 sm:border-r border-border p-3 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Quick Select</p>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                    {presetRanges.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => handlePresetClick(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.startDate, to: dateRange.endDate }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ startDate: startOfDay(range.from), endDate: endOfDay(range.to) });
                      } else if (range?.from) {
                        setDateRange({ startDate: startOfDay(range.from), endDate: endOfDay(range.from) });
                      }
                    }}
                    numberOfMonths={1}
                    className={cn("rounded-md pointer-events-auto")}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filter badges */}
      {selectedActivities.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Filtering:</span>
          {selectedActivities.map(a => (
            <Badge key={a} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleActivity(a)}>
              {a} <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="profit-loss" className="space-y-4">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="profit-loss" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="activity-pl" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Activity P&L</span>
          </TabsTrigger>
          <TabsTrigger value="ar-aging" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">AR Aging</span>
          </TabsTrigger>
          <TabsTrigger value="daily-sales" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center justify-center gap-1 px-1 sm:px-3">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline text-xs sm:text-sm">Attendance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <ProfitLossStatement dateRange={dateRange} activities={selectedActivities} />
        </TabsContent>

        <TabsContent value="activity-pl">
          <ActivityProfitLoss dateRange={dateRange} activities={selectedActivities} />
        </TabsContent>

        <TabsContent value="ar-aging">
          <ARAgingReport activities={selectedActivities} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="daily-sales">
          <DailySalesSummary dateRange={dateRange} activities={selectedActivities} />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueReport dateRange={dateRange} activities={selectedActivities} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseReport dateRange={dateRange} activities={selectedActivities} />
        </TabsContent>

        <TabsContent value="attendance">
          <CampRegistrationsManager visibleTabs={['daily', 'attendance', 'history']} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
