import { useState, useEffect } from 'react';
import { cmsService } from '@/services/cmsService';
import { defaultCampPageConfigs } from '@/utils/defaultCampConfigs';

export interface LocationDetail {
  name: string;
  duration: string;
  ageGroup: string;
  time: string;
  highlights: string[];
}

export interface CampPageConfig {
  title: string;
  description: string;
  heroImage: string;
  // New media fields for photo/video support
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  videoThumbnail?: string;
  mediaAltText?: string;
  duration: string;
  ageGroup: string;
  location: string;
  time: string;
  highlights: string[];
  locationDetails?: LocationDetail[];
}

export const useCampPageConfig = (campType: string) => {
  const [config, setConfig] = useState<CampPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[CampPageConfig] Fetching config for: ${campType}`);
        const data = await cmsService.getCampPageConfig(campType);
        
        console.log(`[CampPageConfig] Data received:`, data);
        
        if (data?.metadata?.pageConfig) {
          console.log(`[CampPageConfig] Using CMS config for ${campType}`);
          setConfig(data.metadata.pageConfig);
        } else {
          console.warn(`[CampPageConfig] No CMS data found for ${campType}, using default`);
          const defaultConfig = defaultCampPageConfigs[campType];
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error(`[CampPageConfig] Error fetching ${campType}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        const defaultConfig = defaultCampPageConfigs[campType];
        setConfig(defaultConfig || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (campType) {
      fetchConfig();
    }
  }, [campType]);

  // Add refresh function that can be called externally
  const refresh = async () => {
    if (campType) {
      setIsLoading(true);
      setError(null);
      try {
        const data = await cmsService.getCampPageConfig(campType);
        if (data?.metadata?.pageConfig) {
          setConfig(data.metadata.pageConfig);
        } else {
          const defaultConfig = defaultCampPageConfigs[campType];
          setConfig(defaultConfig || null);
        }
      } catch (err) {
        console.error(`[CampPageConfig] Error refreshing ${campType}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to refresh config');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { config, isLoading, error, refresh };
};
