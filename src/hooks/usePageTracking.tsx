import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackClick } from '@/services/siteAnalyticsService';

// Check if user has consented to cookies
function hasConsent(): boolean {
  const consent = localStorage.getItem('cookieConsent');
  return consent === 'accepted';
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (!hasConsent()) return;

    const title = document.title || location.pathname;
    trackPageView(location.pathname, title);
  }, [location.pathname]);

  const handleClick = useCallback((
    elementType: string,
    elementText: string,
    href?: string
  ) => {
    if (!hasConsent()) return;
    trackClick(elementType, elementText, href);
  }, []);

  return { trackClick: handleClick };
}

// Component for tracking clicks on CTAs
export function PageTracker() {
  usePageTracking();
  return null;
}
