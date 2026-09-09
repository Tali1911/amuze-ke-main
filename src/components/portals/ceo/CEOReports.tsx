
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, Users, DollarSign, Target } from "lucide-react";

const CEOReports = () => {
  const reports = [
    {
      id: 1,
      title: "Q1 2024 Financial Summary",
      department: "Finance",
      type: "Financial",
      date: "2024-01-25",
      status: "completed",
      description: "Comprehensive financial performance analysis for Q1 2024",
      keyMetrics: ["Revenue: $342K", "Profit: $89K", "Growth: +18.2%"]
    },
    {
      id: 2,
      title: "Marketing Performance Report",
      department: "Marketing",
      type: "Performance",
      date: "2024-01-24",
      status: "completed",
      description: "Customer acquisition and campaign effectiveness analysis",
      keyMetrics: ["New Customers: 1,247", "CAC: $45", "LTV: $890"]
    },
    {
      id: 3,
      title: "HR Analytics Dashboard",
      department: "HR",
      type: "Analytics",
      date: "2024-01-23",
      status: "completed",
      description: "Employee satisfaction, retention, and performance metrics",
      keyMetrics: ["Satisfaction: 4.7/5", "Turnover: 8.2%", "Performance: 94%"]
    },
    {
      id: 4,
      title: "Operations Efficiency Report",
      department: "Operations",
      type: "Operational",
      date: "2024-01-22",
      status: "in-progress",
      description: "Program delivery efficiency and resource utilization analysis",
      keyMetrics: ["Utilization: 78%", "Quality: 4.8/5", "Incidents: 2"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Reports</h2>
          <p className="text-gray-600">Comprehensive department and performance reports</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Custom Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Growth</p>
                <p className="text-2xl font-bold">+18.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">$342K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Performance</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>
            Download or view detailed departmental reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{report.title}</h4>
                      <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mb-3">
                      <span>{report.department}</span>
                      <span>{report.type}</span>
                      <span>{report.date}</span>
                    </div>
                    <div className="flex gap-4">
                      {report.keyMetrics.map((metric, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                    {report.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>Revenue, profit, and financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Monthly P&L Statement</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Cash Flow Analysis</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Budget vs Actual</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Reports</CardTitle>
            <CardDescription>Performance, efficiency, and operational metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Department Performance</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Customer Satisfaction</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <span className="text-sm">Resource Utilization</span>
                <Button variant="outline" size="sm">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CEOReports;
