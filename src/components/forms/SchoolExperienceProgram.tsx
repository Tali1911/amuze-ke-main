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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GraduationCap, MapPin, Users, ArrowLeft, CheckCircle, Plus, X, TreePine, Bus, Factory, Tent, ChevronRight } from "lucide-react";
import RegistrationPageSkeleton from "@/components/skeletons/RegistrationPageSkeleton";
import { Link } from "react-router-dom";
import schoolsImage from "@/assets/schools.jpg";
import DatePickerField from "./DatePickerField";
import { ConsentDialog } from "./ConsentDialog";
import { RefundPolicyDialog } from "./RefundPolicyDialog";
import { ParticipationConsentDialog } from './ParticipationConsentDialog';
import { leadsService } from "@/services/leadsService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSchoolAdventuresPageConfig } from "@/hooks/useSchoolAdventuresPageConfig";
import DynamicMedia from "@/components/content/DynamicMedia";
import { performSecurityChecks, recordSubmission } from "@/services/formSecurityService";

const schoolExperienceSchema = z.object({
  schoolName: z.string().min(1, "School name is required").max(200),
  numberOfKids: z.string().min(1, "Number of kids is required"),
  numberOfAdults: z.string().min(1, "Number of adults is required"),
  ageRanges: z.array(z.object({
    range: z.enum(["6-8", "9-11", "12-14", "15-17"])
  })).min(1, "Please add at least one age range"),
  package: z.enum(["day-trip", "sleep-away", "after-school-club", "physical-education"]),
  preferredDates: z.array(z.object({
    date: z.date()
  })).min(1, "Please add at least one preferred date"),
  location: z.enum(["karura-gate-f", "karura-gate-a", "tigoni", "ngong"]),
  numberOfStudents: z.string().min(1, "Number of students is required"),
  numberOfTeachers: z.string().min(1, "Number of teachers is required"),
  transport: z.boolean().default(false),
  catering: z.boolean().default(false),
  specialNeeds: z.string().max(500),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(20),
  consent: z.boolean().default(false),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) })
});

type SchoolExperienceFormData = z.infer<typeof schoolExperienceSchema>;

// Icon mapping for CMS program icons
const iconMap: Record<string, React.ElementType> = {
  Trees: TreePine,
  TreePine: TreePine,
  MapPin: MapPin,
  Bus: Bus,
  Building2: Factory,
  Factory: Factory,
  Tent: Tent,
  Users: Users,
};

interface ProgramDetail {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  description: string;
  keyFeatures: string[];
  examples?: {
    title: string;
    description: string;
  }[];
  benefits?: string[];
  idealFor?: string;
}

