import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface KenyanExperience {
  id: string;
  title: string;
  description: string;
  duration: string;
  ageGroup: string;
  highlights: string[];
  image?: string;
}

export interface KenyanExperiencesPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredMediaUrl: string;
  mediaType: 'photo' | 'video';
  videoThumbnail?: string;
  experiences: KenyanExperience[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

const defaultExperiences: KenyanExperience[] = [
  {
    id: 'safari-adventure',
    title: 'Safari Adventure',
    description: 'Experience Kenya\'s incredible wildlife in their natural habitat.',
    duration: '3-5 days',
    ageGroup: '8+ years',
    highlights: ['Game drives', 'Wildlife photography', 'Night safaris', 'Conservation education']
  },
  {
    id: 'cultural-immersion',
    title: 'Cultural Immersion',
    description: 'Connect with local communities and learn about Kenyan traditions.',
    duration: '2-3 days',
    ageGroup: 'All ages',
    highlights: ['Village visits', 'Traditional crafts', 'Local cuisine', 'Storytelling sessions']
  },
  {
    id: 'nature-exploration',
    title: 'Nature Exploration',
    description: 'Discover Kenya\'s diverse ecosystems from forests to mountains.',
    duration: '1-4 days',
    ageGroup: '6+ years',
    highlights: ['Hiking trails', 'Bird watching', 'Plant identification', 'Geology walks']
  },
  {
    id: 'marine-discovery',
    title: 'Marine Discovery',
    description: 'Explore Kenya\'s stunning coastal ecosystems and marine life.',
    duration: '2-4 days',
    ageGroup: '8+ years',
    highlights: ['Snorkeling', 'Marine park visits', 'Beach ecology', 'Dolphin watching']
  }
];

const defaultConfig: KenyanExperiencesPageConfig = {
  title: 'Kenyan Experiences',
  subtitle: 'Discover the Magic of Kenya',
  description: 'Multi-day adventures that showcase the best of Kenya\'s wildlife, culture, and natural wonders. Perfect for families, school groups, and corporate teams.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  experiences: defaultExperiences,
  formConfig: {
    fields: {
      leaderName: { label: 'Group Leader Name', placeholder: 'Name of trip organizer' },
      groupSize: { label: 'Group Size', placeholder: 'Number of participants' },
      experience: { label: 'Experience Type', placeholder: 'Select an experience' },
      preferredDates: { label: 'Preferred Dates', placeholder: 'When would you like to travel?' },
      specialRequirements: { label: 'Special Requirements', placeholder: 'Any dietary, medical, or accessibility needs' },
      email: { label: 'Email Address', placeholder: 'Your email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: {
      submit: 'Request Quote',
      back: 'Back to Programs'
    },
    messages: {
      successMessage: 'Thank you! We\'ll send you a customized quote within 48 hours.',
      errorMessage: 'Failed to submit request. Please try again.',
      loadingMessage: 'Sending your request...'
    }
  },
  metaTitle: 'Kenyan Experiences | Multi-Day Adventures | Amuse Kenya',
  metaDescription: 'Multi-day safaris, cultural immersions, and nature explorations across Kenya. Family-friendly adventures for all ages.'
};

export const useKenyanExperiencesPageConfig = () => {
  const [config, setConfig] = useState<KenyanExperiencesPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load from experience_page first (new unified config)
      let content = await cmsService.getContentBySlug('kenyan-experiences-page', 'experience_page');
      
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        // Fallback to older config if exists
        content = await cmsService.getExperiencePageConfig('kenyan-experiences');
        if (content?.metadata) {
          setConfig({ 
            ...defaultConfig, 
            featuredMediaUrl: content.metadata.mediaUrl || '',
            mediaType: content.metadata.mediaType || 'photo',
            videoThumbnail: content.metadata.videoThumbnail
          });
        } else {
          setConfig(defaultConfig);
        }
      }
    } catch (err) {
      console.error('Error loading kenyan experiences config:', err);
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
