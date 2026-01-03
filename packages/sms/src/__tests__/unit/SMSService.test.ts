import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SMSService } from '../../services/SMSService';
import { SMSManagerImpl } from '../../manager/SMSManager';
import { SMSValidationService } from '../../services/SMSValidationService';
import { SMSQueueService } from '../../services/SMSQueueService';
import { SMSAnalyticsService } from '../../services/SMSAnalyticsService';
import { SMSWebhookService } from '../../services/SMSWebhookService';
import { SMSProvider, SMSMessage, SMSResult } from '@dashboard-link/shared';

describe('SMSService', () => {
  let smsService: SMSService;
  let mockProvider: SMSProvider;

  beforeEach(() => {
    // Create a mock provider
    mockProvider = {
      id: 'test-provider',
      name: 'Test Provider',
      version: '1.0.0',
      send: vi.fn(async (message: SMSMessage): Promise<SMSResult> => ({
        success: true,
        messageId: 'test-msg-123',
        provider: 'test-provider',
        timestamp: new Date().toISOString(),
        cost: 0.01
      })),
      getStatus: vi.fn(async (messageId: string) => ({
        messageId,
        status: 'sent' as const,
        timestamp: new Date().toISOString()
      })),
      validateConfig: vi.fn(async () => ({
        valid: true
      })),
      getHealthCheck: vi.fn(async () => ({
        healthy: true,
        lastChecked: new Date().toISOString()
      })),
      supportsDeliveryReports: () => false,
      supportsScheduledMessages: () => false,
      supportsMMS: () => false
    };

    // Create service with fresh instances
    const manager = new SMSManagerImpl();
    manager.registerProvider(mockProvider);
    
    smsService = new SMSService(
      manager,
      new SMSValidationService(),
      new SMSQueueService(),
      new SMSAnalyticsService(),
      new SMSWebhookService()
    );
  });

  describe('sendMessage', () => {
    it('should send a valid message successfully', async () => {
      const message: SMSMessage = {
        to: '+61412345678',
        body: 'Test message'
      };

      const result = await smsService.sendMessage(message, {
        providerIds: ['test-provider']
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-msg-123');
      expect(result.provider).toBe('test-provider');
      expect(mockProvider.send).toHaveBeenCalled();
    });

    it('should reject invalid message', async () => {
      const message: SMSMessage = {
        to: 'invalid-phone',
        body: 'Test message'
      };

      const result = await smsService.sendMessage(message, {
        providerIds: ['test-provider']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockProvider.send).not.toHaveBeenCalled();
    });

    it('should sanitize message before sending', async () => {
      const message: SMSMessage = {
        to: '  +61412345678  ',
        body: '  Test   message  '
      };

      await smsService.sendMessage(message, {
        providerIds: ['test-provider']
      });

      expect(mockProvider.send).toHaveBeenCalled();
      const sentMessage = (mockProvider.send as any).mock.calls[0][0];
      expect(sentMessage.to).toBe('+61412345678');
    });

    it('should skip validation when requested', async () => {
      const message: SMSMessage = {
        to: 'invalid-phone',
        body: 'Test message'
      };

      await smsService.sendMessage(message, {
        providerIds: ['test-provider'],
        skipValidation: true
      });

      // Should attempt to send even with invalid phone
      expect(mockProvider.send).toHaveBeenCalled();
    });
  });

  describe('sendBatch', () => {
    it('should send batch of valid messages', async () => {
      const messages: SMSMessage[] = [
        { to: '+61412345678', body: 'Message 1' },
        { to: '+61487654321', body: 'Message 2' }
      ];

      const result = await smsService.sendBatch(messages, {
        providerId: 'test-provider'
      });

      expect(result.totalMessages).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(mockProvider.send).toHaveBeenCalledTimes(2);
    });

    it('should handle batch with validation errors', async () => {
      const messages: SMSMessage[] = [
        { to: '+61412345678', body: 'Message 1' },
        { to: 'invalid', body: 'Message 2' }
      ];

      const result = await smsService.sendBatch(messages, {
        providerId: 'test-provider'
      });

      expect(result.success).toBe(false);
      expect(result.failed).toBe(2);
      expect(mockProvider.send).not.toHaveBeenCalled();
    });
  });

  describe('scheduleMessage', () => {
    it('should schedule a valid message', async () => {
      const message: SMSMessage = {
        to: '+61412345678',
        body: 'Scheduled message'
      };
      const scheduledFor = new Date(Date.now() + 3600000); // 1 hour from now

      const result = await smsService.scheduleMessage(message, scheduledFor);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.metadata?.scheduled).toBe(true);
    });

    it('should reject scheduling in the past', async () => {
      const message: SMSMessage = {
        to: '+61412345678',
        body: 'Scheduled message'
      };
      const scheduledFor = new Date(Date.now() - 3600000); // 1 hour ago

      const result = await smsService.scheduleMessage(message, scheduledFor);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProviderHealth', () => {
    it('should get health status of all providers', async () => {
      const health = await smsService.getProviderHealth();

      expect(health['test-provider']).toBeDefined();
      expect(health['test-provider'].healthy).toBe(true);
      expect(mockProvider.getHealthCheck).toHaveBeenCalled();
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics for date range', async () => {
      const dateRange = {
        start: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        end: new Date().toISOString()
      };

      const analytics = await smsService.getAnalytics(dateRange);

      expect(analytics.messageStats).toBeDefined();
      expect(analytics.costStats).toBeDefined();
      expect(analytics.deliveryStats).toBeDefined();
    });
  });

  describe('processQueue', () => {
    it('should process queued messages', async () => {
      // Add messages to queue
      const queueService = smsService.getQueueService();
      await queueService.enqueue({ to: '+61412345678', body: 'Queued message 1' });
      await queueService.enqueue({ to: '+61487654321', body: 'Queued message 2' });

      const result = await smsService.processQueue('test-provider', 10);

      expect(result.processed).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });
  });
});