// Default programs as fallback
const defaultProgramDetails: ProgramDetail[] = [{
  id: "forest-days",
  title: "Forest Days",
  tagline: "Where Nature Becomes the Teacher",
  icon: TreePine,
  description: "Forest Days at Amuse Kenya are designed to complement school curricula by transforming forests and green spaces into living classrooms. Here, learning is experiential, sensory-rich, and deeply engaging—allowing children to explore concepts through direct interaction with nature.",
  keyFeatures: ["Curriculum-Aligned Programs: We co-create customized outdoor learning experiences aligned with your school's curriculum, learning objectives, and age group.", "Flexible Duration: Forest Days can run as a one-day experience, week-long program, term-based integration, or a fully customized schedule.", "Hands-On Learning: Activities include nature exploration, storytelling, creative play, observation exercises, and guided inquiry-based learning.", "Environmental Stewardship: Students develop respect for nature while learning about ecosystems, conservation, and sustainability."],
  idealFor: "Schools seeking forest school programs in Nairobi, outdoor education for students, and nature-based learning experiences."
}, {
  id: "field-trips",
  title: "School Field Trips",
  tagline: "Learning Beyond the Classroom",
  icon: Bus,
  description: "Our school field trips are designed to extend classroom lessons into the great outdoors, giving students hands-on opportunities to explore, discover, and grow. Field trips aren't just fun—they're proven to boost academic engagement, curiosity, teamwork, and critical thinking.",
  keyFeatures: ["Curriculum-Aligned Learning: Every activity is designed to reinforce what students are learning in science, geography, history, environmental studies, and more.", "Interactive Experiences: Students participate in guided nature walks, scavenger hunts, problem-solving challenges, and outdoor lessons.", "Teamwork and Social Skills: Activities encourage collaboration, communication, and leadership—skills essential for academic and personal growth.", "Flexible Programs: Field trips can be tailored for one day, multiple days, or specific subjects."],
  examples: [{
    title: "Forests & Nature Reserves",
    description: "Explore ecosystems, biodiversity, and conservation in action (e.g., Karura Forest)."
  }, {
    title: "Farms & Agricultural Centers",
    description: "Learn about food systems, sustainability, and agribusiness."
  }, {
    title: "Wetlands & Water Bodies",
    description: "Study climate, water cycles, and environmental science hands-on."
  }, {
    title: "Heritage & Cultural Sites",
    description: "Bring history and social studies to life with immersive cultural experiences."
  }]
}, {
  id: "industrial-visits",
  title: "Industrial Visits",
  tagline: "Bridging Classroom Learning and the Real World",
  icon: Factory,
  description: "We bring learning to life through industrial visits that take students beyond textbooks and into real workplaces. These visits provide a unique opportunity for students to observe, engage, and understand how classroom concepts are applied in real-world industries.",
  keyFeatures: ["Practical Learning: Students see firsthand how science, geography, business, technology, and environmental concepts are applied in real industries.", "Career Exposure: Early exposure to professionals and workplaces helps students understand potential career pathways and develop ambition.", "Critical Thinking & Problem Solving: Observing processes, systems, and workflows encourages analytical thinking and practical problem-solving skills.", "Curriculum Integration: Visits are aligned with learning objectives, reinforcing academic lessons in a tangible, interactive environment."],
  examples: [{
    title: "Manufacturing Plants",
    description: "Explore production processes, quality control, workplace safety, and efficiency systems."
  }, {
    title: "Renewable Energy Sites",
    description: "Visit solar farms, biogas facilities, and other sustainable energy projects."
  }, {
    title: "Recycling & Waste Management",
    description: "Understand sustainable practices and environmental responsibility."
  }, {
    title: "Agricultural Processing Centers",
    description: "Observe farms, dairies, greenhouses, and food processing units."
  }],
  benefits: ["Connect theory to practice in science, technology, geography, business, and environmental studies", "Develop workplace awareness, professionalism, and curiosity", "Build teamwork, communication, and problem-solving skills", "Gain inspiration for future careers and further studies"]
}, {
  id: "sleep-away",
  title: "Sleep-Away Camps for Schools",
  tagline: "Immersive Outdoor Adventures That Build Life Skills",
  icon: Tent,
  description: "Our sleep-away school experiences offer students a unique opportunity to disconnect from routine and fully immerse themselves in nature. These multi-day experiences are carefully designed to foster independence, resilience, teamwork, and meaningful peer connections.",
  keyFeatures: ["Multi-Day Camping Experiences: Students stay in spacious tents and engage in activities such as archery, orienteering, bushcraft, team challenges, and guided night hikes.", "Confidence & Independence Building: Camp life encourages responsibility, decision-making, cooperation, and leadership.", "Evenings Under the Stars: Campfire stories, reflection sessions, bonding activities, and outdoor movie nights create endless memories.", "Safe & Supportive Environment: Low student-to-instructor ratios, trained facilitators, and comprehensive safety protocols ensure peace of mind."],
  idealFor: "Schools looking for school camping trips in Kenya, educational sleep-away camps, and outdoor leadership programs for students. Suitable for primary through high school."
}];

