import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Ban, AlertTriangle, Search } from "lucide-react";
import { emailManagementService, EmailSuppression } from '@/services/emailManagementService';
import { useToast } from "@/hooks/use-toast";

const EmailSuppressionsTab: React.FC = () => {
  const [suppressions, setSuppressions] = useState<EmailSuppression[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    type: 'manual' as EmailSuppression['suppression_type'],
    reason: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSuppressions();
  }, []);

  const loadSuppressions = async () => {
    setIsLoading(true);
    const data = await emailManagementService.getEmailSuppressions();
    setSuppressions(data);
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.email.trim()) {
      toast({ title: "Error", description: "Email is required", variant: "destructive" });
      return;
    }

    const success = await emailManagementService.addEmailSuppression(
      formData.email,
      formData.type,
      formData.reason
    );

    if (success) {
      toast({ title: "Success", description: "Email added to suppression list" });
      setIsDialogOpen(false);
      setFormData({ email: '', type: 'manual', reason: '' });
      loadSuppressions();
    } else {
      toast({ title: "Error", description: "Failed to add suppression", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this email from the suppression list?')) return;

    const success = await emailManagementService.removeEmailSuppression(id);
    if (success) {
      toast({ title: "Success", description: "Email removed from suppression list" });
      loadSuppressions();
    } else {
      toast({ title: "Error", description: "Failed to remove suppression", variant: "destructive" });
    }
  };

  const filteredSuppressions = suppressions.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type: EmailSuppression['suppression_type']) => {
    const variants: Record<string, { color: string; label: string }> = {
      bounce_hard: { color: 'bg-red-100 text-red-800', label: 'Hard Bounce' },
      bounce_soft: { color: 'bg-orange-100 text-orange-800', label: 'Soft Bounce' },
      spam_complaint: { color: 'bg-purple-100 text-purple-800', label: 'Spam' },
      unsubscribe: { color: 'bg-gray-100 text-gray-800', label: 'Unsubscribed' },
      manual: { color: 'bg-blue-100 text-blue-800', label: 'Manual' }
    };

    const config = variants[type];
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: suppressions.length,
    hard_bounce: suppressions.filter(s => s.suppression_type === 'bounce_hard').length,
    soft_bounce: suppressions.filter(s => s.suppression_type === 'bounce_soft').length,
    spam: suppressions.filter(s => s.suppression_type === 'spam_complaint').length,
    unsubscribe: suppressions.filter(s => s.suppression_type === 'unsubscribe').length,
    manual: suppressions.filter(s => s.suppression_type === 'manual').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Suppressions</h2>
          <p className="text-muted-foreground">Manage bounced, unsubscribed, and blocked emails</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Suppression
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email to Suppression List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="type">Suppression Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="bounce_hard">Hard Bounce</SelectItem>
                    <SelectItem value="bounce_soft">Soft Bounce</SelectItem>
                    <SelectItem value="spam_complaint">Spam Complaint</SelectItem>
                    <SelectItem value="unsubscribe">Unsubscribe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Why is this email being suppressed?"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add Suppression</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.hard_bounce}</div>
            <p className="text-xs text-muted-foreground">Hard Bounce</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.soft_bounce}</div>
            <p className="text-xs text-muted-foreground">Soft Bounce</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.spam}</div>
            <p className="text-xs text-muted-foreground">Spam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.unsubscribe}</div>
            <p className="text-xs text-muted-foreground">Unsubscribed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.manual}</div>
            <p className="text-xs text-muted-foreground">Manual</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppressions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Suppressions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppressed Emails ({filteredSuppressions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading suppressions...</div>
          ) : filteredSuppressions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No suppressed emails found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppressions.map((suppression) => (
                    <TableRow key={suppression.id}>
                      <TableCell className="font-medium">{suppression.email}</TableCell>
                      <TableCell>{getTypeBadge(suppression.suppression_type)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {suppression.reason || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(suppression.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(suppression.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Suppression List Impact</p>
              <p className="text-sm text-yellow-700">
                Emails on this list will NOT receive any emails from the system. Remove suppressions carefully to avoid sending to invalid or unwilling recipients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSuppressionsTab;
