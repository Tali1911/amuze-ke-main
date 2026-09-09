import { useEffect, useState } from 'react';
import { getCalendarDatesForCampType } from '@/services/calendarService';

/**
 * Returns calendar dates scoped to a given (campType, location) pair.
 * - When `location` is empty/undefined, returns dates across all locations
 *   for the camp type (legacy behaviour).
 * - When `location` matches at least one calendar event, returns only that
 *   location's dates.
 * - When no events for the camp type have a location set at all, the service
 *   falls back to all dates (so legacy data still works).
 */
export const useCampDatesForLocation = (
  campType: string | undefined,
  location: string | undefined,
  fallbackDates?: string[]
) => {
  const [dates, setDates] = useState<string[]>(fallbackDates || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!campType) return;

    setIsLoading(true);
    getCalendarDatesForCampType(campType, location)
      .then((result) => {
        if (cancelled) return;
        // If calendar has nothing, fall back to flat config dates
        if (result.length === 0 && fallbackDates && fallbackDates.length > 0) {
          setDates(fallbackDates);
        } else {
          setDates(result);
        }
      })
      .catch(() => {
        if (!cancelled && fallbackDates) setDates(fallbackDates);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campType, location, JSON.stringify(fallbackDates)]);

  return { dates, isLoading };
};
