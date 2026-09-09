import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, DollarSign, Calendar, Send, Trash2, Download, Mail, Percent, FileQuestion, FileDown, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { financialService, Invoice } from '@/services/financialService';
import { invoiceService, InvoiceItem, InvoiceWithItems } from '@/services/invoiceService';
import { quotationService } from '@/services/quotationService';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';

const toCSV = (headers: string[], rows: (string | number)[][]) => {
  const escape = (v: any) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
};

const downloadCSV = (filename: string, csv: string) => {
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
};

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<CampRegistration[]>([]);
  const [systemInvoices, setSystemInvoices] = useState<CampRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'invoices' | 'quotations'>('system');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sendingQuote, setSendingQuote] = useState<string | null>(null);
  const [sendingSystemInv, setSendingSystemInv] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    discount_percent: '0',
    tax_percent: '0'
  });

  const [lineItems, setLineItems] = useState<Omit<InvoiceItem, 'id' | 'invoice_id'>[]>([
    { description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }
  ]);

  // ===== Filters (per tab) =====
  type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name_asc' | 'name_desc';
  interface FilterState {
    name: string;
    email: string;
    activity: string; // camp_type for reg-based; program for manual invoices
    dateFrom: string; // YYYY-MM-DD
    dateTo: string;   // YYYY-MM-DD
    sort: SortKey;
  }
  const emptyFilter: FilterState = { name: '', email: '', activity: 'all', dateFrom: '', dateTo: '', sort: 'date_desc' };
  const [systemFilter, setSystemFilter] = useState<FilterState>(emptyFilter);
  const [invoiceFilter, setInvoiceFilter] = useState<FilterState>(emptyFilter);
  const [quoteFilter, setQuoteFilter] = useState<FilterState>(emptyFilter);

  const inDateRange = (iso: string | undefined, from: string, to: string) => {
    if (!from && !to) return true;
    if (!iso) return false;
    const d = new Date(iso).getTime();
    if (from && d < new Date(from).getTime()) return false;
    if (to && d > new Date(to).getTime() + 86_399_000) return false;
    return true;
  };

  const matchesText = (val: string | undefined | null, q: string) =>
    !q || (val || '').toLowerCase().includes(q.toLowerCase());

  const sortRegs = (arr: CampRegistration[], sort: SortKey, dateField: 'created_at' | 'converted_to_invoice_at' = 'created_at') => {
    const copy = [...arr];
    copy.sort((a, b) => {
      switch (sort) {
        case 'date_asc':   return new Date(a[dateField] || a.created_at || 0).getTime() - new Date(b[dateField] || b.created_at || 0).getTime();
        case 'date_desc':  return new Date(b[dateField] || b.created_at || 0).getTime() - new Date(a[dateField] || a.created_at || 0).getTime();
        case 'amount_asc': return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
        case 'amount_desc':return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
        case 'name_asc':   return (a.parent_name || '').localeCompare(b.parent_name || '');
        case 'name_desc':  return (b.parent_name || '').localeCompare(a.parent_name || '');
      }
    });
    return copy;
  };

  const sortInvoices = (arr: Invoice[], sort: SortKey) => {
    const copy = [...arr];
    copy.sort((a, b) => {
      switch (sort) {
        case 'date_asc':   return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'date_desc':  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'amount_asc': return (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
        case 'amount_desc':return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
        case 'name_asc':   return (a.customer_name || '').localeCompare(b.customer_name || '');
        case 'name_desc':  return (b.customer_name || '').localeCompare(a.customer_name || '');
      }
    });
    return copy;
  };

  const campTypes = useMemo(() => {
    const set = new Set<string>();
    [...systemInvoices, ...quotations].forEach(r => r.camp_type && set.add(r.camp_type));
    return Array.from(set).sort();
  }, [systemInvoices, quotations]);

  const programNames = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(i => i.program_name && set.add(i.program_name));
    return Array.from(set).sort();
  }, [invoices]);

  const filteredSystemInvoices = useMemo(() => {
    const f = systemFilter;
    const filtered = systemInvoices.filter(r =>
      matchesText(r.parent_name, f.name) &&
      matchesText(r.email, f.email) &&
      (f.activity === 'all' || r.camp_type === f.activity) &&
      inDateRange(r.converted_to_invoice_at || r.created_at, f.dateFrom, f.dateTo)
    );
    return sortRegs(filtered, f.sort, 'converted_to_invoice_at');
  }, [systemInvoices, systemFilter]);

  const filteredInvoices = useMemo(() => {
    const f = invoiceFilter;
    const filtered = invoices.filter(i =>
      matchesText(i.customer_name, f.name) &&
      matchesText(i.customer_email, f.email) &&
      (f.activity === 'all' || i.program_name === f.activity) &&
      inDateRange(i.created_at, f.dateFrom, f.dateTo)
    );
    return sortInvoices(filtered, f.sort);
  }, [invoices, invoiceFilter]);

  const filteredQuotations = useMemo(() => {
    const f = quoteFilter;
    const filtered = quotations.filter(q =>
      matchesText(q.parent_name, f.name) &&
      matchesText(q.email, f.email) &&
      (f.activity === 'all' || q.camp_type === f.activity) &&
      inDateRange(q.created_at, f.dateFrom, f.dateTo)
    );
    return sortRegs(filtered, f.sort, 'created_at');
  }, [quotations, quoteFilter]);

  const FilterBar: React.FC<{
    value: FilterState;
    onChange: (v: FilterState) => void;
    activityOptions: string[];
    activityLabel?: string;
  }> = ({ value, onChange, activityOptions, activityLabel = 'Activity' }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 p-3 sm:p-4 border-b bg-muted/30">
      <Input
        placeholder="Filter by name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <Input
        placeholder="Filter by email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
      />
      <Select value={value.activity} onValueChange={(v) => onChange({ ...value, activity: v })}>
        <SelectTrigger><SelectValue placeholder={activityLabel} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {activityLabel.toLowerCase()}s</SelectItem>
          {activityOptions.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={value.dateFrom}
        onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
        title="From date"
      />
      <Input
        type="date"
        value={value.dateTo}
        onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
        title="To date"
      />
      <div className="flex gap-2">
        <Select value={value.sort} onValueChange={(v) => onChange({ ...value, sort: v as SortKey })}>
          <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest first</SelectItem>
            <SelectItem value="date_asc">Oldest first</SelectItem>
            <SelectItem value="amount_desc">Amount (high→low)</SelectItem>
            <SelectItem value="amount_asc">Amount (low→high)</SelectItem>
            <SelectItem value="name_asc">Name (A→Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z→A)</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilter)} title="Clear filters">Clear</Button>
      </div>
    </div>
  );


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesData, quotationsData, systemInvData] = await Promise.all([
        financialService.getInvoices(),
        quotationService.listQuotations().catch((e) => {
          console.error('Error loading quotations:', e);
          return [] as CampRegistration[];
        }),
        quotationService.listSystemInvoices().catch((e) => {
          console.error('Error loading system invoices:', e);
          return [] as CampRegistration[];
        }),
      ]);
      setInvoices(invoicesData);
      setQuotations(quotationsData);
      setSystemInvoices(systemInvData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate line total
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].unit_price) || 0;
    const discount = Number(updated[index].discount_percent) || 0;
    updated[index].line_total = invoiceService.calculateLineTotal(qty, price, discount);
    updated[index].discount_amount = (qty * price) * (discount / 100);
    
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    return invoiceService.calculateInvoiceTotals(
      lineItems,
      Number(formData.discount_percent) || 0,
      Number(formData.tax_percent) || 0
    );
  };

  const handleCreateInvoice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const totals = calculateTotals();

      await invoiceService.createInvoiceWithItems(
        {
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          program_name: lineItems.map(i => i.description).join(', '),
          ...totals,
          due_date: formData.due_date,
          status: 'draft',
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          created_by: user?.id
        },
        lineItems.filter(item => item.description && item.unit_price > 0)
      );

      await loadData();
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: "Success",
        description: "Invoice created successfully.",
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_email: '',
      due_date: '',
      payment_terms: 'Net 30',
      notes: '',
      discount_percent: '0',
      tax_percent: '0'
    });
    setLineItems([{ description: '', quantity: 1, unit_price: 0, discount_percent: 0, discount_amount: 0, line_total: 0 }]);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const fullInvoice = await invoiceService.getInvoiceWithItems(invoice.id);
      if (fullInvoice) {
        invoiceService.downloadPDF(fullInvoice);
        toast({ title: "PDF Downloaded", description: `Invoice ${invoice.invoice_number} downloaded.` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to download PDF.", variant: "destructive" });
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.customer_email) {
      toast({ title: "Error", description: "No customer email provided.", variant: "destructive" });
      return;
    }

    setSendingEmail(invoice.id);
    try {
      const fullInvoice = await invoiceService.getInvoiceWithItems(invoice.id);
      if (!fullInvoice) throw new Error('Invoice not found');

      const result = await invoiceService.sendInvoiceEmail(fullInvoice);
      
      if (result.success) {
        await loadData();
        toast({ title: "Invoice Sent", description: `Invoice emailed to ${invoice.customer_email}` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email.", variant: "destructive" });
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await financialService.deleteInvoice(invoice.id);
      await loadData();
      toast({ title: "Deleted", description: `Invoice ${invoice.invoice_number} deleted.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete invoice.", variant: "destructive" });
    }
  };

  // ===== Quotation handlers =====
  const handleDownloadQuotation = (reg: CampRegistration) => {
    try {
      const shape = quotationService.buildInvoiceShape(reg);
      invoiceService.downloadPDF(shape, 'quotation');
      toast({ title: "Quotation Downloaded", description: `Quote ${shape.invoice_number} downloaded.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to download quotation.", variant: "destructive" });
    }
  };

  const handleSendQuotation = async (reg: CampRegistration) => {
    if (!reg.email) {
      toast({ title: "Error", description: "No customer email on file.", variant: "destructive" });
      return;
    }
    setSendingQuote(reg.id!);
    try {
      const shape = quotationService.buildInvoiceShape(reg);
      const result = await invoiceService.sendInvoiceEmail(shape, 'quotation');
      if (result.success) {
        toast({ title: "Quotation Sent", description: `Quote emailed to ${reg.email}` });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send quotation.", variant: "destructive" });
    } finally {
      setSendingQuote(null);
    }
  };

  const handleDeleteQuotation = async (reg: CampRegistration) => {
    if (!confirm(`Delete quotation ${reg.quote_number || reg.registration_number}? The registration will be cancelled and removed from the quotations list.`)) return;
    try {
      await quotationService.deleteQuotation(reg.id!);
      await loadData();
      toast({ title: "Deleted", description: `Quotation ${reg.quote_number || ''} removed.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete quotation.", variant: "destructive" });
    }
  };

  // ===== System invoice handlers (attended but unpaid registrations) =====
  const handleDownloadSystemInvoice = (reg: CampRegistration) => {
    try {
      const shape = quotationService.buildInvoiceShape(reg);
      shape.invoice_number = reg.invoice_number || shape.invoice_number;
      invoiceService.downloadPDF(shape, 'invoice');
      toast({ title: "Invoice Downloaded", description: `Invoice ${shape.invoice_number} downloaded.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to download invoice.", variant: "destructive" });
    }
  };

  const handleSendSystemInvoice = async (reg: CampRegistration) => {
    if (!reg.email) {
      toast({ title: "Error", description: "No customer email on file.", variant: "destructive" });
      return;
    }
    setSendingSystemInv(reg.id!);
    try {
      const shape = quotationService.buildInvoiceShape(reg);
      shape.invoice_number = reg.invoice_number || shape.invoice_number;
      const result = await invoiceService.sendInvoiceEmail(shape, 'invoice');
      if (result.success) {
        toast({ title: "Invoice Sent", description: `Invoice emailed to ${reg.email}` });
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send invoice.", variant: "destructive" });
    } finally {
      setSendingSystemInv(null);
    }
  };

  const handleDeleteSystemInvoice = async (reg: CampRegistration) => {
    if (!confirm(`Delete invoice ${reg.invoice_number || reg.registration_number}? The underlying registration will be cancelled.`)) return;
    try {
      await quotationService.deleteQuotation(reg.id!);
      await loadData();
      toast({ title: "Deleted", description: `Invoice ${reg.invoice_number || ''} removed.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete invoice.", variant: "destructive" });
    }
  };

  // ===== Mark as Paid =====
  const handleMarkInvoicePaid = async (invoice: Invoice) => {
    if (invoice.status === 'paid') return;
    if (!confirm(`Mark invoice ${invoice.invoice_number} as PAID? This updates the ledger across the system.`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Record a payment so revenue / reports stay in sync
      try {
        await financialService.createPayment({
          invoice_id: invoice.id,
          amount: Number(invoice.total_amount) || 0,
          payment_method: 'other',
          payment_date: new Date().toISOString().split('T')[0],
          notes: 'Marked paid from Invoice Management',
          created_by: user?.id,
        } as any);
      } catch (e) {
        // Fallback: at minimum flip the invoice status
        await financialService.updateInvoice(invoice.id, { status: 'paid' });
      }
      await loadData();
      toast({ title: 'Marked Paid', description: `Invoice ${invoice.invoice_number} marked as paid.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to mark as paid.', variant: 'destructive' });
    }
  };

  const handleMarkRegistrationPaid = async (reg: CampRegistration, label: 'invoice' | 'quotation') => {
    const docNum = reg.invoice_number || reg.quote_number || reg.registration_number;
    if (!confirm(`Mark ${label} ${docNum} as PAID? This will update the registration and reflect everywhere (attendance, reports, client portal).`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await campRegistrationService.updatePaymentStatus(
        reg.id!,
        'paid',
        'cash_ground',
        `MANUAL-${Date.now()}`,
        {
          createPaymentRecord: true,
          parentName: reg.parent_name,
          campType: reg.camp_type,
          totalAmount: Number(reg.total_amount) || 0,
          createdBy: user?.id,
        }
      );
      await loadData();
      toast({ title: 'Marked Paid', description: `${label === 'invoice' ? 'Invoice' : 'Quotation'} ${docNum} marked as paid.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to mark as paid.', variant: 'destructive' });
    }
  };

  // ===== CSV exports (use filtered lists so users export exactly what they see) =====
  const exportSystemInvoicesCSV = () => {
    const rows = filteredSystemInvoices.map(r => [
      r.invoice_number || r.registration_number || '',
      r.parent_name, r.email || '', r.phone || '',
      r.camp_type, r.children?.length || 0,
      Number(r.total_amount) || 0, r.payment_status,
      r.converted_to_invoice_at ? new Date(r.converted_to_invoice_at).toISOString() : '',
      r.created_at ? new Date(r.created_at).toISOString() : '',
    ]);
    downloadCSV(`system-invoices-${new Date().toISOString().split('T')[0]}.csv`,
      toCSV(['Invoice #','Customer','Email','Phone','Camp','Children','Amount (KES)','Payment Status','Converted At','Registered At'], rows));
    toast({ title: 'Exported', description: `${rows.length} system invoice(s) exported.` });
  };

  const exportManualInvoicesCSV = () => {
    const rows = filteredInvoices.map(i => [
      i.invoice_number, i.customer_name, i.customer_email || '',
      i.program_name || '', Number(i.total_amount) || 0, i.status,
      i.due_date ? new Date(i.due_date).toISOString().split('T')[0] : '',
      i.created_at ? new Date(i.created_at).toISOString() : '',
    ]);
    downloadCSV(`manual-invoices-${new Date().toISOString().split('T')[0]}.csv`,
      toCSV(['Invoice #','Customer','Email','Program','Amount (KES)','Status','Due Date','Created At'], rows));
    toast({ title: 'Exported', description: `${rows.length} manual invoice(s) exported.` });
  };

  const exportQuotationsCSV = () => {
    const rows = filteredQuotations.map(q => [
      q.quote_number || q.registration_number || '',
      q.parent_name, q.email || '', q.phone || '',
      q.camp_type, q.children?.length || 0,
      Number(q.total_amount) || 0,
      q.created_at ? new Date(q.created_at).toISOString() : '',
    ]);
    downloadCSV(`quotations-${new Date().toISOString().split('T')[0]}.csv`,
      toCSV(['Quote #','Customer','Email','Phone','Camp','Children','Amount (KES)','Issued At'], rows));
    toast({ title: 'Exported', description: `${rows.length} quotation(s) exported.` });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const totals = calculateTotals();

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Invoice Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage invoices</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription className="hidden sm:block">Add line items, apply discounts, and generate professional invoices</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer_email">Customer Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="customer@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Select value={formData.payment_terms} onValueChange={(value) => setFormData({...formData, payment_terms: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 7">Net 7</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-3 sm:hidden">
                  {lineItems.map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price || ''}
                            onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Disc %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount_percent || ''}
                            onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total: KES {item.line_total.toLocaleString()}</span>
                        {lineItems.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead className="w-[12%]">Qty</TableHead>
                        <TableHead className="w-[18%]">Unit Price</TableHead>
                        <TableHead className="w-[12%]">Discount %</TableHead>
                        <TableHead className="w-[15%] text-right">Total</TableHead>
                        <TableHead className="w-[3%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              placeholder="Service description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.unit_price || ''}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discount_percent || ''}
                              onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            KES {item.line_total.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {lineItems.length > 1 && (
                              <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Discounts and Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_percent">Overall Discount %</Label>
                  <div className="relative">
                    <Input
                      id="discount_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({...formData, discount_percent: e.target.value})}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax_percent">Tax %</Label>
                  <div className="relative">
                    <Input
                      id="tax_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tax_percent}
                      onChange={(e) => setFormData({...formData, tax_percent: e.target.value})}
                      className="pr-8"
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KES {totals.subtotal.toLocaleString()}</span>
                </div>
                {totals.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({formData.discount_percent}%):</span>
                    <span>-KES {totals.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                {totals.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({formData.tax_percent}%):</span>
                    <span>KES {totals.tax_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>KES {totals.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes for the customer..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateInvoice}
                disabled={!formData.customer_name || !formData.customer_email || !formData.due_date || lineItems.every(i => !i.description)}
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Invoices</CardTitle>
            <FileText className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              KES {systemInvoices.reduce((s, r) => s + Number(r.total_amount || 0), 0).toLocaleString()} owed (attended, unpaid)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">
              KES {invoices.reduce((s, inv) => s + Number(inv.total_amount || 0), 0).toLocaleString()} total billed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid (Manual)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.filter(inv => inv.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              KES {invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount), 0).toLocaleString()} collected
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue (Manual)</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {invoices.filter(inv => inv.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: System Invoices / Manual Invoices / Quotations */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'system' | 'invoices' | 'quotations')}>
        <TabsList>
          <TabsTrigger value="system" className="gap-2">
            <FileText className="h-4 w-4" />
            System Invoices
            <Badge variant="secondary" className="ml-1">{systemInvoices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Manual Invoices
            <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="quotations" className="gap-2">
            <FileQuestion className="h-4 w-4" />
            Quotations
            <Badge variant="secondary" className="ml-1">{quotations.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">System Invoices</CardTitle>
                <CardDescription className="hidden sm:block">
                  Auto-generated from registrations where the client attended but has not paid. Download, re-send, mark paid, or delete.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportSystemInvoicesCSV} disabled={systemInvoices.length === 0}>
                <FileDown className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <FilterBar value={systemFilter} onChange={setSystemFilter} activityOptions={campTypes} activityLabel="Camp" />
              {filteredSystemInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {systemInvoices.length === 0 ? 'No outstanding system invoices.' : 'No results match your filters.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="hidden md:table-cell">Camp</TableHead>
                        <TableHead className="hidden md:table-cell">Converted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSystemInvoices.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.invoice_number || reg.registration_number}</TableCell>
                          <TableCell>{reg.parent_name}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{reg.email || '-'}</TableCell>
                          <TableCell>KES {Number(reg.total_amount).toLocaleString()}</TableCell>
                          <TableCell className="hidden md:table-cell">{reg.camp_type}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {reg.converted_to_invoice_at ? new Date(reg.converted_to_invoice_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="icon" title="Download PDF" onClick={() => handleDownloadSystemInvoice(reg)}>
                                <Download className="h-4 w-4" />
                              </Button>
                              {reg.email && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Send Email"
                                  disabled={sendingSystemInv === reg.id}
                                  onClick={() => handleSendSystemInvoice(reg)}
                                >
                                  <Mail className={`h-4 w-4 ${sendingSystemInv === reg.id ? 'animate-pulse' : ''}`} />
                                </Button>
                              )}
                              <Button variant="outline" size="icon" title="Mark as Paid" onClick={() => handleMarkRegistrationPaid(reg, 'invoice')}>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button variant="outline" size="icon" title="Delete" onClick={() => handleDeleteSystemInvoice(reg)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Sent Invoices</CardTitle>
                <CardDescription className="hidden sm:block">Manage, download, email, mark paid, and delete invoices</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportManualInvoicesCSV} disabled={invoices.length === 0}>
                <FileDown className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <FilterBar value={invoiceFilter} onChange={setInvoiceFilter} activityOptions={programNames} activityLabel="Program" />
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {invoices.length === 0 ? 'No invoices yet. Create your first invoice.' : 'No results match your filters.'}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredInvoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{invoice.invoice_number}</div>
                            <div className="text-sm text-muted-foreground">{invoice.customer_name}</div>
                          </div>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">KES {Number(invoice.total_amount).toLocaleString()}</span>
                          <span className="text-muted-foreground">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.customer_email && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sendingEmail === invoice.id}
                              onClick={() => handleSendEmail(invoice)}
                            >
                              <Mail className={`h-4 w-4 ${sendingEmail === invoice.id ? 'animate-pulse' : ''}`} />
                            </Button>
                          )}
                          {invoice.status !== 'paid' && (
                            <Button variant="outline" size="sm" title="Mark as Paid" onClick={() => handleMarkInvoicePaid(invoice)}>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="hidden md:table-cell">Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.customer_name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{invoice.customer_email || '-'}</TableCell>
                            <TableCell>KES {Number(invoice.total_amount).toLocaleString()}</TableCell>
                            <TableCell className="hidden md:table-cell">{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="icon" title="Download PDF" onClick={() => handleDownloadPDF(invoice)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                {invoice.customer_email && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Send Email"
                                    disabled={sendingEmail === invoice.id}
                                    onClick={() => handleSendEmail(invoice)}
                                  >
                                    <Mail className={`h-4 w-4 ${sendingEmail === invoice.id ? 'animate-pulse' : ''}`} />
                                  </Button>
                                )}
                                {invoice.status !== 'paid' && (
                                  <Button variant="outline" size="icon" title="Mark as Paid" onClick={() => handleMarkInvoicePaid(invoice)}>
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button variant="outline" size="icon" title="Delete" onClick={() => handleDeleteInvoice(invoice)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        </TabsContent>

        <TabsContent value="quotations">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Quotations</CardTitle>
                <CardDescription className="hidden sm:block">
                  Pending registrations that have not yet paid or attended. Download, re-send, mark paid, or delete to re-trigger.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportQuotationsCSV} disabled={quotations.length === 0}>
                <FileDown className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <FilterBar value={quoteFilter} onChange={setQuoteFilter} activityOptions={campTypes} activityLabel="Camp" />
              {filteredQuotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {quotations.length === 0 ? 'No open quotations.' : 'No results match your filters.'}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-border">
                    {filteredQuotations.map((q) => (
                      <div key={q.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{q.quote_number || q.registration_number}</div>
                            <div className="text-sm text-muted-foreground">{q.parent_name}</div>
                          </div>
                          <Badge className="bg-amber-100 text-amber-800">QUOTATION</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">KES {Number(q.total_amount).toLocaleString()}</span>
                          <span className="text-muted-foreground">{q.camp_type}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadQuotation(q)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {q.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={sendingQuote === q.id}
                              onClick={() => handleSendQuotation(q)}
                            >
                              <Mail className={`h-4 w-4 ${sendingQuote === q.id ? 'animate-pulse' : ''}`} />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" title="Mark as Paid" onClick={() => handleMarkRegistrationPaid(q, 'quotation')}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteQuotation(q)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quote #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="hidden md:table-cell">Camp</TableHead>
                          <TableHead className="hidden md:table-cell">Issued</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotations.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.quote_number || q.registration_number}</TableCell>
                            <TableCell>{q.parent_name}</TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">{q.email || '-'}</TableCell>
                            <TableCell>KES {Number(q.total_amount).toLocaleString()}</TableCell>
                            <TableCell className="hidden md:table-cell">{q.camp_type}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {q.created_at ? new Date(q.created_at).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="outline" size="icon" title="Download PDF" onClick={() => handleDownloadQuotation(q)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                {q.email && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Send Email"
                                    disabled={sendingQuote === q.id}
                                    onClick={() => handleSendQuotation(q)}
                                  >
                                    <Mail className={`h-4 w-4 ${sendingQuote === q.id ? 'animate-pulse' : ''}`} />
                                  </Button>
                                )}
                                <Button variant="outline" size="icon" title="Mark as Paid" onClick={() => handleMarkRegistrationPaid(q, 'quotation')}>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="outline" size="icon" title="Delete (re-trigger)" onClick={() => handleDeleteQuotation(q)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceManagement;