const SchoolExperienceProgram = () => {
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const { config, isLoading, refresh } = useSchoolAdventuresPageConfig();

  // Listen for CMS updates
  useEffect(() => {
    const handleCMSUpdate = () => {
      refresh?.();
    };
    
    window.addEventListener('cms-content-updated', handleCMSUpdate);
    return () => window.removeEventListener('cms-content-updated', handleCMSUpdate);
  }, [refresh]);

  // Convert CMS programs to component format
  const programDetails: ProgramDetail[] = config?.programs?.length 
    ? config.programs.map(p => ({
        id: p.id,
        title: p.title,
        tagline: p.tagline,
        icon: iconMap[p.icon] || TreePine,
        description: p.description,
        keyFeatures: p.features || [],
        examples: p.examples?.map(e => ({ title: e, description: '' })),
      }))
    : defaultProgramDetails;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: {
      errors,
      isSubmitting
    }
  } = useForm<SchoolExperienceFormData>({
    resolver: zodResolver(schoolExperienceSchema),
    defaultValues: {
      ageRanges: [{
        range: undefined as any
      }],
      preferredDates: [{
        date: undefined as any
      }],
      transport: false,
      catering: false,
      consent: false
    }
  });

  const {
    fields: ageRangeFields,
    append: appendAgeRange,
    remove: removeAgeRange
  } = useFieldArray({
    control,
    name: "ageRanges"
  });

  const {
    fields: dateFields,
    append: appendDate,
    remove: removeDate
  } = useFieldArray({
    control,
    name: "preferredDates"
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

  const onSubmit = async (data: SchoolExperienceFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'school-experience');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const {
        schoolExperienceService
      } = await import("@/services/programRegistrationService");
      const registration = await schoolExperienceService.create(data);
      await leadsService.createLead({
        full_name: data.schoolName,
        email: data.email,
        phone: data.phone,
        program_type: "school-experience",
        program_name: data.package,
        form_data: data,
        source: "website_registration"
      });
      const {
        supabase
      } = await import("@/integrations/supabase/client");
      await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: data.email,
          programType: "school-experience",
          registrationDetails: {
            schoolName: data.schoolName,
            package: data.package,
            numberOfStudents: data.numberOfStudents,
            location: data.location,
            registrationId: registration && "id" in registration ? registration.id : undefined
          }
        }
      });
      toast.success(config?.formConfig?.messages?.successMessage || "Registration submitted successfully! Check your email for confirmation.");
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'school-experience');
      
      reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", error?.message, error?.details, error?.hint);
      toast.error(config?.formConfig?.messages?.errorMessage || error?.message || "Failed to submit registration. Please try again.");
    }
  };

  const selectedProgramData = programDetails.find(p => p.id === selectedProgram);

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
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {config?.title || "School Adventures"}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {config?.subtitle || "(Ages 6-17 years)"}
                  </p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {config?.description || "We partner with schools across Nairobi and Kenya to deliver curriculum-aligned outdoor education programs, school field trips, forest school experiences, and sleep-away camps that enhance academic learning while nurturing holistic child development and environmental stewardship."}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType="photo"
                mediaUrl={config?.featuredImage || schoolsImage}
                fallbackImage={schoolsImage}
                altText="School groups in nature"
                className="w-full h-full object-cover"
                isLoading={isLoading}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* What We Offer Section */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary">What Are Our Offerings for Your School</h3>
              <p className="text-muted-foreground">
                Click on any program below to learn more about how we can partner with your school.
              </p>
            </div>

            {/* Program Cards with Learn More */}
            <div className="space-y-4">
              {programDetails.map(program => {
                const IconComponent = program.icon;
                return (
                  <Card 
                    key={program.id} 
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer group" 
                    onClick={() => setSelectedProgram(program.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 rounded-full p-3 shrink-0">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                          {program.title}
                        </h4>
                        <p className="text-sm text-primary/80 font-medium mb-2">{program.tagline}</p>
                        <p className="text-muted-foreground text-sm line-clamp-2">{program.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Rainy Day Plans */}
            <Card className="p-6 bg-accent/50">
              <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Rainy-Day Plans
              </h4>
              <p className="text-muted-foreground">
                Use indoor pavilions or partner halls for storytelling, simulations, knot practice, cultural dance
                workshops - ensuring learning continues regardless of weather.
              </p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 sticky top-8">
            <h3 className="text-2xl font-bold text-primary mb-6">School Registration</h3>

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
                <Label htmlFor="schoolName" className="text-base font-medium">
                  {config?.formConfig?.fields?.schoolName?.label || "School Name"} *
                </Label>
                <Input 
                  id="schoolName" 
                  {...register("schoolName")} 
                  className="mt-2" 
                  placeholder={config?.formConfig?.fields?.schoolName?.placeholder || "Enter school name"} 
                />
                {errors.schoolName && <p className="text-destructive text-sm mt-1">{errors.schoolName.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numberOfKids" className="text-base font-medium">
                    Number of Kids *
                  </Label>
                  <Input id="numberOfKids" {...register("numberOfKids")} className="mt-2" placeholder="e.g., 25" />
                  {errors.numberOfKids && <p className="text-destructive text-sm mt-1">{errors.numberOfKids.message}</p>}
                </div>
                <div>
                  <Label htmlFor="numberOfAdults" className="text-base font-medium">
                    Number of Adults *
                  </Label>
                  <Input id="numberOfAdults" {...register("numberOfAdults")} className="mt-2" placeholder="e.g., 3" />
                  {errors.numberOfAdults && <p className="text-destructive text-sm mt-1">{errors.numberOfAdults.message}</p>}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">Age Ranges *</Label>
                <div className="space-y-3">
                  {ageRangeFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <Controller 
                          name={`ageRanges.${index}.range`} 
                          control={control} 
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="6-8">6-8 years</SelectItem>
                                <SelectItem value="9-11">9-11 years</SelectItem>
                                <SelectItem value="12-14">12-14 years</SelectItem>
                                <SelectItem value="15-17">15-17 years</SelectItem>
                              </SelectContent>
                            </Select>
                          )} 
                        />
                        {errors.ageRanges?.[index]?.range && (
                          <p className="text-destructive text-sm mt-1">{errors.ageRanges[index]?.range?.message}</p>
                        )}
                      </div>
                      {ageRangeFields.length > 1 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removeAgeRange(index)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => appendAgeRange({ range: undefined as any })} 
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Age Range
                  </Button>
                  {errors.ageRanges && typeof errors.ageRanges.message === "string" && (
                    <p className="text-destructive text-sm mt-1">{errors.ageRanges.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">
                  {config?.formConfig?.fields?.programType?.label || "Package"} *
                </Label>
                <Select onValueChange={value => setValue("package", value as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={config?.formConfig?.fields?.programType?.placeholder || "Select a package"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day-trip">Day Trip</SelectItem>
                    <SelectItem value="sleep-away">Sleep-Away</SelectItem>
                    <SelectItem value="after-school-club">After-School Club</SelectItem>
                    <SelectItem value="physical-education">Physical Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  {config?.formConfig?.fields?.preferredDates?.label || "Preferred Dates"} *
                </Label>
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
                              placeholder={config?.formConfig?.fields?.preferredDates?.placeholder || "Select date"} 
                              value={field.value} 
                              onChange={field.onChange} 
                              error={errors.preferredDates?.[index]?.date?.message} 
                            />
                          )} 
                        />
                      </div>
                      {dateFields.length > 1 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removeDate(index)} className="shrink-0 mt-2">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => appendDate({ date: undefined as any })} 
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Date
                  </Button>
                  {errors.preferredDates && typeof errors.preferredDates.message === "string" && (
                    <p className="text-destructive text-sm mt-1">{errors.preferredDates.message}</p>
                  )}
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numberOfStudents" className="text-base font-medium">
                    {config?.formConfig?.fields?.numberOfStudents?.label || "No. of Students"} *
                  </Label>
                  <Input 
                    id="numberOfStudents" 
                    {...register("numberOfStudents")} 
                    className="mt-2" 
                    placeholder={config?.formConfig?.fields?.numberOfStudents?.placeholder || "Total students"} 
                  />
                  {errors.numberOfStudents && <p className="text-destructive text-sm mt-1">{errors.numberOfStudents.message}</p>}
                </div>
                <div>
                  <Label htmlFor="numberOfTeachers" className="text-base font-medium">
                    No. of Teachers *
                  </Label>
                  <Input id="numberOfTeachers" {...register("numberOfTeachers")} className="mt-2" placeholder="Total teachers" />
                  {errors.numberOfTeachers && <p className="text-destructive text-sm mt-1">{errors.numberOfTeachers.message}</p>}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Add-Ons</Label>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="transport" {...register("transport")} />
                    <Label htmlFor="transport">Transport</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox id="catering" {...register("catering")} />
                    <Label htmlFor="catering">Catering</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="specialNeeds" className="text-base font-medium">
                  Special Needs (Optional)
                </Label>
                <Textarea 
                  id="specialNeeds" 
                  {...register("specialNeeds")} 
                  className="mt-2" 
                  placeholder="Any special requirements or considerations" 
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
                    {...register("email")} 
                    className="mt-2" 
                    placeholder={config?.formConfig?.fields?.email?.placeholder || "school@email.com"} 
                    type="email" 
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
                    placeholder={config?.formConfig?.fields?.phone?.placeholder || "+254 XXX XXX XXX"} 
                  />
                  {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Controller
                  name="participationConsent"
                  control={control}
                  render={({ field }) => (
                    <ParticipationConsentDialog
                      checked={field.value === true}
                      onCheckedChange={(v) => field.onChange(v ? true : undefined)}
                      error={errors.participationConsent?.message}
                      variant="child"
                      eventName="School Experience"
                    />
                  )}
                />
                <ConsentDialog 
                  checked={consent} 
                  onCheckedChange={checked => setValue("consent", checked as boolean)} 
                  error={errors.consent?.message} 
                />
                <div className="text-sm text-muted-foreground">
                  Please also review our <RefundPolicyDialog />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting 
                  ? (config?.formConfig?.messages?.loadingMessage || "Submitting...") 
                  : (config?.formConfig?.buttons?.submit || "Submit Registration")
                }
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Program Detail Dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={open => !open && setSelectedProgram(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProgramData && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-primary/10 rounded-full p-2">
                    <selectedProgramData.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedProgramData.title}</DialogTitle>
                    <DialogDescription className="text-primary font-medium">
                      {selectedProgramData.tagline}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <p className="text-muted-foreground leading-relaxed">
                  {selectedProgramData.description}
                </p>

                <div>
                  <h4 className="font-semibold text-lg mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {selectedProgramData.keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedProgramData.examples && selectedProgramData.examples.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Examples</h4>
                    <div className="grid gap-3">
                      {selectedProgramData.examples.map((example, index) => (
                        <div key={index} className="bg-accent/30 rounded-lg p-4">
                          <h5 className="font-medium text-primary">{example.title}</h5>
                          {example.description && (
                            <p className="text-sm text-muted-foreground">{example.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProgramData.benefits && selectedProgramData.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Benefits for Students</h4>
                    <ul className="space-y-2">
                      {selectedProgramData.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedProgramData.idealFor && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm">
                      <span className="font-medium">Ideal for: </span>
                      <span className="text-muted-foreground">{selectedProgramData.idealFor}</span>
                    </p>
                  </div>
                )}

                <Button onClick={() => setSelectedProgram(null)} className="w-full">
                  Book This Program
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolExperienceProgram;
