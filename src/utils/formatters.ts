/**
 * Centralized formatting utilities for the Bankdrop application.
 * Ensures consistent display of currency, dates, and times across all components.
 */

/**
 * Formats a number as Nigerian Naira (₦).
 */
export const formatCurrency = (amount: number): string => {
  return `₦${amount.toLocaleString()}`;
};

/**
 * Formats an ISO string into a full descriptive date and time.
 * Example: April 17, 2026, 1:28 PM
 */
export const formatFullDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formats an ISO string into a short date for lists.
 * Example: Apr 17
 */
export const formatShortDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Formats a time with an optional offset in seconds.
 * Useful for generating realistic timeline stages from a final timestamp.
 */
export const formatTimeWithOffset = (isoString: string, offsetSeconds = 0): string => {
  const date = new Date(new Date(isoString).getTime() + offsetSeconds * 1000);
  return date.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
