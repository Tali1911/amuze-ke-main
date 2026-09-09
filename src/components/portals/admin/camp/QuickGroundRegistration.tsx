import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Loader2, Mail, Search, UserCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { campRegistrationService } from '@/services/campRegistrationService';
import { attendanceService } from '@/services/attendanceService';
import { financialService } from '@/services/financialService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { accountsActionService } from '@/services/accountsActionService';
import { CampRegistration } from '@/types/campRegistration';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { supabase } from '@/integrations/supabase/client';

const childSchema = z.object({
  childName: z.string().min(2, 'Name required'),
  ageRange: z.string().min(1, 'Age required'),
  price: z.number().min(0)
});

const quickRegSchema = z.object({
  parentName: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  campType: z.string().min(1, 'Select camp'),
  children: z.array(childSchema).min(1, 'Add at least one child'),
  sessionType: z.string().min(1, 'Select session'),
  amountPaid: z.number().min(0),
  paymentMethod: z.enum(['cash_ground', 'mpesa', 'card', 'bank_transfer']).default('cash_ground'),
  notes: z.string().optional()
});

type QuickRegForm = z.infer<typeof quickRegSchema>;

const CAMP_TYPES = [
  { value: 'mid-term-feb-march', label: 'Mid-Term Feb/March' },
  { value: 'mid-term-may-june', label: 'Mid-Term May/June' },
  { value: 'mid-term-october', label: 'Mid-Term October' },
  { value: 'easter', label: 'Easter Camp' },
  { value: 'summer', label: 'Summer Camp' },
  { value: 'end-year', label: 'End Year Camp' },
  { value: 'day-camps', label: 'Day Camps' },
  { value: 'little-forest', label: 'Little Explorers' },
];

const LOCATIONS = ['Kurura Gate F', 'Ngong Sanctuary'];

const AGE_RANGES = [
  { value: '3-below', label: '3 & Below (Neem)' },
  { value: '4-6', label: '4-6 (Grevillea)' },
  { value: '7-10', label: '7-10 (Croton)' },
  { value: '11-15', label: '11-15 (Mighty Oaks)' }
];

const SESSIONS_KARURA = [
  { value: 'full', label: 'Full Day', price: 2500 },
  { value: 'half', label: 'Half Day', price: 1500 }
];

const SESSIONS_NGONG = [
  { value: 'full', label: 'Full Day', price: 2000 },
  { value: 'archery', label: 'Archery (45 min)', price: 1000 }
];

const SESSIONS_LITTLE_EXPLORERS = [
  { value: 'session', label: 'Little Explorers Session', price: 1500 }
];

interface QuickGroundRegistrationProps {
  onComplete: () => void;
}

