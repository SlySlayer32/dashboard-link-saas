import {
    SMSManager as ISMSManager,
    SMSBatchResult,
    SMSMessage,
    SMSProvider,
    SMSResult
} from '@dashboard-link/shared';
import { smsRegistry } from '../registry/SMSRegistry';

/**
 * SMS Manager Implementation
 * Orchestrates SMS sending across multiple providers with fallback logic
 */
export class SMSManagerImpl implements ISMSManager {
  private registry = smsRegistry;

  registerProvider(provider: SMSProvider): void {
    this.registry.register(provider);
  }

  getProvider(id: string): SMSProvider | undefined {
    return this.registry.get(id);
  }

  getAllProviders(): SMSProvider[] {
    return this.registry.getAll();
  }

  /**
   * Send SMS with fallback to multiple providers
   * Tries each provider in order until one succeeds
   */
  async sendWithFallback(message: SMSMessage, providerIds: string[]): Promise<SMSResult> {
    let lastError = 'No providers attempted';

    for (const providerId of providerIds) {
      const provider = this.registry.get(providerId);
      if (!provider) {
        console.warn(`SMS provider '${providerId}' not found, skipping`);
        continue;
      }

      try {
        const result = await provider.send(message);
        if (result.success) {
          return result;
        }
        lastError = result.error || 'Unknown error';
        console.warn(`SMS provider '${providerId}' failed: ${lastError}`);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`SMS provider '${providerId}' threw error: ${lastError}`);
      }
    }

    // All providers failed
    return {
      success: false,
      messageId: '',
      provider: 'fallback',
      timestamp: new Date().toISOString(),
      error: `All providers failed. Last error: ${lastError}`,
      errorType: 'permanent'
    };
  }

  /**
   * Send SMS to all specified providers (useful for redundancy)
   */
  async sendToAll(message: SMSMessage, providerIds: string[]): Promise<SMSResult[]> {
    const promises = providerIds.map(async (providerId) => {
      const provider = this.registry.get(providerId);
      if (!provider) {
        return {
          success: false,
          messageId: '',
          provider: providerId,
          timestamp: new Date().toISOString(),
          error: `Provider '${providerId}' not found`,
          errorType: 'permanent' as const
        } as SMSResult;
      }

      try {
        return await provider.send(message);
      } catch (error) {
        return {
          success: false,
          messageId: '',
          provider: providerId,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: 'temporary' as const
        } as SMSResult;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get the best provider for a specific message
   * Considers factors like:
   * - Provider capabilities
   * - Message destination (geographic)
   * - Provider health status
   * - Rate limits
   */
  getBestProvider(message: SMSMessage): SMSProvider | undefined {
    const providers = this.registry.getAll();
    
    if (providers.length === 0) {
      return undefined;
    }

    // Simple logic: return first healthy provider
    // In production, this would be more sophisticated
    for (const provider of providers) {
      // Check if provider supports the message type
      if (message.body.length > 1600 && !provider.supportsMMS?.()) {
        continue; // Skip if message is too long and provider doesn't support MMS
      }

      // In a real implementation, you would check health status here
      // For now, return the first available provider
      return provider;
    }

    return undefined;
  }

  /**
   * Send batch SMS messages
   */
  async sendBatch(
    messages: SMSMessage[],
    providerId: string,
    options?: { parallel?: boolean; batchSize?: number }
  ): Promise<SMSBatchResult> {
    const provider = this.registry.get(providerId);
    if (!provider) {
      throw new Error(`SMS provider '${providerId}' not found`);
    }

    const parallel = options?.parallel ?? true;
    const batchSize = options?.batchSize ?? 100;

    const _startTime = Date.now();
    const results: SMSResult[] = [];

    if (parallel) {
      // Send all messages in parallel
      const batches = this.chunkArray(messages, batchSize);
      
      for (const batch of batches) {
        const batchResults = await Promise.all(
          batch.map(message => provider.send(message))
        );
        results.push(...batchResults);
      }
    } else {
      // Send messages sequentially
      for (const message of messages) {
        const result = await provider.send(message);
        results.push(result);
      }
    }

    const _endTime = Date.now();
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);

    return {
      totalMessages: messages.length,
      successful,
      failed,
      results,
      provider: providerId,
      timestamp: new Date().toISOString(),
      totalCost
    };
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(): Promise<Record<string, boolean>> {
    const providers = this.registry.getAll();
    const health: Record<string, boolean> = {};

    await Promise.all(
      providers.map(async (provider) => {
        try {
          const healthResult = await provider.getHealthCheck();
          health[provider.id] = healthResult.healthy;
        } catch (error) {
          health[provider.id] = false;
        }
      })
    );

    return health;
  }

  // Helper method
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Singleton instance for easy access
export const smsManager = new SMSManagerImpl();
