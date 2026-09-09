import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useClientAuth } from '@/hooks/useClientAuth';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Baby, Clock, Heart, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from 'react-router-dom';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { PaymentGatewayPlaceholder } from '@/components/camp/PaymentGatewayPlaceholder';
import { QRCodeDownloadModal } from '@/components/camp/QRCodeDownloadModal';
import SimpleDateSelector from './SimpleDateSelector';
import { campRegistrationService } from '@/services/campRegistrationService';
import { qrCodeService } from '@/services/qrCodeService';
import { leadsService } from '@/services/leadsService';
import { invoiceService } from '@/services/invoiceService';
import type { CampRegistration } from '@/types/campRegistration';
import { scrollToFirstError } from '@/utils/scrollToError';
import { useLittleForestConfig } from '@/hooks/useLittleForestConfig';
import { useCampDatesForLocation } from '@/hooks/useCampDatesForLocation';
import DynamicMedia from '@/components/content/DynamicMedia';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { LocationSelector } from './LocationSelector';

// Child schema for multiple children support with simple date selection
const childSchema = z.object({
  childName: z.string().min(2, 'Child name must be at least 2 characters'),
  childAge: z.enum(['1-2', '2-3', '3-below'], {
    required_error: 'Please select child age',
  }),
  selectedDates: z.array(z.string()).min(1, 'Select at least one date'),
  nannyRequired: z.boolean().default(false),
});

const littleForestSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  children: z.array(childSchema).min(1, 'At least one child is required'),
  emergencyContact: z.string().min(10, 'Emergency contact must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) }),
});

type LittleForestFormData = z.infer<typeof littleForestSchema>;

const LittleForestProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const { config, pageConfig, isLoading: configLoading } = useLittleForestConfig();
  
  const [submitType, setSubmitType] = useState<'register' | 'pay'>('register');
  const submitActionRef = React.useRef<'register' | 'pay'>('register');
  const [registrationType, setRegistrationType] = useState<'online_only' | 'online_paid'>('online_only');
  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<CampRegistration | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const { dates: locationScopedDates } = useCampDatesForLocation(
    'little-forest',
    selectedLocation,
    config?.availableDates
  );

  // Set default location
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
    formState: { errors, isSubmitting },
  } = useForm<LittleForestFormData>({
    resolver: zodResolver(littleForestSchema),
    defaultValues: {
      consent: false,
      children: [{
        childName: '',
        childAge: undefined,
        selectedDates: [],
        nannyRequired: false,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  const watchChildren = watch('children');
  const watchConsent = watch('consent');

  // Benefits dialog for non-signed-in users
  useEffect(() => {
    if (authLoading) return;
    if (isSignedIn) { setShowBenefitsDialog(false); return; }
    if (!sessionStorage.getItem('benefits_dialog_dismissed')) {
      const timer = setTimeout(() => setShowBenefitsDialog(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, authLoading]);

  // Auto-fill from profile
  useEffect(() => {
    if (clientProfile && isSignedIn) {
      const filled = new Set<string>();
      if (clientProfile.full_name) { setValue('parentName', clientProfile.full_name); filled.add('parentName'); }
      if (clientProfile.email) { setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { setValue('phone', clientProfile.phone); filled.add('phone'); }
      setAutoFilledFields(filled);
    }
  }, [clientProfile, isSignedIn, setValue]);

  const handleDatesChange = useCallback(
    (childIndex: number, dates: string[]) => {
      setValue(`children.${childIndex}.selectedDates`, dates, { shouldDirty: true });
    },
    [setValue]
  );

  const handleConsentChange = useCallback(
    (checked: boolean) => {
      setValue('consent', checked, { shouldDirty: true });
    },
    [setValue]
  );

  // Calculate total amount.
  // NOTE: react-hook-form may mutate the `children` array in-place for nested updates.
  // Avoid memoizing directly on `watchChildren` reference (can become stale) so the
  // bottom Total Amount always reflects the latest selectedDates.
  const totalAmount = watchChildren.reduce((total, child) => {
    return total + (child.selectedDates?.length || 0) * config.pricing.sessionRate;
  }, 0);

  // Calculate price per child for display
  const getChildPrice = (childIndex: number) => {
    const child = watchChildren[childIndex];
    return (child?.selectedDates?.length || 0) * config.pricing.sessionRate;
  };

  const onSubmit = async (data: LittleForestFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'little-forest');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const registrationData = {
        camp_type: 'little-forest' as const,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        location: selectedLocation,
        children: data.children.map((child, index) => ({
          childName: child.childName,
          dateOfBirth: '',
          ageRange: child.childAge,
          specialNeeds: child.nannyRequired ? 'Accompanied by Nanny' : '',
          selectedDays: child.selectedDates.map((_, i) => `Day ${i + 1}`),
          selectedDates: child.selectedDates,
          selectedSessions: child.selectedDates.reduce((acc, d) => ({ ...acc, [d]: 'half' as const }), {} as Record<string, 'half' | 'full'>),
          price: getChildPrice(index),
        })),
        total_amount: totalAmount,
        payment_status: 'unpaid' as const,
        payment_method: 'pending' as const,
        registration_type: 'online_only' as const,
        qr_code_data: '',
        consent_given: data.consent,
        status: 'active' as const,
      };

      const tempId = `LF-${Date.now()}`;
      const qrData = qrCodeService.generateQRCodeData(tempId);
      registrationData.qr_code_data = qrData;

      const result = await campRegistrationService.createRegistration(registrationData);
      const qrCodeUrl = await qrCodeService.generateQRCode(result.qr_code_data);
      
      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'little-forest',
        program_name: 'Little Forest Explorers',
        form_data: data,
        source: 'website'
      });

      // Auto-create invoice for registration
      try {
        await invoiceService.createFromRegistration({
          id: result.id,
          type: 'camp',
          parentName: data.parentName,
          email: data.email,
          programName: 'Little Forest Explorers',
          totalAmount,
          children: data.children.map((child, index) => ({
            childName: child.childName,
            price: getChildPrice(index),
            selectedDates: child.selectedDates
          }))
        });
        console.log('✅ Auto-invoice created for Little Forest registration');
      } catch (invoiceError) {
        console.error('⚠️ Failed to create auto-invoice:', invoiceError);
      }
      
      // Send confirmation email via Resend (also sends parallel admin notification)
      try {
        console.log('📧 Attempting to send confirmation email...');
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            email: data.email,
            programType: 'little-forest',
            registrationDetails: {
              parentName: data.parentName,
              campTitle: 'Little Forest Explorers',
              campType: 'little-forest',
              registrationId: result.id,
              location: selectedLocation,
              emailContent: (config as any).emailContent,
              children: data.children.map((child, index) => ({
                childName: child.childName,
                ageRange: child.childAge,
                selectedDates: child.selectedDates,
                selectedSessions: {},
                specialNeeds: child.nannyRequired ? 'Accompanied by Nanny' : '',
                price: getChildPrice(index),
              })),
            },
            invoiceDetails: {
              totalAmount,
              paymentMethod: 'pending',
            },
          },
        });
        
        if (emailError) {
          console.error('⚠️ Email sending error:', emailError);
        } else {
          console.log('✅ Confirmation email sent successfully:', emailData);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send confirmation email:', emailError);
        // Don't block registration success - email failure is non-critical
      }

      setRegistrationResult(result);
      setQrCodeDataUrl(qrCodeUrl);

      toast.success(config.messages.registrationSuccess);

      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'little-forest');

      reset();

      const buttonType = submitActionRef.current || submitType;
      if (buttonType === 'pay') {
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { openPaystackCheckout, generatePaystackReference } = await import('@/lib/paystack');
          const reference = generatePaystackReference('AMU');
          await openPaystackCheckout({
            email: data.email,
            amountKES: totalAmount,
            reference,
            metadata: {
              registrationId: result.id,
              registrationNumber: result.registration_number,
              parentName: data.parentName,
              programName: 'Little Forest Explorers',
            },
            onSuccess: async (ref) => {
              try {
                const { data: verifyData, error: verifyErr } = await supabase.functions.invoke(
                  'paystack-verify',
                  { body: { reference: ref, registrationId: result.id } }
                );
                if (verifyErr) throw verifyErr;
                if (!verifyData?.success) throw new Error(verifyData?.error || 'Verification failed');
                toast.success('Payment received. Thank you!');
                setRegistrationType('online_paid');
              } catch (e) {
                console.error('Verify error:', e);
                toast.error(`Payment processed but verification failed. Reference: ${ref}`);
              } finally {
                setShowQRModal(true);
              }
            },
            onClose: () => {
              toast.info('Payment cancelled. You can complete it later from My Registrations.');
              setRegistrationType('online_only');
              setShowQRModal(true);
            },
          });
        } catch (e) {
          console.error('Paystack init error:', e);
          toast.error('Could not start online payment. Please try again from My Registrations.');
          setRegistrationType('online_only');
          setShowQRModal(true);
        }
      } else {
        setRegistrationType('online_only');
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(config.messages.registrationError);
    }
  };

  const addChild = () => {
    append({
      childName: '',
      childAge: undefined,
      selectedDates: [],
      nannyRequired: false,
    });
  };

  // Use schedule from CMS page config
  const schedule = pageConfig.schedule;

  if (configLoading) {
    return <RegistrationPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Program Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Baby className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {pageConfig.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">{pageConfig.subtitle}</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {pageConfig.description}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia 
                mediaUrl={pageConfig.featuredImage} 
                mediaType={pageConfig.mediaType} 
                altText={pageConfig.title}
                fallbackImage={dailyActivitiesImage}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Daily Schedule */}
            <Card className="p-6">
              <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Daily Schedule
              </h3>
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-accent/30">
                    <div className="text-primary font-semibold min-w-[60px]">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.activity}</h4>
                      <p className="text-sm text-muted-foreground">{item.skills}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Special Features */}
            <Card className="p-6 bg-primary/5">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Special Focus Areas
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                {pageConfig.specialFeatures.map((feature, index) => (
                  <li key={index}>• <strong>{feature.title}:</strong> {feature.description}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register Your Little Explorer</h3>
            
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
                <Label htmlFor="parentName" className="text-base font-medium">{config.fields.parentName.label}{autoFilledFields.has('parentName') && <AutoFilledBadge />}</Label>
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
                    watchChildren.forEach((_, idx) => handleDatesChange(idx, []));
                  }}
                />
              )}

              {/* Children Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Children Information</Label>
                  <Button
                    type="button"
                    onClick={addChild}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {config.buttons.addChild}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 space-y-4 border-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Child {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.childName`}>{config.fields.childName.label}</Label>
                      <Input
                        {...register(`children.${index}.childName`)}
                        placeholder={config.fields.childName.placeholder}
                        className="mt-2"
                      />
                      {errors.children?.[index]?.childName && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.childName?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`children.${index}.childAge`}>{config.fields.childAge.label}</Label>
                      <Controller
                        name={`children.${index}.childAge`}
                        control={control}
                        render={({ field }) => (
                          // NOTE: Radix Select can misbehave when forced into a controlled empty-string value.
                          // Keep it uncontrolled (defaultValue) until the user makes a selection.
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder={config.fields.childAge.placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                              {config.ageOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.children?.[index]?.childAge && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.childAge?.message}
                        </p>
                      )}
                    </div>

                    {/* SimpleDateSelector Component */}
                    <div>
                      {locationScopedDates.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
                          {selectedLocation
                            ? `${selectedLocation} dates for Little Forest are not yet published. Please check back soon or pick another location.`
                            : 'No upcoming Little Forest dates have been published yet.'}
                        </div>
                      ) : (
                        <SimpleDateSelector
                          availableDates={locationScopedDates}
                          selectedDates={watchChildren[index]?.selectedDates || []}
                          onDatesChange={(dates) => handleDatesChange(index, dates)}
                          sessionRate={config.pricing.sessionRate}
                          currency={config.pricing.currency}
                        />
                      )}
                      {errors.children?.[index]?.selectedDates && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.children[index]?.selectedDates?.message}
                        </p>
                      )}
                    </div>

                    <div className="bg-accent/30 p-4 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Controller
                          name={`children.${index}.nannyRequired`}
                          control={control}
                          render={({ field }) => (
                            <Checkbox
                              id={`nanny-${index}`}
                              checked={!!field.value}
                              onCheckedChange={(v) => field.onChange(v === true)}
                            />
                          )}
                        />
                        <Label htmlFor={`nanny-${index}`} className="text-base">
                          {config.fields.nannyOption.label}
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div>
                <Label htmlFor="emergencyContact" className="text-base font-medium">{config.fields.emergencyContact.label}</Label>
                <Input
                  id="emergencyContact"
                  {...register('emergencyContact')}
                  className="mt-2"
                  placeholder={config.fields.emergencyContact.placeholder}
                />
                {errors.emergencyContact && (
                  <p className="text-destructive text-sm mt-1">{errors.emergencyContact.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">{config.fields.email.label}{autoFilledFields.has('email') && <AutoFilledBadge />}</Label>
                  <Input id="email" type="email" {...register('email')} className="mt-2" placeholder={config.fields.email.placeholder} />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">{config.fields.phone.label}{autoFilledFields.has('phone') && <AutoFilledBadge />}</Label>
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
                    eventName="Little Forest"
                  />
                )}
              />

              <ConsentDialog
                checked={watchConsent}
                onCheckedChange={handleConsentChange}
                error={errors.consent?.message}
              />

              <RefundPolicyDialog />

              {/* Total Amount Display */}
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
                <p className="text-3xl font-bold text-primary">
                  {config.pricing.currency} {totalAmount.toLocaleString()}
                </p>
              </div>

              <PaymentGatewayPlaceholder />

              <div className="space-y-4">
                <p className="text-center text-muted-foreground text-sm">{config.messages.chooseOption}</p>
                
                <div className="grid gap-3">
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      submitActionRef.current = 'register';
                      setSubmitType('register');
                    }}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {config.buttons.registerOnly}
                  </Button>

                  <Button
                    type="submit"
                    size="lg"
                    onClick={() => {
                      submitActionRef.current = 'pay';
                      setSubmitType('pay');
                    }}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {config.buttons.registerAndPay}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {registrationResult && (
          <QRCodeDownloadModal
            open={showQRModal}
            onOpenChange={setShowQRModal}
            registration={registrationResult}
            qrCodeDataUrl={qrCodeDataUrl}
            registrationType={registrationType}
          />
        )}
      </div>
    </div>
  );
};

export default LittleForestProgram;