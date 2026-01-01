// SMS Gateway Standard Contracts - Zapier-Style Architecture
// This is the "insulation layer" that protects your core system from provider changes

export interface SMSProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  
  // Core SMS operations
  send(message: SMSMessage): Promise<SMSResult>;
  getStatus(messageId: string): Promise<SMSStatus>;
  
  // Provider-specific configuration
  validateConfig(config: SMSProviderConfig): Promise<SMSConfigValidationResult>;
  getHealthCheck(): Promise<SMSHealthResult>;
  
  // Optional capabilities
  supportsDeliveryReports?(): boolean;
  supportsScheduledMessages?(): boolean;
  supportsMMS?(): boolean;
}

// Standard SMS message format - YOUR format, never changes
export interface SMSMessage {
  to: string;           // E.164 format (e.g., +61412345678)
  body: string;
  from?: string;         // Optional sender ID
  metadata?: Record<string, unknown>; // Your system's metadata
  scheduledFor?: Date;  // Optional scheduling
  priority?: 'low' | 'normal' | 'high';
  tags?: string[];       // For categorization
}

// Standard SMS result format - YOUR format, never changes
export interface SMSResult {
  success: boolean;
  messageId: string;
  provider: string;      // Provider ID for tracking
  timestamp: string;     // ISO 8601
  cost?: number;         // In your currency
  error?: string;
  errorType?: 'temporary' | 'permanent' | 'rate_limit' | 'invalid_number';
  deliveryReport?: SMSDeliveryReport;
  metadata?: Record<string, unknown>; // Provider-specific data
}

export interface SMSDeliveryReport {
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  deliveredAt?: string;  // ISO 8601
  errorReason?: string;
  attempts?: number;
}

export interface SMSStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending' | 'unknown';
  timestamp: string;     // ISO 8601
  deliveredAt?: string;   // ISO 8601
  errorReason?: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

// Provider configuration
export interface SMSProviderConfig {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  rateLimits?: {
    messagesPerSecond?: number;
    messagesPerDay?: number;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface SMSConfigValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface SMSHealthResult {
  healthy: boolean;
  responseTime?: number; // in milliseconds
  error?: string;
  lastChecked: string;   // ISO 8601
  metadata?: Record<string, unknown>;
}

// SMS Manager for orchestrating multiple providers
export interface SMSManager {
  registerProvider(provider: SMSProvider): void;
  getProvider(id: string): SMSProvider | undefined;
  getAllProviders(): SMSProvider[];
  sendWithFallback(message: SMSMessage, providerIds: string[]): Promise<SMSResult>;
  sendToAll(message: SMSMessage, providerIds: string[]): Promise<SMSResult[]>;
  getBestProvider(message: SMSMessage): SMSProvider | undefined;
}

// SMS Registry for managing providers
export interface SMSRegistry {
  register(provider: SMSProvider): void;
  unregister(id: string): void;
  get(id: string): SMSProvider | undefined;
  getAll(): SMSProvider[];
  search(query: string): SMSProvider[];
}

// Batch operations for enterprise features
export interface SMSBatchResult {
  totalMessages: number;
  successful: number;
  failed: number;
  results: SMSResult[];
  provider: string;
  timestamp: string;
  totalCost?: number;
}

// SMS Analytics interface
export interface SMSAnalytics {
  getMessageStats(dateRange: { start: string; end: string }): Promise<SMSMessageStats>;
  getCostByProvider(dateRange: { start: string; end: string }): Promise<SMSCostStats>;
  getDeliveryRates(dateRange: { start: string; end: string }): Promise<SMSDeliveryStats>;
}

export interface SMSMessageStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  averageDeliveryTime: number; // in minutes
  byProvider: Record<string, number>;
}

export interface SMSCostStats {
  totalCost: number;
  costByProvider: Record<string, number>;
  averageCostPerMessage: number;
  currency: string;
}

export interface SMSDeliveryStats {
  overallDeliveryRate: number; // percentage
  deliveryRateByProvider: Record<string, number>;
  failureReasons: Record<string, number>;
  peakHours: { hour: number; messages: number }[];
}

// Error types for better error handling
export interface SMSError {
  code: string;
  message: string;
  type: 'temporary' | 'permanent' | 'rate_limit' | 'invalid_number' | 'config_error';
  provider: string;
  timestamp: string;
  retryable: boolean;
  metadata?: Record<string, unknown>;
}
