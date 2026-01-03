// SMS Gateway Package - Zapier-Style Architecture
// Export all SMS-related components

// Core types and interfaces
export type {
    SMSAnalytics, SMSBatchResult, SMSConfigValidationResult, SMSCostStats, SMSDeliveryReport, SMSDeliveryStats,
    SMSError, SMSHealthResult,
    SMSManager, SMSMessage, SMSMessageStats, SMSProvider, SMSProviderConfig, SMSRegistry, SMSResult,
    SMSStatus
} from '@dashboard-link/shared';

// Base adapter
export { BaseSMSProvider } from './base/BaseSMSProvider';

// Provider implementations
export { MobileMessageProvider } from './providers/MobileMessageProvider';
export { TwilioProvider } from './providers/TwilioProvider';
export { AWSSNSProvider } from './providers/AWSSNSProvider';
export { MessageBirdProvider } from './providers/MessageBirdProvider';

// Registry and Manager
export { SMSManagerImpl, smsManager } from './manager/SMSManager';
export { SMSRegistryImpl, smsRegistry } from './registry/SMSRegistry';

// Core Services
export { SMSService, smsService } from './services/SMSService';
export { SMSValidationService } from './services/SMSValidationService';
export { SMSQueueService } from './services/SMSQueueService';
export { SMSAnalyticsService } from './services/SMSAnalyticsService';
export { SMSWebhookService, TwilioWebhookHandler, AWSSNSWebhookHandler, MessageBirdWebhookHandler } from './services/SMSWebhookService';

// Service Types
export type { ValidationResult, BatchValidationResult, PhoneNumberValidationResult } from './services/SMSValidationService';
export type { MessagePriority, QueueStats } from './services/SMSQueueService';
export type { DateRange, FailureAnalysisResult, CostOptimizationResult, ProviderPerformanceResult, PeakUsageResult } from './services/SMSAnalyticsService';
export type { DeliveryReport, WebhookHandler } from './services/SMSWebhookService';

// Middleware
export { RateLimitMiddleware, RateLimitError, waitForRateLimit } from './middleware/RateLimitMiddleware';
export { ValidationMiddleware, ValidationError } from './middleware/ValidationMiddleware';
export { LoggingMiddleware } from './middleware/LoggingMiddleware';

// Middleware Types
export type { RateLimitConfig, RateLimitStatus } from './middleware/RateLimitMiddleware';
export type { LoggingOptions } from './middleware/LoggingMiddleware';

// Utilities
export * from './utils/phoneUtils';
export * from './utils/messageUtils';
export { SMSLogger, smsLogger, measureTime, logSMSOperation, logSMSError } from './utils/logger';
export type { LogLevel, LogMetadata } from './utils/logger';
