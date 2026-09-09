
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Edit, Eye, Calendar, CheckCircle, Clock } from "lucide-react";
import { governanceService, Policy } from '@/services/governanceService';
import { workflowService } from '@/services/workflowService';

const PolicyManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('policies');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    title: '',
    content: '',
    version: '1.0',
    category: '',
    effective_date: '',
    review_date: '',
    owner: 'governance@company.com'
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await governanceService.getPolicies();
      setPolicies(data);
    } catch (error) {
      console.error('Error loading policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const policy = await governanceService.createPolicy({
        ...newPolicy,
        status: 'draft'
      });
      
      // Create workflow task for review
      await workflowService.createWorkflowTask({
        title: `Review Policy: ${policy.title}`,
        description: `New policy created and requires review and approval`,
        entity_type: 'policy',
        entity_id: policy.id,
        assignee_email: 'ceo@company.com',
        status: 'pending',
        priority: 'medium'
      });

      setPolicies([policy, ...policies]);
      setIsCreateDialogOpen(false);
      setNewPolicy({
        title: '',
        content: '',
        version: '1.0',
        category: '',
        effective_date: '',
        review_date: '',
        owner: 'governance@company.com'
      });
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'review': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'archived': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isReviewDue = (reviewDate: string) => {
    const today = new Date();
    const review = new Date(reviewDate);
    const timeDiff = review.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 30;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Policy Management</h2>
          <p className="text-gray-600">Create, manage, and track organizational policies</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Create a new organizational policy document
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Policy Title</Label>
                  <Input
                    id="title"
                    value={newPolicy.title}
                    onChange={(e) => setNewPolicy({ ...newPolicy, title: e.target.value })}
                    placeholder="Enter policy title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newPolicy.category} onValueChange={(value) => setNewPolicy({ ...newPolicy, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Privacy">Privacy</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={newPolicy.version}
                    onChange={(e) => setNewPolicy({ ...newPolicy, version: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="effective_date">Effective Date</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={newPolicy.effective_date}
                    onChange={(e) => setNewPolicy({ ...newPolicy, effective_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="review_date">Review Date</Label>
                  <Input
                    id="review_date"
                    type="date"
                    value={newPolicy.review_date}
                    onChange={(e) => setNewPolicy({ ...newPolicy, review_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="content">Policy Content</Label>
                <Textarea
                  id="content"
                  value={newPolicy.content}
                  onChange={(e) => setNewPolicy({ ...newPolicy, content: e.target.value })}
                  placeholder="Enter policy content..."
                  rows={8}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePolicy}>
                  Create Policy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">All Policies</TabsTrigger>
          <TabsTrigger value="review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-6">
          {/* Policy Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policies.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active policies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {policies.filter(p => p.status === 'review').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {policies.filter(p => isReviewDue(p.review_date)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Within 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {policies.filter(p => p.status === 'approved').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active and approved
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Policy List */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Library</CardTitle>
              <CardDescription>All organizational policies and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading policies...
                </div>
              ) : (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{policy.title}</h4>
                            <Badge className={`${getStatusColor(policy.status)} text-white`}>
                              {policy.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">v{policy.version}</span>
                            {isReviewDue(policy.review_date) && (
                              <Badge variant="destructive">Review Due</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Category:</span> {policy.category}
                            </div>
                            <div>
                              <span className="font-medium">Owner:</span> {policy.owner}
                            </div>
                            <div>
                              <span className="font-medium">Effective:</span> {policy.effective_date}
                            </div>
                            <div>
                              <span className="font-medium">Review:</span> {policy.review_date}
                            </div>
                          </div>
                          {policy.approver && (
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Approved by:</span> {policy.approver}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policies Under Review</CardTitle>
              <CardDescription>Policies awaiting approval or review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.filter(p => p.status === 'review' || p.status === 'draft').map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{policy.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Category: {policy.category} | Owner: {policy.owner}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={`${getStatusColor(policy.status)} text-white`}>
                          {policy.status}
                        </Badge>
                        <Button size="sm">Review</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Policies</CardTitle>
              <CardDescription>Currently active and approved policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.filter(p => p.status === 'approved').map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{policy.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Effective: {policy.effective_date} | Review due: {policy.review_date}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className="bg-green-500 text-white">Approved</Badge>
                        {isReviewDue(policy.review_date) && (
                          <Badge variant="destructive">Review Due</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Policies by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Privacy', 'Security', 'HR', 'Compliance', 'Operations'].map((category) => {
                    const count = policies.filter(p => p.category === category).length;
                    return (
                      <div key={category} className="flex justify-between items-center p-2 border rounded">
                        <span>{category}</span>
                        <Badge variant="outline">{count} policies</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['approved', 'review', 'draft', 'archived'].map((status) => {
                    const count = policies.filter(p => p.status === status).length;
                    return (
                      <div key={status} className="flex justify-between items-center p-2 border rounded">
                        <span className="capitalize">{status}</span>
                        <Badge className={`${getStatusColor(status)} text-white`}>
                          {count}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyManagement;
