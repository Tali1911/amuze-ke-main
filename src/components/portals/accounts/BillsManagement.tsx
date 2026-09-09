import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, DollarSign, Search, FileText, AlertTriangle, CheckCircle, Clock, CreditCard, Download } from 'lucide-react';
import { vendorBillService, Bill, Vendor, BillPayment } from '@/services/vendorBillService';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BILL_CATEGORIES = [
  'Office Supplies',
  'Utilities',
  'Equipment',
  'Food & Catering',
  'Transportation',
  'Professional Services',
  'Maintenance',
  'IT Services',
  'Marketing',
  'Rent',
  'Insurance',
  'Other'
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'M-Pesa',
  'Cash',
  'Cheque',
  'Credit Card'
];

export const BillsManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const isMobile = useIsMobile();

  const [formData, setFormData] = useState({
    vendor_id: '',
    bill_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: '',
    amount: '',
    description: '',
    category: 'Office Supplies',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    payment_method: 'Bank Transfer',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [billsData, vendorsData, summaryData] = await Promise.all([
        vendorBillService.getBills(),
        vendorBillService.getVendors(),
        vendorBillService.getAccountsPayableSummary()
      ]);
      setBills(billsData);
      setVendors(vendorsData);
      setSummary(summaryData);
    } catch (error) {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: '',
      bill_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      amount: '',
      description: '',
      category: 'Office Supplies',
      notes: ''
    });
    setEditingBill(null);
  };

  const handleOpenDialog = (bill?: Bill) => {
    if (bill) {
      setEditingBill(bill);
      setFormData({
        vendor_id: bill.vendor_id,
        bill_date: bill.bill_date,
        due_date: bill.due_date,
        amount: bill.amount.toString(),
        description: bill.description,
        category: bill.category,
        notes: bill.notes || ''
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.vendor_id || !formData.amount || !formData.due_date) {
      toast({ title: 'Vendor, amount, and due date are required', variant: 'destructive' });
      return;
    }

    try {
      if (editingBill) {
        await vendorBillService.updateBill(editingBill.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        });
        toast({ title: 'Bill updated successfully' });
      } else {
        await vendorBillService.createBill({
          ...formData,
          amount: parseFloat(formData.amount),
          amount_paid: 0,
          status: 'pending'
        });
        toast({ title: 'Bill created successfully' });
      }
      loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Error saving bill', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await vendorBillService.deleteBill(id);
      toast({ title: 'Bill deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error deleting bill', variant: 'destructive' });
    }
  };

  const openPaymentDialog = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setPaymentData({
      amount: (bill.amount - bill.amount_paid).toString(),
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'Bank Transfer',
      reference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedBillForPayment || !paymentData.amount || !paymentData.reference) {
      toast({ title: 'Amount and reference are required', variant: 'destructive' });
      return;
    }

    try {
      await vendorBillService.recordBillPayment({
        bill_id: selectedBillForPayment.id,
        amount: parseFloat(paymentData.amount),
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference: paymentData.reference,
        notes: paymentData.notes
      });
      toast({ title: 'Payment recorded successfully' });
      loadData();
      setIsPaymentDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error recording payment', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      partial: 'outline',
      overdue: 'destructive',
      cancelled: 'secondary',
      draft: 'outline'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = 
      b.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const generateBillStatementPDF = async (bill: Bill) => {
    const doc = new jsPDF();
    const vendorName = bill.vendor?.name || 'Unknown Vendor';

    // Header
    doc.setFontSize(18);
    doc.text('Bill Statement', 14, 20);
    doc.setFontSize(10);
    doc.text(`Bill #: ${bill.bill_number}`, 14, 30);
    doc.text(`Vendor: ${vendorName}`, 14, 36);
    doc.text(`Category: ${bill.category || 'N/A'}`, 14, 42);
    doc.text(`Bill Date: ${format(new Date(bill.bill_date), 'dd MMM yyyy')}`, 14, 48);
    doc.text(`Due Date: ${format(new Date(bill.due_date), 'dd MMM yyyy')}`, 14, 54);
    doc.text(`Statement Date: ${format(new Date(), 'dd MMM yyyy')}`, 130, 30);
    doc.text(`Status: ${bill.status.toUpperCase()}`, 130, 36);

    // Summary
    doc.setFontSize(11);
    doc.text(`Amount: ${formatCurrency(bill.amount)}`, 130, 46);
    doc.text(`Paid: ${formatCurrency(bill.amount_paid)}`, 130, 52);
    doc.text(`Balance: ${formatCurrency(bill.amount - bill.amount_paid)}`, 130, 58);

    if (bill.description) {
      doc.setFontSize(9);
      doc.text(`Description: ${bill.description}`, 14, 64);
    }

    // Fetch payments for this bill
    let payments: BillPayment[] = [];
    try {
      payments = await vendorBillService.getBillPayments(bill.id);
    } catch (e) {
      console.error('Error fetching bill payments:', e);
    }

    const startY = bill.description ? 72 : 66;

    if (payments.length > 0) {
      doc.setFontSize(12);
      doc.text('Payment History', 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Date', 'Method', 'Reference', 'Amount']],
        body: payments.map(p => [
          format(new Date(p.payment_date), 'dd MMM yyyy'),
          p.payment_method,
          p.reference || '—',
          formatCurrency(p.amount),
        ]),
        foot: [['', '', 'Total Paid', formatCurrency(bill.amount_paid)]],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 87, 60] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    } else {
      doc.setFontSize(10);
      doc.text('No payments recorded.', 14, startY);
    }

    doc.save(`Bill_Statement_${bill.bill_number}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Bill statement downloaded' });
  };

  const generateAllBillsStatementPDF = async () => {
    if (filteredBills.length === 0) {
      toast({ title: 'No bills to export', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Bills Statement Summary', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 28);
    doc.text(`Total Bills: ${filteredBills.length}`, 14, 34);

    const totalAmount = filteredBills.reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = filteredBills.reduce((sum, b) => sum + b.amount_paid, 0);
    const totalBalance = totalAmount - totalPaid;

    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 130, 28);
    doc.text(`Total Paid: ${formatCurrency(totalPaid)}`, 130, 34);
    doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, 130, 40);

    autoTable(doc, {
      startY: 48,
      head: [['Bill #', 'Vendor', 'Category', 'Bill Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Status']],
      body: filteredBills.map(bill => [
        bill.bill_number,
        bill.vendor?.name || 'N/A',
        bill.category || 'N/A',
        format(new Date(bill.bill_date), 'dd MMM yyyy'),
        format(new Date(bill.due_date), 'dd MMM yyyy'),
        formatCurrency(bill.amount),
        formatCurrency(bill.amount_paid),
        formatCurrency(bill.amount - bill.amount_paid),
        bill.status,
      ]),
      foot: [['', '', '', '', 'Totals', formatCurrency(totalAmount), formatCurrency(totalPaid), formatCurrency(totalBalance), '']],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 87, 60] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    doc.save(`Bills_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'All bills statement downloaded' });
  };

  const BillCard = ({ bill }: { bill: Bill }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-semibold">{bill.bill_number}</div>
            <div className="text-sm text-muted-foreground">{bill.vendor?.name}</div>
          </div>
          {getStatusBadge(bill.status)}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Amount:</span>
            <div className="font-medium">{formatCurrency(bill.amount)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Balance:</span>
            <div className="font-medium">{formatCurrency(bill.amount - bill.amount_paid)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Bill Date:</span>
            <div>{format(new Date(bill.bill_date), 'dd MMM yyyy')}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Due Date:</span>
            <div>{format(new Date(bill.due_date), 'dd MMM yyyy')}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bill.status !== 'paid' && bill.status !== 'cancelled' && (
            <Button size="sm" onClick={() => openPaymentDialog(bill)}>
              <CreditCard className="h-4 w-4 mr-1" /> Pay
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => generateBillStatementPDF(bill)}>
            <Download className="h-4 w-4 mr-1" /> Statement
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleOpenDialog(bill)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(bill.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Bills & Accounts Payable</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAllBillsStatementPDF}>
            <Download className="h-4 w-4 mr-2" /> Download All
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" /> New Bill
              </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Vendor *</Label>
                  <Select value={formData.vendor_id} onValueChange={(v) => setFormData({ ...formData, vendor_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.filter(v => v.status === 'active').map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bill Date</Label>
                  <Input
                    type="date"
                    value={formData.bill_date}
                    onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Amount (KES) *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILL_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Bill description"
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingBill ? 'Update' : 'Create'} Bill</Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Total Outstanding</div>
                  <div className="text-lg font-bold">{formatCurrency(summary.totalOutstanding)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-xs text-muted-foreground">Overdue ({summary.overdueCount})</div>
                  <div className="text-lg font-bold">{formatCurrency(summary.overdueAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Due This Week ({summary.dueThisWeekCount})</div>
                  <div className="text-lg font-bold">{formatCurrency(summary.dueThisWeekAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Pending Bills</div>
                  <div className="text-lg font-bold">{summary.pendingBills}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="text-center py-8">Loading bills...</div>
      ) : isMobile ? (
        <div>
          {filteredBills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))}
          {filteredBills.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No bills found</p>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Bill Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map(bill => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.bill_number}</TableCell>
                    <TableCell>{bill.vendor?.name}</TableCell>
                    <TableCell><Badge variant="outline">{bill.category}</Badge></TableCell>
                    <TableCell>{format(new Date(bill.bill_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(bill.due_date), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(bill.amount - bill.amount_paid)}</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {bill.status !== 'paid' && bill.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" onClick={() => openPaymentDialog(bill)} title="Record Payment">
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => generateBillStatementPDF(bill)} title="Download Statement">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(bill)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(bill.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBills.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedBillForPayment && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Bill:</span>
                  <span className="font-medium">{selectedBillForPayment.bill_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendor:</span>
                  <span>{selectedBillForPayment.vendor?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due:</span>
                  <span className="font-medium">{formatCurrency(selectedBillForPayment.amount - selectedBillForPayment.amount_paid)}</span>
                </div>
              </div>
              <div className="grid gap-4">
                <div>
                  <Label>Payment Amount (KES) *</Label>
                  <Input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={paymentData.payment_date}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentData.payment_method} onValueChange={(v) => setPaymentData({ ...paymentData, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference # *</Label>
                  <Input
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Transaction reference"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Payment notes"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillsManagement;
