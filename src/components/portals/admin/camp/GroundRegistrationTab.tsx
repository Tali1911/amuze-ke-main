import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Plus, X, Loader2, Mail, CalendarCheck, CalendarPlus, CalendarIcon, Search, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { attendanceService } from '@/services/attendanceService';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { campRegistrationService } from '@/services/campRegistrationService';
import { financialService } from '@/services/financialService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { CampRegistration } from '@/types/campRegistration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';

const childSchema = z.object({
  childName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  ageRange: z.string().min(1, 'Age range is required'),
  specialNeeds: z.string().max(500, 'Description too long').optional(),
  selectedSessions: z.array(z.string()).min(0), // Can be empty for multi-day (per-date sessions stored separately)
  price: z.number().min(0)
});

const groundRegistrationSchema = z.object({
  parentName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
  emergencyContact: z.string().trim().min(2, 'Emergency contact name required').max(100, 'Name too long'),
  emergencyPhone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number too long'),
  campType: z.string().min(1, 'Please select a camp type'),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  amountPaid: z.number().min(0, 'Amount must be positive'),
  paymentMethod: z.enum(['cash_ground', 'mpesa', 'card', 'bank_transfer']).default('cash_ground'),
  paymentNotes: z.string().max(500, 'Notes too long').optional()
}).refine(
  (data) => data.amountPaid === 0 || !!data.paymentMethod,
  { message: 'Select a payment method when recording a payment', path: ['paymentMethod'] }
);

type GroundRegistrationForm = z.infer<typeof groundRegistrationSchema>;

const CAMP_TYPES = [
  { value: 'mid-term-feb-march', label: 'Mid-Term Camp - Feb/March' },
  { value: 'mid-term-may-june', label: 'Mid-Term Camp - May/June' },
  { value: 'mid-term-october', label: 'Mid-Term Camp - October' },
  { value: 'easter', label: 'Easter Camp' },
  { value: 'summer', label: 'Summer Camp' },
  { value: 'end-year', label: 'End Year Camp' },
  { value: 'day-camps', label: 'Day Camps' },
  { value: 'little-forest', label: 'Little Explorers' },
];

const LOCATIONS = ['Kurura Gate F', 'Ngong Sanctuary'];

const SESSIONS_KARURA = [
  { value: 'full', label: 'Full Day (9 AM-3 PM)', price: 2500 },
  { value: 'half', label: 'Half Day (9 AM-1 PM)', price: 1500 }
];

const SESSIONS_NGONG = [
  { value: 'full', label: 'Full Day (9 AM-1 PM)', price: 2000 },
  { value: 'archery', label: 'Archery Only (45 mins)', price: 1000 }
];

const SESSIONS_LITTLE_EXPLORERS = [
  { value: 'session', label: 'Little Explorers Session', price: 1500 }
];

const AGE_RANGES = [
  { value: '3 & below', label: '3 & below (Neem)' },
  { value: '4-6', label: '4-6 years (Grevillea)' },
  { value: '7-10', label: '7-10 years (Croton)' },
  { value: '11-15', label: '11-15 years (Mighty Oaks)' },
];

