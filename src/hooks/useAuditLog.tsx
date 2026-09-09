import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { auditLogService } from '@/services/auditLogService';

/**
 * Hook to automatically log page views and provide audit logging functions
 */
export const useAuditLog = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Automatically log page views
  useEffect(() => {
    if (user) {
      const pageName = getPageName(location.pathname);
      auditLogService.logPageView(pageName, location.pathname);
    }
  }, [location.pathname, user]);

  return {
    logEvent: auditLogService.logEvent.bind(auditLogService),
    logContentCreated: auditLogService.logContentCreated.bind(auditLogService),
    logContentUpdated: auditLogService.logContentUpdated.bind(auditLogService),
    logContentDeleted: auditLogService.logContentDeleted.bind(auditLogService),
    logRegistration: auditLogService.logRegistration.bind(auditLogService),
    logExport: auditLogService.logExport.bind(auditLogService),
  };
};

function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/admin': 'Admin Dashboard',
    '/announcements': 'Announcements',
    '/contact': 'Contact',
    '/gallery': 'Gallery',
    '/programs': 'Programs',
    '/about/team': 'Team',
    '/about/who-we-are': 'Who We Are',
    '/about/what-we-do': 'What We Do',
  };

  // Check for exact match
  if (routes[pathname]) {
    return routes[pathname];
  }

  // Handle dynamic routes
  if (pathname.startsWith('/camps/')) {
    return `Camp: ${pathname.split('/').pop()}`;
  }
  if (pathname.startsWith('/programs/')) {
    return `Program: ${pathname.split('/').pop()}`;
  }

  // Default
  return pathname.replace(/\//g, ' > ').trim() || 'Unknown Page';
}
