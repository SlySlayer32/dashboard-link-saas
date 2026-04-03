import { smsManager } from './manager/SMSManager'
import { registerDefaultSMSProviders } from './registry/SMSProviderFactory'
import { smsService } from './services/SMSService'

/**
 * Initialize SMS System
 * Registers all available SMS providers and sets up the system for use
 * This should be called during application startup
 *
 * Environment-based provider initialization is handled by SMSProviderFactory.ts
 * which reads credentials from process.env for each provider.
 */
export function initializeSMSSystem(): void {
  try {
    // Register all available SMS providers
    registerDefaultSMSProviders(smsManager)

    // Log registered providers
    const providers = smsManager.getAllProviders()
    const providerNames = providers.map((p: { id: string }) => p.id).join(', ')

    console.log(`SMS System initialized with providers: ${providerNames}`)

    // Set default provider based on environment or fallback order
    const defaultProvider = process.env.SMS_DEFAULT_PROVIDER || 'mobile-message'
    const provider = smsManager.getProvider(defaultProvider)

    if (provider) {
      console.log(`Default SMS provider set to: ${defaultProvider}`)
    } else {
      console.warn(`Default SMS provider '${defaultProvider}' not found, using first available`)
    }
  } catch (error) {
    console.error('Failed to initialize SMS system:', error)
    throw error
  }
}

/**
 * Get initialized SMS service
 * Returns the singleton SMS service instance
 */
export function getSMSService() {
  return smsService
}

/**
 * Get SMS manager for advanced operations
 */
export function getSMSManager() {
  return smsManager
}

/**
 * Check if SMS system is properly initialized
 */
export function isSMSInitialized(): boolean {
  try {
    const providers = smsManager.getAllProviders()
    return providers.length > 0
  } catch {
    return false
  }
}
