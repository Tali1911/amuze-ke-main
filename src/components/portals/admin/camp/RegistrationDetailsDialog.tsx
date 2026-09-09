import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CampRegistration } from '@/types/campRegistration';
import { campRegistrationService } from '@/services/campRegistrationService';
import { toast } from 'sonner';
import { Save, User, Mail, Phone, Calendar, DollarSign, FileText, ShieldCheck, ShieldX, Printer } from 'lucide-react';
import { formatShortDate } from '@/utils/dateMapper';
import { printCampReceipt } from '@/utils/printReceipt';
import { resolveCampAmountPaid } from '@/utils/campPayment';

interface RegistrationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: CampRegistration;
  onUpdate: () => void;
}

const derivePaymentStatus = (amountPaid: number, totalAmount: number): 'unpaid' | 'partial' | 'paid' | 'overpaid' => {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid > totalAmount) return 'overpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partial';
};

export const RegistrationDetailsDialog: React.FC<RegistrationDetailsDialogProps> = ({
  open,
  onOpenChange,
  registration,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<CampRegistration['payment_method'] | ''>(
    registration.payment_method === 'pending' ? '' : registration.payment_method
  );
  const [paymentReference, setPaymentReference] = useState(registration.payment_reference || '');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Editable copies of children + discount
  const [editedChildren, setEditedChildren] = useState(registration.children);
  const [discountAmount, setDiscountAmount] = useState<number>(
    Number((registration as any).discount_amount) || 0
  );
  const [discountReason, setDiscountReason] = useState('');

  // Flat-rate camps: do not auto-recalculate from half/full toggles
  const isFlatRateCamp =
    registration.camp_type === 'little-forest' ||
    registration.children?.some((c) => c.activityType === 'archery');

  const HALF_PRICE = 1500;
  const FULL_PRICE = 2500;

  const recomputeChildPrice = (child: typeof editedChildren[number]): number => {
    if (isFlatRateCamp || child.activityType === 'archery') return Number(child.price) || 0;
    const sessions = child.selectedSessions;
    if (Array.isArray(sessions)) {
      // Legacy uniform: derive from each entry
      return sessions.reduce((sum, s) => sum + (s === 'full' ? FULL_PRICE : HALF_PRICE), 0);
    }
    if (sessions && typeof sessions === 'object') {
      return Object.values(sessions as Record<string, 'half' | 'full'>).reduce(
        (sum, s) => sum + (s === 'full' ? FULL_PRICE : HALF_PRICE),
        0
      );
    }
    return Number(child.price) || 0;
  };

  const editedTotal = useMemo(
    () => editedChildren.reduce((s, c) => s + (Number(c.price) || 0), 0),
    [editedChildren]
  );
  const totalAmount = editing ? editedTotal : registration.total_amount || 0;
  const netTotal = Math.max(0, totalAmount - (Number(discountAmount) || 0));

  // Reset edits when dialog reopens
  useEffect(() => {
    if (open) {
      setEditedChildren(registration.children);
      setDiscountAmount(Number((registration as any).discount_amount) || 0);
      setDiscountReason('');
    }
  }, [open, registration]);

  // Load existing payment amount when dialog opens or editing starts
  useEffect(() => {
    if (!open) return;
    const loadExistingPayment = async () => {
      setLoadingPayment(true);
      const gross = registration.total_amount || 0;
      const disc = Number((registration as any).discount_amount) || 0;
      const net = Math.max(0, gross - disc);
      try {
        const amount = await campRegistrationService.getAmountPaidForRegistration(registration.id!);
        setAmountPaid(resolveCampAmountPaid(registration, amount, net));
      } catch {
        setAmountPaid(resolveCampAmountPaid(registration, 0, net));
      } finally {
        setLoadingPayment(false);
      }
    };
    loadExistingPayment();
  }, [open, registration.id, registration.payment_status, registration.billing_doc_type, registration.admin_notes, registration.total_amount]);

  const derivedStatus = useMemo(() => derivePaymentStatus(amountPaid, netTotal), [amountPaid, netTotal]);
  const balanceDue = Math.max(0, netTotal - amountPaid);
  const refundDue = Math.max(0, amountPaid - netTotal);

  const statusBadgeVariant =
    derivedStatus === 'paid' ? 'default'
    : derivedStatus === 'overpaid' ? 'secondary'
    : derivedStatus === 'partial' ? 'secondary'
    : 'destructive';

  const handleSessionChange = (childIdx: number, dateKey: string, newSession: 'half' | 'full') => {
    setEditedChildren((prev) => {
      const next = [...prev];
      const child = { ...next[childIdx] };
      const sessions = child.selectedSessions;
      let updatedSessions: Record<string, 'half' | 'full'>;
      if (Array.isArray(sessions)) {
        // Convert legacy array to keyed map using selectedDates
        const map: Record<string, 'half' | 'full'> = {};
        (child.selectedDates || []).forEach((d, i) => {
          map[d] = (sessions[i] as 'half' | 'full') || 'half';
        });
        updatedSessions = { ...map, [dateKey]: newSession };
      } else {
        updatedSessions = { ...(sessions as Record<string, 'half' | 'full'>), [dateKey]: newSession };
      }
      child.selectedSessions = updatedSessions;
      child.price = recomputeChildPrice(child);
      next[childIdx] = child;
      return next;
    });
  };

  const handleSavePayment = async () => {
    if ((derivedStatus === 'paid' || derivedStatus === 'partial') && (!paymentMethod || paymentMethod === 'pending')) {
      toast.error('Select a payment method (Card, M-Pesa, Cash, or Bank Transfer) before saving.');
      return;
    }
    try {
      setSaving(true);

      // 1. Save children + total if anything was edited
      const childrenChanged =
        JSON.stringify(editedChildren) !== JSON.stringify(registration.children) ||
        editedTotal !== (registration.total_amount || 0);
      if (childrenChanged) {
        await campRegistrationService.updateChildrenAndTotal(
          registration.id!,
          editedChildren,
          editedTotal
        );
      }

      // 2. Save payment + discount
      await campRegistrationService.updatePaymentWithAmount(
        registration.id!,
        amountPaid,
        editedTotal || totalAmount,
        paymentMethod || undefined,
        paymentReference || undefined,
        {
          parentName: registration.parent_name,
          campType: registration.camp_type,
          children: editedChildren,
          discountAmount: Number(discountAmount) || 0,
        }
      );

      // 3. Audit discount in admin notes
      const previousDiscount = Number((registration as any).discount_amount) || 0;
      if ((Number(discountAmount) || 0) !== previousDiscount) {
        const reason = discountReason.trim()
          ? ` – ${discountReason.trim()}`
          : '';
        await campRegistrationService.addAdminNote(
          registration.id!,
          `Discount set to KES ${Number(discountAmount) || 0}${reason}`
        );
      }

      // 4. Audit refund-due when sessions change drops net total below amount paid
      if (childrenChanged) {
        const newNet = Math.max(0, (editedTotal || totalAmount) - (Number(discountAmount) || 0));
        const refund = Math.max(0, amountPaid - newNet);
        if (refund > 0) {
          await campRegistrationService.addAdminNote(
            registration.id!,
            `Sessions changed: new net total KES ${newNet.toFixed(2)}, previously paid KES ${amountPaid.toFixed(2)}. Refund due to client: KES ${refund.toFixed(2)}.`
          );
        }
      }

      toast.success('Registration updated');
      onUpdate();
      setEditing(false);
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update registration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!adminNote.trim()) return;

    try {
      setSaving(true);
      await campRegistrationService.addAdminNote(registration.id!, adminNote);
      toast.success('Note added');
      setAdminNote('');
      onUpdate();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
          <DialogDescription>
            Registration {registration.registration_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Parent Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{registration.parent_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {registration.email}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {registration.phone}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Camp Type</Label>
                <p className="font-medium capitalize">{registration.camp_type.replace('-', ' ')}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Children Information */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Children Registered</h3>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit Registration
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {(editing ? editedChildren : registration.children).map((child, index) => {
                const dates = child.selectedDates || [];
                const sessionsMap: Record<string, 'half' | 'full'> = Array.isArray(child.selectedSessions)
                  ? dates.reduce((acc, d, i) => {
                      acc[d] = ((child.selectedSessions as any)[i] as 'half' | 'full') || 'half';
                      return acc;
                    }, {} as Record<string, 'half' | 'full'>)
                  : (child.selectedSessions as Record<string, 'half' | 'full'>);

                return (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{child.childName}</h4>
                      <Badge>{child.ageRange}</Badge>
                    </div>

                    {editing && !isFlatRateCamp && child.activityType !== 'archery' && dates.length > 0 ? (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Sessions per day (toggle Half / Full to adjust price)
                        </Label>
                        <div className="space-y-1.5">
                          {dates.map((dateStr, i) => {
                            const current = sessionsMap?.[dateStr] || 'half';
                            const dayLabel = child.selectedDays?.[i] || formatShortDate(dateStr);
                            return (
                              <div key={dateStr} className="flex items-center justify-between gap-2 text-sm">
                                <span className="min-w-[140px]">
                                  {dayLabel} <span className="text-muted-foreground">({formatShortDate(dateStr)})</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={current === 'half' ? 'default' : 'outline'}
                                    onClick={() => handleSessionChange(index, dateStr, 'half')}
                                  >
                                    Half (1,500)
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={current === 'full' ? 'default' : 'outline'}
                                    onClick={() => handleSessionChange(index, dateStr, 'full')}
                                  >
                                    Full (2,500)
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-sm pt-1 border-t">
                          <span className="text-muted-foreground">Child subtotal</span>
                          <span className="font-semibold">KES {Number(child.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Days: </span>
                          {child.selectedDays.map((day, idx) => {
                            const dateStr = child.selectedDates?.[idx];
                            return dateStr
                              ? `${day} (${formatShortDate(dateStr)})`
                              : day;
                          }).join(', ')}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sessions: </span>
                          {Array.isArray(child.selectedSessions)
                            ? child.selectedSessions.join(', ')
                            : Object.entries(child.selectedSessions as Record<string, 'half' | 'full'>)
                                .map(([date, session]) => `${formatShortDate(date)}: ${session}`)
                                .join(', ')
                          }
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price: </span>
                          KES {Number(child.price).toFixed(2)}
                        </div>
                        {child.specialNeeds && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Special Needs: </span>
                            {child.specialNeeds}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {editing && (
              <div className="flex justify-end mt-3 text-sm">
                <span className="text-muted-foreground mr-2">Registration total:</span>
                <span className="font-semibold">KES {editedTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Information
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  printCampReceipt({
                    registration,
                    amountPaid,
                    totalAmount,
                    discountAmount: Number((registration as any).discount_amount) || 0,
                    paymentMethod: registration.payment_method,
                    paymentReference: registration.payment_reference || undefined,
                  })
                }
                disabled={loadingPayment}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
            </div>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={totalAmount}
                      step={1}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Net total: KES {netTotal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label>Discount reason (optional)</Label>
                    <Input
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g. sibling discount, loyalty"
                    />
                  </div>
                </div>

                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross total</span>
                    <span>KES {totalAmount.toFixed(2)}</span>
                  </div>
                  {Number(discountAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>− KES {Number(discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Net total</span>
                    <span>KES {netTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previously paid</span>
                    <span>KES {amountPaid.toFixed(2)}</span>
                  </div>
                  {refundDue > 0 && (
                    <div className="flex justify-between font-semibold border-t pt-1 text-amber-700 dark:text-amber-400">
                      <span>Refund due to client</span>
                      <span>KES {refundDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount Paid (KES)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                    />
                    {refundDue > 0 ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
                        Refund due: KES {refundDue.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Balance: KES {balanceDue.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Auto Status</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={statusBadgeVariant} className="text-sm">
                        {derivedStatus.toUpperCase()}
                      </Badge>
                      {derivedStatus === 'partial' && (
                        <span className="text-sm text-muted-foreground">
                          Balance: KES {balanceDue.toFixed(2)}
                        </span>
                      )}
                      {derivedStatus === 'overpaid' && (
                        <span className="text-sm text-amber-700 dark:text-amber-400">
                          Refund: KES {refundDue.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa (Paybill / Till)</SelectItem>
                        <SelectItem value="card">Card (Paystack / POS)</SelectItem>
                        <SelectItem value="cash_ground">Cash (at gate)</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Enter payment reference number"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePayment} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Total:</span>
                  <span className="font-bold text-lg">KES {totalAmount.toFixed(2)}</span>
                </div>
                {Number((registration as any).discount_amount) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="font-semibold">
                        − KES {Number((registration as any).discount_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Net Total:</span>
                      <span className="font-bold">KES {netTotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold">
                    {loadingPayment ? '...' : `KES ${amountPaid.toFixed(2)}`}
                  </span>
                </div>
                {balanceDue > 0 && !loadingPayment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance Due:</span>
                    <span className="font-semibold text-destructive">KES {balanceDue.toFixed(2)}</span>
                  </div>
                )}
                {refundDue > 0 && !loadingPayment && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refund Due to Client:</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      KES {refundDue.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={statusBadgeVariant}>
                    {(loadingPayment ? registration.payment_status : derivedStatus).toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span className="capitalize">{registration.payment_method.replace('_', ' ')}</span>
                </div>
                {registration.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono text-sm">{registration.payment_reference}</span>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Edit Registration
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Admin Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Admin Notes
            </h3>
            {registration.admin_notes && (
              <div className="bg-muted p-3 rounded-md mb-3 whitespace-pre-wrap text-sm">
                {registration.admin_notes}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about this registration..."
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={saving || !adminNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>

          {/* Consent Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {registration.consent_given ? (
                <ShieldCheck className="h-5 w-5 text-green-600" />
              ) : (
                <ShieldX className="h-5 w-5 text-amber-500" />
              )}
              Photography & Video Consent
            </h3>
            <Badge variant={registration.consent_given ? 'default' : 'secondary'}>
              {registration.consent_given ? 'Consent Given' : 'Not Consented'}
            </Badge>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Registered: {new Date(registration.created_at!).toLocaleString()}</span>
            </div>
            <div>Registration Type: {registration.registration_type.replace('_', ' ')}</div>
            <div>Status: {registration.status}</div>
            <div className="pt-2 mt-2 border-t">
              <div>
                Billing Document:{' '}
                <Badge
                  variant={registration.billing_doc_type === 'paid' ? 'default' : registration.billing_doc_type === 'invoice' ? 'secondary' : 'outline'}
                  className="ml-1"
                >
                  {(registration.billing_doc_type || (registration.payment_status === 'paid' ? 'paid' : 'quotation')).toUpperCase()}
                </Badge>
              </div>
              {registration.quote_number && (
                <div>Quotation #: <span className="font-mono">{registration.quote_number}</span></div>
              )}
              {registration.invoice_number && (
                <div>Invoice #: <span className="font-mono">{registration.invoice_number}</span></div>
              )}
              {registration.converted_to_invoice_at && (
                <div>Converted to invoice: {new Date(registration.converted_to_invoice_at).toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
