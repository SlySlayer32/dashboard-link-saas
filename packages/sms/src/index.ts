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

// Registry and Manager
export { SMSManagerImpl, smsManager } from './manager/SMSManager';
export { SMSRegistryImpl, smsRegistry } from './registry/SMSRegistry';

// Legacy exports for backward compatibility
export { SMSService } from './services/SMSService';
