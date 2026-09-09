import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, Target, BarChart3, Calendar, CheckCircle, XCircle, Clock, Building } from "lucide-react";
import CEOAnalytics from './ceo/CEOAnalytics';
import CEOReports from './ceo/CEOReports';
import CEOPlanning from './ceo/CEOPlanning';
import CEOApprovals from './ceo/CEOApprovals';
import CEOSettings from './ceo/CEOSettings';
import MessageCenter from '../communication/MessageCenter';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import ProfileEditor from '../profile/ProfileEditor';

interface CEODashboardProps {
  activeTab: string;
}

const CEODashboard = ({ activeTab }: CEODashboardProps) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <CEOAnalytics />;
      case 'reports':
        return <CEOReports />;
      case 'planning':
        return <CEOPlanning />;
      case 'approvals':
        return <CEOApprovals />;
      case 'settings':
        return <CEOSettings />;
      case 'communication':
        return <MessageCenter />;
      case 'cross-analytics':
        return <AnalyticsDashboard />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return <CEODashboardMain />;
    }
  };

  return renderContent();
};

const CEODashboardMain = () => {
  const pendingApprovals = [
    { id: 1, type: 'Budget Request', department: 'Marketing', amount: '$15,000', requester: 'Sarah Johnson', date: '2024-01-20', priority: 'High' },
    { id: 2, type: 'New Hire', department: 'HR', position: 'Senior Coach', requester: 'Emily Brown', date: '2024-01-19', priority: 'Medium' },
    { id: 3, type: 'Equipment Purchase', department: 'Operations', amount: '$8,500', requester: 'Mike Chen', date: '2024-01-18', priority: 'Low' },
  ];

  const departmentMetrics = [
    { department: 'Marketing', revenue: 125000, growth: 15.2, performance: 94, status: 'excellent' },
    { department: 'HR', efficiency: 87, satisfaction: 4.6, turnover: 8.2, status: 'good' },
    { department: 'Accounts', profit: 89000, margins: 34.2, collections: 96.8, status: 'excellent' },
    { department: 'Operations', utilization: 78, quality: 4.8, incidents: 2, status: 'good' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Company overview and key performance indicators</p>
        </div>
        <Badge variant="outline" className="text-sm sm:text-base px-3 py-1 w-fit">
          Q1 2024
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              +180 new this month
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '88%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals & Department Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>
                  Items requiring your immediate attention
                </CardDescription>
              </div>
              <Badge variant="destructive">{pendingApprovals.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{approval.type}</h4>
                      <p className="text-sm text-muted-foreground">{approval.department} • {approval.requester}</p>
                      {approval.amount && (
                        <p className="text-sm font-medium text-green-600">{approval.amount}</p>
                      )}
                      {approval.position && (
                        <p className="text-sm font-medium text-blue-600">{approval.position}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{approval.date}</p>
                    </div>
                    <div className="flex gap-2 flex-col items-end">
                      <Badge variant={approval.priority === 'High' ? 'destructive' : approval.priority === 'Medium' ? 'default' : 'secondary'}>
                        {approval.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                    <Button variant="ghost" size="sm">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Department Performance
            </CardTitle>
            <CardDescription>
              Real-time performance metrics across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentMetrics.map((dept, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{dept.department}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {dept.revenue && <p>Revenue: ${dept.revenue.toLocaleString()}</p>}
                        {dept.efficiency && <p>Efficiency: {dept.efficiency}%</p>}
                        {dept.profit && <p>Profit: ${dept.profit.toLocaleString()}</p>}
                        {dept.utilization && <p>Utilization: {dept.utilization}%</p>}
                      </div>
                    </div>
                    <Badge variant={dept.status === 'excellent' ? "default" : "secondary"}>
                      {dept.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Latest updates from all departments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Q1 Budget Review Completed</p>
                  <p className="text-xs text-muted-foreground">Finance Team • 2 hours ago</p>
                </div>
                <Button variant="outline" size="sm">View Report</Button>
              </div>
            </div>
            <div className="border-l-2 border-green-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">New customer acquisition milestone reached</p>
                  <p className="text-xs text-muted-foreground">Marketing • 4 hours ago</p>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </div>
            <div className="border-l-2 border-purple-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">5 new team members successfully onboarded</p>
                  <p className="text-xs text-muted-foreground">HR • 1 day ago</p>
                </div>
                <Button variant="outline" size="sm">View Profiles</Button>
              </div>
            </div>
            <div className="border-l-2 border-orange-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Summer program enrollment capacity reached</p>
                  <p className="text-xs text-muted-foreground">Operations • 2 days ago</p>
                </div>
                <Button variant="outline" size="sm">View Programs</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEODashboard;
