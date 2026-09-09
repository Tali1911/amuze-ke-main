import React, { useEffect, useState } from "react";
import { useClientAuth } from '@/hooks/useClientAuth';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, Users, Target, CheckCircle, ArrowLeft, Plus, X } from "lucide-react";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from "react-router-dom";
import schoolsImage from "@/assets/schools.jpg";
import DatePickerField from "./DatePickerField";
import { ConsentDialog } from "./ConsentDialog";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { leadsService } from "@/services/leadsService";
import { useHomeschoolingPageConfig } from "@/hooks/useHomeschoolingPageConfig";
import DynamicMedia from "@/components/content/DynamicMedia";
import { performSecurityChecks, recordSubmission } from "@/services/formSecurityService";

const homeschoolingSchema = z.object({
  parentName: z.string().min(1, "Parent name is required").max(100),
  children: z
    .array(
      z.object({
        name: z.string().min(1, "Child name is required").max(100),
        dateOfBirth: z.date({ required_error: "Date of birth is required" }),
      }),
    )
    .min(1, "Please add at least one child"),
  package: z.enum(["1-day-discovery", "weekly-pod", "project-based"]),
  focus: z.array(z.string()).min(1, "Please select at least one focus area"),
  transport: z.boolean().default(false),
  meal: z.boolean().default(false),
  allergies: z.string().max(500),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) }),
});

type HomeschoolingFormData = z.infer<typeof homeschoolingSchema>;

// Default packages as fallback
const defaultPackages = [
  {
    id: "1-day-discovery",
    title: "1-Day Discovery",
    itinerary:
      "10:00 Nature Circle | 10:15 Guided Lesson | 11:15 Journaling | 12:30 Project Build | 1:30 Math-in-Nature | 2:30 Reflection",
    skills: ["Observation", "Sports", "Teamwork", "Journaling"],
  },
  {
    id: "weekly-pod",
    title: "Weekly Pod Plan (4-Weeks)",
    itinerary: "Week 1 – Ecology, Week 2 – Navigation, Week 3 – Survival, Week 4 – Showcase",
    skills: ["Progressive Learning", "Leadership", "Presentation Skills"],
  },
  {
    id: "project-based",
    title: "Project-Based Module (5 Days)",
    itinerary: "Day 1 – Research, Day 2 – Build, Day 3 – Field Study, Day 4 – Prepare Presentation, Day 5 – Present",
    skills: ["Research", "Collaboration", "Critical Thinking"],
  },
];

const HomeschoolingProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const { config, isLoading, refresh } = useHomeschoolingPageConfig();

  // Listen for CMS updates
  useEffect(() => {
    const handleCMSUpdate = () => {
      refresh?.();
    };
    
    window.addEventListener('cms-content-updated', handleCMSUpdate);
    return () => window.removeEventListener('cms-content-updated', handleCMSUpdate);
  }, [refresh]);

  // Convert CMS packages to display format
  const packages = config?.packages?.length 
    ? config.packages.map(pkg => ({
        id: pkg.id,
        title: pkg.name,
        itinerary: pkg.description,
        skills: pkg.features || [],
      }))
    : defaultPackages;

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
      children: [{ name: "", dateOfBirth: undefined }],
      focus: [],
      transport: false,
      meal: false,
      consent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  const watchedFocus = watch("focus") || [];
  const consent = watch("consent");

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

  const onSubmit = async (data: HomeschoolingFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'homeschooling');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      // Save to database
      const { homeschoolingService } = await import("@/services/programRegistrationService");
      const registration = await homeschoolingService.create(data);

      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: "homeschooling",
        program_name: data.package,
        form_data: data,
        source: "website_registration",
      });

      // Send confirmation email via Resend (BLOCK submission if email fails)
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: emailData, error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: data.email,
          programType: "homeschooling",
          registrationDetails: {
            parentName: data.parentName,
            package: data.package,
            children: data.children,
            focus: data.focus,
            registrationId: registration && "id" in registration ? registration.id : undefined,
          },
        },
      });

      if (emailError) {
        throw emailError;
      }
      toast.success(config?.formConfig?.messages?.successMessage || "Registration submitted successfully! Check your email for confirmation.");
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'homeschooling');
      
      reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", error?.message, error?.details, error?.hint);
      toast.error(config?.formConfig?.messages?.errorMessage || error?.message || "Failed to submit registration. Please try again.");
    }
  };

  const handleFocusChange = (focus: string, checked: boolean) => {
    const currentFocus = watchedFocus;
    if (checked) {
      setValue("focus", [...currentFocus, focus]);
    } else {
      setValue(
        "focus",
        currentFocus.filter((f) => f !== focus),
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
                    {config?.title || "Homeschooling Outdoor Experiences"}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {config?.subtitle || "(All Ages)"}
                  </p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {config?.description || "Flexible, experiential learning beyond textbooks. Structured outdoor education that complements homeschooling curricula while fostering social interaction and real-world skill development."}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType="photo"
                mediaUrl={config?.featuredImage || schoolsImage}
                fallbackImage={schoolsImage}
                altText="Homeschooling outdoor activities"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Package Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Available Packages</h3>
              {packages.map((pkg) => (
                <Card key={pkg.id} className="p-6">
                  <h4 className="text-xl font-semibold mb-3">{pkg.title}</h4>
                  <p className="text-muted-foreground mb-4">{pkg.itinerary}</p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.skills.map((skill) => (
                      <span key={skill} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Available Activities */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Available Activities
              </h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                {(config?.activities || [
                  "Horse Riding: Balance, coordination, empathy with animals",
                  "Mountain Biking: Endurance, risk assessment, resilience",
                  "Camping Experiences: Independence, teamwork, self-reliance",
                  "Outdoor Leadership: Communication, decision-making",
                  "Bushcraft & Survival: Shelter building, fire safety, nature awareness",
                  "Archery: Focus, patience, discipline",
                  "Orienteering: Map reading, compass use, navigation"
                ]).map((activity, index) => (
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
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register Now</h3>

            <SignUpBenefitsDialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog} />

            {!isSignedIn && !authLoading && (
              <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Sign in with Google</span> to auto-fill your details and save time
                </p>
                <GoogleSignInButton />
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="parentName" className="text-base font-medium">
                  {config?.formConfig?.fields?.parentName?.label || "Parent Name"} *{autoFilledFields.has('parentName') && <AutoFilledBadge />}
                </Label>
                <Input
                  id="parentName"
                  {...register("parentName")}
                  className="mt-2"
                  placeholder={config?.formConfig?.fields?.parentName?.placeholder || "Enter your full name"}
                />
                {errors.parentName && <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>}
              </div>

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
                        render={({ field }) => (
                          <DatePickerField
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.children?.[index]?.dateOfBirth?.message}
                            required
                          />
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: "", dateOfBirth: undefined })}
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

              <div>
                <Label className="text-base font-medium">
                  {config?.formConfig?.fields?.package?.label || "Package"} *
                </Label>
                <Select onValueChange={(value) => setValue("package", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={config?.formConfig?.fields?.package?.placeholder || "Select a package"} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">
                  {config?.formConfig?.fields?.focusAreas?.label || "Focus Areas"} *
                </Label>
                {config?.formConfig?.fields?.focusAreas?.helpText && (
                  <p className="text-sm text-muted-foreground mt-1">{config.formConfig.fields.focusAreas.helpText}</p>
                )}
                <div className="mt-3 grid grid-cols-2 gap-4">
                  {["STEM", "History", "Multi-Subject"].map((focus) => (
                    <div key={focus} className="flex items-center space-x-3">
                      <Checkbox
                        id={focus}
                        checked={watchedFocus.includes(focus)}
                        onCheckedChange={(checked) => handleFocusChange(focus, checked as boolean)}
                      />
                      <Label htmlFor={focus}>{focus}</Label>
                    </div>
                  ))}
                </div>
                {errors.focus && <p className="text-destructive text-sm mt-1">{errors.focus.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="transport" {...register("transport")} />
                    <Label htmlFor="transport">Transport</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="meal" {...register("meal")} />
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    {config?.formConfig?.fields?.email?.label || "Email"} *{autoFilledFields.has('email') && <AutoFilledBadge />}
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
                    {config?.formConfig?.fields?.phone?.label || "Phone Number"} *{autoFilledFields.has('phone') && <AutoFilledBadge />}
                  </Label>
                  <Input 
                    id="phone" 
                    {...register("phone")} 
                    className="mt-2" 
                    placeholder={config?.formConfig?.fields?.phone?.placeholder || "+254 700 000 000"} 
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
                    eventName="Homeschooling Program"
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
                  ? (config?.formConfig?.messages?.loadingMessage || "Submitting...") 
                  : (config?.formConfig?.buttons?.submit || "Submit Registration")
                }
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomeschoolingProgram;
