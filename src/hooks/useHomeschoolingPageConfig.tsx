import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface HomeschoolingPackage {
  id: string;
  name: string;
  frequency: string;
  price: string;
  description: string;
  features: string[];
}

export interface HomeschoolingPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  packages: HomeschoolingPackage[];
  activities: string[];
  whatsIncluded: string[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

const defaultPackages: HomeschoolingPackage[] = [
  {
    id: 'explorer',
    name: 'Explorer Package',
    frequency: '1 session/week',
    price: 'KES 8,000/month',
    description: 'Perfect for families wanting regular outdoor learning.',
    features: ['Weekly 3-hour sessions', 'Nature journaling', 'Basic bushcraft', 'Group activities']
  },
  {
    id: 'adventurer',
    name: 'Adventurer Package',
    frequency: '2 sessions/week',
    price: 'KES 14,000/month',
    description: 'Deeper immersion in nature-based education.',
    features: ['Twice weekly sessions', 'Advanced skills', 'Personal mentoring', 'Portfolio building']
  },
  {
    id: 'naturalist',
    name: 'Naturalist Package',
    frequency: '3 sessions/week',
    price: 'KES 18,000/month',
    description: 'Comprehensive outdoor curriculum integration.',
    features: ['Three sessions weekly', 'Full curriculum support', 'Assessment reports', 'Special excursions']
  }
];

const defaultConfig: HomeschoolingPageConfig = {
  title: 'Homeschooling Programs',
  subtitle: '(Ages 4-16 years)',
  description: 'Enhance your homeschool curriculum with structured outdoor learning. Our programs complement academic studies with hands-on nature experiences.',
  featuredImage: '',
  packages: defaultPackages,
  activities: [
    'Nature Skills & Bushcraft',
    'Wildlife & Ecology',
    'Adventure Activities',
    'Creative Arts in Nature',
    'Science Explorations',
    'Physical Education Outdoors'
  ],
  whatsIncluded: [
    'Qualified forest school facilitators',
    'All materials and equipment',
    'Nature journals and resources',
    'Progress reports and portfolios',
    'Insurance coverage',
    'Healthy outdoor snacks'
  ],
  formConfig: {
    fields: {
      parentName: { label: 'Parent/Guardian Name', placeholder: 'Your full name' },
      childName: { label: 'Child\'s Name', placeholder: 'Child\'s name' },
      childAge: { label: 'Child\'s Age', placeholder: 'Age in years' },
      package: { label: 'Preferred Package', placeholder: 'Select a package' },
      focusAreas: { label: 'Focus Areas', helpText: 'Select areas of interest' },
      startDate: { label: 'Preferred Start Date', placeholder: 'When would you like to begin?' },
      email: { label: 'Email Address', placeholder: 'Your email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: {
      submit: 'Enroll Now',
      back: 'Back to Programs'
    },
    messages: {
      successMessage: 'Enrollment submitted! We\'ll contact you to confirm your spot.',
      errorMessage: 'Enrollment failed. Please try again.',
      loadingMessage: 'Processing enrollment...'
    }
  },
  metaTitle: 'Homeschooling Programs | Amuse Kenya Outdoor Education',
  metaDescription: 'Nature-based homeschool programs in Nairobi. Weekly outdoor learning sessions for children ages 4-16.'
};

export const useHomeschoolingPageConfig = () => {
  const [config, setConfig] = useState<HomeschoolingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const content = await cmsService.getContentBySlug('homeschooling-page', 'experience_page');
      
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading homeschooling config:', err);
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
