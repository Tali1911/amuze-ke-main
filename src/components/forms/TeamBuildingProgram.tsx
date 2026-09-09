import React, { useState, useEffect } from "react";
import { useClientAuth } from '@/hooks/useClientAuth';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { useForm, Controller } from "react-hook-form";
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
import { PartyPopper, Users, Target, ArrowLeft, CheckCircle, Mountain, Compass, Flame, Focus, Building, School, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import adventureImage from "@/assets/adventure.jpg";
import DatePickerField from "./DatePickerField";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { leadsService } from '@/services/leadsService';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { useTeamBuildingPageConfig } from '@/hooks/useTeamBuildingPageConfig';
import DynamicMedia from "@/components/content/DynamicMedia";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";

const teamBuildingSchema = z.object({
  occasion: z.enum(["birthday", "family", "corporate"]),
  adultsNumber: z.string().min(1, "Number of adults is required"),
  childrenNumber: z.string().min(1, "Number of children is required"),
  ageRange: z.enum(["3-below", "4-6", "7-10", "11-13", "14-17", "18+"]),
  package: z.enum(["adventure", "bushcraft", "nature-carnival", "family-corporate"]),
  eventDate: z.date({
    required_error: "Event date is required"
  }),
  location: z.enum(["karura-gate-f", "karura-gate-a", "tigoni", "ngong"]),
  decor: z.boolean().default(false),
  catering: z.boolean().default(false),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) })
});

type TeamBuildingFormData = z.infer<typeof teamBuildingSchema>;

interface CMSConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  packages: Array<{
    id: string;
    title: string;
    description: string;
    features: string[];
    image?: string;
  }>;
  sampleFlow: Array<{
    title: string;
    description: string;
  }>;
  formTitle: string;
  ctaText: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
}

interface ActivityDetail {
  id: string;
  title: string;
  icon: React.ReactNode;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
}

const teamBuildingActivities: ActivityDetail[] = [{
  id: 'outdoor-challenges',
  title: 'Outdoor Challenges',
  icon: <Target className="w-6 h-6" />,
  shortDescription: 'Collaborative problem-solving and adventure-based tasks.',
  fullDescription: 'Collaborative problem-solving and adventure-based tasks that foster teamwork and creative thinking. Teams work together to overcome obstacles, communicate effectively, and achieve shared goals.',
  benefits: ['Teamwork', 'Creative Thinking', 'Communication', 'Shared Achievement']
}, {
  id: 'leadership-programs',
  title: 'Leadership Programs',
  icon: <Users className="w-6 h-6" />,
  shortDescription: 'Scenario-based challenges for decision-making and leadership.',
  fullDescription: 'Scenario-based challenges designed to develop decision-making, communication, and leadership skills. Participants take on leadership roles in dynamic outdoor scenarios that mirror workplace challenges.',
  benefits: ['Decision-Making', 'Communication', 'Leadership Skills', 'Strategic Thinking']
}, {
  id: 'bushcraft-survival',
  title: 'Bushcraft & Survival Skills',
  icon: <Flame className="w-6 h-6" />,
  shortDescription: 'Hands-on learning for resourcefulness and adaptability.',
  fullDescription: 'Hands-on learning that encourages resourcefulness, teamwork, and adaptability. Teams learn practical outdoor skills including shelter building, fire safety, and navigation while building trust and cooperation.',
  benefits: ['Resourcefulness', 'Teamwork', 'Adaptability', 'Trust Building']
}, {
  id: 'orienteering',
  title: 'Orienteering & Navigation',
  icon: <Compass className="w-6 h-6" />,
  shortDescription: 'Map-reading and navigation skills through team challenges.',
  fullDescription: 'Build map-reading and navigation skills while working together to overcome challenges. Teams navigate through natural terrain using maps and compasses, developing spatial awareness and collaborative problem-solving.',
  benefits: ['Map Reading', 'Navigation', 'Spatial Awareness', 'Collaborative Problem-Solving']
}, {
  id: 'mountain-biking',
  title: 'Mountain Biking & Adventure Trails',
  icon: <Mountain className="w-6 h-6" />,
  shortDescription: 'Promote trust and resilience through thrilling courses.',
  fullDescription: 'Promote trust, resilience, and encouragement as teams tackle thrilling courses together. Participants support each other through challenging terrain, building confidence and team morale.',
  benefits: ['Trust', 'Resilience', 'Encouragement', 'Team Morale']
}, {
  id: 'archery',
  title: 'Archery Challenges',
  icon: <Focus className="w-6 h-6" />,
  shortDescription: 'Focus, precision, and encouragement in a competitive environment.',
  fullDescription: 'Focus, precision, and encouragement in a fun, competitive environment. Team archery challenges build concentration while fostering friendly competition and mutual support.',
  benefits: ['Focus', 'Precision', 'Friendly Competition', 'Mutual Support']
}];

