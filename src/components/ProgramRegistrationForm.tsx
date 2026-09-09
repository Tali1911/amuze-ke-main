import React, { useState, useEffect } from 'react';
import { differenceInYears } from 'date-fns';
import SignUpBenefitsDialog from '@/components/SignUpBenefitsDialog';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { getAvailablePrograms, calculateProgramCost } from "@/services/calendarService";
import { addRegistration } from "@/services/dataService";
import { Registration, ChildRegistration } from '@/types/registration';
import { leadsService } from '@/services/leadsService';
import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarIcon, Download, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AutoFilledBadge from '@/components/ui/AutoFilledBadge';
import { ParticipationConsentDialog } from '@/components/forms/ParticipationConsentDialog';

// Define schemas for form validation
const childSchema = z.object({
  childName: z.string().min(1, "Child's name is required"),
  childAge: z.string().min(1, "Age is required"),
  timeSlot: z.enum(["morning", "afternoon", "fullDay", "weeklong"], {
    required_error: "Please select a time slot",
  }),
  programId: z.string().min(1, "Program selection is required"),
  ageGroup: z.string().optional(),
});

const formSchema = z.object({
  parentName: z.string().min(1, "Parent name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  children: z.array(childSchema).min(1, "At least one child must be registered"),
  paymentMethod: z.enum(["card", "mpesa"], {
    required_error: "Please select a payment method",
  }),
  participationConsent: z.literal(true, { errorMap: () => ({ message: 'You must read and accept the participation form' }) }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramRegistrationFormProps {
  programId?: string;
}

const ProgramRegistrationForm: React.FC<ProgramRegistrationFormProps> = ({ programId: initialProgramId }) => {
  const navigate = useNavigate();
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  // Client auth for auto-fill
  const { isSignedIn, isLoading: authLoading, profile: clientProfile } = useClientAuth();
  const [showBenefitsDialog, setShowBenefitsDialog] = useState(false);

  // Show benefits dialog for non-signed-in users after a delay
  useEffect(() => {
    if (authLoading) return;
    if (isSignedIn) { setShowBenefitsDialog(false); return; }
    if (!sessionStorage.getItem('benefits_dialog_dismissed')) {
      const timer = setTimeout(() => setShowBenefitsDialog(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, authLoading]);
  useEffect(() => {
    const fetchPrograms = async () => {
      // Load available programs from calendar events
      const programs = await getAvailablePrograms();
      setAvailablePrograms(programs);
      
      // If an initial program ID is provided, set it as the selected program
      if (initialProgramId) {
        const program = programs.find(p => p.id === initialProgramId);
        if (program) {
          setSelectedProgram(program);
        }
      }
    };
    fetchPrograms();
  }, [initialProgramId]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentName: "",
      email: "",
      phone: "",
      children: [{ 
        childName: "", 
        childAge: "", 
        timeSlot: "fullDay",
        programId: initialProgramId || "",
        ageGroup: ""
      }],
      paymentMethod: "mpesa",
    },
  });
  
  // Watch for form value changes
  const watchChildren = form.watch("children");
  
  // Use field array from react-hook-form for the children array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "children",
  });

  // Track which fields were auto-filled
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // Auto-fill from client profile (Google sign-in)
  useEffect(() => {
    if (isSignedIn && clientProfile) {
      const filled = new Set<string>();
      if (clientProfile.full_name) { form.setValue('parentName', clientProfile.full_name); filled.add('parentName'); }
      if (clientProfile.email) { form.setValue('email', clientProfile.email); filled.add('email'); }
      if (clientProfile.phone) { form.setValue('phone', clientProfile.phone); filled.add('phone'); }

      // Auto-fill children from profile
      if (Array.isArray(clientProfile.children) && clientProfile.children.length > 0) {
        const profileChildren = clientProfile.children
          .filter((c: any) => c.name)
          .map((c: any) => {
            const age = c.dateOfBirth
              ? String(differenceInYears(new Date(), new Date(c.dateOfBirth)))
              : '';
            return {
              childName: c.name || '',
              childAge: age,
              timeSlot: 'fullDay' as const,
              programId: initialProgramId || '',
              ageGroup: '',
            };
          });
        if (profileChildren.length > 0) {
          form.setValue('children', profileChildren);
          filled.add('children');
        }
      }
      if (filled.size > 0) setAutoFilledFields(filled);
    }
  }, [isSignedIn, clientProfile, form, initialProgramId]);

  // Calculate total amount based on selected program and time slots
  const calculateTotal = async (formData: FormValues) => {
    let total = 0;
    for (const child of formData.children) {
      // Calculate cost based on program and time slot
      const cost = await calculateProgramCost(child.programId, child.timeSlot as any);
      total += cost;
    }
    return total;
  };
  
  // Update total cost when form values change
  useEffect(() => {
    const updateTotal = async () => {
      const currentTotal = await calculateTotal(form.getValues());
      setTotalCost(currentTotal);
    };
    updateTotal();
  }, [watchChildren]);

  const onSubmit = async (data: FormValues) => {
    try {
      const totalAmount = await calculateTotal(data);
      
      const children: ChildRegistration[] = await Promise.all(data.children.map(async child => {
        // Get the program for this child
        const selectedProgram = availablePrograms.find(p => p.id === child.programId);
        
        // Calculate amount based on program and time slot
        const amount = await calculateProgramCost(child.programId, child.timeSlot as any);
        
        return {
          childName: child.childName,
          childAge: child.childAge,
          timeSlot: child.timeSlot,
          programId: child.programId,
          programName: selectedProgram ? selectedProgram.title : '',
          ageGroup: child.ageGroup,
          amount
        };
      }));
      
      // Use the first child's programId as the main programId for the registration
      const registration: Omit<Registration, 'id' | 'createdAt'> = {
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        programId: children.length > 0 ? children[0].programId : '',
        children,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending'
      };
      
      // Save to localStorage for backward compatibility
      addRegistration(registration);
      
      // Create lead in Supabase for marketing tracking
      const firstProgram = availablePrograms.find(p => p.id === children[0]?.programId);
      await leadsService.createLead({
        full_name: data.parentName,
        email: data.email,
        phone: data.phone,
        program_type: 'program_registration',
        program_name: firstProgram?.title || 'Unknown Program',
        form_data: {
          children,
          totalAmount,
          paymentMethod: data.paymentMethod,
          registrationDate: new Date().toISOString(),
          source: 'website_registration_form'
        }
      });
      
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
              dateOfBirth: '',
              specialNeeds: '',
            }));
          if (newChildren.length > 0) {
            await clientProfileService.updateProfile(clientProfile.auth_user_id, {
              children: [...existingChildren, ...newChildren],
            });
            sonnerToast.success('Children saved to your profile', {
              description: "Next time you register, their details will be auto-filled.",
            });
          }
        } catch (e) {
          console.error('Failed to save children to profile:', e);
        }
      }

      toast({
        title: "Registration Successful",
        description: "Your registration has been submitted successfully.",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    }
  };

  // Add child field
  const addChildField = () => {
    append({ 
      childName: "", 
      childAge: "", 
      timeSlot: "fullDay",
      programId: "",
      ageGroup: ""
    });
  };

  // Remove child field
  const removeChildField = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };
  
  // Handle program selection for a specific child
  const handleProgramSelect = (programId: string, index: number) => {
    const program = availablePrograms.find(p => p.id === programId);
    
    // If selecting a camp program with age groups, reset the age group field
    if (program?.eventType === 'camp' && program?.ageGroups?.length > 0) {
      const currentValues = form.getValues();
      currentValues.children[index].ageGroup = '';
      form.reset(currentValues);
    }
    
    // Update the selected program state if it's the first child
    if (index === 0) {
      setSelectedProgram(program);
    }
  };

  // Download program brochure if available
  const downloadProgramInfo = (programId: string) => {
    const program = availablePrograms.find(p => p.id === programId);
    if (program && program.programPdf) {
      const link = document.createElement('a');
      link.href = program.programPdf;
      link.download = `${program.title.replace(/\s+/g, '_')}_Brochure.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "Information",
        description: "No downloadable brochure is available for this program.",
      });
    }
  };

  if (availablePrograms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Program Registration</CardTitle>
            <CardDescription>
              There are currently no available programs for registration. Please check back later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Program Registration</CardTitle>
          <CardDescription>
            Complete this form to register your child/children for our programs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <SignUpBenefitsDialog open={showBenefitsDialog} onOpenChange={setShowBenefitsDialog} />
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {!isSignedIn && !authLoading && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Sign in with Google</span> to auto-fill your details and save time
                  </p>
                  <GoogleSignInButton />
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Parent/Guardian Information</h3>
                
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name{autoFilledFields.has('parentName') && <AutoFilledBadge />}</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address{autoFilledFields.has('email') && <AutoFilledBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number{autoFilledFields.has('phone') && <AutoFilledBadge />}</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Children Information{autoFilledFields.has('children') && <AutoFilledBadge />}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildField}
                  >
                    Add Another Child
                  </Button>
                </div>
                
                {fields.map((field, index) => {
                  // Get current values
                  const currentValues = form.getValues();
                  const currentChild = currentValues.children[index];
                  const selectedProgramId = currentChild?.programId;
                  const selectedProgram = availablePrograms.find(p => p.id === selectedProgramId);
                  
                  return (
                    <div key={field.id} className="p-4 border rounded-md bg-slate-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Child {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChildField(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name={`children.${index}.childName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Child's Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Child's full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`children.${index}.childAge`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Child's Age</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 8" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`children.${index}.programId`}
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Select Program</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleProgramSelect(value, index);
                              }}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="flex items-center justify-between">
                                  <SelectValue placeholder="Select a program" />
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="ghost" 
                                      size="icon"
                                      className="h-8 w-8 p-0 ml-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadProgramInfo(field.value);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availablePrograms.map(program => (
                                  <SelectItem key={program.id} value={program.id}>
                                    <div className="flex flex-col">
                                      <span>{program.title}</span>
                                      <span className="text-xs text-gray-500">
                                        {program.date} {program.isWeeklong && "(Week-long)"}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {selectedProgram?.ageGroups && selectedProgram.ageGroups.length > 0 && (
                        <FormField
                          control={form.control}
                          name={`children.${index}.ageGroup`}
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Age Group</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedProgram.ageGroups.map((group: any, i: number) => (
                                    <SelectItem key={i} value={group.name}>
                                      {group.name} ({group.ageRange})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      <FormField
                        control={form.control}
                        name={`children.${index}.timeSlot`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Slot</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="morning">
                                  Half Day (Morning) - {selectedProgram?.pricing?.morning || 1500} KES
                                </SelectItem>
                                <SelectItem value="afternoon">
                                  Half Day (Afternoon) - {selectedProgram?.pricing?.afternoon || 1500} KES
                                </SelectItem>
                                <SelectItem value="fullDay">
                                  Full Day - {selectedProgram?.pricing?.fullDay || 2500} KES
                                </SelectItem>
                                {selectedProgram?.isWeeklong && (
                                  <SelectItem value="weeklong">
                                    Full Week - {selectedProgram?.pricing?.weeklong || 12000} KES
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Payment Information</h3>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Total Cost</AlertTitle>
                  <AlertDescription>
                    The total cost for this registration is <strong>{totalCost} KES</strong>
                  </AlertDescription>
                </Alert>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="participationConsent"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ParticipationConsentDialog
                        checked={field.value === true}
                        onCheckedChange={(v) => field.onChange(v ? true : undefined)}
                        error={form.formState.errors.participationConsent?.message}
                        variant="child"
                        eventName="Program Registration"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Complete Registration
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramRegistrationForm;
