import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isSameDay,
  parseISO,
  formatISO,
  differenceInDays
} from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DISPLAY_DATE_FORMAT = 'MMMM d, yyyy';
export const DISPLAY_TIME_FORMAT = 'h:mm a';
export const DISPLAY_DAY_FORMAT = 'EEEE, MMMM d';

/**
 * Formats a date for display
 */
export function formatDate(date: Date | string, formatStr: string = DISPLAY_DATE_FORMAT): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Formats a time for display
 */
export function formatTime(time: string, formatStr: string = DISPLAY_TIME_FORMAT): string {
  // Handle ISO time string (HH:mm:ss)
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return format(date, formatStr);
}

/**
 * Returns start and end dates for a given view mode
 */
export function getDateRange(date: Date, viewMode: 'day' | 'week' | 'month'): { start: Date; end: Date } {
  switch (viewMode) {
    case 'day':
      return { start: date, end: date };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 0 }),
        end: endOfWeek(date, { weekStartsOn: 0 })
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
  }
}

/**
 * Navigates to next/previous period based on view mode
 */
export function navigateDate(date: Date, viewMode: 'day' | 'week' | 'month', direction: 'next' | 'prev'): Date {
  if (direction === 'next') {
    switch (viewMode) {
      case 'day':
        return addDays(date, 1);
      case 'week':
        return addWeeks(date, 1);
      case 'month':
        return addMonths(date, 1);
    }
  } else {
    switch (viewMode) {
      case 'day':
        return subDays(date, 1);
      case 'week':
        return subWeeks(date, 1);
      case 'month':
        return subMonths(date, 1);
    }
  }
}

/**
 * Checks if a date is today
 */
export function isDateToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Checks if two dates are the same day
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(dateObj1, dateObj2);
}

/**
 * Formats a date as ISO string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

/**
 * Gets countdown days between now and a future date
 */
export function getCountdownDays(futureDate: Date | string): number {
  const future = typeof futureDate === 'string' ? parseISO(futureDate) : futureDate;
  return Math.max(0, differenceInDays(future, new Date()));
}

/**
 * Determines the time period based on the time
 */
export function determineTimePeriod(time: string): 'morning' | 'afternoon' | 'night' {
  const hour = parseInt(time.split(':')[0], 10);
  
  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else {
    return 'night';
  }
}

/**
 * Generates an array of dates for a week view
 */
export function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Generates dates for a month view (including padding days from prev/next months)
 */
export function getMonthDates(date: Date): Date[] {
  const firstDay = startOfMonth(date);
  const lastDay = endOfMonth(date);
  const startWeek = startOfWeek(firstDay, { weekStartsOn: 0 });
  const endWeek = endOfWeek(lastDay, { weekStartsOn: 0 });
  
  const days = [];
  let day = startWeek;
  
  while (day <= endWeek) {
    days.push(day);
    day = addDays(day, 1);
  }
  
  return days;
}
