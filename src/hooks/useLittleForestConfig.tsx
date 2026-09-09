import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';
import { getCalendarDatesForCampType } from '@/services/calendarService';

export interface ScheduleItem {
  time: string;
  activity: string;
  skills: string;
}

export interface SpecialFeature {
  title: string;
  description: string;
}

export interface LittleForestFormConfig {
  pricing: {
    sessionRate: number;
    currency: string;
  };
  fields: {
    parentName: { label: string; placeholder: string; required: boolean };
    childName: { label: string; placeholder: string; required: boolean };
    childAge: { label: string; placeholder: string; required: boolean };
    emergencyContact: { label: string; placeholder: string; required: boolean };
    email: { label: string; placeholder: string; required: boolean };
    phone: { label: string; placeholder: string; required: boolean };
    nannyOption: { label: string };
  };
  buttons: {
    registerOnly: string;
    registerAndPay: string;
    addChild: string;
    removeChild: string;
  };
  messages: {
    registrationSuccess: string;
    registrationError: string;
    chooseOption: string;
    paymentComingSoon: string;
  };
  availableDates: string[];
  locations?: string[];
  ageOptions: Array<{
    value: string;
    label: string;
  }>;
}

export interface LittleForestPageConfig {
  // Page Content
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  mediaType: 'photo' | 'video';
  
  // Schedule
  schedule: ScheduleItem[];
  
  // Special Features
  specialFeatures: SpecialFeature[];
  
  // Form Configuration
  formConfig: LittleForestFormConfig;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
}

export const defaultFormConfig: LittleForestFormConfig = {
  pricing: {
    sessionRate: 1500,
    currency: 'KES'
  },
  fields: {
    parentName: { label: 'Parent/Guardian Name', placeholder: 'Enter your full name', required: true },
    childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
    childAge: { label: 'Age Range', placeholder: 'Select age range', required: true },
    emergencyContact: { label: 'Emergency Contact Name & Phone', placeholder: 'Enter emergency contact details', required: true },
    email: { label: 'Email Address', placeholder: 'your.email@example.com', required: true },
    phone: { label: 'Phone Number', placeholder: '+254 XXX XXX XXX', required: true },
    nannyOption: { label: 'Is the child accompanied with a Nanny? (Optional)' }
  },
  buttons: {
    registerOnly: 'Register Only',
    registerAndPay: 'Register & Pay Now',
    addChild: 'Add Another Child',
    removeChild: 'Remove'
  },
  messages: {
    registrationSuccess: "Registration submitted successfully! We'll contact you shortly.",
    registrationError: 'Failed to submit registration. Please try again.',
    chooseOption: 'Choose your registration option:',
    paymentComingSoon: 'Payment integration coming soon. Both options will complete your registration.'
  },
  availableDates: [
    '2025-06-02',
    '2025-06-06',
    '2025-06-09',
    '2025-06-13',
    '2025-06-16',
    '2025-06-20'
  ],
  locations: ['Kurura Gate F', 'Ngong Sanctuary'],
  ageOptions: [
    { value: '1-2', label: '1-2 years' },
    { value: '2-3', label: '2-3 years' },
    { value: '3-below', label: '3 years and below' }
  ]
};

export const defaultPageConfig: LittleForestPageConfig = {
  title: 'Little Forest Explorers',
  subtitle: '(Ages 3 & Below)',
  description: 'Safe, playful discovery for our youngest adventurers. Nature play, sensory exploration, and simple challenges that build curiosity, movement skills, and social interaction.',
  featuredImage: '',
  mediaType: 'photo',
  schedule: [
    { time: '10:00', activity: 'Welcome Circle & Warm-Up Songs', skills: 'Social Skills, Language' },
    { time: '10:20', activity: 'Sensory Nature Exploration', skills: 'Sensory Development, Motor Skills' },
    { time: '10:45', activity: 'Swahili Story & Rhymes', skills: 'Language, Listening' },
    { time: '11:10', activity: 'Creative Play & Movement', skills: 'Motor Skills, Creativity' },
    { time: '11:40', activity: 'Snack Time & Goodbye Songs', skills: 'Routine, Transition' }
  ],
  specialFeatures: [
    { title: 'Nature Play', description: 'Sensory-rich outdoor experiences' },
    { title: 'Movement', description: 'Activities for physical growth and coordination' },
    { title: 'Swahili Immersion', description: 'Early language through songs and stories' },
    { title: 'Nurturing Environment', description: 'Safe space for early childhood development' }
  ],
  formConfig: defaultFormConfig,
  metaTitle: 'Little Forest Explorers | Amuse Kenya',
  metaDescription: 'Safe, playful discovery for children aged 3 and below. Nature play, sensory exploration at Karura Forest.'
};

