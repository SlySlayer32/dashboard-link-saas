import { describe, it, expect, beforeEach } from 'vitest';
import { SMSQueueService } from '../../services/SMSQueueService';
import { SMSMessage } from '@dashboard-link/shared';

describe('SMSQueueService', () => {
  let queueService: SMSQueueService;

  beforeEach(() => {
    queueService = new SMSQueueService();
  });

  describe('enqueue', () => {
    it('should enqueue a message with normal priority', async () => {
      const message: SMSMessage = {
        to: '+61412345678',
        body: 'Test message'
      };

      const messageId = await queueService.enqueue(message, 'normal');

      expect(messageId).toBeDefined();
      expect(messageId).toMatch(/^msg_/);
      expect(queueService.getTotalQueueSize()).toBe(1);
    });

    it('should enqueue messages with different priorities', async () => {
      await queueService.enqueue({ to: '+61412345678', body: 'Low' }, 'low');
      await queueService.enqueue({ to: '+61412345678', body: 'Normal' }, 'normal');
      await queueService.enqueue({ to: '+61412345678', body: 'High' }, 'high');
      await queueService.enqueue({ to: '+61412345678', body: 'Urgent' }, 'urgent');

      expect(queueService.getTotalQueueSize()).toBe(4);
      expect(queueService.getQueueSize('urgent')).toBe(1);
      expect(queueService.getQueueSize('high')).toBe(1);
      expect(queueService.getQueueSize('normal')).toBe(1);
      expect(queueService.getQueueSize('low')).toBe(1);
    });
  });

  describe('dequeue', () => {
    it('should dequeue messages in priority order', async () => {
      // Enqueue in reverse order
      await queueService.enqueue({ to: '+61412345678', body: 'Low' }, 'low');
      await queueService.enqueue({ to: '+61412345678', body: 'Normal' }, 'normal');
      await queueService.enqueue({ to: '+61412345678', body: 'High' }, 'high');
      await queueService.enqueue({ to: '+61412345678', body: 'Urgent' }, 'urgent');

      // Should dequeue in priority order: urgent > high > normal > low
      const msg1 = await queueService.dequeue();
      expect(msg1?.body).toBe('Urgent');

      const msg2 = await queueService.dequeue();
      expect(msg2?.body).toBe('High');

      const msg3 = await queueService.dequeue();
      expect(msg3?.body).toBe('Normal');

      const msg4 = await queueService.dequeue();
      expect(msg4?.body).toBe('Low');

      const msg5 = await queueService.dequeue();
      expect(msg5).toBeNull();
    });

    it('should return null when queue is empty', async () => {
      const message = await queueService.dequeue();
      expect(message).toBeNull();
    });

    it('should dequeue FIFO within same priority', async () => {
      await queueService.enqueue({ to: '+61412345678', body: 'First' }, 'normal');
      await queueService.enqueue({ to: '+61487654321', body: 'Second' }, 'normal');
      await queueService.enqueue({ to: '+61400123456', body: 'Third' }, 'normal');

      const msg1 = await queueService.dequeue();
      expect(msg1?.body).toBe('First');

      const msg2 = await queueService.dequeue();
      expect(msg2?.body).toBe('Second');

      const msg3 = await queueService.dequeue();
      expect(msg3?.body).toBe('Third');
    });

    it('should skip scheduled messages not yet due', async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      await queueService.enqueue({
        to: '+61412345678',
        body: 'Immediate'
      }, 'normal');

      await queueService.enqueue({
        to: '+61487654321',
        body: 'Scheduled',
        scheduledFor: futureDate
      }, 'normal');

      const msg = await queueService.dequeue();
      expect(msg?.body).toBe('Immediate');

      const msg2 = await queueService.dequeue();
      expect(msg2).toBeNull(); // Scheduled message should not be dequeued yet
    });
  });

  describe('getQueueStats', () => {
    it('should return correct queue statistics', async () => {
      await queueService.enqueue({ to: '+61412345678', body: 'Msg1' }, 'urgent');
      await queueService.enqueue({ to: '+61487654321', body: 'Msg2' }, 'high');
      await queueService.enqueue({ to: '+61400123456', body: 'Msg3' }, 'normal');
      await queueService.enqueue({ to: '+61411111111', body: 'Msg4' }, 'low');

      const stats = await queueService.getQueueStats();

      expect(stats.totalQueued).toBe(4);
      expect(stats.byPriority.urgent).toBe(1);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.normal).toBe(1);
      expect(stats.byPriority.low).toBe(1);
      expect(stats.oldestMessageAge).toBeGreaterThanOrEqual(0);
    });

    it('should return zero stats for empty queue', async () => {
      const stats = await queueService.getQueueStats();

      expect(stats.totalQueued).toBe(0);
      expect(stats.oldestMessageAge).toBe(0);
      expect(stats.averageWaitTime).toBe(0);
    });
  });

  describe('clearQueues', () => {
    it('should clear all queues', async () => {
      await queueService.enqueue({ to: '+61412345678', body: 'Msg1' }, 'urgent');
      await queueService.enqueue({ to: '+61487654321', body: 'Msg2' }, 'high');
      await queueService.enqueue({ to: '+61400123456', body: 'Msg3' }, 'normal');

      expect(queueService.getTotalQueueSize()).toBe(3);

      await queueService.clearQueues();

      expect(queueService.getTotalQueueSize()).toBe(0);
    });
  });

  describe('getScheduledMessages', () => {
    it('should return scheduled messages', async () => {
      const futureDate1 = new Date(Date.now() + 3600000); // 1 hour
      const futureDate2 = new Date(Date.now() + 7200000); // 2 hours

      await queueService.enqueue({
        to: '+61412345678',
        body: 'Immediate'
      }, 'normal');

      await queueService.enqueue({
        to: '+61487654321',
        body: 'Scheduled 1',
        scheduledFor: futureDate1
      }, 'normal');

      await queueService.enqueue({
        to: '+61400123456',
        body: 'Scheduled 2',
        scheduledFor: futureDate2
      }, 'normal');

      const scheduled = await queueService.getScheduledMessages();

      expect(scheduled).toHaveLength(2);
      expect(scheduled[0].message.body).toBe('Scheduled 1');
      expect(scheduled[1].message.body).toBe('Scheduled 2');
    });
  });

  describe('cancelScheduledMessage', () => {
    it('should cancel a scheduled message', async () => {
      const futureDate = new Date(Date.now() + 3600000);

      const messageId = await queueService.enqueue({
        to: '+61412345678',
        body: 'Scheduled',
        scheduledFor: futureDate
      }, 'normal');

      expect(queueService.getTotalQueueSize()).toBe(1);

      const cancelled = await queueService.cancelScheduledMessage(messageId);

      expect(cancelled).toBe(true);
      expect(queueService.getTotalQueueSize()).toBe(0);
    });

    it('should return false for non-existent message', async () => {
      const cancelled = await queueService.cancelScheduledMessage('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('getTotalQueueSize', () => {
    it('should return correct total size', async () => {
      expect(queueService.getTotalQueueSize()).toBe(0);

      await queueService.enqueue({ to: '+61412345678', body: 'Msg1' }, 'normal');
      expect(queueService.getTotalQueueSize()).toBe(1);

      await queueService.enqueue({ to: '+61487654321', body: 'Msg2' }, 'high');
      expect(queueService.getTotalQueueSize()).toBe(2);

      await queueService.dequeue();
      expect(queueService.getTotalQueueSize()).toBe(1);
    });
  });

  describe('getQueueSize', () => {
    it('should return size for specific priority', async () => {
      await queueService.enqueue({ to: '+61412345678', body: 'Msg1' }, 'normal');
      await queueService.enqueue({ to: '+61487654321', body: 'Msg2' }, 'normal');
      await queueService.enqueue({ to: '+61400123456', body: 'Msg3' }, 'high');

      expect(queueService.getQueueSize('normal')).toBe(2);
      expect(queueService.getQueueSize('high')).toBe(1);
      expect(queueService.getQueueSize('urgent')).toBe(0);
    });
  });
});
