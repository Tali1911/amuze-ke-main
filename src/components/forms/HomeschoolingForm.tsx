import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Users, Target, CheckCircle, BookOpen, Bike, Tent, Award, Flame, Focus, Compass } from 'lucide-react';
import campingImage from '@/assets/camping.jpg';
import adventureImage from '@/assets/adventure.jpg';
import dailyActivitiesImage from '@/assets/daily-activities.jpg';
import DatePickerField from './DatePickerField';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { leadsService } from '@/services/leadsService';

const homeschoolingSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required').max(100),
  children: z.array(z.object({
    name: z.string().min(1, 'Child name is required').max(100),
    dateOfBirth: z.date({ required_error: 'Date of birth is required' })
  })).min(1, 'Please add at least one child'),
  package: z.enum(['1-day-discovery', 'weekly-pod', 'project-based']),
  focus: z.array(z.string()).min(1, 'Please select at least one focus area'),
  transport: z.boolean().default(false),
  meal: z.boolean().default(false),
  allergies: z.string().max(500),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().default(false)
});

type HomeschoolingFormData = z.infer<typeof homeschoolingSchema>;

interface Activity {
  id: string;
  title: string;
  icon: React.ReactNode;
  shortDescription: string;
  fullDescription: string;
  benefits: string[];
}

const activities: Activity[] = [
  {
    id: 'horse-riding',
    title: 'Horse Riding',
    icon: <Award className="w-6 h-6" />,
    shortDescription: 'Build balance, coordination, and connection with animals.',
    fullDescription: 'Horse riding builds balance, coordination, confidence, and responsibility while nurturing empathy and connection with animals. Our trained instructors ensure a safe and enriching experience for all skill levels.',
    benefits: ['Balance & Coordination', 'Confidence Building', 'Responsibility', 'Empathy & Animal Connection']
  },
  {
    id: 'mountain-biking',
    title: 'Mountain Biking',
    icon: <Bike className="w-6 h-6" />,
    shortDescription: 'Develop endurance and bike-handling skills on guided trails.',
    fullDescription: 'Mountain biking develops endurance, bike-handling skills, risk assessment, and resilience through guided trail riding. Students learn to navigate varying terrain while building physical fitness and mental toughness.',
    benefits: ['Endurance', 'Bike-Handling Skills', 'Risk Assessment', 'Resilience']
  },
  {
    id: 'camping',
    title: 'Camping Experiences',
    icon: <Tent className="w-6 h-6" />,
    shortDescription: 'Learn independence, teamwork, and self-reliance outdoors.',
    fullDescription: 'Camping experiences teach independence, teamwork, planning, and self-reliance through immersive outdoor living. Students learn to set up camp, cook outdoors, and work together in nature.',
    benefits: ['Independence', 'Teamwork', 'Planning Skills', 'Self-Reliance']
  },
  {
    id: 'leadership',
    title: 'Outdoor Leadership Programs',
    icon: <Users className="w-6 h-6" />,
    shortDescription: 'Focus on communication, decision-making, and leadership.',
    fullDescription: 'Our outdoor leadership programs focus on communication, decision-making, teamwork, and leadership through challenge-based activities. Students develop essential life skills in a supportive outdoor environment.',
    benefits: ['Communication', 'Decision-Making', 'Teamwork', 'Leadership Skills']
  },
  {
    id: 'bushcraft',
    title: 'Bushcraft & Survival Skills',
    icon: <Flame className="w-6 h-6" />,
    shortDescription: 'Acquire practical skills like shelter building and fire safety.',
    fullDescription: 'Learners acquire practical skills such as shelter building, fire safety, knot-tying, and nature awareness. These hands-on experiences build confidence and self-sufficiency in outdoor environments.',
    benefits: ['Shelter Building', 'Fire Safety', 'Knot-Tying', 'Nature Awareness']
  },
  {
    id: 'archery',
    title: 'Archery',
    icon: <Focus className="w-6 h-6" />,
    shortDescription: 'Enhance focus, patience, and hand-eye coordination.',
    fullDescription: 'Archery enhances focus, patience, discipline, and hand-eye coordination in a safe and structured setting. Students learn proper technique while developing mental concentration and physical control.',
    benefits: ['Focus', 'Patience', 'Discipline', 'Hand-Eye Coordination']
  },
  {
    id: 'orienteering',
    title: 'Orienteering & Navigation',
    icon: <Compass className="w-6 h-6" />,
    shortDescription: 'Learn map reading, compass use, and problem-solving.',
    fullDescription: 'Orienteering teaches map reading, compass use, spatial awareness, and problem-solving while navigating natural environments. Students develop critical thinking skills and outdoor confidence.',
    benefits: ['Map Reading', 'Compass Use', 'Spatial Awareness', 'Problem-Solving']
  }
];

