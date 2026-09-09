import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, MousePointerClick, Users, TrendingUp, ArrowUpDown, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import {
  getPageAnalytics,
  getUserAnalytics,
  getCTRTrend,
  getSummaryStats,
  PageAnalytics,
  UserAnalytics,
  CTRTrend
} from '@/services/siteAnalyticsService';

type SortField = 'views' | 'clicks' | 'ctr' | 'unique_visitors' | 'total_views' | 'total_clicks' | 'pages_visited';
type SortDirection = 'asc' | 'desc';

const SiteAnalyticsTab: React.FC = () => {
  const [pageAnalytics, setPageAnalytics] = useState<PageAnalytics[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([]);
  const [ctrTrend, setCTRTrend] = useState<CTRTrend[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    totalClicks: 0,
    overallCTR: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(dateRange));

    const [pages, users, trend, summary] = await Promise.all([
      getPageAnalytics(startDate, endDate),
      getUserAnalytics(startDate, endDate),
      getCTRTrend(startDate, endDate, parseInt(dateRange) > 30 ? 'weekly' : 'daily'),
      getSummaryStats(startDate, endDate)
    ]);

    setPageAnalytics(pages);
    setUserAnalytics(users);
    setCTRTrend(trend);
    setSummaryStats(summary);
    setLoading(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredPages = useMemo(() => {
    let filtered = pageAnalytics.filter(p =>
      p.page_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.page_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortField as keyof PageAnalytics] as number || 0;
      const bVal = b[sortField as keyof PageAnalytics] as number || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [pageAnalytics, searchTerm, sortField, sortDirection]);

  const filteredUsers = useMemo(() => {
    let filtered = userAnalytics.filter(u =>
      u.visitor_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortField as keyof UserAnalytics] as number || 0;
      const bVal = b[sortField as keyof UserAnalytics] as number || 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [userAnalytics, searchTerm, sortField, sortDirection]);

  const getEngagementBadge = (ctr: number) => {
    if (ctr >= 10) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (ctr >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Site Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track page views and click-through rates across your website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{summaryStats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold">{summaryStats.uniqueVisitors.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <MousePointerClick className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{summaryStats.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall CTR</p>
                <p className="text-2xl font-bold">{summaryStats.overallCTR}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTR Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CTR Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {ctrTrend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctrTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    className="text-muted-foreground"
                  />
                  <YAxis yAxisId="left" className="text-muted-foreground" />
                  <YAxis yAxisId="right" orientation="right" unit="%" className="text-muted-foreground" />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="Views" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="hsl(var(--secondary))" name="Clicks" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="hsl(var(--accent))" name="CTR %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tables */}
      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">By Page</TabsTrigger>
          <TabsTrigger value="users">By Visitor</TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <TabsContent value="pages">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <SortHeader field="views" label="Views" />
                    <SortHeader field="unique_visitors" label="Unique Visitors" />
                    <SortHeader field="clicks" label="Clicks" />
                    <SortHeader field="ctr" label="CTR" />
                    <TableHead>Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No page data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPages.map((page) => (
                      <TableRow key={page.page_path}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{page.page_title}</p>
                            <p className="text-xs text-muted-foreground">{page.page_path}</p>
                          </div>
                        </TableCell>
                        <TableCell>{page.views.toLocaleString()}</TableCell>
                        <TableCell>{page.unique_visitors.toLocaleString()}</TableCell>
                        <TableCell>{page.clicks.toLocaleString()}</TableCell>
                        <TableCell>{page.ctr}%</TableCell>
                        <TableCell>{getEngagementBadge(page.ctr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor ID</TableHead>
                    <SortHeader field="total_views" label="Page Views" />
                    <SortHeader field="total_clicks" label="Clicks" />
                    <SortHeader field="pages_visited" label="Pages Visited" />
                    <SortHeader field="ctr" label="CTR" />
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Engagement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No visitor data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.visitor_id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {user.visitor_id.slice(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell>{user.total_views.toLocaleString()}</TableCell>
                        <TableCell>{user.total_clicks.toLocaleString()}</TableCell>
                        <TableCell>{user.pages_visited}</TableCell>
                        <TableCell>{user.ctr}%</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.last_visit), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{getEngagementBadge(user.ctr)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteAnalyticsTab;
