
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Shield, Users, FileText, Search, Settings, CheckCircle, AlertTriangle } from "lucide-react";

interface DataAsset {
  id: string;
  name: string;
  type: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  owner: string;
  custodian: string;
  lastAccessed: string;
  size: string;
  retention: string;
}

const DataGovernance: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('catalog');

  const dataAssets: DataAsset[] = [
    {
      id: '1',
      name: 'Customer Database',
      type: 'Database',
      classification: 'confidential',
      owner: 'Marketing Team',
      custodian: 'IT Team',
      lastAccessed: '2024-01-24',
      size: '2.5 GB',
      retention: '7 years'
    },
    {
      id: '2',
      name: 'Employee Records',
      type: 'Database',
      classification: 'restricted',
      owner: 'HR Team',
      custodian: 'IT Team',
      lastAccessed: '2024-01-24',
      size: '450 MB',
      retention: '10 years'
    },
    {
      id: '3',
      name: 'Financial Reports',
      type: 'Documents',
      classification: 'confidential',
      owner: 'Accounts Team',
      custodian: 'Finance Team',
      lastAccessed: '2024-01-23',
      size: '125 MB',
      retention: '7 years'
    },
    {
      id: '4',
      name: 'Program Materials',
      type: 'Documents',
      classification: 'internal',
      owner: 'Coach Team',
      custodian: 'Operations Team',
      lastAccessed: '2024-01-24',
      size: '1.2 GB',
      retention: '5 years'
    }
  ];

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'restricted': return 'bg-red-600';
      case 'confidential': return 'bg-red-500';
      case 'internal': return 'bg-yellow-500';
      case 'public': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Governance</h2>
          <p className="text-gray-600">Manage data classification, lineage, and access controls</p>
        </div>
        <Button>
          <Settings className="w-4 h-4 mr-2" />
          Configure Policies
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog">Data Catalog</TabsTrigger>
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="access">Access Management</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Assets</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">
                  Cataloged assets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Owners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Assigned owners
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classified Data</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  Classification complete
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">92%</div>
                <p className="text-xs text-muted-foreground">
                  Data quality rating
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Data Catalog */}
          <Card>
            <CardHeader>
              <CardTitle>Data Catalog</CardTitle>
              <CardDescription>Inventory of organizational data assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search data assets..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="files">Files</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Classification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classifications</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {dataAssets.map((asset) => (
                  <div key={asset.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{asset.name}</h4>
                          <Badge className={`${getClassificationColor(asset.classification)} text-white`}>
                            {asset.classification.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{asset.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Owner:</span> {asset.owner}
                          </div>
                          <div>
                            <span className="font-medium">Custodian:</span> {asset.custodian}
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {asset.size}
                          </div>
                          <div>
                            <span className="font-medium">Retention:</span> {asset.retention}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Last accessed: {asset.lastAccessed}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Classification</CardTitle>
              <CardDescription>Manage data sensitivity levels and handling requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Classification Levels</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-red-600 text-white">RESTRICTED</Badge>
                        <span className="font-medium">8 assets</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Highly sensitive data requiring special handling
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-red-500 text-white">CONFIDENTIAL</Badge>
                        <span className="font-medium">15 assets</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sensitive business information
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-yellow-500 text-white">INTERNAL</Badge>
                        <span className="font-medium">18 assets</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Internal use only
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-green-500 text-white">PUBLIC</Badge>
                        <span className="font-medium">6 assets</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Publicly available information
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Classification Rules</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Personal Data</h5>
                      <p className="text-sm text-muted-foreground">Automatically classified as Confidential or Restricted</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Financial Data</h5>
                      <p className="text-sm text-muted-foreground">Classified as Confidential by default</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Employee Records</h5>
                      <p className="text-sm text-muted-foreground">Classified as Restricted</p>
                    </div>
                    <div className="p-3 border rounded">
                      <h5 className="font-medium">Marketing Materials</h5>
                      <p className="text-sm text-muted-foreground">Default classification: Internal</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Management</CardTitle>
              <CardDescription>Control and monitor data access permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Access Requests</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">Marketing Database Access</h5>
                          <p className="text-sm text-muted-foreground">Requested by: john.doe@company.com</p>
                          <p className="text-xs text-muted-foreground">Submitted: 2 hours ago</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Approve</Button>
                          <Button variant="outline" size="sm">Deny</Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">Financial Reports Access</h5>
                          <p className="text-sm text-muted-foreground">Requested by: manager@company.com</p>
                          <p className="text-xs text-muted-foreground">Submitted: 1 day ago</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Approve</Button>
                          <Button variant="outline" size="sm">Deny</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recent Access Reviews</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h5 className="font-medium">Customer Database</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Access review completed - 15 users validated</p>
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <h5 className="font-medium">Employee Records</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Access review due - 3 users need validation</p>
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h5 className="font-medium">Financial Reports</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">Quarterly review completed - 8 users validated</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality</CardTitle>
              <CardDescription>Monitor and improve data quality across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Quality Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Completeness</h5>
                        <p className="text-sm text-muted-foreground">Data fields populated</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">96%</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Accuracy</h5>
                        <p className="text-sm text-muted-foreground">Data validation rules passed</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">94%</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Consistency</h5>
                        <p className="text-sm text-muted-foreground">Cross-system data alignment</p>
                      </div>
                      <Badge variant="secondary">89%</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h5 className="font-medium">Timeliness</h5>
                        <p className="text-sm text-muted-foreground">Data freshness score</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">97%</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Quality Issues</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <h5 className="font-medium">Duplicate Customer Records</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">23 potential duplicates identified</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Review Duplicates
                      </Button>
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <h5 className="font-medium">Missing Contact Information</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">45 records missing email addresses</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Export Report
                      </Button>
                    </div>
                    
                    <div className="p-3 border rounded">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h5 className="font-medium">Format Validation</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">All phone numbers now properly formatted</p>
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

export default DataGovernance;
