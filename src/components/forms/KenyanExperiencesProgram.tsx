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
import { Mountain, MapPin, Calendar, ArrowLeft, Plus, Trash2 } from "lucide-react";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from "react-router-dom";
import adventureImage from "@/assets/adventure.jpg";
import { ConsentDialog } from "./ConsentDialog";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import DatePickerField from "./DatePickerField";
import { leadsService } from "@/services/leadsService";
import { invoiceService } from "@/services/invoiceService";
import { useKenyanExperiencesPageConfig } from "@/hooks/useKenyanExperiencesPageConfig";
import DynamicMedia from "@/components/content/DynamicMedia";

const participantSchema = z.object({
  name: z.string().min(1, "Participant name is required").max(100),
  ageRange: z.enum(["9-12", "13-17"], { required_error: "Age range is required" }),
});

const preferredDateSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
});

const kenyanExperiencesSchema = z.object({
  parentLeader: z.string().min(1, "Parent/Leader name is required").max(100),
  participants: z.array(participantSchema).min(1, "At least one participant is required"),
  circuit: z.enum(["mt-kenya", "coast", "mara", "chalbi", "western"]),
  preferredDates: z.array(preferredDateSchema).min(1, "At least one preferred date is required"),
  transport: z.boolean().default(false),
  specialMedicalNeeds: z.string().max(500),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) }),
});

type KenyanExperiencesFormData = z.infer<typeof kenyanExperiencesSchema>;

// Default circuits as fallback
const defaultCircuits = [
  {
    id: "mt-kenya",
    title: "Mount Kenya Experiences",
    description: "Alpine hike, bushcraft, team course",
    ageGroups: [
      { range: "9–12", focus: "Independence" },
      { range: "13–17", focus: "Expedition Leadership" },
    ],
    features: ["Alpine Environment", "Bushcraft Skills", "Team Challenges", "Leadership Development"],
  },
  {
    id: "coast",
    title: "Swahili Coastal Experiences",
    description: "Marine ecology, kayaking, Swahili culture",
    ageGroups: [
      { range: "9–12", focus: "Water Confidence" },
      { range: "13–17", focus: "Marine Stewardship" },
    ],
    features: ["Marine Ecology", "Cultural Immersion", "Water Sports", "Conservation Focus"],
  },
  {
    id: "mara",
    title: "Mara Experiences",
    description: "Game drives, Maasai culture immersion",
    ageGroups: [
      { range: "9–12", focus: "Wildlife Journaling" },
      { range: "13–17", focus: "Conservation Projects" },
    ],
    features: ["Wildlife Observation", "Cultural Exchange", "Conservation Education", "Photography"],
  },
  {
    id: "chalbi",
    title: "Rift-valley Experiences",
    description: "Desert trek, camel safari, shelter build",
    ageGroups: [
      { range: "9–12", focus: "Resilience" },
      { range: "13–17", focus: "Desert Survival Challenge" },
    ],
    features: ["Desert Navigation", "Survival Skills", "Cultural Learning", "Resilience Building"],
  },
  {
    id: "western",
    title: "Western Experiences",
    description: "Kakamega biodiversity, cultural visits",
    ageGroups: [
      { range: "9–12", focus: "Curiosity" },
      { range: "13–17", focus: "Community Project Leadership" },
    ],
    features: ["Biodiversity Study", "Community Engagement", "Forest Ecology", "Project Leadership"],
  },
];

const KenyanExperiencesProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const { config, isLoading, refresh } = useKenyanExperiencesPageConfig();

  // Listen for CMS updates
  useEffect(() => {
    const handleCMSUpdate = () => {
      refresh?.();
    };
    
    window.addEventListener('cms-content-updated', handleCMSUpdate);
    return () => window.removeEventListener('cms-content-updated', handleCMSUpdate);
  }, [refresh]);

  // Convert CMS experiences to circuit format
  const circuits = config?.experiences?.length
    ? config.experiences.map(exp => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        ageGroups: [
          { range: exp.ageGroup || "All ages", focus: exp.duration || "" }
        ],
        features: exp.highlights || [],
      }))
    : defaultCircuits;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KenyanExperiencesFormData>({
    resolver: zodResolver(kenyanExperiencesSchema),
    defaultValues: {
      participants: [{ name: "", ageRange: "9-12" as const }],
      preferredDates: [{ date: undefined as any }],
      transport: false,
      consent: false,
    },
  });

  const {
    fields: participantFields,
    append: appendParticipant,
    remove: removeParticipant,
  } = useFieldArray({
    control,
    name: "participants",
  });

  const {
    fields: dateFields,
    append: appendDate,
    remove: removeDate,
  } = useFieldArray({
    control,
    name: "preferredDates",
  });

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
      if (clientProfile.full_name) { setValue('parentLeader', clientProfile.full_name); filled.add('parentLeader'); }
      if (clientProfile.email) { setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { setValue('phone', clientProfile.phone); filled.add('phone'); }
      setAutoFilledFields(filled);
    }
  }, [clientProfile, isSignedIn, setValue]);

  const onSubmit = async (data: KenyanExperiencesFormData) => {
    try {
      // Save to database
      const { kenyanExperiencesService } = await import("@/services/programRegistrationService");
      const registration = await kenyanExperiencesService.create(data);

      // Capture lead
      await leadsService.createLead({
        full_name: data.parentLeader,
        email: data.email,
        phone: data.phone,
        program_type: "kenyan-experiences",
        program_name: data.circuit,
        form_data: data,
        source: "website_registration",
      });

      // Auto-create invoice for registration (estimated pricing)
      const circuitPricing: Record<string, number> = {
        "mt-kenya": 75000,
        coast: 85000,
        mara: 95000,
        chalbi: 70000,
        western: 65000,
      };
      const basePrice = circuitPricing[data.circuit] || 75000;
      const totalAmount = basePrice * data.participants.length;

      try {
        const registrationId = (registration as any)?.id || crypto.randomUUID();
        await invoiceService.createFromRegistration({
          id: String(registrationId),
          type: "kenyan-experiences",
          parentName: data.parentLeader,
          email: data.email,
          programName: `Kenyan Experiences - ${data.circuit.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}`,
          totalAmount,
          children: data.participants.map((p) => ({
            childName: p.name,
            price: basePrice,
          })),
        });
        console.log("✅ Auto-invoice created for Kenyan Experiences registration");
      } catch (invoiceError) {
        console.error("⚠️ Failed to create auto-invoice:", invoiceError);
      }

      // Send confirmation email via Resend (BLOCK submission if email fails)
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: emailData, error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: data.email,
          programType: "kenyan-experiences",
          registrationDetails: {
            parentLeader: data.parentLeader,
            circuit: data.circuit,
            participants: data.participants,
            transport: data.transport,
            registrationId: registration && "id" in registration ? registration.id : undefined,
          },
        },
      });

      if (emailError) {
        throw emailError;
      }
      toast.success(config?.formConfig?.messages?.successMessage || "Registration submitted successfully! Check your email for confirmation.");
      reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", error?.message, error?.details, error?.hint);
      toast.error(config?.formConfig?.messages?.errorMessage || error?.message || "Failed to submit registration. Please try again.");
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
                  <Mountain className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {config?.title || "Kenyan Experiences"}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {config?.subtitle || "(5-Night, 6-Day Programs)"}
                  </p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {config?.description || "Exploring Kenya, one region at a time. Sleep-away adventures for teens and preteens that shape confidence, character, and curiosity through real-world learning. From roaring rivers and mountain trails to cultural heartlands, campers tackle challenges, work as teams, and engage in community projects—raising a generation that thinks boldly and leads responsibly."}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType={config?.mediaType || 'photo'}
                mediaUrl={config?.featuredMediaUrl || adventureImage}
                fallbackImage={adventureImage}
                thumbnailUrl={config?.videoThumbnail}
                altText="Kenyan landscape adventures"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Circuit Details */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary">Available Circuits</h3>
              <div className="space-y-6">
                {circuits.map((circuit) => (
                  <Card key={circuit.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold mb-2">{circuit.title}</h4>
                        <p className="text-muted-foreground mb-4">{circuit.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {circuit.ageGroups.map((group, index) => (
                            <div key={index} className="bg-accent/30 p-3 rounded-lg">
                              <div className="font-medium text-primary">Age {group.range}</div>
                              <div className="text-sm text-muted-foreground">Focus: {group.focus}</div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {circuit.features.map((feature) => (
                            <span key={feature} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Program Benefits */}
            <Card className="p-6 bg-primary/5">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Program Experience
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  • <strong>Living Classrooms:</strong> Kenya's regions become immersive learning environments
                </li>
                <li>
                  • <strong>Team Challenges:</strong> Tackle real obstacles together
                </li>
                <li>
                  • <strong>Community Projects:</strong> Meaningful engagement with local communities
                </li>
                <li>
                  • <strong>Leadership Development:</strong> Building confident, responsible young leaders
                </li>
              </ul>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">Register for Experience</h3>

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
                <Label htmlFor="parentLeader" className="text-base font-medium">
                  {config?.formConfig?.fields?.leaderName?.label || "Parent/Leader Name"} *{autoFilledFields.has('parentLeader') && <AutoFilledBadge />}
                </Label>
                <Input
                  id="parentLeader"
                  {...register("parentLeader")}
                  className="mt-2"
                  placeholder={config?.formConfig?.fields?.leaderName?.placeholder || "Enter your full name"}
                />
                {errors.parentLeader && <p className="text-destructive text-sm mt-1">{errors.parentLeader.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Participants *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendParticipant({ name: "", ageRange: "9-12" as const })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Participant
                  </Button>
                </div>

                <div className="space-y-4">
                  {participantFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-sm">Participant Name</Label>
                          <Input
                            {...register(`participants.${index}.name`)}
                            className="mt-1"
                            placeholder="Enter full name"
                          />
                          {errors.participants?.[index]?.name && (
                            <p className="text-destructive text-sm mt-1">{errors.participants[index]?.name?.message}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm">Age Range</Label>
                          <Controller
                            name={`participants.${index}.ageRange`}
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select age range" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="9-12">9-12 years</SelectItem>
                                  <SelectItem value="13-17">13-17 years</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.participants?.[index]?.ageRange && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.participants[index]?.ageRange?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {participantFields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeParticipant(index)}
                          className="mt-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.participants && typeof errors.participants.message === "string" && (
                  <p className="text-destructive text-sm mt-1">{errors.participants.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">
                  {config?.formConfig?.fields?.experience?.label || "Circuit"} *
                </Label>
                <Select onValueChange={(value) => setValue("circuit", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={config?.formConfig?.fields?.experience?.placeholder || "Select a circuit"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mt-kenya">Mt Kenya</SelectItem>
                    <SelectItem value="coast">Swahili Coast</SelectItem>
                    <SelectItem value="mara">Mara</SelectItem>
                    <SelectItem value="chalbi">Rift-valley</SelectItem>
                    <SelectItem value="western">Western Kenya</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">
                    {config?.formConfig?.fields?.preferredDates?.label || "Preferred Dates"} *
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendDate({ date: undefined as any })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Date
                  </Button>
                </div>

                <div className="space-y-3">
                  {dateFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Controller
                          name={`preferredDates.${index}.date`}
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              label=""
                              placeholder={config?.formConfig?.fields?.preferredDates?.placeholder || "Select preferred date"}
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.preferredDates?.[index]?.date?.message}
                            />
                          )}
                        />
                      </div>
                      {dateFields.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeDate(index)}
                          className="mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.preferredDates && typeof errors.preferredDates.message === "string" && (
                  <p className="text-destructive text-sm mt-1">{errors.preferredDates.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="transport" {...register("transport")} />
                    <Label htmlFor="transport">Transport (Nairobi Pickup/Drop-off)</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="specialMedicalNeeds" className="text-base font-medium">
                  {config?.formConfig?.fields?.specialRequirements?.label || "Special Medical Needs"} (Optional)
                </Label>
                <Textarea
                  id="specialMedicalNeeds"
                  {...register("specialMedicalNeeds")}
                  className="mt-2"
                  placeholder={config?.formConfig?.fields?.specialRequirements?.placeholder || "Any medical conditions, allergies, or special requirements"}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    {config?.formConfig?.fields?.email?.label || "Email Address"} *{autoFilledFields.has('email') && <AutoFilledBadge />}
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
                    eventName="Kenyan Experience"
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

export default KenyanExperiencesProgram;
