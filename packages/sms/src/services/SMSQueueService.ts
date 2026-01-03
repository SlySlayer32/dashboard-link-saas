import { SMSMessage, SMSResult } from '@dashboard-link/shared';

/**
 * Message priority levels
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Queue statistics
 */
export interface QueueStats {
  totalQueued: number;
  byPriority: Record<MessagePriority, number>;
  byProvider: Record<string, number>;
  oldestMessageAge: number; // in milliseconds
  averageWaitTime: number; // in milliseconds
}

/**
 * Queued message wrapper
 */
interface QueuedMessage {
  id: string;
  message: SMSMessage;
  priority: MessagePriority;
  providerId?: string;
  enqueuedAt: Date;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastError?: string;
}

/**
 * SMS Queue Service
 * Manages message queuing, prioritization, and processing
 * Following Zapier's queue-based architecture for reliability
 */
export class SMSQueueService {
  private queues: Map<MessagePriority, QueuedMessage[]>;
  private processingLocks: Map<string, boolean>;
  private readonly priorityOrder: MessagePriority[] = ['urgent', 'high', 'normal', 'low'];

  constructor() {
    this.queues = new Map([
      ['urgent', []],
      ['high', []],
      ['normal', []],
      ['low', []]
    ]);
    this.processingLocks = new Map();
  }

  /**
   * Add message to queue
   */
  async enqueue(
    message: SMSMessage,
    priority: MessagePriority = 'normal',
    providerId?: string,
    maxAttempts: number = 3
  ): Promise<string> {
    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      message,
      priority,
      providerId,
      enqueuedAt: new Date(),
      attempts: 0,
      maxAttempts
    };

    const queue = this.queues.get(priority);
    if (!queue) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    queue.push(queuedMessage);
    
    // Sort queue by enqueued time (FIFO within priority)
    queue.sort((a, b) => a.enqueuedAt.getTime() - b.enqueuedAt.getTime());

