import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Mail, XCircle, BadgePercent, Loader2, CheckCircle2, AlertTriangle, Clock, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  discountService,
  ClientDiscount,
  DiscountType,
  NewClientDiscount,
  describeDiscount,
  validateDiscountDates,
  DiscountAuditEntry,
} from '@/services/discountService';

const CAMP_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'Any camp' },
  { value: 'easter', label: 'Easter Camp' },
  { value: 'summer', label: 'Summer Camp' },
  { value: 'end-year', label: 'End-Year Camp' },
  { value: 'mid-term-feb-march', label: 'Mid-Term Feb/March' },
  { value: 'mid-term-may-june', label: 'Mid-Term May/June' },
  { value: 'mid-term-october', label: 'Mid-Term October' },
  { value: 'little-forest', label: 'Little Forest' },
];

const emptyForm = {
  client_name: '',
  client_email: '',
  client_phone: '',
  discount_type: 'percentage' as DiscountType,
  discount_value: 10,
  camp_type: '',
  valid_from: '',
  valid_to: '',
  min_total: '',
  min_children: '',
  single_use: true,
  reason: '',
};

const ClientDiscounts: React.FC = () => {
  const [discounts, setDiscounts] = useState<ClientDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'revoked'>('all');
  const [view, setView] = useState<'discounts' | 'audit'>('discounts');
  const [audit, setAudit] = useState<DiscountAuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const formDateCheck = useMemo(
    () => validateDiscountDates(form.valid_from || null, form.valid_to || null),
    [form.valid_from, form.valid_to]
  );

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const list = await discountService.listAudit(300);
      setAudit(list);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'audit') loadAudit();
  }, [view]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await discountService.list();
      setDiscounts(list);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: discounts.length,
      active: discounts.filter((d) => d.status === 'active').length,
      used: discounts.filter((d) => d.status === 'used').length,
    };
  }, [discounts]);

  const handleCreate = async () => {
    if (!form.client_email && !form.client_phone) {
      toast.error('Provide at least an email or phone for the client');
      return;
    }
    if (!form.discount_value || form.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (form.discount_type === 'percentage' && form.discount_value > 100) {
      toast.error('Percentage cannot exceed 100');
      return;
    }
    if (formDateCheck.errors.length > 0) {
      toast.error(formDateCheck.errors[0]);
      return;
    }
    setSaving(true);
    try {
      const payload: NewClientDiscount = {
        client_name: form.client_name || null,
        client_email: form.client_email || null,
        client_phone: form.client_phone || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        camp_type: !form.camp_type || form.camp_type === '__any__' ? null : form.camp_type,
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        min_total: form.min_total ? Number(form.min_total) : null,
        min_children: form.min_children ? Number(form.min_children) : null,
        single_use: form.single_use,
        reason: form.reason || null,
      };
      await discountService.create(payload);
      toast.success('Discount created');
      setOpen(false);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create discount');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async (d: ClientDiscount) => {
    if (!d.client_email) {
      toast.error('No client email on this discount');
      return;
    }
    setSendingId(d.id);
    const res = await discountService.sendNotification(d.id);
    setSendingId(null);
    if (res.success) {
      toast.success(`Notification sent to ${d.client_email}`);
      load();
    } else {
      toast.error(res.error || 'Failed to send email');
    }
  };

  const handleRevoke = async (d: ClientDiscount) => {
    if (!confirm(`Revoke discount for ${d.client_email || d.client_phone}?`)) return;
    try {
      await discountService.revoke(d.id);
      toast.success('Discount revoked');
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to revoke');
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      used: 'bg-blue-100 text-blue-800',
      revoked: 'bg-rose-100 text-rose-800',
      expired: 'bg-muted text-muted-foreground',
    };
    return <Badge className={map[s] || ''}>{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-primary" />
            Client Discounts
          </h2>
          <p className="text-muted-foreground text-sm">
            Issue pre-purchase discounts to specific clients. They are applied
            automatically at registration when the client and criteria match.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Client Discount</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="md:col-span-2">
                <Label>Client name</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label>Client email</Label>
                <Input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({ ...form, client_email: e.target.value })}
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <Label>Client phone</Label>
                <Input
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  placeholder="+254..."
                />
              </div>

              <div>
                <Label>Discount type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v) =>
                    setForm({ ...form, discount_type: v as DiscountType })
                  }
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage off</SelectItem>
                    <SelectItem value="fixed_amount">Fixed KES off</SelectItem>
                    <SelectItem value="fixed_price_per_child_day">
                      Fixed price per child/day
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  Value{' '}
                  {form.discount_type === 'percentage' ? '(%)' : '(KES)'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: Number(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label>Camp</Label>
                <Select
                  value={form.camp_type}
                  onValueChange={(v) => setForm({ ...form, camp_type: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Any camp" /></SelectTrigger>
                  <SelectContent>
                    {CAMP_TYPES.map((c) => (
                      <SelectItem key={c.value || 'any'} value={c.value || '__any__'}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.single_use}
                  onCheckedChange={(v) => setForm({ ...form, single_use: v })}
                />
                <Label>Single-use</Label>
              </div>

              <div>
                <Label>Valid from</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div>
                <Label>Valid to</Label>
                <Input
                  type="date"
                  value={form.valid_to}
                  onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                />
              </div>

              {(formDateCheck.errors.length > 0 || formDateCheck.warnings.length > 0) && (
                <div className="md:col-span-2 space-y-2">
                  {formDateCheck.errors.map((e, i) => (
                    <Alert key={`e-${i}`} variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{e}</AlertDescription>
                    </Alert>
                  ))}
                  {formDateCheck.warnings.map((w, i) => (
                    <Alert key={`w-${i}`} className="border-amber-300 bg-amber-50 text-amber-900">
                      <Clock className="w-4 h-4" />
                      <AlertDescription>{w}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <div>
                <Label>Min total (KES)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_total}
                  onChange={(e) => setForm({ ...form, min_total: e.target.value })}
                />
              </div>
              <div>
                <Label>Min children</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_children}
                  onChange={(e) => setForm({ ...form, min_children: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Reason / note to include in email (optional)</Label>
                <Textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Sibling discount, loyalty thank-you, etc."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-emerald-600">{stats.active}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Redeemed</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{stats.used}</CardContent></Card>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <History className="w-3.5 h-3.5" /> Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Discounts</CardTitle>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="used">Used</TabsTrigger>
                  <TabsTrigger value="revoked">Revoked</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : discounts.filter((d) => filter === 'all' || d.status === filter).length === 0 ? (
                <p className="text-muted-foreground text-sm">No discounts to show.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Camp</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Used / History</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discounts
                        .filter((d) => filter === 'all' || d.status === filter)
                        .map((d) => {
                          const dateCheck = validateDiscountDates(d.valid_from, d.valid_to);
                          const showWarn = d.status === 'active' && (dateCheck.errors.length > 0 || dateCheck.warnings.length > 0);
                          return (
                          <TableRow key={d.id}>
                            <TableCell>
                              <div className="font-medium">{d.client_name || '—'}</div>
                              <div className="text-xs text-muted-foreground">
                                {d.client_email}{d.client_email && d.client_phone ? ' · ' : ''}{d.client_phone}
                              </div>
                            </TableCell>
                            <TableCell>{describeDiscount(d)}</TableCell>
                            <TableCell>{d.camp_type || 'Any'}</TableCell>
                            <TableCell className="text-xs">
                              <div>{d.valid_from || '—'} → {d.valid_to || '—'}</div>
                              {showWarn && (
                                <div className="mt-1 space-y-0.5">
                                  {dateCheck.errors.map((e, i) => (
                                    <div key={`re-${i}`} className="flex items-center gap-1 text-rose-700">
                                      <AlertTriangle className="w-3 h-3" /> {e}
                                    </div>
                                  ))}
                                  {dateCheck.warnings.map((w, i) => (
                                    <div key={`rw-${i}`} className="flex items-center gap-1 text-amber-700">
                                      <Clock className="w-3 h-3" /> {w}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{statusBadge(d.status)}</TableCell>
                            <TableCell className="text-xs">
                              {d.used_at ? (
                                <div className="flex items-start gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-emerald-700">
                                      {new Date(d.used_at).toLocaleDateString()}
                                    </div>
                                    {d.used_amount != null && (
                                      <div className="text-muted-foreground">
                                        Saved KES {Number(d.used_amount).toLocaleString()}
                                      </div>
                                    )}
                                    {d.used_registration_id && (
                                      <div className="text-muted-foreground truncate max-w-[140px]" title={d.used_registration_id}>
                                        Reg: {d.used_registration_id.slice(0, 8)}…
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {d.email_sent ? (
                                <span className="text-emerald-600">Sent</span>
                              ) : (
                                <span className="text-muted-foreground">Not sent</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!d.client_email || sendingId === d.id || d.status !== 'active'}
                                onClick={() => handleSendEmail(d)}
                              >
                                {sendingId === d.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                              </Button>
                              {d.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRevoke(d)}
                                >
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                </Button>
                              )}
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
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Discount Audit Trail
              </CardTitle>
              <Button size="sm" variant="outline" onClick={loadAudit} disabled={auditLoading}>
                {auditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Append-only log of every discount preview, application, rejection, revocation
                and notification. Used for compliance and dispute resolution.
              </p>
              {auditLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : audit.length === 0 ? (
                <p className="text-muted-foreground text-sm">No audit events yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>When</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Camp</TableHead>
                        <TableHead>Amounts</TableHead>
                        <TableHead>Reason / Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audit.map((a) => {
                        const color: Record<string, string> = {
                          previewed: 'bg-sky-100 text-sky-800',
                          applied: 'bg-emerald-100 text-emerald-800',
                          rejected: 'bg-rose-100 text-rose-800',
                          revoked: 'bg-rose-100 text-rose-800',
                          created: 'bg-violet-100 text-violet-800',
                          email_sent: 'bg-blue-100 text-blue-800',
                        };
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(a.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={color[a.event_type] || ''}>{a.event_type}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {a.client_email || a.client_phone || '—'}
                            </TableCell>
                            <TableCell className="text-xs">{a.camp_type || '—'}</TableCell>
                            <TableCell className="text-xs">
                              {a.total_before != null && <>Before: KES {Number(a.total_before).toLocaleString()}<br /></>}
                              {a.discount_amount != null && <>Saved: KES {Number(a.discount_amount).toLocaleString()}<br /></>}
                              {a.total_after != null && <>After: KES {Number(a.total_after).toLocaleString()}</>}
                            </TableCell>
                            <TableCell className="text-xs max-w-xs">
                              {a.reason || '—'}
                              {a.registration_id && (
                                <div className="text-muted-foreground truncate" title={a.registration_id}>
                                  Reg: {a.registration_id.slice(0, 8)}…
                                </div>
                              )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDiscounts;
