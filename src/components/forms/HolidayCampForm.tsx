import React, { useEffect, useState } from 'react';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import DatePickerField from './DatePickerField';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { differenceInYears } from 'date-fns';
import { useCampFormConfig } from '@/hooks/useCampFormConfig';
import { useCampDatesForLocation } from '@/hooks/useCampDatesForLocation';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';
import { leadsService } from '@/services/leadsService';
import { DateSelector } from './DateSelector';
import { invoiceService } from '@/services/invoiceService';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { discountService, DiscountApplication } from '@/services/discountService';
import { LocationSelector } from './LocationSelector';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { ActivityTypeSelector } from './ActivityTypeSelector';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { scrollToFirstError } from '@/utils/scrollToError';

const childSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100),
  dateOfBirth: z.date({ required_error: 'Date of birth is required' }),
  ageRange: z.enum(['3-below', '4-6', '7-10', '11-15'], { required_error: 'Age range is required' }),
  specialNeeds: z.string().max(500).optional(),
  selectedDates: z.array(z.string()).min(1, 'At least one date is required'),
  sessionTypes: z.record(z.enum(['half', 'full'])),
  totalPrice: z.number(),
  activityType: z.enum(['camp', 'archery']).default('camp')
});

const holidayCampSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  campType: z.string().min(1, 'Camp type is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) })
});

type HolidayCampFormData = z.infer<typeof holidayCampSchema>;

interface HolidayCampFormProps {
  campType: string;
  campTitle: string;
}

const calculateAgeRange = (dateOfBirth: Date): '3-below' | '4-6' | '7-10' | '11-15' => {
  const age = differenceInYears(new Date(), dateOfBirth);
  if (age <= 3) return '3-below';
  if (age <= 6) return '4-6';
  if (age <= 10) return '7-10';
  return '11-15';
};

