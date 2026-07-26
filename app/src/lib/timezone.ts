/**
 * Timezone utilities for consistent date formatting across the application
 * All times are displayed in America/New_York timezone (Eastern Time)
 */

const TIMEZONE = 'America/New_York';

/**
 * Format a date string (ISO) to a human-readable date string in the configured timezone
 */
export function formatDateInTimezone(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
}

/**
 * Format a date string (ISO) to a human-readable time string in the configured timezone
 */
export function formatTimeInTimezone(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
}

/**
 * Format a date string (ISO) to a human-readable date and time string in the configured timezone
 */
export function formatDateTimeInTimezone(dateString: string): string {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
  return `${dateStr} at ${timeStr} ET`;
}

/**
 * Format a date string (ISO) to a short date and time string in the configured timezone
 */
export function formatShortDateTimeInTimezone(dateString: string): string {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: TIMEZONE,
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIMEZONE,
  });
  return `${dateStr} at ${timeStr} ET`;
}

/**
 * Format multiple time slots for display in emails
 */
export function formatTimeSlotsForEmail(timeSlots: string[]): string {
  return timeSlots
    .map((slot) => {
      const date = new Date(slot);
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: TIMEZONE,
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: TIMEZONE,
      });
      return `${dateStr} at ${timeStr} ET`;
    })
    .join('<br>');
}

/**
 * Format multiple time slots for plain text emails
 */
export function formatTimeSlotsForTextEmail(timeSlots: string[]): string {
  return timeSlots
    .map((slot) => {
      const date = new Date(slot);
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: TIMEZONE,
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: TIMEZONE,
      });
      return `${dateStr} at ${timeStr} ET`;
    })
    .join('\n');
}

/**
 * Get the current date/time formatted in the configured timezone
 */
export function getCurrentDateTimeInTimezone(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' ET';
}