    return queuedMessage.id;
  }

  /**
   * Dequeue next message for a provider
   * Respects priority order: urgent > high > normal > low
   */
  async dequeue(providerId?: string): Promise<SMSMessage | null> {
    // Try to get message from each priority level
    for (const priority of this.priorityOrder) {
      const queue = this.queues.get(priority);
      if (!queue || queue.length === 0) {
        continue;
      }

      // Filter by provider if specified
      const availableMessages = providerId
        ? queue.filter(msg => !msg.providerId || msg.providerId === providerId)
        : queue;

      if (availableMessages.length === 0) {
        continue;
      }

      // Find first message that's ready to send
      for (let i = 0; i < availableMessages.length; i++) {
        const queuedMsg = availableMessages[i];
        
        // Skip if scheduled for future
        if (queuedMsg.message.scheduledFor && new Date(queuedMsg.message.scheduledFor) > new Date()) {
          continue;
        }

        // Skip if waiting for retry
        if (queuedMsg.nextRetryAt && queuedMsg.nextRetryAt > new Date()) {
          continue;
        }

        // Remove from queue and return
        const index = queue.indexOf(queuedMsg);
        queue.splice(index, 1);
        
        return queuedMsg.message;
      }
    }

    return null;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const byPriority: Record<MessagePriority, number> = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0
    };

    const byProvider: Record<string, number> = {};
    let oldestMessageTime = Date.now();
    let totalWaitTime = 0;
    let totalMessages = 0;

    // Calculate stats from all queues
    for (const [priority, queue] of this.queues.entries()) {
      byPriority[priority as MessagePriority] = queue.length;
      totalMessages += queue.length;

      for (const msg of queue) {
        // Track by provider
        const provider = msg.providerId || 'any';
        byProvider[provider] = (byProvider[provider] || 0) + 1;

        // Track oldest message
        if (msg.enqueuedAt.getTime() < oldestMessageTime) {
          oldestMessageTime = msg.enqueuedAt.getTime();
        }

        // Calculate wait time
        totalWaitTime += Date.now() - msg.enqueuedAt.getTime();
      }
    }

    const oldestMessageAge = totalMessages > 0 ? Date.now() - oldestMessageTime : 0;
    const averageWaitTime = totalMessages > 0 ? totalWaitTime / totalMessages : 0;

    return {
      totalQueued: totalMessages,
      byPriority,
      byProvider,
      oldestMessageAge,
      averageWaitTime
    };
  }

  /**
   * Process queue for a specific provider
   * This is called by the SMS service to send queued messages
   */
  async processQueue(
    providerId: string,
    sendFunction: (message: SMSMessage) => Promise<SMSResult>,
    options?: {
      batchSize?: number;
      concurrency?: number;
      stopOnError?: boolean;
    }
  ): Promise<{ processed: number; successful: number; failed: number }> {
    // Prevent concurrent processing for same provider
    const lockKey = `process-${providerId}`;
    if (this.processingLocks.get(lockKey)) {
      throw new Error(`Queue processing already in progress for provider: ${providerId}`);
    }

    this.processingLocks.set(lockKey, true);

    try {
      const batchSize = options?.batchSize || 100;
      const concurrency = options?.concurrency || 10;
      const stopOnError = options?.stopOnError || false;

      let processed = 0;
      let successful = 0;
      let failed = 0;

      // Process messages in batches
      while (processed < batchSize) {
        const messages: SMSMessage[] = [];
        
        // Dequeue messages up to concurrency limit
        for (let i = 0; i < concurrency && processed + i < batchSize; i++) {
          const message = await this.dequeue(providerId);
          if (!message) break;
          messages.push(message);
        }

        if (messages.length === 0) {
          break; // No more messages to process
        }

        // Send messages concurrently
        const results = await Promise.allSettled(
          messages.map(msg => sendFunction(msg))
        );

        // Process results
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          processed++;

          if (result.status === 'fulfilled' && result.value.success) {
            successful++;
          } else {
            failed++;
            
            // Handle failure - could re-queue with exponential backoff
            const message = messages[i];
            const error = result.status === 'rejected' 
              ? result.reason 
              : (result.value as SMSResult).error;

            await this.handleFailedMessage(message, error, providerId);

            if (stopOnError) {
              break;
            }
          }
        }

        if (stopOnError && failed > 0) {
          break;
        }
      }

      return { processed, successful, failed };
    } finally {
      this.processingLocks.delete(lockKey);
    }
  }

  /**
   * Handle failed message - re-queue with retry logic
   */
  private async handleFailedMessage(
    message: SMSMessage,
    error: string,
    providerId?: string
  ): Promise<void> {
    // For now, we'll re-queue with normal priority
    // In production, implement exponential backoff and max retry logic
    
    // Don't re-queue if it was a permanent error
    if (error?.includes('invalid_number') || error?.includes('permanent')) {
      console.error(`Permanent error for message to ${message.to}: ${error}`);
      return;
    }

    // Re-queue with delay (exponential backoff would be better)
    await this.enqueue(message, 'low', providerId);
  }

  /**
   * Clear all queues
   */
  async clearQueues(): Promise<void> {
    for (const queue of this.queues.values()) {
      queue.length = 0;
    }
  }

  /**
   * Get messages waiting for specific provider
   */
  async getProviderQueue(providerId: string): Promise<QueuedMessage[]> {
    const messages: QueuedMessage[] = [];
    
    for (const queue of this.queues.values()) {
      const providerMessages = queue.filter(
        msg => !msg.providerId || msg.providerId === providerId
      );
      messages.push(...providerMessages);
    }

    return messages;
  }

  /**
   * Get scheduled messages
   */
  async getScheduledMessages(): Promise<QueuedMessage[]> {
    const messages: QueuedMessage[] = [];
    const now = new Date();
    
    for (const queue of this.queues.values()) {
      const scheduled = queue.filter(
        msg => msg.message.scheduledFor && new Date(msg.message.scheduledFor) > now
      );
      messages.push(...scheduled);
    }

    return messages.sort((a, b) => {
      const dateA = new Date(a.message.scheduledFor || 0);
      const dateB = new Date(b.message.scheduledFor || 0);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Cancel scheduled message
   */
  async cancelScheduledMessage(messageId: string): Promise<boolean> {
    for (const queue of this.queues.values()) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        queue.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get queue size for specific priority
   */
  getQueueSize(priority: MessagePriority): number {
    return this.queues.get(priority)?.length || 0;
  }

  /**
   * Get total queue size across all priorities
   */
  getTotalQueueSize(): number {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.length;
    }
    return total;
  }
}
