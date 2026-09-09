import { format } from 'date-fns';

/**
 * Parse a date-only string (YYYY-MM-DD) as a local date without timezone conversion.
 * This avoids the timezone shift issues that occur when parseISO treats the string as UTC.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date-only string for display without timezone conversion.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param formatStr - Format string for date-fns
 * @returns Formatted date string
 */
export const formatLocalDate = (dateStr: string, formatStr: string): string => {
  return format(parseLocalDate(dateStr), formatStr);
};
