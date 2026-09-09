
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsMetric, Report, analyticsService } from '@/services/analyticsService';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, Users, DollarSign, Target, Download, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [crossDepartmentalData, setCrossDepartmentalData] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
    customers: {
      label: "Customers",
      color: "hsl(var(--chart-2))",
    },
    employees: {
      label: "Employees",
      color: "hsl(var(--chart-3))",
    },
    performance: {
      label: "Performance",
      color: "hsl(var(--chart-4))",
    },
  };

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));

      const [metricsData, crossData, reportsData] = await Promise.all([
        analyticsService.getMetrics(undefined, {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }),
        analyticsService.getCrossDepartmentalSummary(),
        analyticsService.getReports()
      ]);

      setMetrics(metricsData);
      setCrossDepartmentalData(crossData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedPeriod));

      await analyticsService.generateReport({
        title: `Cross-Departmental Analytics Report`,
        description: `Analytics report for the last ${selectedPeriod} days`,
        type: 'cross_departmental',
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        departments: ['ACCOUNTS', 'HR', 'MARKETING', 'OPERATIONS'],
        generatedBy: user!.id
      });

      toast({
        title: "Success",
        description: "Report generated successfully",
      });

      loadAnalyticsData();
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  const prepareChartData = () => {
    const departmentData = ['ACCOUNTS', 'HR', 'MARKETING', 'OPERATIONS'].map(dept => {
      const deptMetrics = metrics.filter(m => m.department === dept);
      const revenue = deptMetrics.filter(m => m.metric_type === 'revenue').reduce((sum, m) => sum + m.metric_value, 0);
      const customers = deptMetrics.filter(m => m.metric_type === 'customers').reduce((sum, m) => sum + m.metric_value, 0);
      const employees = deptMetrics.filter(m => m.metric_type === 'employees').reduce((sum, m) => sum + m.metric_value, 0);
      const performance = deptMetrics.filter(m => m.metric_type === 'performance').reduce((sum, m) => sum + m.metric_value, 0);

      return {
        department: dept,
        revenue,
        customers,
        employees,
        performance: performance || 85 // Default performance score
      };
    });

    return departmentData;
  };

  const chartData = prepareChartData();

  const pieData = [
    { name: 'Revenue', value: crossDepartmentalData?.revenue?.total || 0, color: '#8884d8' },
    { name: 'Customers', value: crossDepartmentalData?.customers?.total || 0, color: '#82ca9d' },
    { name: 'Employees', value: crossDepartmentalData?.employees?.total || 0, color: '#ffc658' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Cross-departmental analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${crossDepartmentalData?.revenue?.total?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={crossDepartmentalData?.revenue?.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {crossDepartmentalData?.revenue?.trend > 0 ? '+' : ''}{crossDepartmentalData?.revenue?.trend?.toFixed(1) || 0}%
              </span> from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crossDepartmentalData?.customers?.total?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={crossDepartmentalData?.customers?.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {crossDepartmentalData?.customers?.trend > 0 ? '+' : ''}{crossDepartmentalData?.customers?.trend?.toFixed(1) || 0}%
              </span> from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crossDepartmentalData?.employees?.total || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={crossDepartmentalData?.employees?.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {crossDepartmentalData?.employees?.trend > 0 ? '+' : ''}{crossDepartmentalData?.employees?.trend?.toFixed(1) || 0}%
              </span> from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crossDepartmentalData?.performance?.average?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              System health: {crossDepartmentalData?.performance?.systemHealth || 98.5}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Performance metrics across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="performance" fill="var(--color-performance)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Revenue breakdown by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartData.map((dept) => (
              <Card key={dept.department}>
                <CardHeader>
                  <CardTitle>{dept.department}</CardTitle>
                  <CardDescription>Department overview and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold">${dept.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <p className="text-2xl font-bold">{dept.performance}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Customers</p>
                      <p className="text-2xl font-bold">{dept.customers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="text-2xl font-bold">{dept.employees}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Historical reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{report.report_type}</Badge>
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        {report.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports generated yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