const HomeschoolingForm = () => {
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<HomeschoolingFormData>({
    resolver: zodResolver(homeschoolingSchema),
    defaultValues: {
      transport: false,
      meal: false,
      focus: [],
      consent: false
    }
  });

  const watchedFocus = watch('focus') || [];
  const consent = watch('consent');

  const onSubmit = async (data: HomeschoolingFormData) => {
    try {
      // Save to database
      const { homeschoolingService } = await import('@/services/programRegistrationService');
      const registration = await homeschoolingService.create(data);

      // Capture lead
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'homeschooling',
        program_name: data.package,
        form_data: data,
        source: 'website'
      });

      // Send confirmation email via Resend
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: 'homeschooling',
          registrationDetails: {
            parentName: data.parentName,
            package: data.package,
            children: data.children,
            focus: data.focus
          }
        }
      });

      toast.success('Registration submitted successfully! Check your email for confirmation.');
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      toast.error(error?.message || 'Failed to submit registration. Please try again.');
    }
  };

  const handleFocusChange = (focus: string, checked: boolean) => {
    const currentFocus = watchedFocus;
    if (checked) {
      setValue('focus', [...currentFocus, focus]);
    } else {
      setValue('focus', currentFocus.filter(f => f !== focus));
    }
  };

  const packages = [
    {
      id: '1-day-discovery',
      title: '1-Day Discovery',
      itinerary: '10:00 Nature Circle | 10:15 Guided Lesson | 11:15 Journaling | 12:30 Project Build | 1:30 Math-in-Nature | 2:30 Reflection',
      skills: ['Observation', 'Sports', 'Teamwork', 'Journaling']
    },
    {
      id: 'weekly-pod',
      title: 'Weekly Pod Plan (4-Weeks)',
      itinerary: 'Week 1 – Ecology, Week 2 – Navigation, Week 3 – Survival, Week 4 – Showcase',
      skills: ['Progressive Learning', 'Leadership', 'Presentation Skills']
    },
    {
      id: 'project-based',
      title: 'Project-Based Module (5 Days)',
      itinerary: 'Day 1 – Research, Day 2 – Build, Day 3 – Field Study, Day 4 – Prepare Presentation, Day 5 – Present',
      skills: ['Research', 'Collaboration', 'Critical Thinking']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
      {/* Hero Section */}
      <div className="bg-forest-600 text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <Button
            variant="ghost"
            className="text-white hover:bg-forest-700 mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Homeschooler Programs</h1>
          <p className="text-xl text-forest-100 max-w-3xl">
            Flexible, Experiential Learning for Homeschooling Families
          </p>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="bg-accent/30 rounded-2xl p-8 mb-12">
          <p className="text-lg text-foreground leading-relaxed mb-6">
            Our Homeschooler Programs are designed to support families seeking meaningful, hands-on learning experiences beyond textbooks. These programs provide structured outdoor education that complements homeschooling curricula while fostering social interaction and real-world skill development.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">What We Offer:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Curriculum-linked outdoor learning sessions across science, geography, physical education, and life skills
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Project-based learning through nature exploration, problem-solving, and creative challenges
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Social engagement with peers in a supportive outdoor environment
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Flexible scheduling to suit homeschool routines
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-primary">Key Benefits:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Increased independence and confidence
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Enhanced collaboration skills
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Strong connection to the natural world
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  Memorable and impactful learning experiences
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Activities We Support - Clickable Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-primary mb-6">Activities We Readily Support</h2>
          <p className="text-muted-foreground mb-6">Click on any activity to learn more about what's included and the benefits for your child.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activities.map((activity) => (
              <Card 
                key={activity.id} 
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                onClick={() => setSelectedActivity(activity)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 rounded-full p-2 text-primary">
                      {activity.icon}
                    </div>
                    <h4 className="font-semibold">{activity.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{activity.shortDescription}</p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Learn More →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Package Showcase Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src={campingImage} alt="1-Day Discovery" className="w-full h-48 object-cover rounded-lg mb-4" />
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-forest-600" />
                1-Day Discovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Perfect for trying out our approach. One full day of immersive outdoor learning.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src={adventureImage} alt="Weekly Pod Plan" className="w-full h-48 object-cover rounded-lg mb-4" />
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-forest-600" />
                Weekly Pod Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Consistent learning with peers. Meet once a week for structured outdoor education.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <img src={dailyActivitiesImage} alt="Project-Based Module" className="w-full h-48 object-cover rounded-lg mb-4" />
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-forest-600" />
                Project-Based Module
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Deep dive into specific topics over multiple sessions with hands-on projects.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ideal For Section */}
        <div className="bg-primary/5 rounded-xl p-6 mb-12">
          <p className="text-center text-muted-foreground italic">
            Ideal for families searching for <strong>homeschool outdoor programs in Nairobi</strong>, <strong>things homeschool children can do in Nairobi</strong>, and <strong>experiential learning for homeschoolers in Kenya</strong>.
          </p>
        </div>

        {/* Registration Form */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="h-6 w-6 text-forest-600" />
              Register for Homeschooling Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Parent Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-forest-700">Parent/Guardian Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Parent Name *</Label>
                    <Input
                      id="parentName"
                      {...register('parentName')}
                      placeholder="Your name"
                    />
                    {errors.parentName && (
                      <p className="text-destructive text-sm mt-1">{errors.parentName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Children Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-forest-700">Children Information</h3>
                <p className="text-sm text-muted-foreground mb-4">Please provide your children's names and dates of birth</p>
                {errors.children && (
                  <p className="text-destructive text-sm mt-1">{errors.children.message}</p>
                )}
              </div>

              {/* Package Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-forest-700">Select Package *</h3>
                <Controller
                  name="package"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a package" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-day-discovery">1-Day Discovery</SelectItem>
                        <SelectItem value="weekly-pod">Weekly Pod Plan</SelectItem>
                        <SelectItem value="project-based">Project-Based Module</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.package && (
                  <p className="text-destructive text-sm mt-1">{errors.package.message}</p>
                )}
              </div>

              {/* Focus Areas */}
              <div>
                <Label>Learning Focus Areas * (Select at least one)</Label>
                <div className="space-y-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="outdoor-survival"
                      checked={watchedFocus.includes('outdoor-survival')}
                      onCheckedChange={(checked) => handleFocusChange('outdoor-survival', checked as boolean)}
                    />
                    <Label htmlFor="outdoor-survival" className="font-normal cursor-pointer">
                      Outdoor Survival & Bushcraft
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nature-science"
                      checked={watchedFocus.includes('nature-science')}
                      onCheckedChange={(checked) => handleFocusChange('nature-science', checked as boolean)}
                    />
                    <Label htmlFor="nature-science" className="font-normal cursor-pointer">
                      Nature & Science
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="physical-activity"
                      checked={watchedFocus.includes('physical-activity')}
                      onCheckedChange={(checked) => handleFocusChange('physical-activity', checked as boolean)}
                    />
                    <Label htmlFor="physical-activity" className="font-normal cursor-pointer">
                      Physical Activity
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="creativity-arts"
                      checked={watchedFocus.includes('creativity-arts')}
                      onCheckedChange={(checked) => handleFocusChange('creativity-arts', checked as boolean)}
                    />
                    <Label htmlFor="creativity-arts" className="font-normal cursor-pointer">
                      Creativity & Arts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="teamwork"
                      checked={watchedFocus.includes('teamwork')}
                      onCheckedChange={(checked) => handleFocusChange('teamwork', checked as boolean)}
                    />
                    <Label htmlFor="teamwork" className="font-normal cursor-pointer">
                      Teamwork & Leadership
                    </Label>
                  </div>
                </div>
                {errors.focus && (
                  <p className="text-destructive text-sm mt-1">{errors.focus.message}</p>
                )}
              </div>

              {/* Additional Services */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-forest-700">Additional Services</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="transport" {...register('transport')} />
                    <Label htmlFor="transport" className="font-normal">
                      Transport (Pick-up & Drop-off)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="meal" {...register('meal')} />
                    <Label htmlFor="meal" className="font-normal">
                      Meal Plan
                    </Label>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <Label htmlFor="allergies">Allergies or Special Requirements</Label>
                <Textarea
                  id="allergies"
                  {...register('allergies')}
                  placeholder="Please list any allergies, dietary restrictions, or special needs"
                  className="min-h-[80px]"
                />
                {errors.allergies && (
                  <p className="text-destructive text-sm mt-1">{errors.allergies.message}</p>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-forest-700">Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+254 700 000 000"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-2 mt-4">
                  <Checkbox
                    id="consent"
                    {...register('consent')}
                    className="mt-1"
                  />
                  <Label htmlFor="consent" className="text-sm leading-relaxed">
                    I consent to my child participating in the program and understand the activities involved *
                  </Label>
                </div>
                {errors.consent && (
                  <p className="text-destructive text-sm mt-1">{errors.consent.message}</p>
                )}
              </div>

              <RefundPolicyDialog />

                <Button 
                  type="submit" 
                  className="w-full md:w-auto px-8 py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </form>
          </CardContent>
        </Card>
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
                <span 
                  key={index} 
                  className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
                >
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

export default HomeschoolingForm;