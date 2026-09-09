
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";

const GovernanceDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Governance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <p className="text-xs text-muted-foreground">
              Overall compliance rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Published and active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <p className="text-xs text-muted-foreground">
              Requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Compliance Activities</CardTitle>
            <CardDescription>Latest governance and compliance updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium">GDPR Audit Completed</p>
                  <p className="text-sm text-muted-foreground">Data protection compliance verified</p>
                </div>
                <Badge variant="default">Complete</Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <FileText className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Privacy Policy Updated</p>
                  <p className="text-sm text-muted-foreground">Version 3.2 published and distributed</p>
                </div>
                <Badge variant="outline">Published</Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium">Risk Assessment Due</p>
                  <p className="text-sm text-muted-foreground">Quarterly risk review required</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Current compliance framework status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <h4 className="font-medium">GDPR Compliance</h4>
                  <p className="text-sm text-muted-foreground">Data protection regulation</p>
                </div>
                <Badge variant="default" className="bg-green-500">Compliant</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <h4 className="font-medium">Document Retention</h4>
                  <p className="text-sm text-muted-foreground">Record keeping policies</p>
                </div>
                <Badge variant="default" className="bg-green-500">Compliant</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <h4 className="font-medium">Access Controls</h4>
                  <p className="text-sm text-muted-foreground">User permission management</p>
                </div>
                <Badge variant="secondary">Review Required</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GovernanceDashboard;
