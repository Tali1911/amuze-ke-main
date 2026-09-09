import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, CheckCircle, XCircle, Clock, QrCode, UserPlus, DollarSign, RefreshCw } from 'lucide-react';
import { campRegistrationService } from '@/services/campRegistrationService';
import { attendanceService } from '@/services/attendanceService';
import { accountsActionService } from '@/services/accountsActionService';
import { qrCodeService } from '@/services/qrCodeService';
import { supabase } from '@/integrations/supabase/client';
import { CampRegistration } from '@/types/campRegistration';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { QRScannerDialog } from '@/components/attendance/QRScannerDialog';
import { QuickGroundRegistration } from './QuickGroundRegistration';
import { promptForPaymentMethod } from '@/utils/promptPaymentMethod';

const CAMP_TYPES = [
  { value: 'all', label: 'All Camps' },
  { value: 'easter', label: 'Easter' },
  { value: 'summer', label: 'Summer' },
  { value: 'end-year', label: 'End Year' },
  { value: 'little-forest', label: 'Little Forest' },
  { value: 'mid-term-feb-march', label: 'Mid-Term Feb/March' },
  { value: 'mid-term-may-june', label: 'Mid-Term May/June' },
  { value: 'mid-term-october', label: 'Mid-Term October' },
];

export const DailyOperationsView: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [campTypeFilter, setCampTypeFilter] = useState<string>('all');
  const [registrations, setRegistrations] = useState<CampRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, any>>({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [groundRegOpen, setGroundRegOpen] = useState(false);
  const [confirmCheckoutOpen, setConfirmCheckoutOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ attendanceId: string; childName: string; registrationId: string } | null>(null);

  const loadTodaysRegistrations = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (campTypeFilter !== 'all') filters.campType = campTypeFilter;

      const allRegs = await campRegistrationService.getAllRegistrations(filters);
      const activeRegs = allRegs.filter(r => r.status === 'active');
      setRegistrations(activeRegs);

      // Load attendance status
      const statusMap: Record<string, any> = {};
      for (const reg of activeRegs) {
        for (const child of reg.children) {
          const key = `${reg.id}-${child.childName}`;
          const attendance = await attendanceService.hasCheckedInToday(reg.id!, child.childName);
          statusMap[key] = attendance;
        }
      }
      setAttendanceStatus(statusMap);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaysRegistrations();
  }, [campTypeFilter]);

  // Real-time subscription to sync payment status changes from Accounts Portal
  useEffect(() => {
    const channel = supabase
      .channel('camp-registrations-payment-sync')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'camp_registrations'
        },
        (payload) => {
          // Update local state when payment status changes
          const updated = payload.new as any;
          setRegistrations(prev => prev.map(r => 
            r.id === updated.id ? { ...r, payment_status: updated.payment_status } : r
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckIn = async (reg: CampRegistration, childName: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const key = `${reg.id}-${childName}`;
      
      // Optimistic update
      setAttendanceStatus(prev => ({
        ...prev,
        [key]: { id: 'temp', check_in_time: new Date().toISOString(), check_out_time: null }
      }));

      await attendanceService.checkIn(reg.id!, childName, user.id);
      
      // If unpaid, create action item for accounts
      if (reg.payment_status !== 'paid') {
        try {
          await accountsActionService.createUnpaidCheckInItem(
            reg.id!,
            childName,
            reg.parent_name,
            reg.email,
            reg.phone,
            reg.total_amount,
            0,
            reg.camp_type
          );
          toast.info(`Invoice request sent to accounts for ${childName}`);
        } catch (actionError) {
          console.error('Failed to create pending collection item:', actionError);
          toast.warning(`${childName} checked in, but pending collection item could not be created. Please notify accounts manually.`);
        }
      }

      toast.success(`${childName} checked in`);
      
      const attendance = await attendanceService.hasCheckedInToday(reg.id!, childName);
      setAttendanceStatus(prev => ({ ...prev, [key]: attendance }));
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Check-in failed');
      loadTodaysRegistrations();
    }
  };

  const handleCheckOut = async () => {
    if (!pendingCheckout) return;
    const { attendanceId, childName, registrationId } = pendingCheckout;
    try {
      const key = `${registrationId}-${childName}`;

      setAttendanceStatus(prev => ({
        ...prev,
        [key]: { ...prev[key], check_out_time: new Date().toISOString() }
      }));

      await attendanceService.checkOut(attendanceId);
      toast.success(`${childName} checked out`);

      const attendance = await attendanceService.hasCheckedInToday(registrationId, childName);
      setAttendanceStatus(prev => ({ ...prev, [key]: attendance }));
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Check-out failed');
      loadTodaysRegistrations();
    } finally {
      setPendingCheckout(null);
      setConfirmCheckoutOpen(false);
    }
  };

  const promptCheckOut = (attendanceId: string, childName: string, registrationId: string) => {
    setPendingCheckout({ attendanceId, childName, registrationId });
    setConfirmCheckoutOpen(true);
  };

  const handleQuickPaymentUpdate = async (regId: string, newStatus: 'paid' | 'partial' | 'unpaid') => {
    let method: 'mpesa' | 'card' | 'cash_ground' | 'bank_transfer' | undefined;
    if (newStatus === 'paid') {
      const picked = promptForPaymentMethod();
      if (!picked) return; // cancelled or invalid
      method = picked;
    }

    try {
      await campRegistrationService.updatePaymentStatus(regId, newStatus, method);
      
      // If marked as paid, auto-complete any pending accounts action items
      if (newStatus === 'paid' && user?.id) {
        const completedCount = await accountsActionService.markCompletedByRegistration(
          regId, 
          user.id, 
          'Payment confirmed by admin'
        );
        if (completedCount > 0) {
          toast.success(`Payment updated & ${completedCount} accounts item(s) resolved`);
        } else {
          toast.success('Payment status updated');
        }
      } else {
        toast.success('Payment status updated');
      }
      
      // Update local state
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, payment_status: newStatus, ...(method ? { payment_method: method } : {}) } : r
      ));
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadTodaysRegistrations();
      return;
    }

    try {
      setLoading(true);
      const results = await campRegistrationService.searchRegistrations(searchTerm);
      setRegistrations(results.filter(r => r.status === 'active'));
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCodeData: string) => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const parsed = qrCodeService.parseQRCodeData(qrCodeData);
      if (!parsed || parsed.type !== 'camp_registration') {
        toast.error('Invalid QR code');
        return;
      }

      const registration = await campRegistrationService.getRegistrationByQRCode(qrCodeData);
      if (!registration) {
        toast.error('Registration not found');
        return;
      }

      let checkedInCount = 0;
      for (const child of registration.children) {
        const hasCheckedIn = await attendanceService.hasCheckedInToday(registration.id!, child.childName);
        if (!hasCheckedIn) {
          await attendanceService.checkIn(registration.id!, child.childName, user.id);
          
          // Create action item if unpaid
          if (registration.payment_status !== 'paid') {
            try {
              await accountsActionService.createUnpaidCheckInItem(
                registration.id!,
                child.childName,
                registration.parent_name,
                registration.email,
                registration.phone,
                registration.total_amount,
                0,
                registration.camp_type
              );
            } catch (actionError) {
              console.error('Failed to create pending collection item:', actionError);
              toast.warning(`Checked in ${child.childName}, but pending collection item could not be created.`);
            }
          }
          checkedInCount++;
        }
      }

      setScannerOpen(false);
      if (checkedInCount > 0) {
        toast.success(`Checked in ${checkedInCount} child(ren) from ${registration.registration_number}`);
        loadTodaysRegistrations();
      } else {
        toast.info('All children already checked in');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('Failed to process QR code');
      setScannerOpen(false);
    }
  };

  const handleGroundRegistrationComplete = () => {
    setGroundRegOpen(false);
    loadTodaysRegistrations();
  };

  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'partial': return 'secondary';
      default: return 'destructive';
    }
  };

  // Flatten registrations to rows per child
  const childRows = registrations.flatMap(reg =>
    reg.children.map(child => ({
      reg,
      child,
      key: `${reg.id}-${child.childName}`,
      attendance: attendanceStatus[`${reg.id}-${child.childName}`]
    }))
  );

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">
              Daily Operations - {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadTodaysRegistrations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setScannerOpen(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </Button>
              <Sheet open={groundRegOpen} onOpenChange={setGroundRegOpen}>
                <SheetTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Quick Walk-in
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Quick Walk-in Registration</SheetTitle>
                  </SheetHeader>
                  <QuickGroundRegistration onComplete={handleGroundRegistrationComplete} />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, registration #, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={campTypeFilter} onValueChange={setCampTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Camp Type" />
              </SelectTrigger>
              <SelectContent>
                {CAMP_TYPES.map(camp => (
                  <SelectItem key={camp.value} value={camp.value}>{camp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-2xl font-bold">{childRows.length}</div>
          <div className="text-xs text-muted-foreground">Total Children</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-green-600">
            {childRows.filter(r => r.attendance && !r.attendance.check_out_time).length}
          </div>
          <div className="text-xs text-muted-foreground">Present Now</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-blue-600">
            {childRows.filter(r => r.reg.payment_status === 'paid').length}
          </div>
          <div className="text-xs text-muted-foreground">Paid</div>
        </Card>
        <Card className="p-3">
          <div className="text-2xl font-bold text-orange-600">
            {childRows.filter(r => r.reg.payment_status !== 'paid').length}
          </div>
          <div className="text-xs text-muted-foreground">Unpaid/Partial</div>
        </Card>
      </div>

      {/* Main table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : childRows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Reg #</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead className="hidden sm:table-cell">Parent</TableHead>
                    <TableHead className="hidden md:table-cell">Camp</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childRows.map(({ reg, child, key, attendance }) => {
                    const checkedIn = !!attendance;
                    const checkedOut = attendance?.check_out_time;

                    return (
                      <TableRow key={key} className={!checkedIn ? 'bg-muted/30' : ''}>
                        <TableCell className="font-mono text-xs">{reg.registration_number}</TableCell>
                        <TableCell>
                          <div className="font-medium">{child.childName}</div>
                          <div className="text-xs text-muted-foreground">{child.ageRange}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>{reg.parent_name}</div>
                          <div className="text-xs text-muted-foreground">{reg.phone}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {reg.camp_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={reg.payment_status}
                            onValueChange={(value) => handleQuickPaymentUpdate(reg.id!, value as any)}
                          >
                            <SelectTrigger className="h-7 w-[90px]">
                              <Badge variant={getPaymentBadgeVariant(reg.payment_status)} className="text-xs">
                                {reg.payment_status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="partial">Partial</SelectItem>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {checkedOut ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs">
                              <CheckCircle className="h-3 w-3" /> Out
                            </Badge>
                          ) : checkedIn ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit text-xs">
                              <Clock className="h-3 w-3" /> In
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                              <XCircle className="h-3 w-3" /> -
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!checkedIn ? (
                            <Button size="sm" onClick={() => handleCheckIn(reg, child.childName)}>
                              Check In
                            </Button>
                          ) : !checkedOut ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => promptCheckOut(attendance.id, child.childName, reg.id!)}
                            >
                              Check Out
                            </Button>
                          ) : (
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

      <QRScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />

      <AlertDialog open={confirmCheckoutOpen} onOpenChange={setConfirmCheckoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Check-Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out <strong>{pendingCheckout?.childName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingCheckout(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckOut}>Check Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
