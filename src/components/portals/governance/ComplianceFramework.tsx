
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Download, FileText, UserCheck, AlertTriangle, CheckCircle } from "lucide-react";

interface DataRequest {
  id: string;
  type: 'export' | 'deletion' | 'rectification';
  requestor: string;
  email: string;
  status: 'pending' | 'processing' | 'completed';
  submitted: string;
  deadline: string;
}

const ComplianceFramework: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('gdpr');

  const dataRequests: DataRequest[] = [
    {
      id: '1',
      type: 'export',
      requestor: 'John Smith',
      email: 'john.smith@email.com',
      status: 'pending',
      submitted: '2024-01-15',
      deadline: '2024-02-14'
    },
    {
      id: '2',
      type: 'deletion',
      requestor: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      status: 'processing',
      submitted: '2024-01-10',
      deadline: '2024-02-09'
    },
    {
      id: '3',
      type: 'rectification',
      requestor: 'Mike Brown',
      email: 'mike.brown@email.com',
      status: 'completed',
      submitted: '2024-01-05',
      deadline: '2024-02-04'
    }
  ];

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'export': return 'bg-blue-500';
      case 'deletion': return 'bg-red-500';
      case 'rectification': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Compliance Framework</h2>
        <p className="text-gray-600">Manage GDPR compliance and data protection requirements</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gdpr">GDPR Dashboard</TabsTrigger>
          <TabsTrigger value="data-requests">Data Requests</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="reporting">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="gdpr" className="space-y-6">
          {/* GDPR Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  GDPR compliance rating
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Consents</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">
                  Valid user consents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Data subject requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* GDPR Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>GDPR Compliance Checklist</CardTitle>
              <CardDescription>Current status of GDPR requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Privacy Policy Updated</h4>
                      <p className="text-sm text-muted-foreground">GDPR-compliant privacy policy in place</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">Complete</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Data Processing Records</h4>
                      <p className="text-sm text-muted-foreground">Article 30 records maintained</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">Complete</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <h4 className="font-medium">Data Protection Impact Assessment</h4>
                      <p className="text-sm text-muted-foreground">DPIA required for new processing activities</p>
                    </div>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Breach Notification Procedures</h4>
                      <p className="text-sm text-muted-foreground">72-hour notification process established</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">Complete</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Requests</CardTitle>
              <CardDescription>Manage data export, deletion, and rectification requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col space-y-1">
                        <Badge className={`${getRequestTypeColor(request.type)} text-white w-fit`}>
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{request.requestor}</h4>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {request.submitted} • Deadline: {request.deadline}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(request.status)} text-white`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Requests
                </Button>
                <Button>
                  Create New Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consent Management</CardTitle>
              <CardDescription>Track and manage user consent for data processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Consent Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Marketing Communications</span>
                      <Badge variant="default" className="bg-green-500">847 consents</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Data Analytics</span>
                      <Badge variant="default" className="bg-green-500">1,203 consents</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded">
                      <span>Third-party Sharing</span>
                      <Badge variant="default" className="bg-blue-500">423 consents</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Consent Changes</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <p className="font-medium">Marketing consent withdrawn</p>
                      <p className="text-sm text-muted-foreground">user@example.com • 2 hours ago</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Analytics consent granted</p>
                      <p className="text-sm text-muted-foreground">newuser@example.com • 4 hours ago</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Consent preferences updated</p>
                      <p className="text-sm text-muted-foreground">regular@example.com • 1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reporting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and view compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Available Reports</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">GDPR Compliance Report</h5>
                        <p className="text-sm text-muted-foreground">Monthly compliance status</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Data Processing Activities</h5>
                        <p className="text-sm text-muted-foreground">Article 30 records</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Consent Audit Trail</h5>
                        <p className="text-sm text-muted-foreground">User consent history</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Report Schedule</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <p className="font-medium">Weekly Data Request Summary</p>
                      <p className="text-sm text-muted-foreground">Next: Monday 9:00 AM</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Monthly Compliance Review</p>
                      <p className="text-sm text-muted-foreground">Next: 1st of next month</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Quarterly Risk Assessment</p>
                      <p className="text-sm text-muted-foreground">Next: April 1st</p>
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

export default ComplianceFramework;
