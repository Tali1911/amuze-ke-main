import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { cmsService } from '@/services/cmsService';
import { defaultCampFormConfigs } from '@/utils/defaultCampConfigs';
import { getCalendarDatesForCampType } from '@/services/calendarService';

export interface CampFormConfig {
  pricing: {
    halfDayRate: number;
    fullDayRate: number;
    currency: string;
    ngongDayRate?: number; // Flat day rate for Ngong Sanctuary (no half/full day)
  };
  fields: {
    parentName: { label: string; placeholder: string; required: boolean };
    childName: { label: string; placeholder: string; required: boolean };
    dateOfBirth: { label: string; placeholder: string; required: boolean };
    ageRange: { label: string; placeholder: string; required: boolean };
    numberOfDays: { label: string; placeholder: string; helpText: string };
    sessionType: { label: string; halfDayLabel: string; fullDayLabel: string };
    specialNeeds: { label: string; placeholder: string };
    emergencyContact: { label: string; placeholder: string; required: boolean };
    email: { label: string; placeholder: string; required: boolean };
    phone: { label: string; placeholder: string; required: boolean };
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
  specialNeedsSection: {
    title: string;
    description: string;
  };
  sessionDates?: {
    startDate: string; // YYYY-MM-DD format (deprecated, for backward compatibility)
    endDate?: string; // YYYY-MM-DD format (deprecated, for backward compatibility)
  };
  availableDates?: string[]; // Array of YYYY-MM-DD dates (preferred method)
  locations?: string[]; // Available location options (CMS-configurable)
  archeryRate?: number; // Archery session rate (KES) for Ngong Sanctuary
  ageGroups?: Array<{
    age: string;
    locations: string;
    schedule: string;
    skills: string;
    color: string;
  }>;
}

export const useCampFormConfig = (formType: string) => {
  const [config, setConfig] = useState<CampFormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await cmsService.getCampFormConfig(formType);
        const defaultConfig = defaultCampFormConfigs[formType];
        
        if (data?.metadata?.formConfig) {
          // Merge CMS config with default config to include sessionDates and other missing fields
          let availableDates = data.metadata.formConfig.availableDates || defaultConfig?.availableDates;
          
          // Backward compatibility: Generate availableDates from sessionDates if not present
          if (!availableDates && data.metadata.formConfig.sessionDates?.startDate) {
            const start = new Date(data.metadata.formConfig.sessionDates.startDate);
            const end = data.metadata.formConfig.sessionDates.endDate 
              ? new Date(data.metadata.formConfig.sessionDates.endDate) 
              : start;
            
            availableDates = [];
            const current = new Date(start);
            while (current <= end) {
              availableDates.push(format(current, 'yyyy-MM-dd'));
              current.setDate(current.getDate() + 1);
            }
          }
          
          // Try to get dates from calendar events (primary source)
          const calendarDates = await getCalendarDatesForCampType(formType);
          
          const mergedConfig = {
            ...defaultConfig,
            ...data.metadata.formConfig,
            // Calendar dates take priority, then CMS dates, then defaults
            availableDates: calendarDates.length > 0 ? calendarDates : (availableDates || []),
            locations: data.metadata.formConfig.locations || defaultConfig?.locations,
            archeryRate: data.metadata.formConfig.archeryRate || defaultConfig?.archeryRate,
            sessionDates: data.metadata.formConfig.sessionDates || defaultConfig?.sessionDates,
            ageGroups: data.metadata.formConfig.ageGroups || defaultConfig?.ageGroups,
            emailContent: data.metadata.formConfig.emailContent || undefined
          };
          setConfig(mergedConfig);
        } else {
          // No CMS data — still try calendar dates
          const calendarDates = await getCalendarDatesForCampType(formType);
          if (calendarDates.length > 0 && defaultConfig) {
            setConfig({ ...defaultConfig, availableDates: calendarDates });
          } else {
            setConfig(defaultConfig || null);
          }
        }
      } catch (err) {
        console.error('Error fetching camp form config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch config');
        // Fallback to default
        const defaultConfig = defaultCampFormConfigs[formType];
        setConfig(defaultConfig || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (formType) {
      fetchConfig();
    }
  }, [formType]);

  return { config, isLoading, error };
};