const audienceTypes = [{
  id: 'corporates',
  title: 'Corporates',
  icon: <Building className="w-6 h-6" />,
  description: 'Enhance collaboration, leadership, and morale through outdoor challenges.'
}, {
  id: 'schools',
  title: 'Schools',
  icon: <School className="w-6 h-6" />,
  description: 'Teach teamwork, leadership, and resilience to students/teachers in a safe, experiential setting.'
}, {
  id: 'community',
  title: 'Community & Youth Groups',
  icon: <Heart className="w-6 h-6" />,
  description: 'Build confidence, cooperation, and problem-solving skills through active, hands-on learning.'
}];

const TeamBuildingProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const { config: cmsConfig, isLoading, refresh } = useTeamBuildingPageConfig();
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetail | null>(null);

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
    formState: { errors, isSubmitting }
  } = useForm<TeamBuildingFormData>({
    resolver: zodResolver(teamBuildingSchema),
    defaultValues: {
      decor: false,
      catering: false,
      consent: false
    }
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
      if (clientProfile.email) { setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { setValue('phone', clientProfile.phone); filled.add('phone'); }
      setAutoFilledFields(filled);
    }
  }, [clientProfile, isSignedIn, setValue]);

  const onSubmit = async (data: TeamBuildingFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'team-building');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const { teamBuildingService } = await import('@/services/programRegistrationService');
      const registration = await teamBuildingService.create(data);

      await leadsService.createLead({
        full_name: 'Team Building Inquiry',
        email: data.email,
        phone: data.phone,
        program_type: 'team-building',
        program_name: data.package,
        form_data: data,
        source: 'website_registration'
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: 'team-building',
          registrationDetails: {
            occasion: data.occasion,
            package: data.package,
            eventDate: data.eventDate,
            location: data.location,
            registrationId: registration && 'id' in registration ? registration.id : undefined
          }
        }
      });

      if (emailError) {
        throw emailError;
      }
      toast.success(cmsConfig?.formConfig?.messages?.successMessage || "Registration submitted successfully! Check your email for confirmation.");
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'team-building');
      
      reset();
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      toast.error(cmsConfig?.formConfig?.messages?.errorMessage || error?.message || "Failed to submit registration. Please try again.");
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
            {cmsConfig?.formConfig?.buttons?.back || "Back to Home"}
          </Link>
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 rounded-full p-3">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary">{cmsConfig?.title || "Team Building"}</h1>
              <p className="text-lg text-muted-foreground">{cmsConfig?.subtitle || "Strengthen Teams Through Adventure"}</p>
            </div>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl">
            {cmsConfig?.description || "We believe the best teams are built through shared experiences, challenges, and outdoor adventure. Our team-building programs are designed to help organizations, schools, and groups connect, collaborate, and perform better together—all while enjoying the great outdoors."}
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
                mediaUrl={cmsConfig?.featuredMediaUrl || adventureImage}
                fallbackImage={adventureImage}
                altText="Team building activities"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Why Choose Us */}
            <Card className="p-6 bg-accent/30">
              <h2 className="text-xl font-bold text-primary mb-4">Why Choose Amuse Kenya for Team-Building?</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <strong>Adventure-Focused Learning:</strong> Engaging activities like orienteering, archery, obstacle courses, mountain biking, and bushcraft build problem-solving, communication, and leadership skills.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <strong>Tailored Programs:</strong> Each session is customized to your team's size, objectives, and skill levels, ensuring maximum impact.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <strong>Safe & Professional:</strong> All activities are guided by trained facilitators with a focus on safety, inclusivity, and structured fun.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                  <div>
                    <strong>Measurable Outcomes:</strong> Our programs are designed to improve teamwork, morale, resilience, and strategic thinking.
                  </div>
                </div>
              </div>
            </Card>

            {/* Translating Adventure Section */}
            <Card className="p-6 bg-primary/5">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Translating Adventure into Workplace Success
              </h3>
              <p className="text-muted-foreground mb-4">Our approach ensures that the skills your team develops outdoors carry over to the team environment:</p>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-background rounded-lg p-3">
                  <strong className="text-primary">Communication:</strong>
                  <p className="text-sm text-muted-foreground">Participants practice listening, clear messaging, and feedback in real-time challenges.</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <strong className="text-primary">Collaboration:</strong>
                  <p className="text-sm text-muted-foreground">Team tasks reinforce trust, cooperation, and shared responsibility.</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <strong className="text-primary">Leadership:</strong>
                  <p className="text-sm text-muted-foreground">Adventure scenarios allow natural leaders to emerge and inspire their peers.</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <strong className="text-primary">Problem-Solving:</strong>
                  <p className="text-sm text-muted-foreground">Teams develop strategies, adapt to change, and think creatively under pressure.</p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <strong className="text-primary">Resilience & Morale:</strong>
                  <p className="text-sm text-muted-foreground">Overcoming outdoor challenges fosters confidence, motivation, and a positive team culture.</p>
                </div>
              </div>
            </Card>

            {/* Activities We Offer */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Team-Building Activities We Offer</h2>
              <p className="text-muted-foreground mb-4">Click on any activity to learn more:</p>
              <div className="grid grid-cols-2 gap-3">
                {teamBuildingActivities.map((activity) => (
                  <Card 
                    key={activity.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 rounded-full p-2 text-primary">
                        {activity.icon}
                      </div>
                      <h4 className="font-semibold text-sm">{activity.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.shortDescription}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Who We Work With */}
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Who We Work With</h2>
              <div className="space-y-3">
                {audienceTypes.map(audience => (
                  <Card key={audience.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-full p-2 text-primary">
                        {audience.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{audience.title}</h4>
                        <p className="text-sm text-muted-foreground">{audience.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">{cmsConfig?.formConfig?.formTitle || "Book Your Team-Building Experience"}</h3>

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
                <Select onValueChange={value => setValue("occasion", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={cmsConfig?.formConfig?.fields?.occasion?.placeholder || "Select occasion"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adultsNumber" className="text-base font-medium">
                    Adults *
                  </Label>
                  <Input id="adultsNumber" {...register("adultsNumber")} type="number" className="mt-2" placeholder="Number of adults" />
                  {errors.adultsNumber && <p className="text-destructive text-sm mt-1">{errors.adultsNumber.message}</p>}
                </div>
                <div>
                  <Label htmlFor="childrenNumber" className="text-base font-medium">
                    Children *
                  </Label>
                  <Input id="childrenNumber" {...register("childrenNumber")} type="number" className="mt-2" placeholder="Number of children" />
                  {errors.childrenNumber && <p className="text-destructive text-sm mt-1">{errors.childrenNumber.message}</p>}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Age Range *</Label>
                <Select onValueChange={value => setValue("ageRange", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-below">3 & Below</SelectItem>
                    <SelectItem value="4-6">4-6 years</SelectItem>
                    <SelectItem value="7-10">7-10 years</SelectItem>
                    <SelectItem value="11-13">11-13 years</SelectItem>
                    <SelectItem value="14-17">14-17 years</SelectItem>
                    <SelectItem value="18+">18+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.ageRange && <p className="text-destructive text-sm mt-1">{errors.ageRange.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Package *</Label>
                <Select onValueChange={value => setValue("package", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Outdoor Challenges</SelectItem>
                    <SelectItem value="bushcraft">Bushcraft & Survival</SelectItem>
                    <SelectItem value="nature-carnival">Leadership Programs</SelectItem>
                    <SelectItem value="family-corporate">Mountain Biking & Orienteering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Controller name="eventDate" control={control} render={({ field }) => (
                <DatePickerField 
                  label="Event Date" 
                  placeholder="Select event date" 
                  value={field.value} 
                  onChange={field.onChange} 
                  error={errors.eventDate?.message} 
                  required 
                />
              )} />

              <div>
                <Label className="text-base font-medium">Location *</Label>
                <Select onValueChange={value => setValue("location", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karura-gate-f">Karura Gate F</SelectItem>
                    <SelectItem value="karura-gate-a">Karura Gate A</SelectItem>
                    <SelectItem value="tigoni">Tigoni</SelectItem>
                    <SelectItem value="ngong">Ngong</SelectItem>
                  </SelectContent>
                </Select>
                {errors.location && <p className="text-destructive text-sm mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="decor" {...register("decor")} />
                    <Label htmlFor="decor">Decoration</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="catering" {...register("catering")} />
                    <Label htmlFor="catering">Catering</Label>
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
                    variant="adult"
                    eventName="Team Building"
                  />
                )}
              />

              <div className="flex items-start space-x-3 pt-4">
                <Controller name="consent" control={control} render={({ field }) => (
                  <Checkbox id="consent" checked={field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="consent" className="text-sm leading-relaxed">
                  I agree to the terms and conditions and consent to participate in the team-building activities. *
                </Label>
              </div>
              {errors.consent && <p className="text-destructive text-sm">{errors.consent.message}</p>}

              <div className="flex flex-wrap gap-4 pt-4">
                <RefundPolicyDialog />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (cmsConfig?.formConfig?.messages?.loadingMessage || "Submitting...") : (cmsConfig?.formConfig?.ctaText || "Book Experience")}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 rounded-full p-3 text-primary">
                {selectedActivity?.icon}
              </div>
              <DialogTitle className="text-2xl">{selectedActivity?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-base text-foreground">
              {selectedActivity?.fullDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h4 className="font-semibold mb-3">Key Benefits:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedActivity?.benefits.map((benefit, index) => (
                <span key={index} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamBuildingProgram;
