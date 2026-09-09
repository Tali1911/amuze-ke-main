import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface TeamBuildingPackage {
  id: string;
  title: string;
  description: string;
  features: string[];
  image?: string;
}

export interface SampleFlowItem {
  title: string;
  description: string;
}

export interface TeamBuildingPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredMediaUrl: string;
  mediaType: 'photo' | 'video';
  videoThumbnail?: string;
  packages: TeamBuildingPackage[];
  sampleFlow: SampleFlowItem[];
  formConfig: {
    formTitle: string;
    ctaText: string;
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
  keywords: string;
}

const defaultPackages: TeamBuildingPackage[] = [
  {
    id: 'adventure',
    title: 'Adventure Party',
    description: 'Arrival Icebreaker • Obstacle Challenge • Water Game • Treasure Hunt • Cake & Awards • Closing Circle',
    features: ['Team Communication', 'Problem-Solving', '90% Fun + 10% Reflection']
  },
  {
    id: 'bushcraft',
    title: 'Bushcraft Bash',
    description: 'Fire-making challenges, shelter building, navigation skills, and outdoor cooking activities.',
    features: ['Survival Skills', 'Leadership', 'Outdoor Confidence']
  },
  {
    id: 'nature-carnival',
    title: 'Nature Carnival',
    description: 'Nature games, eco-friendly activities, wildlife exploration, and environmental challenges.',
    features: ['Environmental Awareness', 'Teamwork', 'Creative Problem-Solving']
  },
  {
    id: 'family-corporate',
    title: 'Family/Corporate Build',
    description: 'Customized team building experiences for families and corporate groups with measurable outcomes.',
    features: ['Custom Activities', 'Team Bonding', 'Measurable Results']
  }
];

const defaultSampleFlow: SampleFlowItem[] = [
  { title: 'Arrival Icebreaker', description: 'Welcome activities and team formation' },
  { title: 'Obstacle Challenge', description: 'Physical and mental challenges' },
  { title: 'Water Game', description: 'Fun water-based team activities' },
  { title: 'Treasure Hunt', description: 'Problem-solving adventure' },
  { title: 'Cake & Awards', description: 'Celebration and recognition' },
  { title: 'Closing Circle', description: 'Reflection and key takeaways' }
];

const defaultConfig: TeamBuildingPageConfig = {
  title: 'Team Building',
  subtitle: '(All Ages)',
  description: 'Create safe, fun, memory-filled experiences with measurable outcomes. Each package is 90% fun + 10% reflection, focusing on team communication and problem-solving.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  packages: defaultPackages,
  sampleFlow: defaultSampleFlow,
  formConfig: {
    formTitle: 'Book Your Experience',
    ctaText: 'Book Experience',
    fields: {
      occasion: { label: 'Occasion', placeholder: 'Select occasion' },
      adultsNumber: { label: 'Number of Adults', placeholder: 'e.g., 10' },
      childrenNumber: { label: 'Number of Children', placeholder: 'e.g., 5' },
      ageRange: { label: 'Age Range', placeholder: 'Select age range' },
      package: { label: 'Package', placeholder: 'Select a package' },
      eventDate: { label: 'Event Date', placeholder: 'Select date' },
      location: { label: 'Location', placeholder: 'Select location' },
      decor: { label: 'Decoration Package' },
      catering: { label: 'Catering Services' },
      email: { label: 'Email Address', placeholder: 'your@email.com' },
      phone: { label: 'Phone Number', placeholder: '+254 700 000 000' }
    },
    buttons: {
      submit: 'Book Experience',
      back: 'Back to Home'
    },
    messages: {
      successMessage: 'Booking submitted successfully! We\'ll contact you shortly.',
      errorMessage: 'Failed to submit booking. Please try again.',
      loadingMessage: 'Submitting...'
    }
  },
  metaTitle: 'Team Building Programs | Amuse Kenya Corporate Events',
  metaDescription: 'Strengthen your team with nature-based team building activities at Karura Forest. Customized corporate programs focusing on collaboration, communication, and leadership development.',
  keywords: 'team building Kenya, corporate events, team activities, leadership training, corporate retreats Nairobi'
};

export const useTeamBuildingPageConfig = () => {
  const [config, setConfig] = useState<TeamBuildingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load from experience_page content type
      const content = await cmsService.getContentBySlug('team-building-page', 'experience_page');
      
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading team building config:', err);
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