export const GroundRegistrationTab: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [registrationMode, setRegistrationMode] = useState<'walkin_today' | 'book_future'>('walkin_today');
  const [bookingDates, setBookingDates] = useState<Date[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [completedRegistration, setCompletedRegistration] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState('Kurura Gate F');
  // Per-date session tracking for multi-day bookings: { childIndex: { 'YYYY-MM-DD': 'full' | 'half' | 'archery' } }
  const [perDateSessions, setPerDateSessions] = useState<Record<number, Record<string, string>>>({});

  // Client lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<CampRegistration[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<GroundRegistrationForm>({
    resolver: zodResolver(groundRegistrationSchema),
    defaultValues: {
      children: [{
        childName: '',
        ageRange: '',
        specialNeeds: '',
        selectedSessions: [],
        price: 0
      }],
      amountPaid: 0,
      paymentMethod: 'cash_ground'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children'
  });

  const children = watch('children');
  const campType = watch('campType');
  const amountPaid = watch('amountPaid') || 0;

  const getSessionsForLocation = () => {
    if (campType === 'little-forest') return SESSIONS_LITTLE_EXPLORERS;
    return selectedLocation === 'Ngong Sanctuary' ? SESSIONS_NGONG : SESSIONS_KARURA;
  };

  const calculateChildPrice = (childIndex: number) => {
    const child = children[childIndex];
    if (!child) return 0;

    const sessions = getSessionsForLocation();

    if (registrationMode === 'book_future' && bookingDates.length > 1) {
      // Per-date pricing: sum the price for each date's chosen session
      const childDateSessions = perDateSessions[childIndex] || {};
      let total = 0;
      for (const date of bookingDates) {
        const dateStr = date.toISOString().split('T')[0];
        const sessionType = childDateSessions[dateStr] || (sessions[0]?.value || 'full');
        const price = sessions.find(s => s.value === sessionType)?.price || 0;
        total += price;
      }
      return total;
    }

    // Single date: price = first VALID selected session (matches what onSubmit persists at [0]).
    // Filter out stale values that don't belong to the current sessions catalog
    // (prevents 0-priced ghosts like 'half' on Little Explorers from being averaged in).
    const validSelections = (child.selectedSessions || []).filter(s =>
      sessions.some(session => session.value === s)
    );
    const firstValid = validSelections[0] ?? sessions[0]?.value;
    const sessionPrice = sessions.find(session => session.value === firstValid)?.price || 0;

    return sessionPrice;
  };

  const calculateTotalAmount = () => {
    return children.reduce((total, _, index) => total + calculateChildPrice(index), 0);
  };

  const totalAmount = calculateTotalAmount();
  const balanceDue = totalAmount - amountPaid;

  const setDateSession = (childIndex: number, dateStr: string, sessionType: string) => {
    setPerDateSessions(prev => ({
      ...prev,
      [childIndex]: {
        ...(prev[childIndex] || {}),
        [dateStr]: sessionType,
      }
    }));
  };

  const toggleSession = (childIndex: number, session: string) => {
    // Single-select: clicking a session replaces the selection. onSubmit only persists
    // selectedSessions[0], so keeping a single value here prevents stale/ambiguous state.
    const currentSessions = children[childIndex].selectedSessions || [];
    const newSessions = currentSessions[0] === session ? [] : [session];
    setValue(`children.${childIndex}.selectedSessions`, newSessions);
    updateChildPrice(childIndex);
  };

  const updateChildPrice = (childIndex: number) => {
    const price = calculateChildPrice(childIndex);
    setValue(`children.${childIndex}.price`, price);
  };

  // When camp type or location changes, drop any session selections that no longer
  // belong to the active catalog (e.g. 'half' lingering after switching to Little Explorers).
  useEffect(() => {
    const validValues = getSessionsForLocation().map(s => s.value);
    (children || []).forEach((child, idx) => {
      const filtered = (child?.selectedSessions || []).filter(s => validValues.includes(s));
      if (filtered.length !== (child?.selectedSessions || []).length) {
        setValue(`children.${idx}.selectedSessions`, filtered);
      }
      updateChildPrice(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campType, selectedLocation]);

  // Client lookup
  const handleClientLookup = async () => {
    if (lookupQuery.trim().length < 3) {
      toast.error('Enter at least 3 characters to search');
      return;
    }
    try {
      setLookupLoading(true);
      const results = await campRegistrationService.searchRegistrations(lookupQuery.trim());
      setLookupResults(results.slice(0, 5));
      if (results.length === 0) {
        toast.info('No previous registrations found');
      }
    } catch (err) {
      console.error('Client lookup error:', err);
      toast.error('Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const applyClientData = (reg: CampRegistration) => {
    setValue('parentName', reg.parent_name);
    setValue('email', reg.email);
    setValue('phone', reg.phone);
    if (reg.emergency_contact) {
      const match = reg.emergency_contact.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        setValue('emergencyContact', match[1]);
        setValue('emergencyPhone', match[2]);
      } else {
        setValue('emergencyContact', reg.emergency_contact);
      }
    }
    // Auto-fill children
    if (reg.children && reg.children.length > 0) {
      const mappedChildren = reg.children.map(c => ({
        childName: c.childName || '',
        ageRange: c.ageRange || '',
        specialNeeds: c.specialNeeds || '',
        selectedSessions: [],
        price: 0
      }));
      setValue('children', mappedChildren);
    }
    setLookupResults([]);
    setLookupQuery('');
    toast.success('Client details auto-filled! You can edit any field.');
  };

  const onSubmit = async (data: GroundRegistrationForm) => {
    if (registrationMode === 'book_future' && bookingDates.length === 0) {
      toast.error('Please select at least one booking date.');
      return;
    }

    // Validate sessions: for single-day or walk-in, require at least one session per child
    if (!(registrationMode === 'book_future' && bookingDates.length > 1)) {
      const missingSession = data.children.some(c => !c.selectedSessions || c.selectedSessions.length === 0);
      if (missingSession) {
        toast.error('Please select a session type for each child.');
        return;
      }
    }

    const securityCheck = await performSecurityChecks(data, 'ground-registration');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }

    try {
      setSubmitting(true);

      const paymentStatus = amountPaid >= totalAmount ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

      const registrationData: Omit<CampRegistration, 'id' | 'registration_number' | 'created_at' | 'updated_at'> = {
        camp_type: data.campType as CampRegistration['camp_type'],
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        location: selectedLocation,
        emergency_contact: `${data.emergencyContact} (${data.emergencyPhone})`,
        children: data.children.map((child, childIdx) => {
          const today = new Date().toISOString().split('T')[0];
          let actualDates: string[] = [];

          if (registrationMode === 'walkin_today') {
            actualDates = [today];
          } else {
            actualDates = bookingDates.map(d => d.toISOString().split('T')[0]);
          }

          // Build per-date session map
          let sessionData: string[] | Record<string, 'half' | 'full'>;
          if (registrationMode === 'book_future' && bookingDates.length > 1) {
            // Multi-day: use per-date sessions
            const childDateSessions = perDateSessions[childIdx] || {};
            const defaultSession = getSessionsForLocation()[0]?.value || 'full';
            const sessionMap: Record<string, 'half' | 'full'> = {};
            for (const dateStr of actualDates) {
              sessionMap[dateStr] = (childDateSessions[dateStr] || defaultSession) as 'half' | 'full';
            }
            sessionData = sessionMap;
          } else {
            // Single-day: store as per-date map so attendance reads the correct session type
            const selected = (child.selectedSessions && child.selectedSessions[0]) || (getSessionsForLocation()[0]?.value || 'full');
            const sessionMap: Record<string, 'half' | 'full'> = {};
            for (const dateStr of actualDates) {
              sessionMap[dateStr] = selected as 'half' | 'full';
            }
            sessionData = sessionMap;
          }

          return {
            childName: child.childName || '',
            dateOfBirth: '',
            ageRange: child.ageRange || '',
            specialNeeds: child.specialNeeds || '',
            selectedDays: actualDates.map((_, i) => `Day ${i + 1}`),
            selectedDates: actualDates,
            selectedSessions: sessionData,
            price: calculateChildPrice(childIdx)
          };
        }),
        total_amount: totalAmount,
        payment_status: paymentStatus,
        payment_method: data.paymentMethod,
        payment_reference: `${data.paymentMethod.toUpperCase()}-${Date.now()}`,
        registration_type: 'ground_registration',
        qr_code_data: JSON.stringify({
          type: 'camp_registration',
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }),
        consent_given: true,
        status: 'active',
        admin_notes: data.paymentNotes || `Ground registration. Paid: KES ${amountPaid}/${totalAmount}`
      };

      const registration = await campRegistrationService.createRegistration(registrationData);

      if (registration) {
        // Record submission immediately after successful registration to prevent duplicates
        await recordSubmission(data, 'ground-registration');

        // --- Non-critical post-registration steps (failures logged, not blocking) ---

        if (amountPaid > 0) {
          try {
            await financialService.createPaymentFromRegistration({
              registrationId: registration.id,
              registrationType: 'camp',
              source: 'ground_registration',
              customerName: data.parentName,
              programName: `${data.campType} (Ground)`,
              amount: amountPaid,
              paymentMethod: data.paymentMethod,
              paymentReference: `${data.paymentMethod.toUpperCase()}-${Date.now()}`,
              notes: `Ground registration. Paid: KES ${amountPaid}/${totalAmount}`,
              createdBy: user?.id
            });
          } catch (paymentError) {
            console.error('Payment recording failed:', paymentError);
            toast.warning('Registration saved but payment record failed. Please record payment manually.');
          }
        }

        try {
          const qrData = await qrCodeService.generateQRCode(registration.qr_code_data);
          setQrCodeDataUrl(qrData);
        } catch (qrError) {
          console.error('QR code generation failed:', qrError);
        }

        try {
          await leadsService.createLead({
            full_name: data.parentName,
            email: data.email,
            phone: data.phone,
            program_type: data.campType,
            program_name: `${data.campType} (Ground Registration)`,
            form_data: data,
            source: 'ground_registration'
          });
        } catch (leadError) {
          console.error('Lead creation failed:', leadError);
        }

        setCompletedRegistration(registration);
        setShowQRModal(true);

        if (registrationMode === 'walkin_today') {
          try {
            for (const child of data.children) {
              await attendanceService.checkInForDate(
                registration.id,
                child.childName,
                user?.id || '',
                new Date().toISOString().split('T')[0],
                'Auto check-in from ground registration (walk-in today)'
              );
            }
            toast.success('Walk-in registration completed & attendance marked!');
          } catch (attendanceError) {
            console.error('Auto attendance marking failed:', attendanceError);
            toast.success('Registration completed! (Attendance marking failed - please mark manually)');
          }
        } else {
          const dateStr = bookingDates.map(d => format(d, 'PPP')).join(', ');
          toast.success(`Booking registered for ${dateStr}!`);
        }

        if (sendEmail) {
          try {
            const campLabel = CAMP_TYPES.find(c => c.value === data.campType)?.label || data.campType;
            await supabase.functions.invoke('send-confirmation-email', {
              body: {
                email: data.email,
                programType: data.campType,
                registrationDetails: {
                  parentName: data.parentName,
                  campTitle: `${campLabel} (Walk-in)`,
                  registrationId: registration.id,
                  registrationNumber: registration.registration_number,
                  location: selectedLocation,
                  children: data.children.map(child => ({
                    childName: child.childName,
                    ageRange: child.ageRange,
                    selectedDates: registrationMode === 'walkin_today'
                      ? [new Date().toISOString().split('T')[0]]
                      : bookingDates.map(d => d.toISOString().split('T')[0]),
                    selectedSessions: child.selectedSessions,
                    price: child.price,
                  })),
                },
                invoiceDetails: {
                  totalAmount,
                  paymentMethod: data.paymentMethod,
                },
              },
            });
          } catch (emailError) {
            console.error('Email notification failed:', emailError);
          }
        }
      }
    } catch (error) {
      console.error('Ground registration error:', error);
      toast.error('Failed to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ground Registration
          </CardTitle>
          <CardDescription>
            Register walk-in participants directly at the camp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Registration Mode */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Registration Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegistrationMode('walkin_today')}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                    registrationMode === 'walkin_today'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <CalendarCheck className={`h-5 w-5 flex-shrink-0 ${registrationMode === 'walkin_today' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Walk-in Today</p>
                    <p className="text-xs text-muted-foreground">Register & mark attendance for today</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationMode('book_future')}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left ${
                    registrationMode === 'book_future'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <CalendarPlus className={`h-5 w-5 flex-shrink-0 ${registrationMode === 'book_future' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">Book for Another Day</p>
                    <p className="text-xs text-muted-foreground">Register for one or more future dates</p>
                  </div>
                </button>
              </div>

              {/* Multi-date picker for future bookings */}
              {registrationMode === 'book_future' && (
                <div className="mt-3">
                  <Label className="text-sm font-medium">Booking Dates * ({bookingDates.length} selected)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[320px] justify-start text-left font-normal mt-1",
                          bookingDates.length === 0 && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingDates.length > 0
                          ? `${bookingDates.length} date${bookingDates.length > 1 ? 's' : ''} selected`
                          : <span>Select booking dates</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="multiple"
                        selected={bookingDates}
                        onSelect={(dates) => setBookingDates(dates || [])}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  {bookingDates.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bookingDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((d, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                            {format(d, 'EEE, MMM d')}
                          </span>
                        ))}
                    </div>
                  )}
                  {bookingDates.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">Click multiple dates on the calendar to select them</p>
                  )}
                </div>
              )}
            </div>

            {/* Client Lookup */}
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4" />
                Returning Client? Look up previous registration
              </Label>
              <div className="flex gap-2">
                <Input
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Search by phone, email, or name..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleClientLookup())}
                />
                <Button type="button" variant="outline" size="sm" onClick={handleClientLookup} disabled={lookupLoading}>
                  {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {lookupResults.length > 0 && (
                <div className="space-y-2 mt-2">
                  {lookupResults.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between border rounded-md p-3 bg-background">
                      <div className="text-sm">
                        <p className="font-medium">{reg.parent_name}</p>
                        <p className="text-muted-foreground">{reg.email} · {reg.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {reg.children?.length || 0} child(ren): {reg.children?.map(c => c.childName).join(', ')}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyClientData(reg)}>
                        <UserCheck className="h-3 w-3 mr-1" /> Use
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Parent/Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Full Name *</Label>
                  <Input id="parentName" {...register('parentName')} placeholder="Enter parent/guardian name" />
                  {errors.parentName && <p className="text-sm text-destructive mt-1">{errors.parentName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" {...register('phone')} placeholder="+254 XXX XXX XXX" />
                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                  <Input id="emergencyContact" {...register('emergencyContact')} placeholder="Enter emergency contact name" />
                  {errors.emergencyContact && <p className="text-sm text-destructive mt-1">{errors.emergencyContact.message}</p>}
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                  <Input id="emergencyPhone" {...register('emergencyPhone')} placeholder="+254 XXX XXX XXX" />
                  {errors.emergencyPhone && <p className="text-sm text-destructive mt-1">{errors.emergencyPhone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="campType">Camp Type *</Label>
                  <Select onValueChange={(value) => setValue('campType', value)}>
                    <SelectTrigger><SelectValue placeholder="Select camp type" /></SelectTrigger>
                    <SelectContent>
                      {CAMP_TYPES.map(camp => (
                        <SelectItem key={camp.value} value={camp.value}>{camp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.campType && <p className="text-sm text-destructive mt-1">{errors.campType.message}</p>}
                </div>
                <div>
                  <Label>Location *</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Children Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Children Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    childName: '',
                    ageRange: '',
                    specialNeeds: '',
                    selectedSessions: [],
                    price: 0
                  })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Child
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Child {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Child's Full Name *</Label>
                      <Input {...register(`children.${index}.childName`)} placeholder="Enter child's name" />
                      {errors.children?.[index]?.childName && (
                        <p className="text-sm text-destructive mt-1">{errors.children[index]?.childName?.message}</p>
                      )}
                    </div>
                    <div>
                      <Label>Age Range *</Label>
                      <Select onValueChange={(value) => setValue(`children.${index}.ageRange`, value)} value={children[index]?.ageRange || ''}>
                        <SelectTrigger><SelectValue placeholder="Select age range" /></SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map(range => (
                            <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.children?.[index]?.ageRange && (
                        <p className="text-sm text-destructive mt-1">{errors.children[index]?.ageRange?.message}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label>Special Needs / Medical Information</Label>
                      <Textarea
                        {...register(`children.${index}.specialNeeds`)}
                        placeholder="Any allergies, medical conditions, or special requirements"
                        rows={2}
                      />
                    </div>
                    {/* Session selection: per-date for multi-day, global for single-day */}
                    {registrationMode === 'book_future' && bookingDates.length > 1 ? (
                      <div className="md:col-span-2">
                        <Label>Session per Date *</Label>
                        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                          {bookingDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map(date => {
                              const dateStr = date.toISOString().split('T')[0];
                              const currentSession = perDateSessions[index]?.[dateStr] || getSessionsForLocation()[0]?.value || 'full';
                              return (
                                <div key={dateStr} className="flex items-center gap-2 p-2 rounded border bg-background">
                                  <span className="text-sm font-medium min-w-[100px]">{format(date, 'EEE, MMM d')}</span>
                                  <div className="flex gap-1 flex-1">
                                    {getSessionsForLocation().map(session => (
                                      <Button
                                        key={session.value}
                                        type="button"
                                        variant={currentSession === session.value ? 'default' : 'outline'}
                                        size="sm"
                                        className="text-xs flex-1"
                                        onClick={() => setDateSession(index, dateStr, session.value)}
                                      >
                                        {session.label} - KES {session.price}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {/* Hidden: keep zod happy with at least one session */}
                        {children[index]?.selectedSessions?.length === 0 && (
                          <input type="hidden" {...register(`children.${index}.selectedSessions.0`)} value={getSessionsForLocation()[0]?.value || 'full'} />
                        )}
                      </div>
                    ) : (
                      <div className="md:col-span-2">
                        <Label>Select Sessions *</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getSessionsForLocation().map(session => (
                            <Button
                              key={session.value}
                              type="button"
                              variant={children[index]?.selectedSessions?.includes(session.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleSession(index, session.value)}
                            >
                              {session.label} - KES {session.price}
                            </Button>
                          ))}
                        </div>
                        {errors.children?.[index]?.selectedSessions && (
                          <p className="text-sm text-destructive mt-1">{errors.children[index]?.selectedSessions?.message}</p>
                        )}
                      </div>
                    )}
                    <div className="md:col-span-2 bg-muted p-3 rounded">
                      <p className="text-sm font-medium">
                        Subtotal for {children[index]?.childName || 'this child'}:
                        <span className="ml-2 text-primary">KES {calculateChildPrice(index).toLocaleString()}</span>
                        {registrationMode === 'book_future' && bookingDates.length > 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({bookingDates.length} dates)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Information</h3>

              <div className="bg-primary/10 p-4 rounded-lg">
                <p className="text-lg font-bold">
                  Total Amount: <span className="text-primary">KES {totalAmount.toLocaleString()}</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amountPaid">Amount Paid *</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    {...register('amountPaid', { valueAsNumber: true })}
                    placeholder="Enter amount received"
                  />
                  {errors.amountPaid && <p className="text-sm text-destructive mt-1">{errors.amountPaid.message}</p>}
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={watch('paymentMethod') || 'cash_ground'}
                    onValueChange={(v) => setValue('paymentMethod', v as any, { shouldValidate: true })}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Select method..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_ground">Cash (at gate)</SelectItem>
                      <SelectItem value="mpesa">M-Pesa (Paybill / Till)</SelectItem>
                      <SelectItem value="card">Card (Paystack / POS)</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && <p className="text-sm text-destructive mt-1">{(errors.paymentMethod as any).message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="paymentNotes">Payment Notes</Label>
                  <Textarea id="paymentNotes" {...register('paymentNotes')} placeholder="Any additional payment notes (e.g. M-Pesa transaction code)" rows={2} />
                </div>
              </div>

              {/* Balance indicator */}
              {totalAmount > 0 && (
                <div className={cn(
                  "p-3 rounded-lg border text-sm font-medium",
                  balanceDue <= 0
                    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                    : amountPaid > 0
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                )}>
                  {balanceDue <= 0
                    ? '✓ Fully Paid'
                    : amountPaid > 0
                      ? `⚠ Partial Payment — Balance Due: KES ${balanceDue.toLocaleString()}`
                      : `✗ Unpaid — Balance Due: KES ${balanceDue.toLocaleString()}`}
                </div>
              )}
            </div>

            {/* Email Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmailFull"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(checked === true)}
              />
              <Label htmlFor="sendEmailFull" className="flex items-center gap-1.5 text-sm cursor-pointer">
                <Mail className="h-3.5 w-3.5" />
                Send confirmation email to client
              </Label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="submit" size="lg" disabled={submitting} className="min-w-[200px]">
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><UserPlus className="mr-2 h-4 w-4" /> Complete Registration</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {completedRegistration && (
        <QRCodeDownloadModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          registration={completedRegistration}
          qrCodeDataUrl={qrCodeDataUrl}
          registrationType="online_only"
        />
      )}
    </>
  );
};
