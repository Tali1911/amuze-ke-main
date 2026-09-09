import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Eye, CheckCircle, XCircle, Search, Download, FileText, 
  ChevronDown, ChevronUp, Filter, BarChart3, Calendar
} from 'lucide-react';
import {
  kenyanExperiencesService,
  homeschoolingService,
  schoolExperienceService,
  teamBuildingService,
  partiesService
} from '@/services/programRegistrationService';
import { exportService } from '@/services/exportService';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ProgramRegistrationsManager = () => {
  const [activeTab, setActiveTab] = useState('kenyan-experiences');
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadRegistrations();
  }, [activeTab, statusFilter]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      let data = [];
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;

      switch (activeTab) {
        case 'kenyan-experiences':
          data = await kenyanExperiencesService.getAll(filters);
          break;
        case 'homeschooling':
          data = await homeschoolingService.getAll(filters);
          break;
        case 'school-experience':
          data = await schoolExperienceService.getAll(filters);
          break;
        case 'team-building':
          data = await teamBuildingService.getAll(filters);
          break;
        case 'parties':
          data = await partiesService.getAll(filters);
          break;
      }

      setRegistrations(data || []);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, service: any) => {
    try {
      await service.update(id, { status });
      toast.success('Status updated successfully');
      loadRegistrations();
      setSelectedRegistration(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async (id: string, note: string, service: any) => {
    try {
      await service.update(id, { admin_notes: note });
      toast.success('Note added successfully');
      loadRegistrations();
      setSelectedRegistration(null);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const getService = () => {
    switch (activeTab) {
      case 'kenyan-experiences':
        return kenyanExperiencesService;
      case 'homeschooling':
        return homeschoolingService;
      case 'school-experience':
        return schoolExperienceService;
      case 'team-building':
        return teamBuildingService;
      case 'parties':
        return partiesService;
      default:
        return kenyanExperiencesService;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'secondary',
      confirmed: 'default',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getProgramTypeName = () => {
    const names: Record<string, string> = {
      'kenyan-experiences': 'Kenyan Experiences',
      'homeschooling': 'Homeschooling',
      'school-experience': 'School Experience',
      'team-building': 'Team Building',
      'parties': 'Parties'
    };
    return names[activeTab] || activeTab;
  };

  // Export handlers
  const handleExportCSV = () => {
    const dataToExport = selectedIds.size > 0 
      ? registrations.filter(r => selectedIds.has(r.id))
      : filteredRegistrations;
    
    exportService.exportProgramToCSV(dataToExport, getProgramTypeName());
    toast.success(`Exported ${dataToExport.length} registrations to CSV`);
  };

  const handleExportPDF = () => {
    const dataToExport = selectedIds.size > 0 
      ? registrations.filter(r => selectedIds.has(r.id))
      : filteredRegistrations;
    
    exportService.exportProgramToPDF(dataToExport, getProgramTypeName());
    toast.success(`Exported ${dataToExport.length} registrations to PDF`);
  };

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRegistrations.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedIds.size === 0) {
      toast.error('No registrations selected');
      return;
    }

    try {
      const service = getService();
      const updatePromises = Array.from(selectedIds).map(id =>
        service.update(id, { status })
      );
      
      await Promise.all(updatePromises);
      toast.success(`Updated ${selectedIds.size} registrations to ${status}`);
      setSelectedIds(new Set());
      loadRegistrations();
    } catch (error) {
      toast.error('Failed to update registrations');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const filteredRegistrations = registrations.filter(reg => {
    // Search filter
    const matchesSearch = reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.phone?.includes(searchTerm) ||
      (reg.parent_name && reg.parent_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reg.parent_leader && reg.parent_leader.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reg.school_name && reg.school_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Date range filter
    const regDate = new Date(reg.created_at);
    const matchesDateFrom = !dateFrom || regDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || regDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const RegistrationDetails = ({ registration }: { registration: any }) => {
    const [note, setNote] = useState(registration.admin_notes || '');

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Contact Information</h4>
          <p><strong>Email:</strong> {registration.email}</p>
          <p><strong>Phone:</strong> {registration.phone}</p>
        </div>

        {registration.participants && (
          <div>
            <h4 className="font-semibold mb-2">Participants</h4>
            <div className="space-y-2">
              {Array.isArray(registration.participants) ? (
                registration.participants.map((participant: any, index: number) => (
                  <Card key={index} className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{participant.name || 'N/A'}</p>
                        {participant.ageRange && (
                          <p className="text-sm text-muted-foreground">Age: {participant.ageRange}</p>
                        )}
                        {participant.age && (
                          <p className="text-sm text-muted-foreground">Age: {participant.age}</p>
                        )}
                      </div>
                      <Badge variant="outline">Participant {index + 1}</Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No participant details available</p>
              )}
            </div>
          </div>
        )}

        {registration.children && (
          <div>
            <h4 className="font-semibold mb-2">Children</h4>
            <div className="space-y-2">
              {Array.isArray(registration.children) ? (
                registration.children.map((child: any, index: number) => (
                  <Card key={index} className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{child.name || 'N/A'}</p>
                        {child.ageRange && (
                          <p className="text-sm text-muted-foreground">Age: {child.ageRange}</p>
                        )}
                        {child.age && (
                          <p className="text-sm text-muted-foreground">Age: {child.age}</p>
                        )}
                        {child.birthdate && (
                          <p className="text-sm text-muted-foreground">Birthdate: {child.birthdate}</p>
                        )}
                      </div>
                      <Badge variant="outline">Child {index + 1}</Badge>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No children details available</p>
              )}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2">Photography & Video Consent</h4>
          <Badge variant={registration.consent_given ? 'default' : 'secondary'}>
            {registration.consent_given ? 'Consent Given' : 'Not Consented'}
          </Badge>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Status</h4>
          <div className="flex gap-2">
            {getStatusBadge(registration.status)}
            <Select
              defaultValue={registration.status}
              onValueChange={(value) => handleUpdateStatus(registration.id, value, getService())}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="admin-note">Admin Notes</Label>
          <Textarea
            id="admin-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this registration..."
            rows={3}
            className="mt-2"
          />
          <Button
            onClick={() => handleAddNote(registration.id, note, getService())}
            className="mt-2"
            size="sm"
          >
            Save Note
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Registered: {new Date(registration.created_at).toLocaleString()}</p>
          {registration.updated_at !== registration.created_at && (
            <p>Last Updated: {new Date(registration.updated_at).toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  };

  // Reports tab component
  const ReportsTab = () => {
    const summary = exportService.calculateProgramSummary(registrations, getProgramTypeName());
    
    const statusChartData = Object.entries(summary.statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));

    const dateChartData = Object.entries(summary.dateDistribution)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-14)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: count
      }));

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Registrations</div>
            <div className="text-3xl font-bold mt-2">{summary.totalRegistrations}</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Total Participants</div>
            <div className="text-3xl font-bold mt-2">{summary.totalParticipants}</div>
          </Card>
          
          <Card className="p-6">
            <div className="text-sm font-medium text-muted-foreground">Confirmed</div>
            <div className="text-3xl font-bold mt-2">{summary.statusCounts.confirmed || 0}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Registrations by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Registration Trend (Last 14 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dateChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="registrations" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Program Registrations</h2>
        <p className="text-muted-foreground">
          Manage registrations from Experiences, Schools, and Group Activities programs
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by email, phone, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showMoreFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
        </div>

        {showMoreFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  Clear All Filters
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <Card className="p-3 sm:p-4 bg-primary/5 border-primary">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('confirmed')}
                className="text-xs sm:text-sm"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mark </span>Confirmed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('cancelled')}
                className="text-xs sm:text-sm"
              >
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mark </span>Cancelled
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs sm:text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedIds(new Set()); }}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="kenyan-experiences" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Experiences</TabsTrigger>
            <TabsTrigger value="homeschooling" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Homeschool</TabsTrigger>
            <TabsTrigger value="school-experience" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Schools</TabsTrigger>
            <TabsTrigger value="team-building" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Team</TabsTrigger>
            <TabsTrigger value="parties" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap">Parties</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-3 py-2 whitespace-nowrap flex items-center gap-1">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        {['kenyan-experiences', 'homeschooling', 'school-experience', 'team-building', 'parties'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading registrations...</p>
              </Card>
            ) : filteredRegistrations.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No registrations found</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-4">
                  <Checkbox
                    checked={selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Select All ({filteredRegistrations.length})
                  </span>
                </div>
                <div className="grid gap-4">
                  {filteredRegistrations.map((reg) => (
                    <Card key={reg.id} className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-4">
                        <Checkbox
                          checked={selectedIds.has(reg.id)}
                          onCheckedChange={(checked) => handleSelectOne(reg.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {reg.parent_name || reg.parent_leader || reg.school_name || reg.email}
                            </h3>
                            {getStatusBadge(reg.status)}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{reg.email}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{reg.phone}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(reg.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRegistration(reg)}
                          className="flex-shrink-0"
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && <RegistrationDetails registration={selectedRegistration} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};
