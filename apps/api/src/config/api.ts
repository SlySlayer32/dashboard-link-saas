// API Configuration and Environment Setup
// This file configures the API gateway with all required services

import { config } from 'dotenv'

// Load environment variables
config()

// API Configuration
export const API_CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  env: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'dashboard-link:',
    ttl: {
      session: 3600, // 1 hour
      quota: 86400, // 24 hours
      cache: 300, // 5 minutes
    },
  },

  // SMS Configuration (MobileMessage.au)
  sms: {
    provider: 'mobilemessage',
    username: process.env.MOBILEMESSAGE_USERNAME || '',
    password: process.env.MOBILEMESSAGE_PASSWORD || '',
    senderId: process.env.MOBILEMESSAGE_SENDER_ID || 'Dashboard',
    baseUrl: 'https://api.mobilemessage.com.au',
    rateLimit: {
      perSecond: 10,
      perMinute: 100,
    },
  },

  // Webhook Configuration
  webhooks: {
    secrets: {
      google_calendar: process.env.WEBHOOK_SECRET_GOOGLE || '',
      airtable: process.env.WEBHOOK_SECRET_AIRTABLE || '',
      notion: process.env.WEBHOOK_SECRET_NOTION || '',
      custom: process.env.WEBHOOK_SECRET_CUSTOM || '',
    },
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
  },

  // Token Configuration
  tokens: {
    dashboard: {
      defaultExpiry: 24, // hours
      maxExpiry: 168, // 1 week
      secretLength: 32, // bytes
    },
    jwt: {
      refreshExpiry: '7d',
      accessExpiry: '15m',
    },
  },

  // Quota Configuration
  quotas: {
    free: {
      smsPerDay: 50,
      workersPerOrg: 10,
      adaptersPerOrg: 2,
      apiRequestsPerMinute: 60,
      storageMB: 100,
    },
    pro: {
      smsPerDay: 500,
      workersPerOrg: 100,
      adaptersPerOrg: 10,
      apiRequestsPerMinute: 600,
      storageMB: 1000,
    },
    enterprise: {
      smsPerDay: 5000,
      workersPerOrg: 1000,
      adaptersPerOrg: 50,
      apiRequestsPerMinute: 6000,
      storageMB: 10000,
    },
  },

  // Security Configuration
  security: {
    corsOrigins: [
      process.env.APP_URL || 'http://localhost:5173',
      'http://localhost:5173', // Admin
      'http://localhost:5174', // Worker
      'https://dashboard-link.vercel.app',
      'https://dashboard-link-pro.vercel.app',
    ],
    rateLimiting: {
      windowMs: 60000, // 1 minute
      max: 100, // requests per window
    },
    bcryptRounds: 12,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    structured: true,
  },

  // Job Queue Configuration (for future BullMQ implementation)
  queues: {
    redis: {
      host: process.env.QUEUE_REDIS_HOST || 'localhost',
      port: parseInt(process.env.QUEUE_REDIS_PORT || '6379'),
      password: process.env.QUEUE_REDIS_PASSWORD,
    },
    concurrency: {
      sms: 10,
      webhooks: 20,
      sync: 5,
      scheduled: 2,
    },
  },
}

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_JWT_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'MOBILEMESSAGE_USERNAME',
    'MOBILEMESSAGE_PASSWORD',
    'WEBHOOK_SECRET_GOOGLE',
    'WEBHOOK_SECRET_AIRTABLE',
    'WEBHOOK_SECRET_NOTION',
    'WEBHOOK_SECRET_CUSTOM',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Database configuration for different environments
export const DB_CONFIG = {
  development: {
    ssl: false,
    maxConnections: 10,
  },
  staging: {
    ssl: true,
    maxConnections: 20,
  },
  production: {
    ssl: true,
    maxConnections: 50,
  },
}

// Export configuration helpers
export const isDevelopment = API_CONFIG.env === 'development'
export const isProduction = API_CONFIG.env === 'production'
export const isStaging = API_CONFIG.env === 'staging'

// Get database config for current environment
export function getDBConfig() {
  return DB_CONFIG[API_CONFIG.env as keyof typeof DB_CONFIG] || DB_CONFIG.development
}
