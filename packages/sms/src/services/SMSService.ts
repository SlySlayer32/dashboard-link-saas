import {
  SMSMessage,
  SMSResult,
  SMSBatchResult,
  SMSStatus,
  SMSDeliveryReport,
  SMSHealthResult,
  SMSMessageStats,
  SMSCostStats,
  SMSDeliveryStats
} from '@dashboard-link/shared';
import { SMSManagerImpl } from '../manager/SMSManager';
import { SMSValidationService } from './SMSValidationService';
import { SMSQueueService, MessagePriority } from './SMSQueueService';
import { SMSAnalyticsService, DateRange } from './SMSAnalyticsService';
import { SMSWebhookService } from './SMSWebhookService';

/**
 * Main SMS Service Facade
 * Provides a unified, high-level API for all SMS operations
 * Following Zapier's service facade pattern
 * 
 * This is the primary entry point for sending SMS messages, with:
 * - Automatic validation
 * - Queue management
 * - Analytics tracking
 * - Multi-provider support with failover
 */
export class SMSService {
  private manager: SMSManagerImpl;
  private validator: SMSValidationService;
  private queue: SMSQueueService;
  private analytics: SMSAnalyticsService;
  private webhook: SMSWebhookService;

  constructor(
    manager?: SMSManagerImpl,
    validator?: SMSValidationService,
    queue?: SMSQueueService,
    analytics?: SMSAnalyticsService,
    webhook?: SMSWebhookService
  ) {
    this.manager = manager || new SMSManagerImpl();
    this.validator = validator || new SMSValidationService();
    this.queue = queue || new SMSQueueService();
    this.analytics = analytics || new SMSAnalyticsService();
    this.webhook = webhook || new SMSWebhookService();
  }

  /**
   * Send a single SMS message
   * Validates, sends, and tracks the message
   */
  async sendMessage(
    message: SMSMessage,
    options?: {
      providerIds?: string[];
      skipValidation?: boolean;
      priority?: MessagePriority;
    }
  ): Promise<SMSResult> {
    // Validate message
    if (!options?.skipValidation) {
      const validation = this.validator.validateMessage(message);
      if (!validation.valid) {
        const result: SMSResult = {
          success: false,
          messageId: '',
          provider: 'validation',
          timestamp: new Date().toISOString(),
          error: validation.errors.join(', '),
          errorType: 'permanent'
        };
        this.analytics.recordMessage(result);
        return result;
      }
    }

    // Sanitize message
    const sanitized = this.validator.sanitizeMessage(message);

    // Send with fallback
    let result: SMSResult;
    
    if (options?.providerIds && options.providerIds.length > 0) {
      result = await this.manager.sendWithFallback(sanitized, options.providerIds);
    } else {
      // Use best provider
      const provider = this.manager.getBestProvider(sanitized);
      if (!provider) {
        result = {
          success: false,
          messageId: '',
          provider: 'none',
          timestamp: new Date().toISOString(),
          error: 'No SMS providers available',
          errorType: 'permanent'
        };
      } else {
        result = await provider.send(sanitized);
      }
    }

    // Record for analytics
    this.analytics.recordMessage(result);

    return result;
  }

  /**
   * Send batch SMS messages
   */
  async sendBatch(
    messages: SMSMessage[],
    options?: {
      providerId?: string;
      parallel?: boolean;
      batchSize?: number;
      skipValidation?: boolean;
    }
  ): Promise<SMSBatchResult> {
    // Validate batch
    if (!options?.skipValidation) {
      const validation = this.validator.validateBatch(messages);
      if (!validation.valid) {
        // Return batch result with all failures
        const results: SMSResult[] = messages.map((msg, index) => ({
          success: false,
          messageId: '',
          provider: 'validation',
          timestamp: new Date().toISOString(),
          error: validation.results[index]?.errors.join(', ') || 'Validation failed',
          errorType: 'permanent'
        }));

        return {
          totalMessages: messages.length,
          successful: 0,
          failed: messages.length,
          results,
          provider: 'validation',
          timestamp: new Date().toISOString(),
          totalCost: 0
        };
      }
    }

    // Sanitize messages
    const sanitized = messages.map(msg => this.validator.sanitizeMessage(msg));

    // Determine provider
    const providerId = options?.providerId || this.manager.getBestProvider(sanitized[0])?.id;
    
    if (!providerId) {
      throw new Error('No SMS provider available');
    }

    // Send batch
    const result = await this.manager.sendBatch(sanitized, providerId, {
      parallel: options?.parallel,
      batchSize: options?.batchSize
    });

    // Record results for analytics
    for (const msgResult of result.results) {
      this.analytics.recordMessage(msgResult);
    }

    return result;
  }

