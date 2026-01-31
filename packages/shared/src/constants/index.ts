// SMS Constants
export const SMS_LIMITS = {
    DEFAULT_PER_HOUR: 100,
    MIN_PER_HOUR: 1,
    MAX_PER_HOUR: 1000,
    MAX_MESSAGE_LENGTH: 320, // 2 SMS parts
} as const;

// Token Constants
export const TOKEN_EXPIRY = {
    DEFAULT_HOURS: 8,
    MIN_HOURS: 1,
    MAX_HOURS: 24,
} as const;

// Validation Constants
export const VALIDATION = {
    PHONE_REGEX: /^\+[1-9]\d{1,14}$/,
    EMAIL_REGEX: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/,
    SLUG_REGEX: /^[a-z0-9-]{3,50}$/,
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
} as const;

// Organization Plans
export const ORGANIZATION_PLANS = ['free', 'pro', 'enterprise'] as const;

// User Roles
export const USER_ROLES = ['admin', 'owner'] as const;

// Plugin IDs
export const PLUGIN_IDS = ['google-calendar', 'airtable', 'notion', 'manual'] as const;

// Data Source Status
export const DATA_SOURCE_STATUS = ['active', 'error', 'disconnected'] as const;

// SMS Status
export const SMS_STATUS = ['sent', 'delivered', 'failed'] as const;

// Access Log Validation Status
export const ACCESS_LOG_STATUS = ['success', 'expired', 'invalid', 'revoked'] as const;
