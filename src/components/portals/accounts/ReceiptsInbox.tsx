import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Image as ImageIcon, Link2, Unlink, Trash2, ExternalLink, Search } from "lucide-react";
import { receiptService, ReceiptUpload } from '@/services/receiptService';
import { financialService, Expense } from '@/services/financialService';
import { toast } from "@/hooks/use-toast";

interface Props {
  onMatched?: () => void;
}

const ReceiptsInbox: React.FC<Props> = ({ onMatched }) => {
  const [uploads, setUploads] = useState<ReceiptUpload[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [matchTarget, setMatchTarget] = useState<ReceiptUpload | null>(null);
  const [matchSearch, setMatchSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [u, e] = await Promise.all([
        receiptService.listUploads(),
        financialService.getExpenses(),
      ]);
      setUploads(u);
      setExpenses(e);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load receipts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url } = await receiptService.uploadFile(file);
        await receiptService.createUpload({
          file_url: url,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        });
      }
      toast({ title: 'Uploaded', description: `${files.length} receipt(s) added to inbox.` });
      await load();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Try again', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    const q = matchSearch.trim().toLowerCase();
    let list = expenses;
    if (matchTarget?.amount_hint) {
      const amt = Number(matchTarget.amount_hint);
      list = list.filter(e => Math.abs(Number(e.amount) - amt) < 1);
    }
    if (q) {
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        (e.vendor || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q)
      );
    }
    return list.slice(0, 50);
  }, [expenses, matchSearch, matchTarget]);

  const handleMatch = async (expenseId: string) => {
    if (!matchTarget) return;
    try {
      await receiptService.matchToExpense(matchTarget.id, expenseId, matchTarget.file_url);
      toast({ title: 'Matched', description: 'Receipt linked to expense.' });
      setMatchTarget(null);
      setMatchSearch('');
      await load();
      onMatched?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Match failed', variant: 'destructive' });
    }
  };

  const handleUnmatch = async (u: ReceiptUpload) => {
    try {
      await receiptService.unmatch(u.id);
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (u: ReceiptUpload) => {
    if (!confirm('Delete this receipt upload?')) return;
    try {
      await receiptService.deleteUpload(u.id);
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const unmatchedCount = uploads.filter(u => u.status === 'unmatched').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-lg">Receipts Inbox</CardTitle>
              <CardDescription>Upload receipts and match them to expenses</CardDescription>
            </div>
            <Badge variant="secondary">{unmatchedCount} unmatched</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/40 transition">
            <Upload className="h-6 w-6 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click or drop files to upload'}</span>
            <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, PDF · up to 10MB</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Uploads</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="text-center py-6 text-muted-foreground text-sm">Loading…</div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">No receipts uploaded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Expense</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map(u => {
                    const linked = u.expense_id ? expenses.find(e => e.id === u.expense_id) : null;
                    const isImg = (u.mime_type || '').startsWith('image/');
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isImg ? (
                              <img src={u.file_url} alt={u.file_name} className="h-10 w-10 object-cover rounded border" />
                            ) : (
                              <div className="h-10 w-10 rounded border flex items-center justify-center bg-muted">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <a href={u.file_url} target="_blank" rel="noreferrer" className="text-sm hover:underline truncate max-w-[180px]">
                              {u.file_name}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(u.uploaded_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'matched' ? 'default' : u.status === 'archived' ? 'outline' : 'secondary'}>
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {linked ? (
                            <span className="text-muted-foreground">
                              {linked.description} · KES {Number(linked.amount).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <a href={u.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                            </Button>
                            {u.status !== 'matched' ? (
                              <Button variant="outline" size="sm" onClick={() => setMatchTarget(u)}>
                                <Link2 className="h-3.5 w-3.5 mr-1" /> Match
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => handleUnmatch(u)}>
                                <Unlink className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => handleDelete(u)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!matchTarget} onOpenChange={(o) => { if (!o) { setMatchTarget(null); setMatchSearch(''); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Match Receipt to Expense</DialogTitle>
            <DialogDescription>Select an expense to attach this receipt to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search by description, vendor, category…"
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[360px] overflow-y-auto border rounded">
              {filteredExpenses.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No matching expenses.</div>
              ) : filteredExpenses.map(e => (
                <button
                  key={e.id}
                  onClick={() => handleMatch(e.id)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b last:border-b-0 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-medium">{e.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.expense_date).toLocaleDateString()} · {e.category}{e.vendor ? ` · ${e.vendor}` : ''}
                    </div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">KES {Number(e.amount).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMatchTarget(null); setMatchSearch(''); }}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceiptsInbox;
