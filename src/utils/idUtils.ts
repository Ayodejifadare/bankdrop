/**
 * Centralized ID generation utilities for the Bankdrop ecosystem.
 * Using prefixes helps identify the type of entity and reduces collision risk.
 */

export const generateId = (prefix?: string) => {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timestampPart = Date.now().toString(36);
  
  if (prefix) {
    return `${prefix}_${timestampPart}_${randomPart}`;
  }
  
  return `${timestampPart}_${randomPart}`;
};

// Legacy compatibility for random 8-char IDs
export const generateSimpleId = () => Math.random().toString(36).substring(2, 10);
