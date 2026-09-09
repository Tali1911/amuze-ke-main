
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, TrendingUp, FileText, Plus, Eye } from "lucide-react";

interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  status: 'open' | 'mitigating' | 'closed';
  owner: string;
  createdDate: string;
  lastReview: string;
}

const RiskManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('risks');

  const risks: Risk[] = [
    {
      id: '1',
      title: 'Data Breach Risk',
      description: 'Potential unauthorized access to customer data',
      category: 'Security',
      severity: 'high',
      probability: 'medium',
      status: 'mitigating',
      owner: 'IT Security Team',
      createdDate: '2024-01-15',
      lastReview: '2024-01-20'
    },
    {
      id: '2',
      title: 'Staff Turnover Risk',
      description: 'High turnover affecting program quality',
      category: 'Operational',
      severity: 'medium',
      probability: 'high',
      status: 'open',
      owner: 'HR Team',
      createdDate: '2024-01-10',
      lastReview: '2024-01-18'
    },
    {
      id: '3',
      title: 'Compliance Violation',
      description: 'Risk of GDPR compliance violations',
      category: 'Compliance',
      severity: 'high',
      probability: 'low',
      status: 'mitigating',
      owner: 'Legal Team',
      createdDate: '2024-01-08',
      lastReview: '2024-01-22'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-green-500';
      case 'mitigating': return 'bg-yellow-500';
      case 'open': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskScore = (severity: string, probability: string) => {
    const severityScore = { low: 1, medium: 2, high: 3, critical: 4 };
    const probabilityScore = { low: 1, medium: 2, high: 3 };
    return severityScore[severity as keyof typeof severityScore] * probabilityScore[probability as keyof typeof probabilityScore];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Risk Management</h2>
          <p className="text-gray-600">Identify, assess, and mitigate organizational risks</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Risk
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="risks">Risk Register</TabsTrigger>
          <TabsTrigger value="assessment">Risk Assessment</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="reports">Risk Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="space-y-6">
          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Active risks identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
                <p className="text-xs text-muted-foreground">
                  Requiring immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">7</div>
                <p className="text-xs text-muted-foreground">
                  Risks being mitigated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">2</div>
                <p className="text-xs text-muted-foreground">
                  Reviews past due
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Register */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>Current organizational risks and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {risks.map((risk) => (
                  <div key={risk.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{risk.title}</h4>
                          <Badge className={`${getSeverityColor(risk.severity)} text-white`}>
                            {risk.severity.toUpperCase()}
                          </Badge>
                          <Badge className={`${getStatusColor(risk.status)} text-white`}>
                            {risk.status.charAt(0).toUpperCase() + risk.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">
                            Score: {getRiskScore(risk.severity, risk.probability)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Category: {risk.category}</span>
                          <span>Owner: {risk.owner}</span>
                          <span>Last Review: {risk.lastReview}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Matrix</CardTitle>
              <CardDescription>Visual representation of risk severity and probability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="text-center font-medium">Probability</div>
                <div className="text-center text-sm text-muted-foreground">Low</div>
                <div className="text-center text-sm text-muted-foreground">Medium</div>
                <div className="text-center text-sm text-muted-foreground">High</div>
                
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className="h-12 bg-yellow-200 border rounded flex items-center justify-center text-xs">4</div>
                <div className="h-12 bg-red-300 border rounded flex items-center justify-center text-xs">8</div>
                <div className="h-12 bg-red-500 border rounded flex items-center justify-center text-xs">12</div>
                
                <div className="text-sm text-muted-foreground">High</div>
                <div className="h-12 bg-green-200 border rounded flex items-center justify-center text-xs">3</div>
                <div className="h-12 bg-yellow-300 border rounded flex items-center justify-center text-xs">6</div>
                <div className="h-12 bg-red-300 border rounded flex items-center justify-center text-xs">9</div>
                
                <div className="text-sm text-muted-foreground">Medium</div>
                <div className="h-12 bg-green-300 border rounded flex items-center justify-center text-xs">2</div>
                <div className="h-12 bg-yellow-200 border rounded flex items-center justify-center text-xs">4</div>
                <div className="h-12 bg-yellow-300 border rounded flex items-center justify-center text-xs">6</div>
                
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="h-12 bg-green-400 border rounded flex items-center justify-center text-xs">1</div>
                <div className="h-12 bg-green-300 border rounded flex items-center justify-center text-xs">2</div>
                <div className="h-12 bg-green-200 border rounded flex items-center justify-center text-xs">3</div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p><span className="font-medium">Risk Score Legend:</span></p>
                <p>1-3: Low Risk (Green) • 4-6: Medium Risk (Yellow) • 7-9: High Risk (Orange) • 10-12: Critical Risk (Red)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident Management</CardTitle>
              <CardDescription>Track and manage security incidents and breaches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Active Incidents</h3>
                <p>No security incidents or breaches currently reported.</p>
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Reports</CardTitle>
              <CardDescription>Generate and view risk management reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Available Reports</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Monthly Risk Summary</h5>
                        <p className="text-sm text-muted-foreground">Executive summary of risks</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Risk Assessment Matrix</h5>
                        <p className="text-sm text-muted-foreground">Visual risk mapping</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Mitigation Progress</h5>
                        <p className="text-sm text-muted-foreground">Risk treatment progress</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Reports</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <p className="font-medium">Q4 2023 Risk Review</p>
                      <p className="text-sm text-muted-foreground">Generated: Dec 31, 2023</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Security Audit Report</p>
                      <p className="text-sm text-muted-foreground">Generated: Dec 15, 2023</p>
                    </div>
                    <div className="p-3 border rounded">
                      <p className="font-medium">Compliance Risk Assessment</p>
                      <p className="text-sm text-muted-foreground">Generated: Nov 30, 2023</p>
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

export default RiskManagement;
