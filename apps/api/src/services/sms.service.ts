import {
    SMSManager,
    SMSMessage,
    SMSResult,
    formatAustralianPhone, validateAustralianPhone
} from '@dashboard-link/shared';
import { smsManager } from '@dashboard-link/sms';

/**
 * Refactored SMS Service - Zapier-Style Architecture
 * 
 * This service now uses the SMS abstraction layer
 * It no longer knows about MobileMessage.com.au specifics
 * 
 * BEFORE: Direct API calls to MobileMessage
 * AFTER: Uses SMSProvider interface - can switch providers without code changes
 */

export interface SendSMSOptions {
  phone: string; // Will be formatted to E.164
  message: string;
  senderId?: string;
  organizationId?: string;
  workerId?: string;
  providerId?: string; // Optional: specify which provider to use
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  cost?: number;
}

export class SMSService {
  private static manager: SMSManager = smsManager;
  
  /**
   * Send an SMS using the configured provider(s)
   * 
   * Key changes from old implementation:
   * 1. No longer hardcoded to MobileMessage
   * 2. Uses standard SMSMessage format
   * 3. Supports provider fallback
   * 4. Returns standardized SMSResult
   */
  static async sendSMS(options: SendSMSOptions): Promise<SMSResponse> {
    if (!options.phone || !options.message) {
      return {
        success: false,
        error: 'Phone number and message are required'
      };
    }

    try {
      // Format phone to E.164
      const formattedPhone = formatAustralianPhone(options.phone);

      // Validate the formatted phone number
      if (!validateAustralianPhone(options.phone)) {
        return {
          success: false,
          error: `Invalid Australian phone number: ${options.phone}`
        };
      }

      // Create standard SMS message
      const smsMessage: SMSMessage = {
        to: formattedPhone,
        body: options.message,
        from: options.senderId,
        metadata: {
          organizationId: options.organizationId,
          workerId: options.workerId,
          type: 'manual'
        },
        priority: 'normal'
      };

      // Determine which provider(s) to use
      let result: SMSResult;

      if (options.providerId) {
        // Use specific provider
        const provider = this.manager.getProvider(options.providerId);
        if (!provider) {
          return {
            success: false,
            error: `SMS provider '${options.providerId}' not found`
          };
        }
        result = await provider.send(smsMessage);
      } else {
        // Use default provider or fallback logic
        const defaultProviders = this.getDefaultProviders();
        result = await this.manager.sendWithFallback(smsMessage, defaultProviders);
      }

      // Log SMS to database (same as before)
      if (options.organizationId) {
        await this.logSMS({
          organizationId: options.organizationId,
          workerId: options.workerId,
          phone: formattedPhone,
          message: options.message,
          status: result.success ? 'sent' : 'failed',
          providerResponse: result,
          provider: result.provider
        });
      }

      return {
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        error: result.error,
        cost: result.cost
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed attempt
      if (options.organizationId) {
        await this.logSMS({
          organizationId: options.organizationId,
          workerId: options.workerId,
          phone: options.phone,
          message: options.message,
          status: 'failed',
          providerResponse: { error: errorMessage },
          provider: 'unknown'
        });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Send dashboard link via SMS
   * 
   * This method remains the same from the caller's perspective,
   * but now uses the new abstraction layer internally
   */
  static async sendDashboardLink(
    phone: string,
    dashboardUrl: string,
    workerName: string,
    organizationId?: string,
    workerId?: string
  ): Promise<SMSResponse> {
    const message = `Hi ${workerName}! Your daily dashboard is ready: ${dashboardUrl}`;

    return this.sendSMS({
      phone,
      message,
      organizationId,
      workerId,
    });
  }

  /**
   * Send SMS to multiple workers (batch operation)
   * New capability enabled by the abstraction layer
   */
  static async sendToMultipleWorkers(
    workers: Array<{ phone: string; name: string; id: string }>,
    dashboardUrl: string,
    organizationId?: string
  ): Promise<SMSResponse[]> {
    const messages = workers.map(worker => ({
      phone: worker.phone,
      message: `Hi ${worker.name}! Your daily dashboard is ready: ${dashboardUrl}`,
      organizationId,
      workerId: worker.id
    }));

    // Send all messages in parallel
    const results = await Promise.all(
      messages.map(msg => this.sendSMS(msg))
    );

    return results;
  }

  /**
   * Get SMS status from provider
   * New capability enabled by the abstraction layer
   */
  static async getSMSStatus(messageId: string, providerId?: string): Promise<any> {
    if (!providerId) {
      throw new Error('Provider ID is required to check SMS status');
    }

    const provider = this.manager.getProvider(providerId);
    if (!provider) {
      throw new Error(`SMS provider '${providerId}' not found`);
    }

    return provider.getStatus(messageId);
  }

  /**
   * Get health status of all SMS providers
   * New capability for monitoring
   */
  static async getProviderHealth(): Promise<Record<string, boolean>> {
    return this.manager.getProviderHealth();
  }

  /**
   * Get list of available SMS providers
   * New capability for provider management
   */
  static getAvailableProviders(): Array<{ id: string; name: string; description?: string }> {
    return this.manager.getAllProviders().map(provider => ({
      id: provider.id,
      name: provider.name,
      description: provider.description
    }));
  }

  // Private helper methods (same as before)
  private static async logSMS(data: {
    organizationId?: string;
    workerId?: string;
    phone: string;
    message: string;
    status: string;
    providerResponse: unknown;
    provider?: string;
  }): Promise<void> {
    if (!data.organizationId) return;

    try {
      // Import here to avoid circular dependency
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_KEY || ''
      );

      await supabase.from('sms_logs').insert({
        organization_id: data.organizationId,
        worker_id: data.workerId,
        phone: data.phone,
        message: data.message,
        status: data.status,
        provider_response: data.providerResponse,
        provider: data.provider || 'unknown'
      });
    } catch {
      // Silently fail logging to avoid breaking SMS flow
    }
  }

  /**
   * Get default provider list based on configuration
   * This allows switching providers without code changes
   */
  private static getDefaultProviders(): string[] {
    // In production, this would come from environment variables or database
    const defaultProvider = process.env.DEFAULT_SMS_PROVIDER || 'mobile-message';
    const fallbackProviders = process.env.FALLBACK_SMS_PROVIDERS?.split(',') || ['twilio'];
    
    return [defaultProvider, ...fallbackProviders];
  }
}
