import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface SchoolAdventuresProgram {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  description: string;
  features: string[];
  examples: string[];
}

export interface SchoolAdventuresPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  programs: SchoolAdventuresProgram[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

const defaultPrograms: SchoolAdventuresProgram[] = [
  {
    id: 'forest-days',
    title: 'Forest Days',
    tagline: 'Nature-based learning',
    icon: 'Trees',
    description: 'Regular forest school sessions that bring classroom lessons to life in a natural setting.',
    features: ['Nature walks', 'Outdoor classrooms', 'Wildlife observation', 'Plant identification'],
    examples: ['Weekly nature club', 'Science field studies', 'Art in nature']
  },
  {
    id: 'field-trips',
    title: 'Field Trips',
    tagline: 'Educational adventures',
    icon: 'MapPin',
    description: 'Day excursions to various natural and cultural sites across Kenya.',
    features: ['Guided tours', 'Educational activities', 'Transport included', 'Curriculum aligned'],
    examples: ['National parks', 'Museums', 'Cultural centers']
  },
  {
    id: 'industrial-visits',
    title: 'Industrial Visits',
    tagline: 'Real-world learning',
    icon: 'Building2',
    description: 'Visits to farms, factories, and businesses to understand how things work.',
    features: ['Factory tours', 'Farm visits', 'Career exposure', 'Interactive learning'],
    examples: ['Dairy farms', 'Manufacturing plants', 'Tech companies']
  },
  {
    id: 'sleep-away-camps',
    title: 'Sleep-Away Camps',
    tagline: 'Overnight adventures',
    icon: 'Tent',
    description: 'Multi-day camping experiences with outdoor skills, team building, and adventure.',
    features: ['Overnight camping', 'Adventure activities', 'Team challenges', 'Campfire programs'],
    examples: ['2-3 day camps', 'End of term camps', 'Leadership retreats']
  }
];

const defaultConfig: SchoolAdventuresPageConfig = {
  title: 'School Adventures',
  subtitle: '(Ages 6-17 years)',
  description: 'Transform your school\'s outdoor learning with our comprehensive adventure programs. From forest days to overnight camps, we bring curriculum-aligned experiences to life.',
  featuredImage: '',
  programs: defaultPrograms,
  formConfig: {
    fields: {
      schoolName: { label: 'School Name', placeholder: 'Enter your school name' },
      numberOfStudents: { label: 'Number of Students', placeholder: 'Estimated number' },
      ageRange: { label: 'Age Range', placeholder: 'e.g., 8-12 years' },
      programType: { label: 'Program Type', placeholder: 'Select a program' },
      preferredDates: { label: 'Preferred Dates', placeholder: 'Select dates' },
      contactPerson: { label: 'Contact Person', placeholder: 'Name of coordinator' },
      email: { label: 'Email Address', placeholder: 'School or coordinator email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: {
      submit: 'Submit Enquiry',
      back: 'Back to Home'
    },
    messages: {
      successMessage: 'Thank you for your enquiry! We\'ll contact you within 24 hours.',
      errorMessage: 'Failed to submit. Please try again or contact us directly.',
      loadingMessage: 'Submitting your enquiry...'
    }
  },
  metaTitle: 'School Adventures | Amuse Kenya Outdoor Education',
  metaDescription: 'Curriculum-aligned outdoor education programs for schools. Forest days, field trips, industrial visits, and overnight camps.'
};

export const useSchoolAdventuresPageConfig = () => {
  const [config, setConfig] = useState<SchoolAdventuresPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const content = await cmsService.getContentBySlug('school-adventures-page', 'experience_page');
      
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading school adventures config:', err);
      setError('Failed to load configuration');
      setConfig(defaultConfig);
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

  return { config, isLoading, error, refresh: loadConfig };
};
