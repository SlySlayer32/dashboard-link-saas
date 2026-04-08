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
export { BaseSMSProvider } from './base/BaseSMSProvider.js'

// Provider implementations
export { AWSSNSProvider } from './providers/AWSSNSProvider.js'
export { MessageBirdProvider } from './providers/MessageBirdProvider.js'
export { MobileMessageProvider } from './providers/MobileMessageProvider.js'
export { TwilioProvider } from './providers/TwilioProvider.js'

// Registry and Manager
export { SMSManagerImpl, smsManager } from './manager/SMSManager.js'
export { createSMSProvider, registerDefaultSMSProviders } from './registry/SMSProviderFactory.js'
export { SMSRegistryImpl, smsRegistry } from './registry/SMSRegistry.js'

// Core Services
export { SMSAnalyticsService } from './services/SMSAnalyticsService.js'
export { SMSQueueService } from './services/SMSQueueService.js'
export { SMSService, smsService } from './services/SMSService.js'
export { SMSValidationService } from './services/SMSValidationService.js'
export {
  AWSSNSWebhookHandler,
  MessageBirdWebhookHandler,
  SMSWebhookService,
  TwilioWebhookHandler,
} from './services/SMSWebhookService.js'

// Initialization
export { getSMSManager, getSMSService, initializeSMSSystem, isSMSInitialized } from './initialize.js'

// Service Types
export type {
  CostOptimizationResult,
  DateRange,
  FailureAnalysisResult,
  PeakUsageResult,
  ProviderPerformanceResult,
} from './services/SMSAnalyticsService.js'
export type { MessagePriority, QueueStats } from './services/SMSQueueService.js'
export type {
  BatchValidationResult,
  PhoneNumberValidationResult,
  ValidationResult,
} from './services/SMSValidationService.js'
export type { DeliveryReport, WebhookHandler } from './services/SMSWebhookService.js'

// Middleware
export { LoggingMiddleware } from './middleware/LoggingMiddleware.js'
export {
  RateLimitError,
  RateLimitMiddleware,
  waitForRateLimit,
} from './middleware/RateLimitMiddleware.js'
export { ValidationError, ValidationMiddleware } from './middleware/ValidationMiddleware.js'

// Middleware Types
export type { LoggingOptions } from './middleware/LoggingMiddleware.js'
export type { RateLimitConfig, RateLimitStatus } from './middleware/RateLimitMiddleware.js'

// Utilities
export { SMSLogger, logSMSError, logSMSOperation, measureTime, smsLogger } from './utils/logger.js'
export type { LogLevel, LogMetadata } from './utils/logger.js'
export * from './utils/messageUtils.js'
export * from './utils/phoneUtils.js'