  /**
   * Schedule a message for future delivery
   */
  async scheduleMessage(
    message: SMSMessage,
    scheduledFor: Date,
    options?: {
      providerIds?: string[];
      priority?: MessagePriority;
    }
  ): Promise<SMSResult> {
    // Add scheduled time to message
    const scheduledMessage: SMSMessage = {
      ...message,
      scheduledFor
    };

    // Validate
    const validation = this.validator.validateMessage(scheduledMessage);
    if (!validation.valid) {
      return {
        success: false,
        messageId: '',
        provider: 'validation',
        timestamp: new Date().toISOString(),
        error: validation.errors.join(', '),
        errorType: 'permanent'
      };
    }

    // Add to queue with scheduled time
    const sanitized = this.validator.sanitizeMessage(scheduledMessage);
    const messageId = await this.queue.enqueue(
      sanitized,
      options?.priority || 'normal',
      options?.providerIds?.[0]
    );

    return {
      success: true,
      messageId,
      provider: 'queue',
      timestamp: new Date().toISOString(),
      metadata: {
        scheduled: true,
        scheduledFor: scheduledFor.toISOString()
      }
    };
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string, providerId: string): Promise<SMSStatus> {
    const provider = this.manager.getProvider(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return provider.getStatus(messageId);
  }

  /**
   * Get delivery report for a message
   */
  async getDeliveryReport(messageId: string): Promise<SMSDeliveryReport | undefined> {
    const webhookReport = this.webhook.getDeliveryReport(messageId);
    
    if (webhookReport) {
      return {
        status: webhookReport.status,
        deliveredAt: webhookReport.deliveredAt,
        errorReason: webhookReport.errorReason,
        attempts: 1
      };
    }

    return undefined;
  }

  /**
   * Get health status of all providers
   */
  async getProviderHealth(): Promise<Record<string, SMSHealthResult>> {
    const providers = this.manager.getAllProviders();
    const health: Record<string, SMSHealthResult> = {};

    await Promise.all(
      providers.map(async (provider) => {
        try {
          health[provider.id] = await provider.getHealthCheck();
        } catch (error) {
          health[provider.id] = {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        }
      })
    );

    return health;
  }

  /**
   * Switch primary provider
   */
  async switchProvider(providerId: string): Promise<void> {
    const provider = this.manager.getProvider(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Verify provider is healthy
    const health = await provider.getHealthCheck();
    if (!health.healthy) {
      throw new Error(`Provider ${providerId} is not healthy: ${health.error}`);
    }

    // In a real implementation, this would update configuration
    // to make this provider the default/primary
    console.log(`Switched primary provider to: ${providerId}`);
  }

  /**
   * Get analytics for date range
   */
  async getAnalytics(dateRange: DateRange): Promise<{
    messageStats: SMSMessageStats;
    costStats: SMSCostStats;
    deliveryStats: SMSDeliveryStats;
  }> {
    const [messageStats, costStats, deliveryStats] = await Promise.all([
      this.analytics.getMessageStats(dateRange),
      this.analytics.getCostByProvider(dateRange),
      this.analytics.getDeliveryRates(dateRange)
    ]);

    return {
      messageStats,
      costStats,
      deliveryStats
    };
  }

  /**
   * Get cost breakdown
   */
  async getCostBreakdown(dateRange: DateRange): Promise<SMSCostStats> {
    return this.analytics.getCostByProvider(dateRange);
  }

  /**
   * Process message queue
   */
  async processQueue(providerId: string, batchSize: number = 100): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const provider = this.manager.getProvider(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return this.queue.processQueue(
      providerId,
      async (message) => {
        const result = await provider.send(message);
        this.analytics.recordMessage(result);
        return result;
      },
      { batchSize }
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    return this.queue.getQueueStats();
  }

  /**
   * Get webhook service for delivery reports
   */
  getWebhookService(): SMSWebhookService {
    return this.webhook;
  }

  /**
   * Get validation service
   */
  getValidationService(): SMSValidationService {
    return this.validator;
  }

  /**
   * Get analytics service
   */
  getAnalyticsService(): SMSAnalyticsService {
    return this.analytics;
  }

  /**
   * Get queue service
   */
  getQueueService(): SMSQueueService {
    return this.queue;
  }

  /**
   * Get manager
   */
  getManager(): SMSManagerImpl {
    return this.manager;
  }
}

// Export singleton instance for easy access
export const smsService = new SMSService();
