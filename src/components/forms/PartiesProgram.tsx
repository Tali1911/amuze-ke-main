import React, { useState, useEffect } from "react";
import { useClientAuth } from '@/hooks/useClientAuth';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PartyPopper, Gift, ArrowLeft, Plus, Trash2, TreePine, Home, Moon, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import birthdayImage from "@/assets/birthday.jpg";
import campingImage from "@/assets/camping.jpg";
import adventureImage from "@/assets/adventure.jpg";
import DatePickerField from "./DatePickerField";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { leadsService } from '@/services/leadsService';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { usePartiesPageConfig } from '@/hooks/usePartiesPageConfig';
import DynamicMedia from "@/components/content/DynamicMedia";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";

const childSchema = z.object({
  childName: z.string().min(1, "Child name is required").max(100),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  specialNeeds: z.string().max(500).optional(),
});

const partiesSchema = z.object({
  occasion: z.enum(["birthday", "anniversary", "reunion", "other"]),
  parentName: z.string().min(1, "Parent/Organizer name is required").max(100),
  children: z.array(childSchema).min(1, "At least one child is required"),
  guestsNumber: z.string().min(1, "Number of guests is required"),
  packageType: z.enum(["half-day", "full-day"]),
  eventTiming: z.enum(["day", "night", "both"], { required_error: "Event timing is required" }),
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().min(1, "End time is required").regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  location: z.enum(["karura-f", "tigoni"]),
  decor: z.boolean().default(false),
  catering: z.boolean().default(false),
  photography: z.boolean().default(false),
  activities: z.boolean().default(false),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) })
});

type PartiesFormData = z.infer<typeof partiesSchema>;

interface PartyOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  image: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  idealFor: string;
  note?: string;
}

const partyOptions: PartyOption[] = [
  {
    id: 'karura-forest',
    title: 'Come to Karura Forest',
    icon: <TreePine className="w-6 h-6" />,
    image: adventureImage,
    shortDescription: 'Bring your child to Karura, where most of our outdoor adventures happens!',
    fullDescription: 'Bring your child to Karura, where most of our outdoor adventures happens! Here, your child and their friends will enjoy adventure activities, bushcraft, creative outdoor play, and more—all in a safe, supervised environment with trained facilitators.',
    features: [
      'Adventure activities like obstacle courses, rope course, nature scavenger hunts',
      'Bushcraft and creative outdoor play',
      'Safe, supervised fun with trained facilitators',
      'Custom themes and setups to make the day extra special'
    ],
    idealFor: 'Perfect for children of all ages who love nature, movement, and exploration.',
    note: 'In line with forest guidelines, no single-use plastics are allowed, and our team will help handle all forest logistics on your behalf—so you can relax and enjoy the celebration.'
  },
  {
    id: 'we-come-to-you',
    title: 'We Come to You',
    icon: <Home className="w-6 h-6" />,
    image: birthdayImage,
    shortDescription: 'No need to travel—we can bring the adventure to your chosen location!',
    fullDescription: 'No need to travel—we can bring the adventure to your chosen location! Our team sets up fun, engaging, and safe outdoor activities wherever you are, with full facilitation and equipment provided for stress-free planning.',
    features: [
      'Our team sets up fun, engaging, and safe outdoor activities wherever you are',
      'Ideal for home gardens, schools, or community spaces',
      'Activities can be customized for your child\'s age, interests, and group size',
      'Full facilitation and equipment provided, so you can enjoy stress-free planning'
    ],
    idealFor: 'Perfect for families looking for outdoor birthday parties without leaving home.'
  },
  {
    id: 'overnight-camping',
    title: 'Overnight Camping (Preteens & Teens)',
    icon: <Moon className="w-6 h-6" />,
    image: campingImage,
    shortDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure.',
    fullDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure. We offer flexible locations: you can host a backyard camping party at your home, use a shared clubhouse or school compound, or venture into nature for a full wilderness experience.',
    features: [
      'Sleep in spacious tents and enjoy hands-on adventure activities like archery, orienteering, and bushcraft',
      'Bond with friends through night activities, campfire stories, and outdoor movie nights under the stars',
      'Build life skills including independence, teamwork, resilience, and problem-solving while having the time of their lives'
    ],
    idealFor: 'Perfect for preteens and teenagers seeking a memorable, adventurous birthday celebration beyond the ordinary.'
  }
];

const PartiesProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [selectedPartyOption, setSelectedPartyOption] = useState<PartyOption | null>(null);
  const { config: cmsConfig, isLoading, refresh } = usePartiesPageConfig();

  // Listen for CMS updates
  useEffect(() => {
    const handleCMSUpdate = () => refresh?.();
    window.addEventListener('cms-content-updated', handleCMSUpdate);
    return () => window.removeEventListener('cms-content-updated', handleCMSUpdate);
  }, [refresh]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartiesFormData>({
    resolver: zodResolver(partiesSchema),
    defaultValues: {
      children: [{ childName: "", dateOfBirth: undefined, specialNeeds: "" }],
      decor: false,
      catering: false,
      photography: false,
      activities: false,
      consent: false,
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "children",
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
      if (clientProfile.full_name) { setValue('parentName', clientProfile.full_name); filled.add('parentName'); }
      if (clientProfile.email) { setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { setValue('phone', clientProfile.phone); filled.add('phone'); }
      setAutoFilledFields(filled);
    }
  }, [clientProfile, isSignedIn, setValue]);

  const onSubmit = async (data: PartiesFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'parties');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const { partiesService } = await import('@/services/programRegistrationService');
      const registration = await partiesService.create(data);

      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'parties',
        program_name: data.occasion,
        form_data: data,
        source: 'website_registration'
      });

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: 'parties',
          registrationDetails: {
            parentName: data.parentName,
            occasion: data.occasion,
            packageType: data.packageType,
            eventTiming: data.eventTiming,
            guestsNumber: data.guestsNumber,
            eventDate: data.eventDate,
            startTime: data.startTime,
            endTime: data.endTime,
            registrationId: registration && 'id' in registration ? registration.id : undefined
          }
        }
      });

      toast.success(cmsConfig?.formConfig?.messages?.successMessage || "Party booking submitted successfully! Check your email for confirmation.");
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'parties');
      
      reset();
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      toast.error(cmsConfig?.formConfig?.messages?.errorMessage || error?.message || "Failed to submit booking. Please try again.");
    }
  };

  if (isLoading) {
    return <RegistrationPageSkeleton />;
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/programs" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            {cmsConfig?.formConfig?.buttons?.back || "Back to Programs"}
          </Link>
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 rounded-full p-3">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary">{cmsConfig?.title || "Parties"}</h1>
              <p className="text-lg text-muted-foreground">{cmsConfig?.subtitle || "Celebrate Outdoors, Make Memories Forever"}</p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl">
            {cmsConfig?.description || "We turn birthdays into memorable adventures! Whether your child loves exploring forests, challenging themselves with fun activities, or enjoying magical nights under the stars, we've got the perfect birthday experience."}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Information */}
          <div className="space-y-8">
            {/* Featured Image */}
            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType="photo"
                mediaUrl={cmsConfig?.featuredMediaUrl || birthdayImage}
                fallbackImage={birthdayImage}
                altText="Party celebrations"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Party Options */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Choose the birthday party that fits your child and your family's style:</h2>
              <p className="text-muted-foreground mb-4">Click on any option to learn more about what's included.</p>
              
              <div className="space-y-4">
                {partyOptions.map((option) => (
                  <Card 
                    key={option.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 overflow-hidden"
                    onClick={() => setSelectedPartyOption(option)}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                        <img src={option.image} alt={option.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-primary/10 rounded-full p-1.5 text-primary">
                            {option.icon}
                          </div>
                          <h3 className="font-bold">{option.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{option.shortDescription}</p>
                        <Button variant="link" className="p-0 h-auto text-primary text-sm">
                          Learn More →
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Standard Package Includes
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Dedicated party area
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Outdoor adventure activities
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Party games and entertainment
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Professional event coordination
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Safety equipment and supervision
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Basic decorations setup
                </li>
              </ul>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">{cmsConfig?.formConfig?.formTitle || "Book Your Party"}</h3>

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
                <Label className="text-base font-medium">{cmsConfig?.formConfig?.fields?.occasion?.label || "Occasion"} *</Label>
                <Select onValueChange={(value) => setValue("occasion", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={cmsConfig?.formConfig?.fields?.occasion?.placeholder || "Select occasion"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday Party</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="reunion">Family Reunion</SelectItem>
                    <SelectItem value="other">Other Celebration</SelectItem>
                  </SelectContent>
                </Select>
                {errors.occasion && <p className="text-destructive text-sm mt-1">{errors.occasion.message}</p>}
              </div>

              <div>
                <Label htmlFor="parentName" className="text-base font-medium">
                  {cmsConfig?.formConfig?.fields?.parentName?.label || "Organizer Name"} *{autoFilledFields.has('parentName') && <AutoFilledBadge />}
                </Label>
                <Input
                  id="parentName"
                  {...register("parentName")}
                  className="mt-2"
                  placeholder={cmsConfig?.formConfig?.fields?.parentName?.placeholder || "Enter your full name"}
                />
                {errors.parentName && (
                  <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Children Information *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendChild({ childName: "", dateOfBirth: undefined, specialNeeds: "" })}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Child
                  </Button>
                </div>

                <div className="space-y-4">
                  {childrenFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Child {index + 1}</h4>
                        {childrenFields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeChild(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label className="text-sm">Child Name</Label>
                        <Input
                          {...register(`children.${index}.childName`)}
                          className="mt-1"
                          placeholder="Enter child's full name"
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
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.children?.[index]?.dateOfBirth?.message}
                            required
                          />
                        )}
                      />

                      <div>
                        <Label className="text-sm">Special/Medical Needs (Optional)</Label>
                        <Input
                          {...register(`children.${index}.specialNeeds`)}
                          className="mt-1"
                          placeholder="Allergies, medical conditions, etc."
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.children && typeof errors.children.message === "string" && (
                  <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="guestsNumber" className="text-base font-medium">
                  Number of Guests *
                </Label>
                <Input
                  id="guestsNumber"
                  {...register("guestsNumber")}
                  type="number"
                  className="mt-2"
                  placeholder="Total number of guests (10-50)"
                />
                {errors.guestsNumber && (
                  <p className="text-destructive text-sm mt-1">{errors.guestsNumber.message}</p>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Package Type *</Label>
                <Select onValueChange={(value) => setValue("packageType", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="half-day">Half-Day Package</SelectItem>
                    <SelectItem value="full-day">Full-Day Package</SelectItem>
                  </SelectContent>
                </Select>
                {errors.packageType && <p className="text-destructive text-sm mt-1">{errors.packageType.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Event Timing *</Label>
                <Select onValueChange={(value) => setValue("eventTiming", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select event timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">During the Day</SelectItem>
                    <SelectItem value="night">During the Night</SelectItem>
                    <SelectItem value="both">Both Day and Night</SelectItem>
                  </SelectContent>
                </Select>
                {errors.eventTiming && <p className="text-destructive text-sm mt-1">{errors.eventTiming.message}</p>}
              </div>

              <Controller
                name="eventDate"
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    label="Event Date"
                    placeholder="Select event date"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.eventDate?.message}
                    required
                  />
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-base font-medium">
                    Start Time *
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register("startTime")}
                    className="mt-2"
                  />
                  {errors.startTime && (
                    <p className="text-destructive text-sm mt-1">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="endTime" className="text-base font-medium">
                    End Time *
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register("endTime")}
                    className="mt-2"
                  />
                  {errors.endTime && (
                    <p className="text-destructive text-sm mt-1">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Location *</Label>
                <Select onValueChange={(value) => setValue("location", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karura-f">Karura Gate F</SelectItem>
                    <SelectItem value="tigoni">Tigoni</SelectItem>
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-destructive text-sm mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="decor" {...register("decor")} />
                    <Label htmlFor="decor">Enhanced Decoration Package</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="catering" {...register("catering")} />
                    <Label htmlFor="catering">Catering Services</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="photography" {...register("photography")} />
                    <Label htmlFor="photography">Professional Photography</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="activities" {...register("activities")} />
                    <Label htmlFor="activities">Special Activities (Rock Climbing, Kayaking)</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium">
                    Email *{autoFilledFields.has('email') && <AutoFilledBadge />}
                  </Label>
                  <Input id="email" type="email" {...register("email")} className="mt-2" placeholder="your@email.com" />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone *{autoFilledFields.has('phone') && <AutoFilledBadge />}
                  </Label>
                  <Input id="phone" {...register("phone")} className="mt-2" placeholder="+254 700 000 000" />
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
                    eventName="Party"
                  />
                )}
              />

              <div className="flex items-start space-x-3 pt-4">
                <Controller
                  name="consent"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="consent"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed">
                  I agree to the terms and conditions and consent to my child's participation in the party activities. *
                </Label>
              </div>
              {errors.consent && <p className="text-destructive text-sm">{errors.consent.message}</p>}

              <div className="flex flex-wrap gap-4 pt-4">
                <RefundPolicyDialog />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (cmsConfig?.formConfig?.messages?.loadingMessage || "Submitting...") : (cmsConfig?.formConfig?.ctaText || "Book Party")}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Party Option Detail Dialog */}
      <Dialog open={!!selectedPartyOption} onOpenChange={() => setSelectedPartyOption(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 rounded-full p-3 text-primary">
                {selectedPartyOption?.icon}
              </div>
              <DialogTitle className="text-2xl">{selectedPartyOption?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-base text-foreground">
              {selectedPartyOption?.fullDescription}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-3">What's Included:</h4>
              <ul className="space-y-2">
                {selectedPartyOption?.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            {selectedPartyOption?.note && (
              <div className="bg-accent/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground italic">
                  <strong>Note:</strong> {selectedPartyOption.note}
                </p>
              </div>
            )}
            
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm font-medium text-primary">{selectedPartyOption?.idealFor}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartiesProgram;
