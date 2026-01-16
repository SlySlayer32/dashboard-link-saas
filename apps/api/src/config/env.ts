import { z } from 'zod'
import { logger } from '../utils/logger.js'

// Environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // App URLs
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:5173'),
  API_URL: z.string().url('API_URL must be a valid URL').default('http://localhost:3000'),

  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),

  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ALGORITHM: z.string().default('HS256'),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),

  // Token configuration
  TOKEN_PROVIDER: z.string().default('database'),
  TOKEN_TABLE_NAME: z.string().default('tokens'),
  TOKEN_DEFAULT_EXPIRY: z.string().transform(Number).default('3600'),
  TOKEN_REFRESH_EXPIRY: z.string().transform(Number).default('2592000'),
  TOKEN_CLEANUP_INTERVAL: z.string().transform(Number).default('3600'),
  TOKEN_HASH: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  TOKEN_CLEANUP: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // SMS configuration
  DEFAULT_SMS_PROVIDER: z.string().default('mobile-message'),
  FALLBACK_SMS_PROVIDERS: z.string().optional(),

  // MobileMessage SMS
  MOBILE_MESSAGE_USERNAME: z.string().optional(),
  MOBILE_MESSAGE_PASSWORD: z.string().optional(),
  MOBILE_MESSAGE_SENDER_ID: z.string().default('DashLink'),

  // Twilio SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_DEFAULT_FROM: z.string().default('DashLink'),

  // Plugin Credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AIRTABLE_API_KEY: z.string().optional(),
  NOTION_INTEGRATION_SECRET: z.string().optional(),

  // Logging configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // External API configuration
  EXTERNAL_API_TIMEOUT: z.string().transform(Number).default('30000'), // 30 seconds

  // Feature flags
  ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  ENABLE_CACHE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  CACHE_TTL: z.string().transform(Number).default('300'), // 5 minutes

  // Database configuration (optional)
  DATABASE_URL: z.string().url().optional(),
  DB_TYPE: z.string().default('supabase'),
  DB_CACHE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  DB_CACHE_TTL: z.string().transform(Number).default('300'),

  // Redis (BullMQ queues)
  REDIS_URL: z.string().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),

  // Billing (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
})

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env)

    // Log successful validation (except in test)
    if (env.NODE_ENV !== 'test') {
      logger.info('Environment variables loaded:', {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        supabaseUrl: env.SUPABASE_URL,
        logLevel: env.LOG_LEVEL,
      })
    }

    return env
  } catch (error) {
    logger.error('Environment variable validation failed', error as Error)

    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })

      logger.error('Invalid environment variables:', { errors: errorMessages })

      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        logger.error('\n❌ Invalid environment variables:')
        errorMessages.forEach((msg) => logger.error(`  - ${msg}`))
        logger.error('\nPlease check your .env file and ensure all required variables are set.')
        process.exit(1)
      }

      // In development, show a warning but continue
      logger.warn('\n⚠️  Invalid environment variables:')
      errorMessages.forEach((msg) => logger.warn(`  - ${msg}`))
      logger.warn('\nSome features may not work correctly.')
    }

    // Return partial env for development
    return {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT || '3000'),
      HOST: process.env.HOST || '0.0.0.0',
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
      JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key-that-is-not-secure',
      APP_URL: process.env.APP_URL || 'http://localhost:5173',
      LOG_LEVEL: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
      // Add other variables with defaults
    }
  }
}

// Export validated environment
export const env = validateEnv()

// Export types for use in other files
export type Env = z.infer<typeof envSchema>

// Helper function to check if a feature is enabled
export function isFeatureEnabled(
  feature: keyof Pick<Env, 'ENABLE_ANALYTICS' | 'ENABLE_CACHE'>
): boolean {
  return env[feature]
}

// Helper function to get database URL with fallback
export function getDatabaseUrl(): string {
  return env.DATABASE_URL || env.SUPABASE_URL
}

// Helper function to get SMTP config if available
export function getSmtpConfig() {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null
  }

  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }
}

// Validate critical runtime dependencies
export function validateRuntimeDependencies() {
  const criticalVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET']
  const missing = criticalVars.filter((varName) => !process.env[varName])

  if (missing.length > 0) {
    logger.error('Missing critical environment variables', { missing })

    if (env.NODE_ENV === 'production') {
      logger.error('\n❌ Missing critical environment variables:')
      missing.forEach((varName) => logger.error(`  - ${varName}`))
      logger.error('\nApplication cannot start without these variables.')
      process.exit(1)
    }
  }
}

// Export configuration object for easy access
export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
    host: env.HOST,
  },

  urls: {
    appUrl: env.APP_URL,
    apiUrl: env.API_URL,
  },

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
    algorithm: env.JWT_ALGORITHM,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },

  tokens: {
    provider: env.TOKEN_PROVIDER,
    tableName: env.TOKEN_TABLE_NAME,
    defaultExpiry: env.TOKEN_DEFAULT_EXPIRY,
    refreshExpiry: env.TOKEN_REFRESH_EXPIRY,
    cleanupInterval: env.TOKEN_CLEANUP_INTERVAL,
    hash: env.TOKEN_HASH,
    cleanup: env.TOKEN_CLEANUP,
  },

  sms: {
    defaultProvider: env.DEFAULT_SMS_PROVIDER,
    fallbackProviders: env.FALLBACK_SMS_PROVIDERS ? env.FALLBACK_SMS_PROVIDERS.split(',') : [],
    mobileMessage: {
      username: env.MOBILE_MESSAGE_USERNAME,
      password: env.MOBILE_MESSAGE_PASSWORD,
      senderId: env.MOBILE_MESSAGE_SENDER_ID,
    },
    twilio: {
      accountSid: env.TWILIO_ACCOUNT_SID,
      authToken: env.TWILIO_AUTH_TOKEN,
      defaultFrom: env.TWILIO_DEFAULT_FROM,
    },
  },

  plugins: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    airtable: {
      apiKey: env.AIRTABLE_API_KEY,
    },
    notion: {
      integrationSecret: env.NOTION_INTEGRATION_SECRET,
    },
  },

  cors: {
    origin: [env.APP_URL, 'http://localhost:5173', 'http://localhost:5174'],
  },

  logging: {
    level: env.LOG_LEVEL,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  cache: {
    enabled: env.ENABLE_CACHE,
    ttl: env.CACHE_TTL,
  },

  database: {
    url: env.DATABASE_URL,
    type: env.DB_TYPE,
    cacheEnabled: env.DB_CACHE_ENABLED,
    cacheTtl: env.DB_CACHE_TTL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  observability: {
    sentryDsn: env.SENTRY_DSN,
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  },

  billing: {
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  analytics: {
    enabled: env.ENABLE_ANALYTICS,
  },

  timeouts: {
    externalApi: env.EXTERNAL_API_TIMEOUT,
  },
}
