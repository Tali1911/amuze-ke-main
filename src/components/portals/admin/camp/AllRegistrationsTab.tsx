import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Search, Eye, Download, FileSpreadsheet, FileText, QrCode, 
  Mail, CheckCircle, XCircle, Trash2, Calendar as CalendarIcon,
  Filter, X
} from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from 'sonner';
import { RegistrationDetailsDialog } from './RegistrationDetailsDialog';
import { exportService } from '@/services/exportService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { registrationInDateWindow } from '@/utils/registrationDate';
import { promptForPaymentMethod } from '@/utils/promptPaymentMethod';

type DocType = 'quotation' | 'invoice' | 'paid';
const deriveDocType = (reg: CampRegistration): DocType => {
  if (reg.billing_doc_type) return reg.billing_doc_type;
  if (reg.payment_status === 'paid') return 'paid';
  return 'quotation';
};


export const AllRegistrationsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<CampRegistration | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Advanced filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;
      if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;

      // IMPORTANT: We always do the date filter client-side using
      // `registrationInDateWindow` because the "event date" depends on doc type:
      //   - quotations bucket by `children[*].selectedDates` (expected attendance day)
      //   - invoices/paid bucket by `converted_to_invoice_at`
      // This is what makes "today" on the All page match the Attendance page.

      let data = await campRegistrationService.getAllRegistrations(filters);

      // Apply client-side filters
      if (registrationTypeFilter !== 'all') {
        data = data.filter(reg => reg.registration_type === registrationTypeFilter);
      }

      if (locationFilter !== 'all') {
        data = data.filter(reg => (reg.location || 'Kurura Gate F') === locationFilter);
      }

      if (docTypeFilter !== 'all') {
        data = data.filter(reg => deriveDocType(reg) === docTypeFilter);
      }

      if (dateFrom || dateTo) {
        data = data.filter(reg => registrationInDateWindow(reg, dateFrom, dateTo));
      }

      if (minAmount) {
        data = data.filter(reg => reg.total_amount >= parseFloat(minAmount));
      }

      if (maxAmount) {
        data = data.filter(reg => reg.total_amount <= parseFloat(maxAmount));
      }

      setRegistrations(data);

      // Keep the open details dialog in sync with the freshly-loaded list,
      // so edits to children/sessions/totals show up immediately after save
      // instead of displaying the stale prop captured when the dialog opened.
      setSelectedRegistration((prev) => {
        if (!prev?.id) return prev;
        const refreshed = data.find((r) => r.id === prev.id);
        return refreshed || prev;
      });
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [campTypeFilter, paymentFilter, registrationTypeFilter, locationFilter, docTypeFilter, dateFrom, dateTo]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadRegistrations();
      return;
    }

    try {
      setLoading(true);
      const data = await campRegistrationService.searchRegistrations(searchTerm);
      setRegistrations(data);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (registration: CampRegistration) => {
    setSelectedRegistration(registration);
    setDetailsOpen(true);
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      partial: 'secondary',
      unpaid: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  const getDocTypeBadge = (reg: CampRegistration) => {
    const t = deriveDocType(reg);
    if (t === 'paid') {
      return <Badge className="bg-green-600 hover:bg-green-700 text-white" title="Fully paid">PAID</Badge>;
    }
    if (t === 'invoice') {
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white" title="Attended but not paid — invoice issued">INVOICE</Badge>;
    }
    return <Badge variant="outline" title="Registered but not paid and not yet attended">QUOTATION</Badge>;
  };


  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(registrations.map(reg => reg.id!));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === registrations.length);
  };

  const getSelectedRegistrations = () => {
    return registrations.filter(reg => selectedIds.has(reg.id!));
  };

  // Bulk actions
  const handleBulkPaymentUpdate = async (status: 'paid' | 'unpaid' | 'partial') => {
    const selected = getSelectedRegistrations();
    if (selected.length === 0) {
      toast.error('No registrations selected');
      return;
    }

    let method: 'mpesa' | 'card' | 'cash_ground' | 'bank_transfer' | undefined;
    if (status === 'paid') {
      const picked = promptForPaymentMethod();
      if (!picked) return; // cancelled or invalid
      method = picked;
    }

    try {
      for (const reg of selected) {
        await campRegistrationService.updatePaymentStatus(reg.id!, status, method);
      }
      toast.success(`Updated ${selected.length} registration(s) to ${status}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadRegistrations();
    } catch (error) {
      toast.error('Failed to update payment status');
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'cancelled') => {
    const selected = getSelectedRegistrations();
    if (selected.length === 0) {
      toast.error('No registrations selected');
      return;
    }

    try {
      for (const reg of selected) {
        await campRegistrationService.updateRegistration(reg.id!, { status });
      }
      toast.success(`Updated ${selected.length} registration(s) to ${status}`);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadRegistrations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Delete handlers
  const handleDeleteSingle = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this registration? This action cannot be undone.')) {
      return;
    }

    try {
      await campRegistrationService.deleteRegistration(id);
      toast.success('Registration deleted successfully');
      loadRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error('Failed to delete registration');
    }
  };

  const handleBulkDelete = async () => {
    const selected = getSelectedRegistrations();
    if (selected.length === 0) {
      toast.error('No registrations selected');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selected.length} registration(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await campRegistrationService.deleteRegistrations(selected.map(r => r.id!));
      toast.success(`Deleted ${selected.length} registration(s)`);
      setSelectedIds(new Set());
      setSelectAll(false);
      loadRegistrations();
    } catch (error) {
      console.error('Error deleting registrations:', error);
      toast.error('Failed to delete registrations');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportToCSV(dataToExport, `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${dataToExport.length} registrations to CSV`);
  };

  const handleExportPDF = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportToPDF(dataToExport, `registrations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success(`Exported ${dataToExport.length} registrations to PDF`);
  };

  const handleExportDetailedPDF = () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    exportService.exportDetailedPDF(dataToExport, `detailed-registrations-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success(`Exported detailed registrations to PDF`);
  };

  const handleExportQRCodes = async () => {
    const dataToExport = selectedIds.size > 0 ? getSelectedRegistrations() : registrations;
    toast.info('Generating QR codes... This may take a moment.');
    await exportService.exportQRCodes(dataToExport, `qr-codes-${format(new Date(), 'yyyy-MM-dd')}.zip`);
    toast.success(`Exported ${dataToExport.length} QR codes`);
  };

  const clearFilters = () => {
    setCampTypeFilter('all');
    setPaymentFilter('all');
    setRegistrationTypeFilter('all');
    setLocationFilter('all');
    setDocTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
  };

  const hasActiveFilters = campTypeFilter !== 'all' || paymentFilter !== 'all' ||
    registrationTypeFilter !== 'all' || locationFilter !== 'all' || docTypeFilter !== 'all' ||
    dateFrom || dateTo || minAmount || maxAmount || searchTerm;

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg sm:text-xl">All Registrations ({registrations.length})</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs sm:text-sm">
                <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportDetailedPDF} className="text-xs sm:text-sm hidden md:flex">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Detailed</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportQRCodes} className="text-xs sm:text-sm">
                <QrCode className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">QR</span>
              </Button>
            </div>
          </div>

          {/* Search and basic filters */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={campTypeFilter} onValueChange={setCampTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Camp Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Camps</SelectItem>
                  <SelectItem value="easter">Easter</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                  <SelectItem value="end-year">End Year</SelectItem>
                  <SelectItem value="mid-term-feb-march">Mid-Term Camp (Feb/March)</SelectItem>
                  <SelectItem value="mid-term-may-june">Mid-Term Camp (May/June)</SelectItem>
                  <SelectItem value="mid-term-october">Mid-Term Camp (October)</SelectItem>
                  <SelectItem value="day-camps">Day Camps</SelectItem>
                  <SelectItem value="little-forest">Little Forest</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Doc Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="quotation">Quotation (no-show)</SelectItem>
                  <SelectItem value="invoice">Invoice (attended unpaid)</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Kurura Gate F">Kurura Gate F</SelectItem>
                  <SelectItem value="Ngong Sanctuary">Ngong Sanctuary</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex-1 sm:flex-none"
              >
                <Filter className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{showAdvancedFilters ? 'Hide' : 'More'} Filters</span>
                <span className="sm:hidden">Filters</span>
              </Button>
            </div>
          </div>

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Registration Type</label>
                <Select value={registrationTypeFilter} onValueChange={setRegistrationTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online_only">Online Only</SelectItem>
                    <SelectItem value="online_paid">Online Paid</SelectItem>
                    <SelectItem value="ground_registration">Ground</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Min Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Max Amount (KES)</label>
                <Input
                  type="number"
                  placeholder="999999"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-2 text-sm text-muted-foreground">
              Active filters applied. <Button variant="link" size="sm" onClick={clearFilters} className="p-0 h-auto">Clear all</Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-3 sm:px-6">
          {/* Bulk actions toolbar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 p-2 sm:p-3 bg-primary/10 rounded-lg flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs sm:text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handleBulkPaymentUpdate('paid')} className="text-xs px-2 py-1 h-7 sm:h-8">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Mark </span>Paid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkPaymentUpdate('unpaid')} className="text-xs px-2 py-1 h-7 sm:h-8">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Mark </span>Unpaid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate('cancelled')} className="text-xs px-2 py-1 h-7 sm:h-8">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="text-xs px-2 py-1 h-7 sm:h-8">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedIds(new Set()); setSelectAll(false); }} className="text-xs px-2 py-1 h-7 sm:h-8">
                  Clear
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations found</div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table className="min-w-[800px] sm:min-w-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] px-2">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs sm:text-sm">Reg #</TableHead>
                    <TableHead className="text-xs sm:text-sm">Parent</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell">Camp</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Location</TableHead>
                    <TableHead className="text-xs sm:text-sm">Kids</TableHead>
                    <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Doc Type</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="px-2">
                        <Checkbox
                          checked={selectedIds.has(reg.id!)}
                          onCheckedChange={() => handleSelectOne(reg.id!)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm">{reg.registration_number?.slice(-8)}</TableCell>
                      <TableCell className="text-xs sm:text-sm max-w-[100px] truncate">{reg.parent_name}</TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm hidden md:table-cell">{reg.camp_type.replace('-', ' ')}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{reg.location || 'Kurura Gate F'}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{reg.children.length}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        KES {Math.max(0, (reg.total_amount || 0) - (Number((reg as any).discount_amount) || 0)).toFixed(0)}
                        {Number((reg as any).discount_amount) > 0 && (
                          <span className="ml-1 text-[10px] text-muted-foreground line-through">
                            {reg.total_amount.toFixed(0)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getPaymentBadge(reg.payment_status)}</TableCell>
                      <TableCell>{getDocTypeBadge(reg)}</TableCell>
                      <TableCell className="capitalize text-xs hidden lg:table-cell">{reg.registration_type.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                        {new Date(reg.created_at!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(reg)}
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSingle(reg.id!)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
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

      {selectedRegistration && (
        <RegistrationDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          registration={selectedRegistration}
          onUpdate={loadRegistrations}
        />
      )}
    </>
  );
};