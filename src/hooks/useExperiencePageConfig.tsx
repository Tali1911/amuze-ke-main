import { useState, useEffect } from 'react';
import { cmsService } from '@/services/cmsService';

export interface ExperiencePageConfig {
  title: string;
  description: string;
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  videoThumbnail?: string;
  mediaAltText?: string;
}

const defaultExperienceConfigs: Record<string, ExperiencePageConfig> = {
  'kenyan-experiences': {
    title: 'Kenyan Experiences',
    description: 'Multi day experiences designed to immerse teens in the rich cultural, artistic, and natural diversity that Kenya has to offer.',
    mediaType: 'photo',
    mediaUrl: '',
    mediaAltText: 'Kenyan landscape adventures',
  },
};

export const useExperiencePageConfig = (experienceType: string) => {
  const [config, setConfig] = useState<ExperiencePageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await cmsService.getExperiencePageConfig(experienceType);

        if (data?.metadata?.pageConfig) {
          setConfig(data.metadata.pageConfig);
        } else {
          const defaultConfig = defaultExperienceConfigs[experienceType];
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error(`[ExperiencePageConfig] Error fetching ${experienceType}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        const defaultConfig = defaultExperienceConfigs[experienceType];
        setConfig(defaultConfig || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (experienceType) {
      fetchConfig();
    }
  }, [experienceType]);

  const refresh = async () => {
    if (experienceType) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await cmsService.getExperiencePageConfig(experienceType);
        if (data?.metadata?.pageConfig) {
          setConfig(data.metadata.pageConfig);
        } else {
          const defaultConfig = defaultExperienceConfigs[experienceType];
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error(`[ExperiencePageConfig] Error refreshing ${experienceType}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to refresh config');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { config, isLoading, error, refresh };
};
