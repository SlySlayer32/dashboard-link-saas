// SMS Gateway Package - Zapier-Style Architecture
// Export all SMS-related components
//
// Environment-based provider initialization: see SMSProviderFactory.ts
// Provider auto-registration: see registerDefaultSMSProviders() in SMSProviderFactory.ts
// Phase 2: Add org_id tenant scoping to main service methods

// Core types and interfaces
export type {
  SMSAnalytics,
  SMSBatchResult,
  SMSConfigValidationResult,
  SMSCostStats,
  SMSDeliveryReport,
  SMSDeliveryStats,
  SMSError,
  SMSHealthResult,
  SMSManager,
  SMSMessage,
  SMSMessageStats,
  SMSProvider,
  SMSProviderConfig,
  SMSRegistry,
  SMSResult,
  SMSStatus,
} from '@dashboard-link/shared'

// Base adapter
export { BaseSMSProvider } from './base/BaseSMSProvider'

// Provider implementations
export { AWSSNSProvider } from './providers/AWSSNSProvider'
export { MessageBirdProvider } from './providers/MessageBirdProvider'
export { MobileMessageProvider } from './providers/MobileMessageProvider'
export { TwilioProvider } from './providers/TwilioProvider'

// Registry and Manager
export { SMSManagerImpl, smsManager } from './manager/SMSManager'
export { createSMSProvider, registerDefaultSMSProviders } from './registry/SMSProviderFactory'
export { SMSRegistryImpl, smsRegistry } from './registry/SMSRegistry'

// Core Services
export { SMSAnalyticsService } from './services/SMSAnalyticsService'
export { SMSQueueService } from './services/SMSQueueService'
export { SMSService, smsService } from './services/SMSService'
export { SMSValidationService } from './services/SMSValidationService'
export {
  AWSSNSWebhookHandler,
  MessageBirdWebhookHandler,
  SMSWebhookService,
  TwilioWebhookHandler,
} from './services/SMSWebhookService'

// Initialization
export { getSMSManager, getSMSService, initializeSMSSystem, isSMSInitialized } from './initialize'

// Service Types
export type {
  CostOptimizationResult,
  DateRange,
  FailureAnalysisResult,
  PeakUsageResult,
  ProviderPerformanceResult,
} from './services/SMSAnalyticsService'
export type { MessagePriority, QueueStats } from './services/SMSQueueService'
export type {
  BatchValidationResult,
  PhoneNumberValidationResult,
  ValidationResult,
} from './services/SMSValidationService'
export type { DeliveryReport, WebhookHandler } from './services/SMSWebhookService'

// Middleware
export { LoggingMiddleware } from './middleware/LoggingMiddleware'
export {
  RateLimitError,
  RateLimitMiddleware,
  waitForRateLimit,
} from './middleware/RateLimitMiddleware'
export { ValidationError, ValidationMiddleware } from './middleware/ValidationMiddleware'

// Middleware Types
export type { LoggingOptions } from './middleware/LoggingMiddleware'
export type { RateLimitConfig, RateLimitStatus } from './middleware/RateLimitMiddleware'

// Utilities
export { SMSLogger, logSMSError, logSMSOperation, measureTime, smsLogger } from './utils/logger'
export type { LogLevel, LogMetadata } from './utils/logger'
export * from './utils/messageUtils'
export * from './utils/phoneUtils'
