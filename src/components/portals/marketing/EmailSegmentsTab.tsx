import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Users, Filter, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { emailManagementService, EmailSegment } from '@/services/emailManagementService';
import { useToast } from "@/hooks/use-toast";

const EmailSegmentsTab: React.FC = () => {
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    filters: {
      program_type: '',
      status: '',
      min_age: '',
      max_age: ''
    }
  });
  const { toast } = useToast();
  const [filterOptions, setFilterOptions] = useState<{ programTypes: string[]; statuses: string[] }>({ programTypes: [], statuses: [] });
  const [recipientPreview, setRecipientPreview] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSegments();
    emailManagementService.getSegmentFilterOptions().then(setFilterOptions);
  }, []);

  const loadSegments = async () => {
    setIsLoading(true);
    const data = await emailManagementService.getEmailSegments();
    setSegments(data);
    setIsLoading(false);
    // Pre-resolve recipient counts
    data.forEach(async (s) => {
      const r = await emailManagementService.resolveSegmentRecipients(s.id);
      setRecipientPreview(prev => ({ ...prev, [s.id]: r.length }));
    });
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Segment name is required", variant: "destructive" });
      return;
    }

    const success = editingSegment
      ? await emailManagementService.updateEmailSegment(
          editingSegment.id,
          formData.name,
          formData.description,
          formData.filters
        )
      : await emailManagementService.createEmailSegment(
          formData.name,
          formData.description,
          formData.filters
        );

    if (success) {
      toast({ 
        title: "Success", 
        description: `Segment ${editingSegment ? 'updated' : 'created'} successfully` 
      });
      setIsDialogOpen(false);
      resetForm();
      loadSegments();
    } else {
      toast({ 
        title: "Error", 
        description: "Failed to save segment", 
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (segment: EmailSegment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      filters: segment.filters || {
        program_type: '',
        status: '',
        min_age: '',
        max_age: ''
      }
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;

    const success = await emailManagementService.deleteEmailSegment(id);
    if (success) {
      toast({ title: "Success", description: "Segment deleted" });
      loadSegments();
    } else {
      toast({ title: "Error", description: "Failed to delete segment", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setEditingSegment(null);
    setFormData({
      name: '',
      description: '',
      filters: {
        program_type: '',
        status: '',
        min_age: '',
        max_age: ''
      }
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const sanitizeFilename = (s: string) =>
    s.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'segment';

  const handleExportCSV = async (segment: EmailSegment) => {
    const recipients = await emailManagementService.resolveSegmentRecipients(segment.id);
    if (!recipients.length) {
      toast({ title: "No recipients", description: "This segment has no eligible recipients.", variant: "destructive" });
      return;
    }
    const headers = ['Full Name', 'Email', 'Lead ID'];
    const rows = recipients.map(r => [r.full_name || '', r.email, r.lead_id]);
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(segment.name)}_recipients.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `${recipients.length} recipients exported.` });
  };

  const handleExportPDF = async (segment: EmailSegment) => {
    const recipients = await emailManagementService.resolveSegmentRecipients(segment.id);
    if (!recipients.length) {
      toast({ title: "No recipients", description: "This segment has no eligible recipients.", variant: "destructive" });
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Email Segment: ${segment.name}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (segment.description) doc.text(segment.description, 14, 25);
    const filterText = Object.entries(segment.filters || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('  |  ') || 'No filters';
    doc.text(`Filters: ${filterText}`, 14, segment.description ? 31 : 25);
    doc.text(`Total recipients: ${recipients.length}`, 14, segment.description ? 37 : 31);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, segment.description ? 43 : 37);

    autoTable(doc, {
      startY: segment.description ? 50 : 44,
      head: [['#', 'Full Name', 'Email']],
      body: recipients.map((r, i) => [i + 1, r.full_name || '—', r.email]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 139, 34] },
    });

    doc.save(`${sanitizeFilename(segment.name)}_recipients.pdf`);
    toast({ title: "PDF exported", description: `${recipients.length} recipients exported.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Segments</h2>
          <p className="text-muted-foreground">Create targeted audience segments for email campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSegment ? 'Edit' : 'Create'} Email Segment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Segment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Camp Parents"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this segment..."
                  rows={3}
                />
              </div>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <Label className="text-base font-semibold">Segment Filters</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program_type">Program Type</Label>
                    <Select
                      value={formData.filters.program_type || 'any'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, program_type: v === 'any' ? '' : v }
                      })}
                    >
                      <SelectTrigger id="program_type"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {filterOptions.programTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Lead Status</Label>
                    <Select
                      value={formData.filters.status || 'any'}
                      onValueChange={(v) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, status: v === 'any' ? '' : v }
                      })}
                    >
                      <SelectTrigger id="status"><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="min_age">Min Age</Label>
                    <Input
                      id="min_age"
                      type="number"
                      value={formData.filters.min_age}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, min_age: e.target.value }
                      })}
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_age">Max Age</Label>
                    <Input
                      id="max_age"
                      type="number"
                      value={formData.filters.max_age}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, max_age: e.target.value }
                      })}
                      placeholder="e.g., 12"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                <Button onClick={handleCreateOrUpdate}>
                  {editingSegment ? 'Update' : 'Create'} Segment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Segments List */}
      {isLoading ? (
        <div className="text-center py-8">Loading segments...</div>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No segments created yet</p>
            <p className="text-sm text-muted-foreground">Create your first segment to organize your email campaigns</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((segment) => (
            <Card key={segment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleExportCSV(segment)} title="Download CSV">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExportPDF(segment)} title="Download PDF">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(segment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(segment.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Active Filters:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(segment.filters || {}).map(([key, value]) => 
                      value ? (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ) : null
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm pt-2 border-t mt-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{recipientPreview[segment.id] ?? '…'}</span>
                    <span className="text-muted-foreground">eligible recipients</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(segment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailSegmentsTab;
