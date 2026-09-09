import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, FileText, CheckCircle, RefreshCw, Send, DollarSign, Mail, Receipt } from 'lucide-react';
import { accountsActionService, AccountsActionItem } from '@/services/accountsActionService';
import { campRegistrationService } from '@/services/campRegistrationService';
import { financialService } from '@/services/financialService';
import { invoiceService } from '@/services/invoiceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { formatDistanceToNow } from 'date-fns';

// Helper to get a stable parent key from an action item
const getParentKey = (item: AccountsActionItem) =>
  item.phone || item.email || item.parent_name;

export const PendingCollections: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [items, setItems] = useState<AccountsActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionDialog, setActionDialog] = useState<'invoice' | 'payment' | null>(null);
  const [notes, setNotes] = useState('');
  const [sendingDigest, setSendingDigest] = useState(false);
  // For family-level actions we store the parent key instead of a single item
  const [selectedParentKey, setSelectedParentKey] = useState<string | null>(null);
  // Payment amount input for partial payment support
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  // Date range filter (filters by attendance/check-in date = created_at)
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const handleSendTestDigest = async () => {
    try {
      setSendingDigest(true);
      const { data, error } = await supabase.functions.invoke('daily-pending-digest');
      if (error) throw error;
      if (data?.success === false) {
        toast.error(`Failed: ${data.error || 'Unknown error'}`);
        return;
      }
      if (data?.pendingCount === 0) {
        toast.info('No pending collections to report');
      } else {
        toast.success(`Digest sent! ${data?.pendingCount || 0} items`);
      }
    } catch (error: any) {
      console.error('Error sending digest:', error);
      toast.error(`Failed to send digest: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingDigest(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await accountsActionService.getActionItems({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setItems(data);
    } catch (error) {
      console.error('Error loading action items:', error);
      toast.error('Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, [statusFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('accounts-action-items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_action_items' }, () => loadItems())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [statusFilter]);

  // ── Aggregate by parent ──────────────────────────────────────────────
  const parentAggregates = useMemo(() => {
    const map = new Map<string, {
      totalDue: number;
      totalPaid: number;
      items: AccountsActionItem[];
      parentName: string;
      email: string;
      phone: string;
    }>();
    items.filter(i => i.status === 'pending').forEach(item => {
      const key = getParentKey(item);
      const existing = map.get(key) || {
        totalDue: 0, totalPaid: 0, items: [],
        parentName: item.parent_name,
        email: item.email || '',
        phone: item.phone || '',
      };
      existing.totalDue += item.amount_due;
      existing.totalPaid += item.amount_paid;
      existing.items.push(item);
      map.set(key, existing);
    });
    return map;
  }, [items]);

  // Get family items for the selected parent
  const selectedFamilyItems = useMemo(() => {
    if (!selectedParentKey) return [];
    return parentAggregates.get(selectedParentKey)?.items || [];
  }, [selectedParentKey, parentAggregates]);

  const selectedFamilyBalance = useMemo(() => {
    return selectedFamilyItems.reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);
  }, [selectedFamilyItems]);

  // Track which parent keys are the "first row" so we only show buttons once
  const isFirstRowForParent = useMemo(() => {
    const seen = new Set<string>();
    const map = new Map<string, boolean>();
    items.forEach(item => {
      const key = getParentKey(item);
      map.set(item.id, !seen.has(key));
      seen.add(key);
    });
    return map;
  }, [items]);

  // Check if any items for a parent already have invoices sent
  const parentHasInvoiceSent = (parentKey: string) => {
    const agg = parentAggregates.get(parentKey);
    return agg?.items.some(i => i.invoice_sent) || false;
  };

  // ── Send Family Invoice ──────────────────────────────────────────────
  const handleSendFamilyInvoice = async () => {
    if (!selectedParentKey || !user?.id) return;
    const family = parentAggregates.get(selectedParentKey);
    if (!family || family.items.length === 0) return;

    try {
      // Build children array for consolidated invoice
      const children = family.items.map(item => ({
        childName: item.child_name,
        price: item.amount_due - item.amount_paid,
      }));

      const totalAmount = children.reduce((sum, c) => sum + c.price, 0);
      // Use first item's registration id as the primary reference
      const primaryItem = family.items[0];

      const invoice = await invoiceService.createFromRegistration({
        id: primaryItem.registration_id,
        type: (primaryItem.registration_type as any) || 'camp',
        parentName: family.parentName,
        email: family.email,
        programName: primaryItem.camp_type || 'Camp Program',
        totalAmount,
        children,
      }, user.id);

      // Send one email
      if (family.email) {
        const emailResult = await invoiceService.sendInvoiceEmail(invoice);
        if (!emailResult.success) {
          console.error('Failed to send invoice email:', emailResult.error);
          toast.warning(`Invoice created but email failed: ${emailResult.error}`);
        }
      }

      // Update ALL action items for this parent with the invoice reference
      for (const item of family.items) {
        await accountsActionService.updateActionItem(item.id, {
          invoice_id: invoice.id,
          invoice_sent: true,
          invoice_sent_at: new Date().toISOString(),
          notes: notes || `Invoice ${invoice.invoice_number} sent (family)`,
        });
      }

      toast.success(`Family invoice ${invoice.invoice_number} sent to ${family.parentName} (${family.items.length} children)`);
      closeDialog();
      loadItems();
    } catch (error) {
      console.error('Error creating/sending family invoice:', error);
      toast.error('Failed to create family invoice');
    }
  };

  // ── Record Payment (with partial support) ────────────────────────────
  const handleRecordPayment = async () => {
    if (!selectedParentKey || !user?.id) return;
    const family = parentAggregates.get(selectedParentKey);
    if (!family || family.items.length === 0) return;

    const enteredAmount = parseFloat(paymentAmount) || 0;
    if (enteredAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const familyBalance = family.totalDue - family.totalPaid;
    const isFullPayment = enteredAmount >= familyBalance;

    try {
      const paymentRef = `ACCOUNTS-${Date.now()}`;

      if (isFullPayment) {
        // ── Full payment: mark all items completed ──
        for (const item of family.items) {
          if (item.registration_id) {
            await campRegistrationService.updatePaymentStatus(
              item.registration_id, 'paid', 'mpesa', paymentRef
            );
          }
          if (item.invoice_id) {
            await financialService.updateInvoice(item.invoice_id, { status: 'paid' });
          }
          await accountsActionService.markCompleted(item.id, user.id, notes || 'Full payment recorded');
        }

        // Record one unified payment
        await financialService.createPaymentFromRegistration({
          registrationId: family.items[0].registration_id,
          registrationType: (family.items[0].registration_type || 'camp') as 'camp' | 'program',
          source: 'pending_collections',
          customerName: family.parentName,
          programName: family.items[0].camp_type || 'Camp',
          amount: enteredAmount,
          paymentMethod: 'mpesa',
          paymentReference: paymentRef,
          notes: notes || 'Full family payment from Pending Collections',
          createdBy: user.id,
          invoiceId: family.items[0].invoice_id,
        });

        toast.success(`Full payment of KES ${enteredAmount.toLocaleString()} recorded for ${family.parentName}`);
      } else {
        // ── Partial payment: distribute proportionally across items ──
        let remaining = enteredAmount;

        for (const item of family.items) {
          const itemBalance = item.amount_due - item.amount_paid;
          if (itemBalance <= 0) continue;

          const allocated = Math.min(remaining, itemBalance);
          remaining -= allocated;

          const newAmountPaid = item.amount_paid + allocated;
          const isItemFullyPaid = newAmountPaid >= item.amount_due;

          // Update action item's amount_paid
          await accountsActionService.updateActionItem(item.id, {
            amount_paid: newAmountPaid,
            notes: notes || `Partial payment: KES ${allocated.toLocaleString()} applied`,
            ...(isItemFullyPaid ? {
              status: 'completed' as const,
              completed_at: new Date().toISOString(),
              completed_by: user.id,
            } : {}),
          });

          // Update registration payment status
          if (item.registration_id) {
            await campRegistrationService.updatePaymentStatus(
              item.registration_id,
              isItemFullyPaid ? 'paid' : 'partial',
              isItemFullyPaid ? 'mpesa' : undefined,
              paymentRef
            );
          }

          if (remaining <= 0) break;
        }

        // Record the payment record
        await financialService.createPaymentFromRegistration({
          registrationId: family.items[0].registration_id,
          registrationType: (family.items[0].registration_type || 'camp') as 'camp' | 'program',
          source: 'pending_collections',
          customerName: family.parentName,
          programName: family.items[0].camp_type || 'Camp',
          amount: enteredAmount,
          paymentMethod: 'mpesa',
          paymentReference: paymentRef,
          notes: notes || `Partial payment (KES ${enteredAmount.toLocaleString()} of ${familyBalance.toLocaleString()})`,
          createdBy: user.id,
          invoiceId: family.items[0].invoice_id,
        });

        toast.success(`Partial payment of KES ${enteredAmount.toLocaleString()} recorded for ${family.parentName}. Remaining: KES ${(familyBalance - enteredAmount).toLocaleString()}`);
      }

      closeDialog();
      loadItems();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const handleMarkComplete = async (item: AccountsActionItem) => {
    if (!user?.id) return;
    try {
      await accountsActionService.markCompleted(item.id, user.id, 'Marked complete');
      toast.success('Item marked as complete');
      loadItems();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update');
    }
  };

  const closeDialog = () => {
    setActionDialog(null);
    setSelectedParentKey(null);
    setNotes('');
    setPaymentAmount('');
  };

  const openFamilyAction = (item: AccountsActionItem, action: 'invoice' | 'payment') => {
    const key = getParentKey(item);
    setSelectedParentKey(key);
    setActionDialog(action);
    if (action === 'payment') {
      const agg = parentAggregates.get(key);
      setPaymentAmount(agg ? (agg.totalDue - agg.totalPaid).toString() : (item.amount_due - item.amount_paid).toString());
    }
  };

  const filteredItems = items.filter(item => {
    // Date range filter (created_at ≈ check-in/attendance date)
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      if (new Date(item.created_at) < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      if (new Date(item.created_at) > to) return false;
    }
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.child_name.toLowerCase().includes(search) ||
      item.parent_name.toLowerCase().includes(search) ||
      item.email?.toLowerCase().includes(search) ||
      item.phone?.includes(search)
    );
  });

  const hasActiveFilters = !!(dateFrom || dateTo || searchTerm || statusFilter !== 'all');
  const statsSource = hasActiveFilters ? filteredItems : items;
  const totalPending = statsSource.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedTodayCount = hasActiveFilters
    ? statsSource.filter(i => i.status === 'completed').length
    : items.filter(i => i.status === 'completed' && (i.completed_at || '').slice(0, 10) === todayStr).length;
  const completedLabel = hasActiveFilters ? 'Completed (filtered)' : 'Completed Today';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Collections
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSendTestDigest} disabled={sendingDigest}>
                <Mail className="h-4 w-4 mr-1" />
                {sendingDigest ? 'Sending...' : 'Send Digest'}
              </Button>
              <Button variant="outline" size="sm" onClick={loadItems}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date range filter — by attendance/check-in date */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground">Attended from</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
              />
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground">Attended to</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => {
                const t = new Date().toISOString().slice(0, 10);
                setDateFrom(t); setDateTo(t);
              }}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const now = new Date();
                const start = new Date(now); start.setDate(now.getDate() - now.getDay());
                setDateFrom(start.toISOString().slice(0, 10));
                setDateTo(now.toISOString().slice(0, 10));
              }}>This Week</Button>
              <Button variant="outline" size="sm" onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                setDateFrom(start.toISOString().slice(0, 10));
                setDateTo(now.toISOString().slice(0, 10));
              }}>This Month</Button>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Card className="p-3 bg-orange-50 dark:bg-orange-950/20">
              <div className="text-xl font-bold text-orange-600">
                {statsSource.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pending Items{hasActiveFilters ? ' (filtered)' : ''}</div>
            </Card>
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20">
              <div className="text-xl font-bold text-blue-600">
                KES {totalPending.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Outstanding{hasActiveFilters ? ' (filtered)' : ''}</div>
            </Card>
            <Card className="p-3 bg-green-50 dark:bg-green-950/20 col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-green-600">
                {completedTodayCount}
              </div>
              <div className="text-xs text-muted-foreground">{completedLabel}</div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {statusFilter === 'pending' ? 'No pending collections!' : 'No items found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead className="hidden sm:table-cell">Parent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const parentKey = getParentKey(item);
                    const isFirst = isFirstRowForParent.get(item.id) || false;
                    const agg = parentAggregates.get(parentKey);
                    const familyChildCount = agg?.items.length || 1;
                    const familyBalance = agg ? agg.totalDue - agg.totalPaid : 0;
                    const familyPaid = agg?.totalPaid || 0;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.child_name}</div>
                          <div className="text-xs text-muted-foreground">{item.camp_type}</div>
                          {(item as any).location && (item as any).location !== 'Kurura Gate F' && (
                            <div className="text-xs text-muted-foreground">{(item as any).location}</div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.parent_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{item.phone}</div>
                          <div className="text-xs text-muted-foreground">{item.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">KES {(item.amount_due - item.amount_paid).toLocaleString()}</div>
                          {item.amount_paid > 0 && (
                            <Badge variant="outline" className="text-xs mt-1 bg-amber-50 text-amber-700 border-amber-200">
                              Partial — KES {item.amount_paid.toLocaleString()} paid
                            </Badge>
                          )}
                          {item.status === 'pending' && familyChildCount > 1 && isFirst && (
                            <div className="text-xs font-medium text-red-600 mt-1">
                              Family total: KES {familyBalance.toLocaleString()} ({familyChildCount} children)
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                item.status === 'completed' ? 'default' :
                                item.status === 'in_progress' ? 'secondary' :
                                'outline'
                              }
                              className="text-xs w-fit"
                            >
                              {item.status}
                            </Badge>
                            {item.invoice_sent && (
                              <Badge variant="outline" className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200">
                                <Receipt className="h-3 w-3 mr-1" />
                                Invoice Sent
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              {/* Family Invoice button — only on first row per parent, only if no invoice sent yet */}
                              {isFirst && !parentHasInvoiceSent(parentKey) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openFamilyAction(item, 'invoice')}
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    {familyChildCount > 1 ? 'Family Invoice' : 'Invoice'}
                                  </span>
                                </Button>
                              )}
                              {/* Family Payment button — only on first row per parent */}
                              {isFirst && (
                                <Button
                                  size="sm"
                                  onClick={() => openFamilyAction(item, 'payment')}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  <span className="hidden sm:inline">
                                    {familyPaid > 0 ? `Partial — KES ${familyPaid.toLocaleString()}` : 'Record Payment'}
                                  </span>
                                </Button>
                              )}
                            </div>
                          )}
                          {item.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkComplete(item)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          {item.status === 'completed' && (
                            <span className="text-xs text-muted-foreground">Done</span>
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

      {/* Family Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog === 'invoice' ? 'Send Family Invoice' : 'Record Family Payment'}
            </DialogTitle>
          </DialogHeader>
          {selectedParentKey && selectedFamilyItems.length > 0 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="font-medium">{selectedFamilyItems[0].parent_name}</div>
                <div className="text-sm text-muted-foreground">{selectedFamilyItems[0].email}</div>
                <div className="text-sm text-muted-foreground">{selectedFamilyItems[0].phone}</div>
              </div>

              {/* Children breakdown */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Children</Label>
                {selectedFamilyItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-muted/30 rounded px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{item.child_name}</span>
                      <span className="text-muted-foreground ml-2">({item.camp_type})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">KES {(item.amount_due - item.amount_paid).toLocaleString()}</span>
                      {item.amount_paid > 0 && (
                        <div className="text-xs text-amber-600">KES {item.amount_paid.toLocaleString()} already paid</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center font-bold pt-2 border-t">
                  <span>Total Due</span>
                  <span>KES {selectedFamilyBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment amount input (only for payment dialog) */}
              {actionDialog === 'payment' && (
                <div>
                  <Label>Payment Amount (KES)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount received"
                    min={0}
                    max={selectedFamilyBalance}
                  />
                  {parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < selectedFamilyBalance && (
                    <p className="text-xs text-amber-600 mt-1">
                      Partial payment — KES {(selectedFamilyBalance - parseFloat(paymentAmount)).toLocaleString()} will remain outstanding
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={actionDialog === 'invoice' ? 'Invoice reference or notes...' : 'Payment method, reference...'}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={actionDialog === 'invoice' ? handleSendFamilyInvoice : handleRecordPayment}>
              {actionDialog === 'invoice'
                ? `Send Invoice (${selectedFamilyItems.length} ${selectedFamilyItems.length === 1 ? 'child' : 'children'})`
                : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
