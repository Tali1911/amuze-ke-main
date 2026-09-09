import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CreditCard, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { financialService, Payment, Invoice } from '@/services/financialService';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const PaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'mpesa' as Payment['payment_method'],
    payment_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
    customer_name: '',
    program_name: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [paymentsData, invoicesData] = await Promise.all([
        financialService.getPayments(),
        financialService.getInvoices()
      ]);
      setPayments(paymentsData);
      setInvoices(invoicesData.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled'));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (sourceFilter === 'all') return true;
    return payment.source === sourceFilter;
  });

  const handleCreatePayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Manual payment with optional invoice
      const newPayment: Omit<Payment, 'id' | 'created_at' | 'invoice'> = {
        invoice_id: formData.invoice_id || null,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference,
        payment_date: formData.payment_date,
        status: 'completed',
        notes: formData.notes,
        created_by: user?.id,
        source: formData.invoice_id ? 'invoice' : 'manual',
        customer_name: formData.customer_name || undefined,
        program_name: formData.program_name || undefined
      };

      await financialService.createPayment(newPayment);
      await loadData();
      setIsCreateDialogOpen(false);
      setFormData({
        invoice_id: '',
        amount: '',
        payment_method: 'mpesa',
        payment_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        customer_name: '',
        program_name: ''
      });

      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodLabel = (method: Payment['payment_method']) => {
    const labels: Record<Payment['payment_method'], string> = {
      cash: 'Cash',
      card: 'Card',
      bank_transfer: 'Bank Transfer',
      mpesa: 'M-Pesa',
      cash_ground: 'Cash (Ground)',
      other: 'Other'
    };
    return labels[method] || method;
  };

  const getSourceLabel = (source?: string) => {
    const labels: Record<string, string> = {
      pending_collections: 'Pending Collections',
      ground_registration: 'Ground Registration',
      invoice: 'Invoice',
      camp_registration: 'Camp Registration',
      manual: 'Manual Entry'
    };
    return labels[source || 'manual'] || source || 'Unknown';
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'pending_collections': return 'bg-orange-100 text-orange-800';
      case 'ground_registration': return 'bg-purple-100 text-purple-800';
      case 'invoice': return 'bg-blue-100 text-blue-800';
      case 'camp_registration': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading payments...</div>;
  }

  const totalReceived = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayments = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">All Payments</h2>
          <p className="text-sm text-muted-foreground">Unified view of all payments across the system</p>
        </div>
        <div className="flex gap-2">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="pending_collections">Pending Collections</SelectItem>
              <SelectItem value="ground_registration">Ground Registration</SelectItem>
              <SelectItem value="camp_registration">Camp Registration</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="manual">Manual Entry</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Record a manual payment (optionally against an invoice)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Parent/Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="program_name">Program/Camp</Label>
                  <Input
                    id="program_name"
                    value={formData.program_name}
                    onChange={(e) => setFormData({...formData, program_name: e.target.value})}
                    placeholder="Program or camp name"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice">Invoice (Optional)</Label>
                  <Select value={formData.invoice_id} onValueChange={(value) => setFormData({...formData, invoice_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No invoice</SelectItem>
                      {invoices.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - {invoice.customer_name} (KES {Number(invoice.total_amount).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (KES) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Method *</Label>
                    <Select 
                      value={formData.payment_method} 
                      onValueChange={(value: Payment['payment_method']) => setFormData({...formData, payment_method: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cash_ground">Cash (Ground)</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_reference">Reference</Label>
                    <Input
                      id="payment_reference"
                      value={formData.payment_reference}
                      onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
                      placeholder="Transaction ref"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_date">Date *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePayment}
                  disabled={!formData.amount || !formData.payment_date}
                  className="w-full sm:w-auto"
                >
                  Record Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">KES {totalReceived.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
          <CardDescription className="hidden sm:block">All recorded transactions from all sources</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found.
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-border">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{payment.customer_name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{payment.program_name || payment.payment_reference || 'No ref'}</div>
                      </div>
                      <Badge className={getSourceColor(payment.source)}>
                        {getSourceLabel(payment.source)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">KES {Number(payment.amount).toLocaleString()}</span>
                      <span className="text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{payment.customer_name || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.program_name || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getSourceColor(payment.source)}>
                            {getSourceLabel(payment.source)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getMethodLabel(payment.payment_method)}</TableCell>
                        <TableCell>KES {Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentManagement;
