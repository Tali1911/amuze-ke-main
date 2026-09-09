
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Filter, Download, Eye, Calendar, User, Activity } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const AuditManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-01-24 14:30:15',
      user: 'admin@company.com',
      action: 'LOGIN',
      entityType: 'admin_user',
      entityId: 'user-123',
      details: 'Successful login from dashboard',
      ipAddress: '192.168.1.100',
      severity: 'low'
    },
    {
      id: '2',
      timestamp: '2024-01-24 14:25:42',
      user: 'hr@company.com',
      action: 'CREATE',
      entityType: 'employee',
      entityId: 'emp-456',
      details: 'Created new employee record: John Smith',
      ipAddress: '192.168.1.101',
      severity: 'medium'
    },
    {
      id: '3',
      timestamp: '2024-01-24 14:20:33',
      user: 'marketing@company.com',
      action: 'UPDATE',
      entityType: 'customer',
      entityId: 'cust-789',
      details: 'Updated customer contact information',
      ipAddress: '192.168.1.102',
      severity: 'low'
    },
    {
      id: '4',
      timestamp: '2024-01-24 14:15:18',
      user: 'admin@company.com',
      action: 'DELETE',
      entityType: 'program',
      entityId: 'prog-321',
      details: 'Deleted archived program: Winter Camp 2023',
      ipAddress: '192.168.1.100',
      severity: 'high'
    },
    {
      id: '5',
      timestamp: '2024-01-24 14:10:07',
      user: 'accounts@company.com',
      action: 'EXPORT',
      entityType: 'financial_data',
      entityId: 'report-654',
      details: 'Exported quarterly financial report',
      ipAddress: '192.168.1.103',
      severity: 'medium'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-500';
      case 'UPDATE': return 'bg-blue-500';
      case 'DELETE': return 'bg-red-500';
      case 'LOGIN': return 'bg-gray-500';
      case 'EXPORT': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = userFilter === 'all' || log.user === userFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Audit Management</h2>
          <p className="text-gray-600">Monitor system activity and maintain audit trails</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Audit Logs
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="reports">Audit Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Audit Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">
                  Unique users today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">12</div>
                <p className="text-xs text-muted-foreground">
                  Events requiring review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <p className="text-xs text-muted-foreground">
                  Last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Search and filter system audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit logs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin@company.com">Admin User</SelectItem>
                    <SelectItem value="hr@company.com">HR User</SelectItem>
                    <SelectItem value="marketing@company.com">Marketing User</SelectItem>
                    <SelectItem value="accounts@company.com">Accounts User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="DELETE">Delete</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audit Log Entries */}
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${getActionColor(log.action)} text-white`}>
                            {log.action}
                          </Badge>
                          <Badge className={`${getSeverityColor(log.severity)} text-white`}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{log.details}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">User:</span> {log.user}
                            </div>
                            <div>
                              <span className="font-medium">Entity:</span> {log.entityType}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {log.entityId}
                            </div>
                            <div>
                              <span className="font-medium">IP:</span> {log.ipAddress}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Analytics</CardTitle>
              <CardDescription>Visual analysis of system activity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Activity by User</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>admin@company.com</span>
                      <Badge variant="outline">847 actions</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>hr@company.com</span>
                      <Badge variant="outline">623 actions</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>marketing@company.com</span>
                      <Badge variant="outline">445 actions</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Activity by Action Type</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>View/Read</span>
                      <Badge variant="outline">1,245 events</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Update</span>
                      <Badge variant="outline">623 events</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Create</span>
                      <Badge variant="outline">234 events</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Monitor suspicious activities and security events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No Active Security Alerts</h3>
                <p>All system activities are within normal parameters.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Reports</CardTitle>
              <CardDescription>Generate and download compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Available Reports</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Monthly Audit Summary</h5>
                        <p className="text-sm text-muted-foreground">Comprehensive activity summary</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">User Activity Report</h5>
                        <p className="text-sm text-muted-foreground">Individual user actions</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Security Events Log</h5>
                        <p className="text-sm text-muted-foreground">Security-related activities</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Report Templates</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Compliance Audit</h5>
                      <p className="text-sm text-muted-foreground">GDPR compliance activities</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Access Review</h5>
                      <p className="text-sm text-muted-foreground">User access patterns</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Change Management</h5>
                      <p className="text-sm text-muted-foreground">System changes tracking</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditManagement;
