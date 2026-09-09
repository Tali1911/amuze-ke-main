
import { useState, useEffect, useCallback } from 'react';
import { contentService, ContentItem } from '@/services/contentService';

export const useContent = (section?: string, key?: string) => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (section && key) {
        const item = await contentService.getContentByKey(section, key);
        setContent(item ? [item] : []);
      } else {
        const items = await contentService.getContent(section);
        setContent(items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
      console.error('Error fetching content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [section, key]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const getContentValue = useCallback((defaultValue: string = '') => {
    if (content.length > 0) {
      return content[0].content;
    }
    return defaultValue;
  }, [content]);

  const refreshContent = useCallback(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    isLoading,
    error,
    getContentValue,
    refreshContent
  };
};