export const QuickGroundRegistration: React.FC<QuickGroundRegistrationProps> = ({ onComplete }) => {
  const { user } = useSupabaseAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Kurura Gate F');

  // Client lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<CampRegistration[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QuickRegForm>({
    resolver: zodResolver(quickRegSchema),
    defaultValues: {
      children: [{ childName: '', ageRange: '', price: 0 }],
      amountPaid: 0,
      sessionType: 'full',
      paymentMethod: 'cash_ground'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children'
  });

  const sessionType = watch('sessionType');
  const children = watch('children');
  const campType = watch('campType');
  const amountPaid = watch('amountPaid') || 0;

  const availableSessions = campType === 'little-forest'
    ? SESSIONS_LITTLE_EXPLORERS
    : selectedLocation === 'Ngong Sanctuary' ? SESSIONS_NGONG : SESSIONS_KARURA;
  const sessionPrice = availableSessions.find(s => s.value === sessionType)?.price || 0;
  const totalAmount = children.length * sessionPrice;
  const balanceDue = totalAmount - amountPaid;

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
    if (reg.children && reg.children.length > 0) {
      const mappedChildren = reg.children.map(c => ({
        childName: c.childName || '',
        ageRange: c.ageRange || '',
        price: 0
      }));
      setValue('children', mappedChildren);
    }
    setLookupResults([]);
    setLookupQuery('');
    toast.success('Client details auto-filled!');
  };

  const onSubmit = async (data: QuickRegForm) => {
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
        emergency_contact: data.phone,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: '',
          ageRange: child.ageRange,
          specialNeeds: '',
          selectedDays: ['Day 1'],
          selectedDates: [new Date().toISOString().split('T')[0]],
          selectedSessions: { [new Date().toISOString().split('T')[0]]: data.sessionType as 'full' | 'half' },
          price: sessionPrice
        })),
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
        admin_notes: data.notes || `Walk-in registration. Paid: KES ${amountPaid}/${totalAmount}`
      };

      const registration = await campRegistrationService.createRegistration(registrationData);

      if (registration) {
        // Record submission immediately after successful registration to prevent duplicates
        await recordSubmission(data, 'ground-registration');

        toast.success(`Registered! #${registration.registration_number}`);

        // --- Non-critical post-registration steps (failures logged, not blocking) ---

        if (amountPaid > 0) {
          try {
            await financialService.createPaymentFromRegistration({
              registrationId: registration.id,
              registrationType: 'camp',
              source: 'ground_registration',
              customerName: data.parentName,
              programName: `${data.campType} (Walk-in)`,
              amount: amountPaid,
              paymentMethod: data.paymentMethod,
              paymentReference: `${data.paymentMethod.toUpperCase()}-${Date.now()}`,
              notes: `Walk-in registration. Paid: KES ${amountPaid}/${totalAmount}`,
              createdBy: user?.id
            });
          } catch (paymentError) {
            console.error('Payment recording failed:', paymentError);
            toast.warning('Registration saved but payment record failed. Please record payment manually.');
          }
        }

        try {
          await leadsService.createLead({
            full_name: data.parentName,
            email: data.email,
            phone: data.phone,
            program_type: data.campType,
            program_name: `${data.campType} (Walk-in)`,
            form_data: data,
            source: 'ground_registration'
          });
        } catch (leadError) {
          console.error('Lead creation failed:', leadError);
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
                    selectedDates: [new Date().toISOString().split('T')[0]],
                    selectedSessions: { [new Date().toISOString().split('T')[0]]: data.sessionType },
                    price: sessionPrice,
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

        // Mark attendance for today (creates camp_attendance record + triggers action item via DB trigger)
        try {
          for (const child of data.children) {
            await attendanceService.checkInForDate(
              registration.id,
              child.childName,
              user?.id || '',
              new Date().toISOString().split('T')[0],
              'Auto check-in from quick walk-in registration'
            );
          }
        } catch (attendanceError) {
          console.error('Auto attendance marking failed:', attendanceError);
          toast.warning('Registration saved but attendance marking failed. Please mark manually.');
        }

        // For unpaid/partial: also ensure action items exist with correct amounts (in case trigger didn't fire or has stale data)
        if (paymentStatus !== 'paid') {
          const perChildAmount = Math.round(totalAmount / data.children.length);
          const perChildPaid = Math.round(amountPaid / data.children.length);
          for (const child of data.children) {
            try {
              await accountsActionService.createUnpaidCheckInItem(
                registration.id,
                child.childName,
                data.parentName,
                data.email,
                data.phone,
                perChildAmount,
                perChildPaid,
                data.campType,
                selectedLocation
              );
            } catch (actionError) {
              console.error('Failed to create pending collection item:', actionError);
              toast.warning(`Pending collection item for ${child.childName} could not be created.`);
            }
          }
        }

        reset();
        onComplete();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      {/* Client Lookup */}
      <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Search className="h-3 w-3" />
          Returning client? Search previous records
        </Label>
        <div className="flex gap-2">
          <Input
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            placeholder="Phone, email, or name..."
            className="text-sm"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleClientLookup())}
          />
          <Button type="button" variant="outline" size="sm" onClick={handleClientLookup} disabled={lookupLoading}>
            {lookupLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
          </Button>
        </div>
        {lookupResults.length > 0 && (
          <div className="space-y-1.5 mt-1">
            {lookupResults.map((reg) => (
              <div key={reg.id} className="flex items-center justify-between border rounded p-2 bg-background text-xs">
                <div>
                  <p className="font-medium">{reg.parent_name}</p>
                  <p className="text-muted-foreground">{reg.phone} · {reg.children?.map(c => c.childName).join(', ')}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => applyClientData(reg)} className="text-xs h-7 px-2">
                  <UserCheck className="h-3 w-3 mr-1" /> Use
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parent Info */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label>Parent Name *</Label>
          <Input {...register('parentName')} placeholder="Full name" />
          {errors.parentName && <p className="text-xs text-destructive mt-1">{errors.parentName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Email *</Label>
            <Input {...register('email')} type="email" placeholder="email@example.com" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Phone *</Label>
            <Input {...register('phone')} placeholder="+254..." />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Camp, Location & Session */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Camp Type *</Label>
          <Select onValueChange={(v) => setValue('campType', v)}>
            <SelectTrigger><SelectValue placeholder="Select camp" /></SelectTrigger>
            <SelectContent>
              {CAMP_TYPES.map(camp => (
                <SelectItem key={camp.value} value={camp.value}>{camp.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.campType && <p className="text-xs text-destructive mt-1">{errors.campType.message}</p>}
        </div>
        <div>
          <Label>Location *</Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Session *</Label>
          <Select value={sessionType} onValueChange={(v) => setValue('sessionType', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {availableSessions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label} - KES {s.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Children ({children.length})</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ childName: '', ageRange: '', price: 0 })}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            <div className="flex-1">
              <Input {...register(`children.${index}.childName`)} placeholder="Child's name" />
            </div>
            <Select onValueChange={(v) => setValue(`children.${index}.ageRange`, v)} value={children[index]?.ageRange || ''}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Age" /></SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fields.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Payment */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total Amount:</span>
          <span className="font-bold">KES {totalAmount.toLocaleString()}</span>
        </div>
        <div>
          <Label>Amount Paid (KES)</Label>
          <Input type="number" {...register('amountPaid', { valueAsNumber: true })} placeholder="0" />
        </div>
        <div>
          <Label>Payment Method</Label>
          <Select
            value={watch('paymentMethod') || 'cash_ground'}
            onValueChange={(v) => setValue('paymentMethod', v as any, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash_ground">Cash (at gate)</SelectItem>
              <SelectItem value="mpesa">M-Pesa (Paybill / Till)</SelectItem>
              <SelectItem value="card">Card (Paystack / POS)</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Balance indicator */}
        {totalAmount > 0 && (
          <div className={cn(
            "p-2 rounded text-xs font-medium",
            balanceDue <= 0
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : amountPaid > 0
                ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                : "bg-destructive/10 text-destructive"
          )}>
            {balanceDue <= 0
              ? '✓ Fully Paid'
              : amountPaid > 0
                ? `⚠ Partial — Balance: KES ${balanceDue.toLocaleString()}`
                : `✗ Unpaid — KES ${balanceDue.toLocaleString()} due`}
          </div>
        )}
      </div>

      {/* Email Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox id="sendEmail" checked={sendEmail} onCheckedChange={(checked) => setSendEmail(checked === true)} />
        <Label htmlFor="sendEmail" className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Mail className="h-3.5 w-3.5" />
          Send confirmation email to client
        </Label>
      </div>

      {/* Notes */}
      <div>
        <Label>Notes (optional)</Label>
        <Textarea {...register('notes')} placeholder="Any notes..." rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Register Walk-in
      </Button>
    </form>
  );
};
