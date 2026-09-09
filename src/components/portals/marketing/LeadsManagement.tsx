import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Mail, Phone, Search, Filter, Eye } from "lucide-react";
import { leadsService, Lead } from '@/services/leadsService';
import { useToast } from "@/hooks/use-toast";

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    const data = await leadsService.getAllLeads();
    setLeads(Array.isArray(data) ? data : []);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: Lead['status']) => {
    const updated = await leadsService.updateLead(leadId, { status: newStatus });
    if (updated) {
      toast({ title: "Success", description: "Lead status updated" });
      loadLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead(updated);
      }
    }
  };

  const handleUpdateNotes = async (leadId: string, notes: string) => {
    const updated = await leadsService.updateLead(leadId, { notes });
    if (updated) {
      toast({ title: "Success", description: "Notes saved" });
      setSelectedLead(updated);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.program_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^\w/, c => c.toUpperCase())
      .trim();
  };

  const renderFormData = (data: any, depth = 0): React.ReactNode => {
    if (data === null || data === undefined) return <span className="text-muted-foreground">N/A</span>;
    if (typeof data === 'boolean') return <span>{data ? 'Yes' : 'No'}</span>;
    if (typeof data !== 'object') return <span>{String(data)}</span>;

    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-muted-foreground">None</span>;
      
      // Check if it's an array of children objects
      if (data[0] && typeof data[0] === 'object' && ('childName' in data[0] || 'ageRange' in data[0])) {
        return (
          <div className="space-y-2">
            {data.map((child, idx) => (
              <div key={idx} className="pl-3 border-l-2 border-primary/30">
                <p className="font-medium text-primary">Child {idx + 1}</p>
                {Object.entries(child).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground">{formatLabel(key)}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      }
      
      // Simple array
      return <span>{data.join(', ')}</span>;
    }

    // Object
    return (
      <div className={depth > 0 ? "pl-3 border-l-2 border-muted-foreground/30" : ""}>
        {Object.entries(data).map(([key, value]) => {
          // Skip internal/redundant fields
          if (['consent', 'id'].includes(key)) return null;
          
          return (
            <div key={key} className="py-1">
              <span className="text-muted-foreground font-medium">{formatLabel(key)}:</span>{' '}
              {typeof value === 'object' ? (
                <div className="mt-1">{renderFormData(value, depth + 1)}</div>
              ) : (
                renderFormData(value, depth + 1)
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Leads Management</h2>
          <p className="text-muted-foreground">Track and manage your leads pipeline</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
            <p className="text-xs text-muted-foreground">Qualified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No leads found</div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{lead.full_name}</h4>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.program_type} {lead.program_name && `- ${lead.program_name}`}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(lead.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleUpdateStatus(lead.id, value as Lead['status'])}
                      >
                        <SelectTrigger className={`w-32 ${getStatusColor(lead.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Lead Details</DialogTitle>
                          </DialogHeader>
                          {selectedLead && selectedLead.id === lead.id && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Name</Label>
                                  <p className="font-medium">{selectedLead.full_name}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="font-medium">{selectedLead.email}</p>
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <p className="font-medium">{selectedLead.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label>Status</Label>
                                  <Badge className={getStatusColor(selectedLead.status)}>
                                    {selectedLead.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label>Program Type</Label>
                                  <p className="font-medium">{selectedLead.program_type}</p>
                                </div>
                                <div>
                                  <Label>Created</Label>
                                  <p className="font-medium">
                                    {new Date(selectedLead.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedLead.form_data && (
                                <div>
                                  <Label>Registration Details</Label>
                                  <div className="mt-2 p-3 bg-muted rounded text-sm space-y-3 max-h-60 overflow-auto">
                                    {renderFormData(selectedLead.form_data)}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <Label>Notes</Label>
                                <Textarea
                                  placeholder="Add notes about this lead..."
                                  defaultValue={selectedLead.notes || ''}
                                  onBlur={(e) => handleUpdateNotes(selectedLead.id, e.target.value)}
                                  className="mt-2"
                                  rows={4}
                                />
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsManagement;