// Legacy export for backwards compatibility
export const defaultLittleForestConfig = defaultFormConfig;

export const useLittleForestConfig = () => {
  const [config, setConfig] = useState<LittleForestFormConfig>(defaultFormConfig);
  const [pageConfig, setPageConfig] = useState<LittleForestPageConfig>(defaultPageConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await cmsService.getContentBySlug('little-forest-page', 'experience_page');
      
      if (data?.metadata?.pageConfig) {
        const cmsPageConfig = data.metadata.pageConfig;
        
        // Merge page config with defaults
        // Get dates from calendar (primary source)
        const calendarDates = await getCalendarDatesForCampType('little-forest');
        const cmsAvailableDates = cmsPageConfig.formConfig?.availableDates || defaultFormConfig.availableDates;
        
        const mergedPageConfig: LittleForestPageConfig = {
          ...defaultPageConfig,
          ...cmsPageConfig,
          schedule: cmsPageConfig.schedule || defaultPageConfig.schedule,
          specialFeatures: cmsPageConfig.specialFeatures || defaultPageConfig.specialFeatures,
          formConfig: {
            ...defaultFormConfig,
            ...cmsPageConfig.formConfig,
            pricing: {
              ...defaultFormConfig.pricing,
              ...cmsPageConfig.formConfig?.pricing
            },
            availableDates: calendarDates.length > 0 ? calendarDates : cmsAvailableDates,
            ageOptions: cmsPageConfig.formConfig?.ageOptions || defaultFormConfig.ageOptions
          }
        };
        
        setPageConfig(mergedPageConfig);
        setConfig(mergedPageConfig.formConfig);
      } else {
        // Try legacy format (little-forest-form)
        const calendarDates = await getCalendarDatesForCampType('little-forest');
        const legacyData = await cmsService.getContentBySlug('little-forest-form');
        if (legacyData?.metadata?.formConfig) {
          const cmsConfig = legacyData.metadata.formConfig;
          const mergedConfig: LittleForestFormConfig = {
            ...defaultFormConfig,
            ...cmsConfig,
            pricing: {
              ...defaultFormConfig.pricing,
              ...cmsConfig.pricing
            },
            availableDates: calendarDates.length > 0 ? calendarDates : (cmsConfig.availableDates || defaultFormConfig.availableDates),
            ageOptions: cmsConfig.ageOptions || defaultFormConfig.ageOptions
          };
          setConfig(mergedConfig);
          setPageConfig({ ...defaultPageConfig, formConfig: mergedConfig });
        } else {
          const fallbackConfig = calendarDates.length > 0 
            ? { ...defaultFormConfig, availableDates: calendarDates }
            : defaultFormConfig;
          setConfig(fallbackConfig);
          setPageConfig({ ...defaultPageConfig, formConfig: fallbackConfig });
        }
      }
    } catch (err) {
      console.error('Error fetching Little Forest config:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch config');
      setConfig(defaultFormConfig);
      setPageConfig(defaultPageConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    
    const handleCmsUpdate = () => loadConfig();
    window.addEventListener('cms-content-updated', handleCmsUpdate);
    
    return () => window.removeEventListener('cms-content-updated', handleCmsUpdate);
  }, [loadConfig]);

  return { config, pageConfig, isLoading, error, refresh: loadConfig };
};
