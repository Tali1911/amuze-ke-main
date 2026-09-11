import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useClientAuth } from "@/hooks/useClientAuth";
import SignUpBenefitsDialog from "@/components/SignUpBenefitsDialog";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AutoFilledBadge from "@/components/ui/AutoFilledBadge";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, Users, Target, CheckCircle, ArrowLeft, Plus, X } from "lucide-react";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from "react-router-dom";
import schoolsImage from "@/assets/schools.jpg";
import DatePickerField from "./DatePickerField";
import SimpleDateSelector from "./SimpleDateSelector";
import { ConsentDialog } from "./ConsentDialog";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from "./ParticipationConsentDialog";
import { QRCodeDownloadModal } from "@/components/camp/QRCodeDownloadModal";
import { leadsService } from "@/services/leadsService";
import { campRegistrationService } from "@/services/campRegistrationService";
import { qrCodeService } from "@/services/qrCodeService";
import { invoiceService } from "@/services/invoiceService";
import type { CampRegistration } from "@/types/campRegistration";
import { useHomeschoolingPageConfig } from "@/hooks/useHomeschoolingPageConfig";
import { useCampDatesForLocation } from "@/hooks/useCampDatesForLocation";
import DynamicMedia from "@/components/content/DynamicMedia";
import { performSecurityChecks, recordSubmission } from "@/services/formSecurityService";
import { scrollToFirstError } from "@/utils/scrollToError";
import { parseLocalDate } from "@/utils/dateUtils";

const homeschoolingSchema = z.object({
  parentName: z.string().min(1, "Parent name is required").max(100),
  children: z
    .array(
      z.object({
        name: z.string().min(1, "Child name is required").max(100),
        dateOfBirth: z.date({ required_error: "Date of birth is required" }),
        selectedDates: z.array(z.string()).min(1, "Select at least one session date"),
      }),
    )
    .min(1, "Please add at least one child"),
  package: z.string().min(1, "Please select a package"),
  sessionDay: z.string().optional(),
  transport: z.boolean().default(false),
  meal: z.boolean().default(false),
  allergies: z.string().max(500).optional().default(""),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, {
    errorMap: () => ({ message: "You must read and accept the participation form" }),
  }),
});

type HomeschoolingFormData = z.infer<typeof homeschoolingSchema>;

const WEEKDAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const HomeschoolingProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const { config, isLoading, refresh } = useHomeschoolingPageConfig();

  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<CampRegistration | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Published homeschool session dates come from the admin calendar, exactly like camps.
  const { dates: publishedDates } = useCampDatesForLocation("homeschooling", undefined, []);

  // Listen for CMS updates
  useEffect(() => {
    const handleCMSUpdate = () => {
      refresh?.();
    };

    window.addEventListener("cms-content-updated", handleCMSUpdate);
    return () => window.removeEventListener("cms-content-updated", handleCMSUpdate);
  }, [refresh]);

  const packages = config?.packages || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HomeschoolingFormData>({
    resolver: zodResolver(homeschoolingSchema),
    defaultValues: {
      children: [{ name: "", dateOfBirth: undefined, selectedDates: [] }],
      package: "",
      sessionDay: "",
      transport: false,
      meal: false,
      allergies: "",
      consent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  const consent = watch("consent");
  const selectedPackageId = watch("package");
  const sessionDay = watch("sessionDay");
  const watchedChildren = watch("children") || [];

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId),
    [packages, selectedPackageId],
  );

  const packageDays = selectedPackage?.days?.length ? selectedPackage.days : [3, 5];
  const needsDayChoice = selectedPackage?.dayChoice === "single";
  const sessionRate = selectedPackage?.pricePerSession || 0;

  // Dates offered to families: published dates limited to the package's weekdays
  // (and, for Explorers, to the single day the family picked).
  const availableDates = useMemo(() => {
    const allowedDays = needsDayChoice
      ? sessionDay
        ? [Number(sessionDay)]
        : []
      : packageDays;
    if (!selectedPackage || allowedDays.length === 0) return [];
    return publishedDates.filter((d) => allowedDays.includes(parseLocalDate(d).getDay()));
  }, [publishedDates, selectedPackage, needsDayChoice, sessionDay, packageDays]);

  // Clear chosen dates whenever the package or day changes so stale dates cannot be submitted.
  useEffect(() => {
    watchedChildren.forEach((_, index) => {
      setValue(`children.${index}.selectedDates`, [], { shouldValidate: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackageId, sessionDay]);

  // Benefits dialog for non-signed-in users
  useEffect(() => {
    if (authLoading) return;
    if (isSignedIn) {
      setShowBenefitsDialog(false);
      return;
    }
    if (!sessionStorage.getItem("benefits_dialog_dismissed")) {
      const timer = setTimeout(() => setShowBenefitsDialog(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, authLoading]);

  // Auto-fill from profile
  useEffect(() => {
    if (clientProfile && isSignedIn) {
      const filled = new Set<string>();
      if (clientProfile.full_name) {
        setValue("parentName", clientProfile.full_name);
        filled.add("parentName");
      }
      if (clientProfile.email) {
        setValue("email", clientProfile.email);
        filled.add("email");
      }
      if (clientProfile.phone) {
        setValue("phone", clientProfile.phone);
        filled.add("phone");
      }
      setAutoFilledFields(filled);
    }
  }, [clientProfile, isSignedIn, setValue]);

  const getChildPrice = useCallback(
    (index: number) => (watchedChildren[index]?.selectedDates?.length || 0) * sessionRate,
    [watchedChildren, sessionRate],
  );

  const totalAmount = watchedChildren.reduce(
    (sum, child) => sum + (child?.selectedDates?.length || 0) * sessionRate,
    0,
  );

  const onSubmit = async (data: HomeschoolingFormData) => {
    if (needsDayChoice && !data.sessionDay) {
      toast.error("Please choose Wednesday or Friday for the Explorers package");
      return;
    }

    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, "homeschooling");
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || "Submission blocked. Please try again later.");
      return;
    }

    const packageName = selectedPackage?.name || data.package;
    const sessionType = selectedPackage?.sessionType === "full" ? "full" : "half";

    try {
      const notes = [
        data.transport ? "Transport requested" : null,
        data.meal ? "Meal requested" : null,
        data.allergies ? `Allergies: ${data.allergies}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const registrationData = {
        camp_type: "homeschooling" as any,
        parent_name: data.parentName,
        email: data.email,
        phone: data.phone,
        emergency_contact: data.phone,
        location: "",
        children: data.children.map((child, index) => ({
          childName: child.name,
          dateOfBirth: child.dateOfBirth ? child.dateOfBirth.toISOString() : "",
          ageRange: "",
          specialNeeds: notes,
          selectedDays: child.selectedDates.map((_, i) => `Day ${i + 1}`),
          selectedDates: child.selectedDates,
          selectedSessions: child.selectedDates.reduce(
            (acc, d) => ({ ...acc, [d]: sessionType as "half" | "full" }),
            {} as Record<string, "half" | "full">,
          ),
          price: getChildPrice(index),
        })),
        total_amount: totalAmount,
        payment_status: "unpaid" as const,
        payment_method: "pending" as const,
        registration_type: "online_only" as const,
        qr_code_data: qrCodeService.generateQRCodeData(`HS-${Date.now()}`),
        consent_given: data.consent,
        participation_consent_given: data.participationConsent === true,
        participation_consent_at: data.participationConsent === true ? new Date().toISOString() : null,
        status: "active" as const,
      };

      const result = await campRegistrationService.createRegistration(registrationData);
      const qrCodeUrl = await qrCodeService.generateQRCode(result.qr_code_data);

      // Keep the homeschool-specific record for the programme reports (non-blocking).
      try {
        const { homeschoolingService } = await import("@/services/programRegistrationService");
        await homeschoolingService.create({
          ...data,
          package: packageName,
        });
      } catch (e) {
        console.warn("Homeschooling record not saved (non-fatal):", e);
      }

      // Capture lead
      try {
        await leadsService.createLead({
          full_name: data.parentName,
          email: data.email,
          phone: data.phone,
          program_type: "homeschooling",
          program_name: packageName,
          form_data: { ...data, sessionDay: sessionDay ? WEEKDAY_LABELS[Number(sessionDay)] : undefined },
          source: "website_registration",
        });
      } catch (e) {
        console.warn("Lead capture failed (non-fatal):", e);
      }

      // Auto-create invoice
      try {
        await invoiceService.createFromRegistration({
          id: result.id,
          type: "camp",
          parentName: data.parentName,
          email: data.email,
          programName: `Homeschool — ${packageName}`,
          totalAmount,
          children: data.children.map((child, index) => ({
            childName: child.name,
            price: getChildPrice(index),
            selectedDates: child.selectedDates,
          })),
        });
      } catch (invoiceError) {
        console.error("⚠️ Failed to create auto-invoice:", invoiceError);
      }

      // Confirmation email (non-blocking)
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: data.email,
            programType: "homeschooling",
            registrationDetails: {
              parentName: data.parentName,
              campTitle: `Homeschool — ${packageName}`,
              campType: "homeschooling",
              registrationId: result.id,
              package: packageName,
              sessionDay: sessionDay ? WEEKDAY_LABELS[Number(sessionDay)] : undefined,
              children: data.children.map((child, index) => ({
                childName: child.name,
                selectedDates: child.selectedDates,
                selectedSessions: child.selectedDates.reduce(
                  (acc, d) => ({ ...acc, [d]: sessionType }),
                  {} as Record<string, string>,
                ),
                price: getChildPrice(index),
              })),
            },
            invoiceDetails: {
              totalAmount,
              paymentMethod: "pending",
            },
          },
        });
        if (emailError) console.error("⚠️ Email sending error:", emailError);
      } catch (emailError) {
        console.error("⚠️ Failed to send confirmation email:", emailError);
      }

      setRegistrationResult(result);
      setQrCodeDataUrl(qrCodeUrl);

      toast.success(
        config?.formConfig?.messages?.successMessage ||
          "Registration submitted successfully! Check your email for confirmation.",
      );

      await recordSubmission(data, "homeschooling");

      reset();
      setShowQRModal(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", error?.message, error?.details, error?.hint);
      toast.error(
        error?.message ||
          config?.formConfig?.messages?.errorMessage ||
          "Failed to submit registration. Please try again.",
      );
    }
  };

  if (isLoading) {
    return <RegistrationPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            {config?.formConfig?.buttons?.back || "Back to Home"}
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Program Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {config?.title || "Amuse Homeschool — Explorers & Adventure"}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {config?.subtitle || "Nature-based learning & play · Ages 3 & below to 15"}
                  </p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">{config?.description}</p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType="photo"
                mediaUrl={config?.featuredImage || schoolsImage}
                fallbackImage={schoolsImage}
                altText="Children learning outdoors on the Amuse homeschool programme"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Packages */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Two Ways to Join</h3>
              {packages.map((pkg) => (
                <Card key={pkg.id} className="p-6">
                  <h4 className="text-xl font-semibold mb-1">{pkg.name}</h4>
                  {pkg.frequency && <p className="text-sm text-muted-foreground">{pkg.frequency}</p>}
                  {pkg.hours && (
                    <p className="text-sm text-primary font-medium flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" />
                      {pkg.hours}
                    </p>
                  )}
                  {pkg.price && <p className="text-lg font-bold text-primary mt-2">{pkg.price}</p>}
                  <p className="text-muted-foreground my-4">{pkg.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(pkg.features || []).map((feature) => (
                      <span key={feature} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
              {config?.commitmentNote && (
                <p className="text-sm text-muted-foreground leading-relaxed">{config.commitmentNote}</p>
              )}
            </div>

            {/* Five Learning Segments */}
            {config?.segments && config.segments.length > 0 && (
              <Card className="p-6">
                <h3 className="text-2xl font-bold text-primary mb-2">The Five Learning Segments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Every session — Explorers or Adventure — is built around the same five segments. What changes is the
                  depth and pace, scaled to each child's age group.
                </p>
                <Accordion type="single" collapsible className="w-full">
                  {config.segments.map((segment, index) => (
                    <AccordionItem key={segment.title} value={`segment-${index}`}>
                      <AccordionTrigger className="text-left">
                        <span className="font-semibold">
                          {index + 1}. {segment.title}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-3">{segment.blurb}</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {(segment.examples || []).map((example) => (
                            <li key={example} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {config?.signatureActivity && (
                    <AccordionItem value="signature">
                      <AccordionTrigger className="text-left">
                        <span className="font-semibold">{config.signatureActivity.title}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground mb-3">{config.signatureActivity.blurb}</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {(config.signatureActivity.examples || []).map((example) => (
                            <li key={example} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </Card>
            )}

            {/* Available Activities */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Available Activities
              </h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                {(config?.activities || []).map((activity, index) => (
                  <li key={index}>• {activity}</li>
                ))}
              </ul>
            </Card>

            {/* What's Included */}
            {config?.whatsIncluded && config.whatsIncluded.length > 0 && (
              <Card className="p-6 bg-primary/5">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  What's Included
                </h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {config.whatsIncluded.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Registration Form */}
          <Card className="p-8 lg:sticky lg:top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register Now</h3>

            <SignUpBenefitsDialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog} />

            {!isSignedIn && !authLoading && (
              <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Sign in with Google</span> to auto-fill your details and
                  save time
                </p>
                <GoogleSignInButton />
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-6">
              <div>
                <Label htmlFor="parentName" className="text-base font-medium">
                  {config?.formConfig?.fields?.parentName?.label || "Parent Name"} *
                  {autoFilledFields.has("parentName") && <AutoFilledBadge />}
                </Label>
                <Input
                  id="parentName"
                  {...register("parentName")}
                  className="mt-2"
                  placeholder={config?.formConfig?.fields?.parentName?.placeholder || "Enter your full name"}
                />
                {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
              </div>

              {/* Package */}
              <div>
                <Label className="text-base font-medium">
                  {config?.formConfig?.fields?.package?.label || "Package"} *
                </Label>
                <Select value={selectedPackageId} onValueChange={(value) => setValue("package", value, { shouldValidate: true })}>
                  <SelectTrigger id="package" className="mt-2">
                    <SelectValue placeholder={config?.formConfig?.fields?.package?.placeholder || "Select a package"} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPackage && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedPackage.frequency}
                    {selectedPackage.hours ? ` · ${selectedPackage.hours}` : ""}
                  </p>
                )}
                {errors.package && <p className="text-destructive text-sm mt-1">{errors.package.message}</p>}
              </div>

              {/* Day choice (Explorers) */}
              {selectedPackage && needsDayChoice && (
                <div>
                  <Label className="text-base font-medium">
                    {config?.formConfig?.fields?.sessionDay?.label || "Preferred Day"} *
                  </Label>
                  {config?.formConfig?.fields?.sessionDay?.helpText && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.formConfig.fields.sessionDay.helpText}
                    </p>
                  )}
                  <RadioGroup
                    value={sessionDay || ""}
                    onValueChange={(v) => setValue("sessionDay", v, { shouldValidate: true })}
                    className="mt-3 flex gap-6"
                  >
                    {packageDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <RadioGroupItem value={String(day)} id={`session-day-${day}`} />
                        <Label htmlFor={`session-day-${day}`} className="cursor-pointer">
                          {WEEKDAY_LABELS[day]}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {selectedPackage && !needsDayChoice && (
                <p className="text-sm text-muted-foreground">
                  This package attends {packageDays.map((d) => WEEKDAY_LABELS[d]).join(" and ")} each week.
                </p>
              )}

              {/* Children */}
              <div>
                <Label className="text-base font-medium mb-2 block">
                  {config?.formConfig?.fields?.childName?.label || "Children"} *
                </Label>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Child {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm">Child Name</Label>
                        <Input
                          {...register(`children.${index}.name`)}
                          placeholder={config?.formConfig?.fields?.childName?.placeholder || "Enter child's full name"}
                          className="mt-1"
                        />
                        {errors.children?.[index]?.name && (
                          <p className="text-destructive text-sm mt-1">{errors.children[index]?.name?.message}</p>
                        )}
                      </div>

                      <Controller
                        name={`children.${index}.dateOfBirth`}
                        control={control}
                        render={({ field: dobField }) => (
                          <DatePickerField
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            value={dobField.value}
                            onChange={dobField.onChange}
                            error={errors.children?.[index]?.dateOfBirth?.message}
                            required
                          />
                        )}
                      />

                      {/* Session dates */}
                      <div>
                        <Label className="text-sm">
                          {config?.formConfig?.fields?.startDate?.label || "Session Dates"} *
                        </Label>
                        {!selectedPackage ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Select a package above to see the available session dates.
                          </p>
                        ) : needsDayChoice && !sessionDay ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Choose {packageDays.map((d) => WEEKDAY_LABELS[d]).join(" or ")} above to see the available
                            dates.
                          </p>
                        ) : availableDates.length === 0 ? (
                          <div className="mt-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-sm text-muted-foreground">
                            No homeschool dates have been published for this day yet. Please check back soon or contact
                            us to be notified.
                          </div>
                        ) : (
                          <div className="mt-2">
                            <SimpleDateSelector
                              availableDates={availableDates}
                              selectedDates={watchedChildren[index]?.selectedDates || []}
                              onDatesChange={(dates) =>
                                setValue(`children.${index}.selectedDates`, dates, { shouldValidate: true })
                              }
                              sessionRate={sessionRate}
                              currency="KES"
                            />
                          </div>
                        )}
                        {errors.children?.[index]?.selectedDates && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.children[index]?.selectedDates?.message as string}
                          </p>
                        )}
                      </div>

                      {(watchedChildren[index]?.selectedDates?.length || 0) > 0 && sessionRate > 0 && (
                        <div className="bg-primary/5 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-sm font-medium">Price for this child:</span>
                          <span className="text-lg font-bold text-primary">
                            KES {getChildPrice(index).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", dateOfBirth: undefined as any, selectedDates: [] })}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Child
                  </Button>
                </div>
                {errors.children && typeof errors.children.message === "string" && (
                  <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
                )}
              </div>

              {totalAmount > 0 && (
                <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-primary">KES {totalAmount.toLocaleString()}</span>
                </div>
              )}

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Controller
                      name="transport"
                      control={control}
                      render={({ field }) => (
                        <Checkbox id="transport" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="transport">Transport</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Controller
                      name="meal"
                      control={control}
                      render={({ field }) => (
                        <Checkbox id="meal" checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <Label htmlFor="meal">Meal</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="allergies" className="text-base font-medium">
                  Allergies (Optional)
                </Label>
                <Textarea
                  id="allergies"
                  {...register("allergies")}
                  className="mt-2"
                  placeholder="Please list any allergies or dietary restrictions"
                  rows={2}
                />
                {errors.allergies && <p className="text-destructive text-sm mt-1">{errors.allergies.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    {config?.formConfig?.fields?.email?.label || "Email"} *
                    {autoFilledFields.has("email") && <AutoFilledBadge />}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-2"
                    placeholder={config?.formConfig?.fields?.email?.placeholder || "your@email.com"}
                  />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    {config?.formConfig?.fields?.phone?.label || "Phone Number"} *
                    {autoFilledFields.has("phone") && <AutoFilledBadge />}
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    className="mt-2"
                    placeholder={config?.formConfig?.fields?.phone?.placeholder || "+254 114 705763"}
                  />
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
                    eventName="Homeschool Programme"
                  />
                )}
              />

              <ConsentDialog
                checked={consent}
                onCheckedChange={(checked) => setValue("consent", checked)}
                error={errors.consent?.message}
              />

              <RefundPolicyDialog />

              <Button type="submit" className="w-full h-12 text-base" disabled={isSubmitting}>
                {isSubmitting
                  ? config?.formConfig?.messages?.loadingMessage || "Submitting..."
                  : config?.formConfig?.buttons?.submit || "Enroll Now"}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {registrationResult && (
        <QRCodeDownloadModal
          open={showQRModal}
          onOpenChange={setShowQRModal}
          registration={registrationResult}
          qrCodeDataUrl={qrCodeDataUrl}
          registrationType="online_only"
        />
      )}
    </div>
  );
};

export default HomeschoolingProgram;
