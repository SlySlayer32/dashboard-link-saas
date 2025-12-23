import { logger } from '@dashboard-link/shared';
import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // Supabase configuration
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required'),
  
  // JWT configuration
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // SMS configuration
  SMS_API_KEY: z.string().min(1, 'SMS_API_KEY is required'),
  SMS_API_URL: z.string().url('SMS_API_URL must be a valid URL').optional(),
  
  // CORS configuration
  APP_URL: z.string().url('APP_URL must be a valid URL').default('http://localhost:5173'),
  
  // Database configuration (if using direct connection)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // File upload configuration
  MAX_FILE_SIZE: z.string().transform(Number).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().transform(str => str.split(',')).default('jpg,jpeg,png,gif,pdf'),
  
  // Email configuration (if needed)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  
  // External API configuration
  EXTERNAL_API_TIMEOUT: z.string().transform(Number).default('30000'), // 30 seconds
  
  // Feature flags
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  ENABLE_CACHE: z.string().transform(val => val === 'true').default('true'),
  CACHE_TTL: z.string().transform(Number).default('300'), // 5 minutes
});

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    
    // Log successful validation (except in test)
    if (env.NODE_ENV !== 'test') {
      logger.info('Environment variables loaded:', {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        supabaseUrl: env.SUPABASE_URL,
        logLevel: env.LOG_LEVEL
      });
    }
    
    return env;
  } catch (error) {
    logger.error('Environment variable validation failed', error as Error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      logger.error('Invalid environment variables:', { errors: errorMessages });
      
      // In production, fail fast
      if (process.env.NODE_ENV === 'production') {
        logger.error('\n❌ Invalid environment variables:');
        errorMessages.forEach(msg => logger.error(`  - ${msg}`));
        logger.error('\nPlease check your .env file and ensure all required variables are set.');
        process.exit(1);
      }
      
      // In development, show a warning but continue
      logger.warn('\n⚠️  Invalid environment variables:');
      errorMessages.forEach(msg => logger.warn(`  - ${msg}`));
      logger.warn('\nSome features may not work correctly.');
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
    };
  }
}

// Export validated environment
export const env = validateEnv();

// Export types for use in other files
export type Env = z.infer<typeof envSchema>;

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof Pick<Env, 'ENABLE_ANALYTICS' | 'ENABLE_CACHE'>): boolean {
  return env[feature];
}

// Helper function to get database URL with fallback
export function getDatabaseUrl(): string {
  return env.DATABASE_URL || env.SUPABASE_URL;
}

// Helper function to get SMTP config if available
export function getSmtpConfig() {
  if (!env.SMTP_HOST || !env.SMTP_PORT) {
    return null;
  }
  
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  };
}

// Validate critical runtime dependencies
export function validateRuntimeDependencies() {
  const criticalVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
  const missing = criticalVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error('Missing critical environment variables', { missing });
    
    if (env.NODE_ENV === 'production') {
      logger.error('\n❌ Missing critical environment variables:');
      missing.forEach(varName => logger.error(`  - ${varName}`));
      logger.error('\nApplication cannot start without these variables.');
      process.exit(1);
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
  
  supabase: {
    url: env.SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_KEY,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
  },
  
  sms: {
    apiKey: env.SMS_API_KEY,
    apiUrl: env.SMS_API_URL,
  },
  
  cors: {
    origin: env.APP_URL,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES,
  },
  
  cache: {
    enabled: env.ENABLE_CACHE,
    ttl: env.CACHE_TTL,
  },
  
  analytics: {
    enabled: env.ENABLE_ANALYTICS,
  },
  
  timeouts: {
    externalApi: env.EXTERNAL_API_TIMEOUT,
  },
};
