import { format, addDays, parseISO } from "date-fns";

/**
 * Formats a date string to display format (e.g., "Jan 15, 2025")
 */
export const formatDisplayDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Formats a date string to short format (e.g., "Jan 15")
 */
export const formatShortDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "MMM dd");
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Generates an array of dates from a start date
 */
export const generateDateRange = (startDate: string, numberOfDays: number): string[] => {
  try {
    const dates: string[] = [];
    const start = parseISO(startDate);

    for (let i = 0; i < numberOfDays; i++) {
      const date = addDays(start, i);
      dates.push(format(date, "yyyy-MM-dd"));
    }

    return dates;
  } catch (error) {
    console.error("Error generating date range:", error);
    return [];
  }
};

/**
 * Maps day numbers to actual dates
 * @param startDate - Session start date (YYYY-MM-DD)
 * @param numberOfDays - Total number of days
 * @returns Array of objects with day number and date
 */
export const mapDaysToCalendarDates = (
  startDate: string | undefined,
  numberOfDays: number,
): Array<{ dayNumber: number; date: string; label: string }> => {
  if (!startDate) {
    // Return days without dates if start date not configured
    return Array.from({ length: numberOfDays }, (_, i) => ({
      dayNumber: i + 1,
      date: "",
      label: `Day ${i + 1}`,
    }));
  }

  const dates = generateDateRange(startDate, numberOfDays);
  return dates.map((date, index) => ({
    dayNumber: index + 1,
    date,
    label: `Day ${index + 1} (${formatShortDate(date)})`,
  }));
};

/**
 * Parses available dates and groups them by week
 */
export const parseAvailableDates = (
  availableDates: string[],
): Array<{
  date: string;
  displayLabel: string;
  weekNumber: number;
}> => {
  try {
    if (!availableDates || availableDates.length === 0) return [];

    const sortedDates = [...availableDates].sort();
    const firstDate = parseISO(sortedDates[0]);

    return sortedDates.map((dateStr) => {
      const date = parseISO(dateStr);
      const weekNumber = Math.floor((date.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      return {
        date: dateStr,
        displayLabel: format(date, "EEE, MMM d"),
        weekNumber,
      };
    });
  } catch (error) {
    console.error("Error parsing available dates:", error);
    return [];
  }
};

/**
 * Format date for selection display
 */
export const formatDateForSelection = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, "EEE, MMM d");
  } catch (error) {
    console.error("Error formatting date for selection:", error);
    return dateString;
  }
};

/**
 * Maps day names (Monday, Friday) to actual calendar dates
 * Used for The Little Forest Explorers (Ages 3 & below)
 */
export const mapDayNamesToCalendarDates = (
  sessionSchedule?: Record<string, string>,
): Array<{ value: string; label: string; date: string }> => {
  const defaultDays = [
    { value: "Monday", label: "Monday", date: "" },
    { value: "Friday", label: "Friday", date: "" },
  ];

  if (!sessionSchedule) {
    return defaultDays;
  }

  return defaultDays.map((day) => {
    const date = sessionSchedule[day.value];
    return {
      ...day,
      date: date || "",
      label: date ? `${day.label} (${formatShortDate(date)})` : day.label,
    };
  });
};
