/**
 * Base configuration for all adapters
 */
export interface AdapterConfig {
    organizationId: string;
    enabled?: boolean;
    [key: string]: unknown;
}

/**
 * Health status response
 */
export interface HealthStatus {
    healthy: boolean;
    message?: string;
    lastChecked: Date;
}

/**
 * OAuth token set
 */
export interface TokenSet {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    tokenType?: string;
    scope?: string;
}

/**
 * Adapter capability flags
 */
export interface AdapterCapability {
    name: string;
    enabled: boolean;
    description?: string;
}
