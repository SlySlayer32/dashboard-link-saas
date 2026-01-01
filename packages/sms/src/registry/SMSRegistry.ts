import { SMSRegistry as ISMSRegistry, SMSProvider } from '@dashboard-link/shared';

/**
 * SMS Registry Implementation
 * Manages registration and retrieval of SMS providers
 */
export class SMSRegistryImpl implements ISMSRegistry {
  private providers = new Map<string, SMSProvider>();

  register(provider: SMSProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`SMS provider with id '${provider.id}' is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): void {
    if (!this.providers.has(id)) {
      console.warn(`SMS provider with id '${id}' is not registered.`);
      return;
    }
    this.providers.delete(id);
  }

  get(id: string): SMSProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): SMSProvider[] {
    return Array.from(this.providers.values());
  }

  search(query: string): SMSProvider[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(provider => 
      provider.id.toLowerCase().includes(lowerQuery) ||
      provider.name.toLowerCase().includes(lowerQuery) ||
      provider.description?.toLowerCase().includes(lowerQuery)
    );
  }

  // Helper methods
  has(id: string): boolean {
    return this.providers.has(id);
  }

  clear(): void {
    this.providers.clear();
  }

  get count(): number {
    return this.providers.size;
  }
}

// Singleton instance for easy access
export const smsRegistry = new SMSRegistryImpl();
