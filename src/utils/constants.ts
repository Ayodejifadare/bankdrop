/**
 * Application-wide constants and configurations.
 */

export const STORAGE_KEYS = {
  MERCHANT_STATE: 'merchant_state',
  MERCHANT_AUTH: 'merchant_authenticated',
  MERCHANT_USER: 'merchant_user',
  CUSTOMER_PROFILE: 'customer_profile',
  CUSTOMER_AUTH: 'customer_authenticated',
  CUSTOMER_WALLET: 'customer_wallet',
  CUSTOMER_ACTIVITIES: 'customer_activities',
  CUSTOMER_REWARDS: 'customer_rewards',
  PARTICIPANT_ID: 'participant_id',
  THEME: 'theme',
} as const;

export const MERCHANT_LIMITS = {
  MAX_ARCHIVED_SESSIONS: 50,
  MAX_ORDER_HISTORY: 100,
  MAX_ACTIVITIES: 150,
} as const;

export const REVENUE_STATS = {
  REFRESH_INTERVAL_MS: 30000, // 30 seconds
} as const;
