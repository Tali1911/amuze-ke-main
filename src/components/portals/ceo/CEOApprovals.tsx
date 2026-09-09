
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, DollarSign, Users, FileText, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CEOApprovals = () => {
  const [approvals, setApprovals] = useState([
    {
      id: 1,
      type: 'Budget Request',
      title: 'Q2 Marketing Campaign Budget',
      department: 'Marketing',
      amount: 25000,
      requester: 'Sarah Johnson',
      date: '2024-01-20',
      priority: 'High',
      status: 'pending',
      description: 'Budget allocation for comprehensive digital marketing campaign targeting new customer segments in Q2 2024.',
      justification: 'Expected ROI of 300% based on Q1 performance metrics and market analysis.',
      impact: 'Projected 40% increase in customer acquisition and 25% revenue growth.'
    },
    {
      id: 2,
      type: 'Personnel',
      title: 'Senior Coach Position Approval',
      department: 'HR',
      position: 'Senior Nature Guide Specialist',
      requester: 'Emily Brown',
      date: '2024-01-19',
      priority: 'Medium',
      status: 'pending',
      description: 'Approval to hire experienced nature guide specialist to lead advanced outdoor programs.',
      justification: 'Growing demand for specialized programs and current capacity constraints.',
      impact: 'Will enable expansion of premium program offerings and increase revenue by $50K annually.'
    },
    {
      id: 3,
      type: 'Equipment',
      title: 'Outdoor Equipment Purchase',
      department: 'Operations',
      amount: 12500,
      requester: 'Mike Chen',
      date: '2024-01-18',
      priority: 'Low',
      status: 'pending',
      description: 'Purchase of specialized outdoor equipment for new adventure programs.',
      justification: 'Current equipment aging and insufficient for new program requirements.',
      impact: 'Enhanced safety standards and ability to serve 30% more participants.'
    },
    {
      id: 4,
      type: 'Contract',
      title: 'Vendor Partnership Agreement',
      department: 'Procurement',
      amount: 50000,
      requester: 'Lisa Wang',
      date: '2024-01-17',
      priority: 'High',
      status: 'pending',
      description: 'Strategic partnership with local conservation organization for joint programs.',
      justification: 'Opportunity to expand program offerings and establish community partnerships.',
      impact: 'Access to new venues and educational resources, potential 20% cost reduction.'
    }
  ]);

  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState('');

  const handleApproval = (id: number, action: 'approve' | 'reject') => {
    setApprovals(prev => prev.map(approval => 
      approval.id === id 
        ? { ...approval, status: action === 'approve' ? 'approved' : 'rejected' }
        : approval
    ));

    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `The request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      variant: action === 'approve' ? 'default' : 'destructive',
    });

    setSelectedApproval(null);
    setComments('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Budget Request': return DollarSign;
      case 'Personnel': return Users;
      case 'Equipment': return FileText;
      case 'Contract': return FileText;
      default: return AlertTriangle;
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const processedApprovals = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Center</h2>
          <p className="text-gray-600">Review and approve pending requests</p>
        </div>
        <Badge variant="destructive" className="text-lg px-3 py-1">
          {pendingApprovals.length} Pending
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{pendingApprovals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{processedApprovals.filter(a => a.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{processedApprovals.filter(a => a.status === 'rejected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${pendingApprovals.filter(a => a.amount).reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Requests awaiting your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval) => {
                const TypeIcon = getTypeIcon(approval.type);
                return (
                  <div key={approval.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className="h-5 w-5 text-gray-600" />
                          <h4 className="font-medium">{approval.title}</h4>
                          <Badge variant={getPriorityColor(approval.priority)}>
                            {approval.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{approval.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{approval.department} • {approval.requester}</span>
                          <span>{approval.date}</span>
                          {approval.amount && <span className="font-medium text-green-600">${approval.amount.toLocaleString()}</span>}
                          {approval.position && <span className="font-medium text-blue-600">{approval.position}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedApproval(approval)}>
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{approval.title}</DialogTitle>
                              <DialogDescription>
                                Review the details and make your decision
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-gray-600">{approval.description}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Justification</h4>
                                <p className="text-sm text-gray-600">{approval.justification}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Expected Impact</h4>
                                <p className="text-sm text-gray-600">{approval.impact}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Comments</h4>
                                <Textarea
                                  placeholder="Add your comments or feedback..."
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleApproval(approval.id, 'reject')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  onClick={() => handleApproval(approval.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          size="sm" 
                          onClick={() => handleApproval(approval.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Quick Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Decisions */}
      {processedApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
            <CardDescription>
              Recently processed approval requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedApprovals.slice(0, 5).map((approval) => {
                const TypeIcon = getTypeIcon(approval.type);
                return (
                  <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <TypeIcon className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium">{approval.title}</p>
                        <p className="text-xs text-gray-500">{approval.department} • {approval.date}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(approval.status)}>
                      {approval.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CEOApprovals;