const HolidayCampForm = ({ campType, campTitle }: HolidayCampFormProps) => {
  // Pass the specific campType directly so calendar date sync matches exactly
  // (e.g., 'mid-term-february' only gets mid-term-feb dates, not all mid-term dates)
  const { config, isLoading } = useCampFormConfig(campType);
  const [selectedLocation, setSelectedLocation] = useState('');
  const { dates: locationScopedDates } = useCampDatesForLocation(
    campType,
    selectedLocation,
    config?.availableDates
  );
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  
  // Client auth for auto-fill
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();

  // Show benefits dialog for non-signed-in users after a delay
  useEffect(() => {
    if (authLoading) return;
    if (isSignedIn) { setShowBenefitsDialog(false); return; }
    if (!sessionStorage.getItem('benefits_dialog_dismissed')) {
      const timer = setTimeout(() => setShowBenefitsDialog(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, authLoading]);

  const calculatePrice = (selectedDates: string[], sessionTypes: Record<string, 'half' | 'full'>, activityType: 'camp' | 'archery' = 'camp', location?: string): number => {
    if (!config) return 0;
    if (activityType === 'archery') {
      return selectedDates.length * (config.archeryRate || 1000);
    }
    // Ngong Sanctuary now mirrors Karura's Half/Full Day pricing
    return selectedDates.reduce((sum, date) => {
      const sessionType = sessionTypes[date] || 'full';
      return sum + (sessionType === 'half' ? config.pricing.halfDayRate : config.pricing.fullDayRate);
    }, 0);
  };

  // Set default location when config loads
  useEffect(() => {
    if (config?.locations?.length && !selectedLocation) {
      setSelectedLocation(config.locations[0]);
    }
  }, [config]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HolidayCampFormData>({
    resolver: zodResolver(holidayCampSchema),
    defaultValues: {
      children: [{ 
        childName: '', 
        dateOfBirth: undefined, 
        ageRange: '3-below' as const, 
        specialNeeds: '',
        selectedDates: [],
        sessionTypes: {},
        totalPrice: 0,
        activityType: 'camp' as const
      }],
      campType: campType,
      consent: false
    }
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: 'children'
  });

  const consent = watch('consent');
  const watchedChildren = watch('children');

  const isNgongSanctuary = selectedLocation === 'Ngong Sanctuary';

  // Track which fields were auto-filled
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  // Guard: only auto-fill ONCE per mount. Without this, any later refresh of the
  // client profile (e.g. after the parent ticks the participation consent box,
  // which calls refreshProfile()) would re-run this effect and wipe out dates
  // the parent had already picked for earlier children.
  const autoFilledOnceRef = React.useRef(false);

  // Auto-fill from client profile (Google sign-in)
  useEffect(() => {
    if (autoFilledOnceRef.current) return;
    if (isSignedIn && clientProfile) {
      const filled = new Set<string>();
      if (clientProfile.full_name) { setValue('parentName', clientProfile.full_name); filled.add('parentName'); }
      if (clientProfile.email) { setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { setValue('phone', clientProfile.phone); filled.add('phone'); }

      // Auto-fill children from profile
      if (Array.isArray(clientProfile.children) && clientProfile.children.length > 0) {
        const profileChildren = clientProfile.children
          .filter((c: any) => c.name)
          .map((c: any) => {
            const dob = c.dateOfBirth ? new Date(c.dateOfBirth) : undefined;
            const ageRange = dob ? calculateAgeRange(dob) : '3-below' as const;
            return {
              childName: c.name || '',
              dateOfBirth: dob,
              ageRange,
              specialNeeds: c.specialNeeds || '',
              selectedDates: [] as string[],
              sessionTypes: {} as Record<string, 'half' | 'full'>,
              totalPrice: 0,
              activityType: 'camp' as const,
            };
          });
        if (profileChildren.length > 0) {
          setValue('children', profileChildren);
          filled.add('children');
        }
      }
      if (filled.size > 0) setAutoFilledFields(filled);
      autoFilledOnceRef.current = true;
    }
  }, [isSignedIn, clientProfile, setValue]);

  // Auto-calculate age range and price
  useEffect(() => {
    watchedChildren.forEach((child, index) => {
      if (child.dateOfBirth) {
        const calculatedAgeRange = calculateAgeRange(child.dateOfBirth);
        if (child.ageRange !== calculatedAgeRange) {
          setValue(`children.${index}.ageRange`, calculatedAgeRange, { shouldValidate: false });
        }
      }
      
      if (child.selectedDates && child.sessionTypes) {
        const calculatedPrice = calculatePrice(child.selectedDates, child.sessionTypes, child.activityType, selectedLocation);
        if (child.totalPrice !== calculatedPrice) {
          setValue(`children.${index}.totalPrice`, calculatedPrice, { shouldValidate: false });
        }
      }
    });
  }, [watchedChildren.map(c => `${c.dateOfBirth?.getTime()}-${c.selectedDates?.join(',')}-${JSON.stringify(c.sessionTypes)}-${c.activityType}`).join('|'), setValue, config, selectedLocation]);

  // Reset activity types when location changes away from Ngong Sanctuary
  useEffect(() => {
    if (!isNgongSanctuary) {
      watchedChildren.forEach((child, index) => {
        if (child.activityType === 'archery') {
          setValue(`children.${index}.activityType`, 'camp', { shouldValidate: false });
        }
      });
    }
  }, [isNgongSanctuary]);

  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [registrationType, setRegistrationType] = useState<'online_only' | 'online_paid'>('online_only');
  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');
  // Ref mirrors the latest submit action so onSubmit reads it synchronously,
  // even if React batches the setSubmitType update.
  const submitActionRef = React.useRef<'register' | 'pay'>('register');
  const [previewDiscount, setPreviewDiscount] = useState<DiscountApplication | null>(null);

  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const subtotal = watchedChildren.reduce((sum, child) => sum + (child.totalPrice || 0), 0);
  const numChildren = watchedChildren.length;

  // Live preview of any pre-issued discount for this client
  useEffect(() => {
    const email = (watchedEmail || '').trim();
    const phone = (watchedPhone || '').trim();
    if ((!email && !phone) || subtotal <= 0) {
      setPreviewDiscount(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const result = await discountService.findApplicable({
          email,
          phone,
          campType: campType as string,
          totalBeforeDiscount: subtotal,
          numChildren,
        });
        setPreviewDiscount(result);
      } catch {
        setPreviewDiscount(null);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [watchedEmail, watchedPhone, campType, subtotal, numChildren]);

  const onSubmit = async (data: HolidayCampFormData) => {
    // Read from ref first; falls back to state if ref is unset.
    const buttonType = submitActionRef.current || submitType;
    if (!config) return;
    
    const securityCheck = await performSecurityChecks(data, 'holiday-camp');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const subtotalAmount = data.children.reduce((sum, child) => sum + child.totalPrice, 0);

      // Look up an active discount issued to this client (by email OR phone)
      let totalAmount = subtotalAmount;
      let appliedDiscount: Awaited<ReturnType<typeof discountService.findApplicable>> = null;
      try {
        appliedDiscount = await discountService.findApplicable({
          email: data.email,
          phone: data.phone,
          campType: campType as string,
          totalBeforeDiscount: subtotalAmount,
          numChildren: data.children.length,
          audit: true,
        });
        if (appliedDiscount) {
          totalAmount = appliedDiscount.finalTotal;
          toast.success(
            `Discount applied: ${appliedDiscount.description} — you save KES ${appliedDiscount.discountAmount.toLocaleString()}`
          );
        }
      } catch (e) {
        console.warn('Discount lookup failed (non-fatal):', e);
      }

      const tempId = crypto.randomUUID();
      const qrCodeData = qrCodeService.generateQRCodeData(tempId);

      const registrationData = {
        camp_type: campType as any,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        location: selectedLocation,
        children: data.children.map(child => ({
          childName: child.childName,
          dateOfBirth: child.dateOfBirth.toISOString(),
          ageRange: child.ageRange,
          specialNeeds: child.specialNeeds || '',
          selectedDays: child.selectedDates.map((date, i) => `Day ${i + 1}`),
          selectedDates: child.selectedDates,
          selectedSessions: child.sessionTypes,
          price: child.totalPrice,
          activityType: child.activityType,
        })),
        total_amount: totalAmount,
        discount_id: appliedDiscount?.discount.id ?? null,
        discount_amount: appliedDiscount?.discountAmount ?? 0,
        payment_status: 'unpaid' as const,
        payment_method: 'pending' as const,
        registration_type: 'online_only' as const,
        qr_code_data: qrCodeData,
        consent_given: data.consent,
        status: 'active' as const,
      };

      const registration = await campRegistrationService.createRegistration(registrationData);

      // Mark applied discount as used (non-blocking)
      if (appliedDiscount) {
        try {
          await discountService.markUsed(
            appliedDiscount.discount.id,
            registration.id,
            appliedDiscount.discountAmount
          );
        } catch (e) {
          console.warn('Failed to mark discount used (non-fatal):', e);
        }
      }

      const qrUrl = await qrCodeService.generateQRCode(qrCodeData);
      
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: campType, // seasonal slug: 'summer' | 'easter' | 'end-year' | 'mid-term-*'
        program_name: campTitle,
        form_data: { ...data, campType, season: campType },
        source: 'website_registration'
      });

      try {
        await invoiceService.createFromRegistration({
          id: registration.id,
          type: 'camp',
          parentName: data.parentName,
          email: data.email,
          programName: campTitle,
          totalAmount: totalAmount,
          children: data.children.map(child => ({
            childName: child.childName,
            price: child.totalPrice,
            selectedDates: child.selectedDates
          }))
        });
      } catch (invoiceError) {
        console.error('⚠️ Failed to create auto-invoice:', invoiceError);
      }
      
      const { supabase } = await import('@/integrations/supabase/client');

      // For "Pay Now" flow: open Paystack FIRST so it isn't blocked by email failures
      // or hidden behind the QR success modal.
      if (buttonType === 'pay') {
        try {
          console.log('💳 Opening Paystack checkout...', { email: data.email, amount: totalAmount });
          const { openPaystackCheckout, generatePaystackReference } = await import('@/lib/paystack');
          const reference = generatePaystackReference('AMU');
          await openPaystackCheckout({
            email: data.email,
            amountKES: totalAmount,
            reference,
            metadata: {
              registrationId: registration.id,
              registrationNumber: registration.registration_number,
              parentName: data.parentName,
              programName: campTitle,
            },
            onSuccess: async (ref) => {
              try {
                const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
                  'paystack-verify',
                  { body: { reference: ref, registrationId: registration.id } }
                );
                if (verifyErr) throw verifyErr;
                if (!verifyData?.success) throw new Error(verifyData?.error || 'Verification failed');
                toast.success('Payment received. Thank you!');
              } catch (e) {
                console.error('Verify error:', e);
                toast.error(`Payment processed but verification failed. Reference: ${ref}`);
              } finally {
                // Show success/QR modal AFTER payment attempt completes
                setRegistrationResult(registration);
                setQrCodeDataUrl(qrUrl);
                setRegistrationType('online_paid');
                setShowQRModal(true);
              }
            },
            onClose: () => {
              toast.info('Payment cancelled. You can complete it later from My Registrations.');
              // Still show QR modal so the user has their registration confirmation
              setRegistrationResult(registration);
              setQrCodeDataUrl(qrUrl);
              setRegistrationType('online_only');
              setShowQRModal(true);
            },
          });
        } catch (e) {
          console.error('Paystack init error:', e);
          toast.error('Could not start online payment. Please try again from My Registrations.');
          // Fallback: still show confirmation
          setRegistrationResult(registration);
          setQrCodeDataUrl(qrUrl);
          setRegistrationType('online_only');
          setShowQRModal(true);
        }
      } else {
        // "Register only" flow: show confirmation immediately
        setRegistrationResult(registration);
        setQrCodeDataUrl(qrUrl);
        setRegistrationType('online_only');
        setShowQRModal(true);
      }

      // Send confirmation email in background (non-blocking, never breaks payment)
      console.log('📧 Sending confirmation email (background)...');
      supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: campType,
          registrationDetails: {
            parentName: data.parentName,
            campTitle: campTitle,
            children: data.children,
            campType: campType,
            registrationId: registration.id,
            location: selectedLocation,
            emailContent: (config as any).emailContent
          },
          invoiceDetails: {
            totalAmount: totalAmount,
            paymentMethod: buttonType === 'pay' ? 'online_payment' : 'cash'
          }
        }
      }).then(({ error }) => {
        if (error) console.error('❌ Email sending failed (non-blocking):', error);
      }).catch((e) => console.error('❌ Email invoke error (non-blocking):', e));

      toast.success(config.messages.registrationSuccess);
      await recordSubmission(data, 'holiday-camp');

      // Save children back to client profile for future auto-fill
      if (isSignedIn && clientProfile) {
        try {
          const { clientProfileService } = await import('@/services/clientProfileService');
          const existingChildren = Array.isArray(clientProfile.children) ? clientProfile.children : [];
          const existingNames = new Set(existingChildren.map((c: any) => c.name?.toLowerCase().trim()));
          const newChildren = data.children
            .filter(c => c.childName && !existingNames.has(c.childName.toLowerCase().trim()))
            .map(c => ({
              name: c.childName,
              dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString().split('T')[0] : '',
              specialNeeds: c.specialNeeds || '',
            }));
          if (newChildren.length > 0) {
            await clientProfileService.updateProfile(clientProfile.auth_user_id, {
              children: [...existingChildren, ...newChildren],
            });
            toast.success('Children saved to your profile', {
              description: "Next time you register, their details will be auto-filled.",
            });
          }
        } catch (e) {
          console.error('Failed to save children to profile:', e);
        }
      }

      reset();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(config.messages.registrationError);
    }
  };

  if (isLoading || !config) {
    return (
      <Card className="p-8 sticky top-8">
        <p className="text-center text-muted-foreground">Loading form...</p>
      </Card>
    );
  }

  if (!config.fields || !config.pricing || !config.buttons || !config.messages) {
    return (
      <Card className="p-8 sticky top-8">
        <p className="text-center text-destructive">Form configuration is incomplete. Please contact support.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8 sticky top-8">
      <h3 className="text-2xl font-bold text-primary mb-6">{campTitle}</h3>
      
      <SignUpBenefitsDialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog} />
      
      {!isSignedIn && !authLoading && (
        <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Sign in with Google</span> to auto-fill your details and save time
          </p>
          <GoogleSignInButton />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-6">
        <div>
          <Label htmlFor="parentName" className="text-base font-medium">{config.fields.parentName.label} *{autoFilledFields.has('parentName') && <AutoFilledBadge />}</Label>
          <Input id="parentName" {...register('parentName')} className="mt-2" placeholder={config.fields.parentName.placeholder} />
          {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
        </div>

        {/* Location Selector */}
        {config.locations && config.locations.length > 0 && (
          <LocationSelector
            locations={config.locations}
            value={selectedLocation}
            onChange={(loc) => {
              setSelectedLocation(loc);
              // Clear any dates already picked — they may not belong to the new location
              watchedChildren.forEach((_, index) => {
                setValue(`children.${index}.selectedDates`, [], { shouldValidate: false });
                setValue(`children.${index}.sessionTypes`, {}, { shouldValidate: false });
              });
            }}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-medium">{config.fields.childName.label} *{autoFilledFields.has('children') && <AutoFilledBadge />}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendChild({ 
                childName: '', 
                dateOfBirth: undefined, 
                ageRange: '3-below' as const, 
                specialNeeds: '',
                selectedDates: [],
                sessionTypes: {},
                totalPrice: 0,
                activityType: 'camp' as const
              })}
            >
              <Plus className="w-4 h-4 mr-1" />
              {config.buttons.addChild}
            </Button>
          </div>
          
          <div className="space-y-6">
            {childrenFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Child {index + 1}</h4>
                  {childrenFields.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeChild(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {config.buttons.removeChild}
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm">{config.fields.childName.label}</Label>
                  <Input
                    {...register(`children.${index}.childName`)}
                    className="mt-1"
                    placeholder={config.fields.childName.placeholder}
                  />
                  {errors.children?.[index]?.childName && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.childName?.message}</p>
                  )}
                </div>

                <Controller
                  name={`children.${index}.dateOfBirth`}
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label={config.fields.dateOfBirth.label}
                      placeholder={config.fields.dateOfBirth.placeholder}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.children?.[index]?.dateOfBirth?.message}
                      required
                    />
                  )}
                />
                
                <div>
                  <Label className="text-sm">{config.fields.ageRange.label} (Auto-calculated)</Label>
                  <Controller
                    name={`children.${index}.ageRange`}
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <SelectTrigger className="mt-1 bg-muted">
                          <SelectValue placeholder="Select date of birth first" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-below">3 & Below (Neem)</SelectItem>
                          <SelectItem value="4-6">4-6 (Grevillea)</SelectItem>
                          <SelectItem value="7-10">7-10 (Croton)</SelectItem>
                          <SelectItem value="11-15">11-15 (Mighty Oaks)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.children?.[index]?.ageRange && (
                    <p className="text-destructive text-sm mt-1">{errors.children[index]?.ageRange?.message}</p>
                  )}
                </div>

                {/* Activity Type Selector for Ngong Sanctuary */}
                {isNgongSanctuary && (
                  <ActivityTypeSelector
                    value={watchedChildren[index]?.activityType || 'camp'}
                    onChange={(v) => setValue(`children.${index}.activityType`, v, { shouldValidate: false })}
                    archeryRate={config.archeryRate || 1000}
                    currency={config.pricing.currency}
                  />
                )}

                {/* Date & Session selection — hide session picker for archery */}
                {locationScopedDates.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
                    {selectedLocation
                      ? `${selectedLocation} dates for ${campTitle} are not yet published. Please check back soon or pick another location.`
                      : `No upcoming dates for ${campTitle} have been published yet.`}
                  </div>
                ) : watchedChildren[index]?.activityType !== 'archery' ? (
                  <DateSelector
                    availableDates={locationScopedDates}
                    selectedDates={watchedChildren[index]?.selectedDates || []}
                    sessionTypes={watchedChildren[index]?.sessionTypes || {}}
                    onDatesChange={(dates) => setValue(`children.${index}.selectedDates`, dates, { shouldValidate: true })}
                    onSessionTypeChange={(date, type) => {
                      const currentTypes = watchedChildren[index]?.sessionTypes || {};
                      setValue(`children.${index}.sessionTypes`, { ...currentTypes, [date]: type }, { shouldValidate: true });
                    }}
                    halfDayRate={config.pricing.halfDayRate}
                    fullDayRate={config.pricing.fullDayRate}
                    currency={config.pricing.currency}
                  />
                ) : (
                  <DateSelector
                    availableDates={locationScopedDates}
                    selectedDates={watchedChildren[index]?.selectedDates || []}
                    sessionTypes={{}}
                    onDatesChange={(dates) => setValue(`children.${index}.selectedDates`, dates, { shouldValidate: true })}
                    onSessionTypeChange={() => {}}
                    halfDayRate={config.archeryRate || 1000}
                    fullDayRate={config.archeryRate || 1000}
                    currency={config.pricing.currency}
                  />
                )}
                {errors.children?.[index]?.selectedDates && (
                  <p className="text-destructive text-sm mt-1">{errors.children[index]?.selectedDates?.message}</p>
                )}

                {watchedChildren[index]?.selectedDates?.length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Price for this child:</span>
                      <span className="text-lg font-bold text-primary">
                        {config.pricing.currency} {watchedChildren[index]?.totalPrice?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {watchedChildren[index]?.activityType === 'archery'
                        ? `${watchedChildren[index]?.selectedDates?.length || 0} archery session(s)`
                        : `${Object.values(watchedChildren[index]?.sessionTypes || {}).filter(s => s === 'half').length} half days + ${Object.values(watchedChildren[index]?.sessionTypes || {}).filter(s => s === 'full').length} full days`
                      }
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm">{config.fields.specialNeeds.label}</Label>
                  <Input
                    {...register(`children.${index}.specialNeeds`)}
                    className="mt-1"
                    placeholder={config.fields.specialNeeds.placeholder}
                  />
                </div>
              </div>
            ))}
          </div>
          {errors.children && typeof errors.children.message === 'string' && (
            <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="emergencyContact" className="text-base font-medium">{config.fields.emergencyContact.label} *</Label>
          <Input id="emergencyContact" {...register('emergencyContact')} className="mt-2" placeholder={config.fields.emergencyContact.placeholder} />
          {errors.emergencyContact && <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-base font-medium">{config.fields.email.label} *{autoFilledFields.has('email') && <AutoFilledBadge />}</Label>
            <Input id="email" type="email" {...register('email')} className="mt-2" placeholder={config.fields.email.placeholder} />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="phone" className="text-base font-medium">{config.fields.phone.label} *{autoFilledFields.has('phone') && <AutoFilledBadge />}</Label>
            <Input id="phone" {...register('phone')} className="mt-2" placeholder={config.fields.phone.placeholder} />
            {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
          </div>
        </div>

        <Controller
          name="participationConsent"
          control={control}
          render={({ field }) => (
            <ParticipationConsentDialog
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v ? true : undefined)}
              error={errors.participationConsent?.message}
              variant="child"
              eventName={campTitle}
            />
          )}
        />

        <ConsentDialog checked={consent} onCheckedChange={checked => setValue('consent', checked)} error={errors.consent?.message} />

        <RefundPolicyDialog />

        <div className="bg-primary/10 rounded-lg p-4 space-y-2">
          {previewDiscount ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">
                  {config.pricing.currency} {previewDiscount.originalTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-700 font-medium">
                  Discount applied ({previewDiscount.description})
                  {previewDiscount.discount.reason ? ` — ${previewDiscount.discount.reason}` : ''}:
                </span>
                <span className="font-medium text-emerald-700">
                  − {config.pricing.currency} {previewDiscount.discountAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-base font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  {config.pricing.currency} {previewDiscount.finalTotal.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                A discount issued to this client has been automatically applied.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold text-primary">
                {config.pricing.currency} {subtotal.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <PaymentGatewayPlaceholder />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            onClick={() => {
              submitActionRef.current = 'register';
              setSubmitType('register');
              handleSubmit(onSubmit)();
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Register Only'}
          </Button>
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            onClick={() => {
              submitActionRef.current = 'pay';
              setSubmitType('pay');
              handleSubmit(onSubmit)();
            }}
          >
            {isSubmitting ? 'Processing...' : 'Register & Pay Now'}
          </Button>
        </div>
      </form>

      {registrationResult && (
        <QRCodeDownloadModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          registration={registrationResult}
          qrCodeDataUrl={qrCodeDataUrl}
          registrationType={registrationType}
        />
      )}
    </Card>
  );
};

export default HolidayCampForm;
