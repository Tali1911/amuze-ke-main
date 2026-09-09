import React from 'react';
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
import { toast } from 'sonner';
import DatePickerField from './DatePickerField';
import { ConsentDialog } from './ConsentDialog';
import { RefundPolicyDialog } from './RefundPolicyDialog';
import { kenyanExperiencesService } from '@/services/programRegistrationService';
import { performSecurityChecks, recordSubmission } from '@/services/formSecurityService';
import { leadsService } from '@/services/leadsService';

const kenyanExperiencesSchema = z.object({
  parentLeader: z.string().min(1, 'Parent/Leader name is required').max(100),
  participantNames: z.string().min(1, 'Participant names and ages are required').max(500),
  ageRange: z.enum(['4-6', '7-10', '11-13', '14-17', '18+']),
  circuit: z.enum(['mt-kenya', 'coast', 'mara', 'chalbi', 'western']),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  location: z.enum(['karura-gate-f', 'karura-gate-a', 'tigoni', 'ngong']),
  transport: z.boolean().default(false),
  specialNeeds: z.string().max(500).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  consent: z.boolean().default(false)
});

type KenyanExperiencesFormData = z.infer<typeof kenyanExperiencesSchema>;

const KenyanExperiencesForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<KenyanExperiencesFormData>({
    resolver: zodResolver(kenyanExperiencesSchema),
    defaultValues: {
      transport: false,
      consent: false
    }
  });

  const onSubmit = async (data: KenyanExperiencesFormData) => {
    // Security checks: prevent duplicates and rate limiting
    const securityCheck = await performSecurityChecks(data, 'kenyan-experiences');
    if (!securityCheck.allowed) {
      toast.error(securityCheck.message || 'Submission blocked. Please try again later.');
      return;
    }
    
    try {
      const registration = await kenyanExperiencesService.create({
        parentLeader: data.parentLeader,
        participants: data.participantNames,
        ageRange: data.ageRange,
        circuit: data.circuit,
        preferredDates: [data.startDate.toISOString(), data.endDate.toISOString()],
        location: data.location,
        transport: data.transport,
        specialMedicalNeeds: data.specialNeeds || null,
        email: data.email,
        phone: data.phone,
        consent: data.consent,
      });

      // Create lead for marketing tracking
      await leadsService.createLead({
        full_name: data.parentLeader,
        email: data.email,
        phone: data.phone,
        program_type: 'kenyan-experiences',
        program_name: data.circuit,
        form_data: data,
        source: 'website_registration'
      });

      // Send confirmation email via Resend
      const { supabase } = await import('@/integrations/supabase/client');
      const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: {
          email: data.email,
          programType: 'kenyan-experiences',
          registrationDetails: {
            parentLeader: data.parentLeader,
            participants: data.participantNames,
            circuit: data.circuit,
            ageRange: data.ageRange,
            startDate: data.startDate,
            endDate: data.endDate,
            location: data.location,
            registrationId: registration && 'id' in registration ? registration.id : undefined
          }
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        throw emailError;
      }

      toast.success('Registration submitted successfully! Check your email for confirmation.');
      
      // Record successful submission for duplicate prevention
      await recordSubmission(data, 'kenyan-experiences');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to submit registration. Please try again.');
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-forest-800">5-Day Kenyan Experience Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="parentLeader">Parent/Leader Name *</Label>
            <Input
              id="parentLeader"
              {...register('parentLeader')}
              className="mt-1"
            />
            {errors.parentLeader && (
              <p className="text-red-500 text-sm mt-1">{errors.parentLeader.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="participantNames">Child/Participant Name(s) *</Label>
            <Textarea
              id="participantNames"
              {...register('participantNames')}
              placeholder="e.g., John, Mary, Group of 15 children"
              className="mt-1"
            />
            {errors.participantNames && (
              <p className="text-red-500 text-sm mt-1">{errors.participantNames.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ageRange">Age Range *</Label>
            <Select onValueChange={(value) => setValue('ageRange', value as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4-6">4-6 years</SelectItem>
                <SelectItem value="7-10">7-10 years</SelectItem>
                <SelectItem value="11-13">11-13 years</SelectItem>
                <SelectItem value="14-17">14-17 years</SelectItem>
                <SelectItem value="18+">18+ years</SelectItem>
              </SelectContent>
            </Select>
            {errors.ageRange && (
              <p className="text-red-500 text-sm mt-1">{errors.ageRange.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="circuit">Circuit *</Label>
            <Select onValueChange={(value) => setValue('circuit', value as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a circuit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mt-kenya">Mount Kenya</SelectItem>
                <SelectItem value="coast">Swahili Coast</SelectItem>
                <SelectItem value="mara">Mara</SelectItem>
                <SelectItem value="chalbi">Rift Valley (Chalbi)</SelectItem>
                <SelectItem value="western">Western Kenya</SelectItem>
              </SelectContent>
            </Select>
            {errors.circuit && (
              <p className="text-red-500 text-sm mt-1">{errors.circuit.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  label="Start Date"
                  placeholder="Select start date"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.startDate?.message}
                  required
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field }) => (
                <DatePickerField
                  label="End Date"
                  placeholder="Select end date"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.endDate?.message}
                  required
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="location">Meeting Location *</Label>
            <Select onValueChange={(value) => setValue('location', value as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select meeting location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="karura-gate-f">Karura Gate F</SelectItem>
                <SelectItem value="karura-gate-a">Karura Gate A</SelectItem>
                <SelectItem value="tigoni">Tigoni</SelectItem>
                <SelectItem value="ngong">Ngong</SelectItem>
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="transport"
              {...register('transport')}
            />
            <Label htmlFor="transport" className="text-sm">Transport Required</Label>
          </div>

          <div>
            <Label htmlFor="specialNeeds">Special/Medical Needs (Optional)</Label>
            <Textarea
              id="specialNeeds"
              {...register('specialNeeds')}
              placeholder="Please describe any special needs, medical conditions, or dietary restrictions"
              className="mt-1"
            />
            {errors.specialNeeds && (
              <p className="text-red-500 text-sm mt-1">{errors.specialNeeds.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                {...register('phone')}
                className="mt-1"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <ConsentDialog
                checked={field.value}
                onCheckedChange={field.onChange}
                error={errors.consent?.message}
              />
            )}
          />

          <RefundPolicyDialog />

          <Button
            type="submit" 
            className="w-full bg-forest-600 hover:bg-forest-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default KenyanExperiencesForm;