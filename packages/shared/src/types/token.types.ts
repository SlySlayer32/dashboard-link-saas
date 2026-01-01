/**
 * Token System Types
 * 
 * Core interfaces and types for the token abstraction layer
 * Provides Zapier-style token provider interface for flexible token management
 */

export interface TokenPayload {
  userId: string;
  organizationId?: string;
  sessionId?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
  issuedAt: number;
  expiresAt: number;
}

export interface TokenResult {
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: 'jwt' | 'database';
  metadata?: Record<string, unknown>;
}

export interface TokenValidation {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
  errorCode?: 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'REVOKED';
  metadata?: Record<string, unknown>;
}

export interface TokenProvider {
  /**
   * Generate a new token with the given payload
   */
  generate(payload: TokenPayload): Promise<TokenResult>;

  /**
   * Validate a token and return its payload
   */
  validate(token: string): Promise<TokenValidation>;

  /**
   * Refresh an existing token
   */
  refresh(refreshToken: string): Promise<TokenResult>;

  /**
   * Revoke a token
   */
  revoke(token: string): Promise<void>;

  /**
   * Check if a token exists and is not revoked
   */
  exists(token: string): Promise<boolean>;

  /**
   * Get token metadata
   */
  getMetadata(token: string): Promise<Record<string, unknown> | null>;

  /**
   * Clean up expired tokens
   */
  cleanup(): Promise<number>;

  /**
   * Health check for the token provider
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get provider type
   */
  getType(): 'jwt' | 'database';
}

export interface TokenConfig {
  provider: 'jwt' | 'database';
  jwtSecret?: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
  defaultExpiry?: number; // seconds
  refreshExpiry?: number; // seconds
  cleanupInterval?: number; // seconds
  databaseConfig?: {
    tableName?: string;
    hashTokens?: boolean;
    cleanupExpired?: boolean;
  };
}

export interface TokenManager {
  /**
   * Generate a token for a user
   */
  generateToken(userId: string, options?: TokenGenerationOptions): Promise<TokenResult>;

  /**
   * Validate a token
   */
  validateToken(token: string): Promise<TokenValidation>;

  /**
   * Refresh a token
   */
  refreshToken(refreshToken: string): Promise<TokenResult>;

  /**
   * Revoke a token
   */
  revokeToken(token: string): Promise<void>;

  /**
   * Revoke all tokens for a user
   */
  revokeUserTokens(userId: string): Promise<void>;

  /**
   * Revoke all tokens for an organization
   */
  revokeOrganizationTokens(organizationId: string): Promise<void>;

  /**
   * Get active tokens for a user
   */
  getUserTokens(userId: string): Promise<TokenResult[]>;

  /**
   * Get token statistics
   */
  getTokenStats(organizationId?: string): Promise<TokenStats>;

  /**
   * Clean up expired tokens
   */
  cleanup(): Promise<number>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}

export interface TokenGenerationOptions {
  organizationId?: string;
  sessionId?: string;
  role?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
  expiresIn?: number; // seconds
  includeRefresh?: boolean;
}

export interface TokenStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  lastCleanup?: Date;
  providerType: 'jwt' | 'database';
}

export interface TokenRegistry {
  /**
   * Register a token provider
   */
  register(name: string, provider: TokenProvider): void;

  /**
   * Unregister a token provider
   */
  unregister(name: string): void;

  /**
   * Get a token provider by name
   */
  get(name: string): TokenProvider | undefined;

  /**
   * List all registered providers
   */
  list(): string[];

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean;

  /**
   * Clear all providers
   */
  clear(): void;
}

export interface TokenProviderFactory {
  (config: TokenConfig): TokenProvider;
}

// Worker-specific token types (for backward compatibility)
export interface WorkerTokenPayload extends TokenPayload {
  workerId: string;
  dashboardUrl?: string;
}

export interface WorkerTokenResult extends TokenResult {
  workerId: string;
  dashboardUrl?: string;
}

export interface WorkerTokenValidation extends TokenValidation {
  workerId?: string;
  workerData?: unknown;
}

// Token errors
export interface TokenError {
  code: 'GENERATION_FAILED' | 'VALIDATION_FAILED' | 'REFRESH_FAILED' | 'REVOCATION_FAILED' | 'CLEANUP_FAILED';
  message: string;
  details?: Record<string, unknown>;
}

// Token events
export interface TokenEvent {
  type: 'generated' | 'validated' | 'refreshed' | 'revoked' | 'expired' | 'cleaned';
  tokenId?: string;
  userId?: string;
  organizationId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface TokenEventHandler {
  (event: TokenEvent): void | Promise<void>;
}

// Token provider capabilities
export interface TokenProviderCapabilities {
  supportsRefresh: boolean;
  supportsMetadata: boolean;
  supportsBulkRevocation: boolean;
  supportsStatistics: boolean;
  supportsCleanup: boolean;
  isStateless: boolean;
  maxTokenSize?: number;
  supportedAlgorithms?: string[];
}

// Token migration interfaces
export interface TokenMigration {
  from: string;
  to: string;
  migrate: (tokens: TokenResult[]) => Promise<void>;
  rollback?: (tokens: TokenResult[]) => Promise<void>;
}

export interface TokenMigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  duration: number;
}

// Token audit log
export interface TokenAuditLog {
  id: string;
  action: 'generate' | 'validate' | 'refresh' | 'revoke' | 'cleanup';
  userId?: string;
  organizationId?: string;
  tokenId?: string;
  tokenType: 'jwt' | 'database';
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Token rate limiting
export interface TokenRateLimit {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface TokenRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

// Token security
export interface TokenSecurityConfig {
  enforceHttps: boolean;
  maxTokenAge: number;
  maxRefreshAge: number;
  requireRefreshRotation: boolean;
  blacklistEnabled: boolean;
  auditEnabled: boolean;
  rateLimit?: TokenRateLimit;
}

// Token storage options
export interface TokenStorageOptions {
  compression: boolean;
  encryption: boolean;
  versioning: boolean;
  backupEnabled: boolean;
  retentionPeriod: number;
}

// Token provider configuration
export interface JWTProviderConfig extends TokenConfig {
  provider: 'jwt';
  jwtSecret: string;
  algorithm?: string;
  issuer?: string;
  audience?: string;
  keyid?: string;
  clockTolerance?: number;
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
}

export interface DatabaseProviderConfig extends TokenConfig {
  provider: 'database';
  tableName?: string;
  hashTokens?: boolean;
  cleanupExpired?: boolean;
  connectionPool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
  encryption?: {
    enabled: boolean;
    algorithm: string;
    key: string;
  };
}

// Token provider registry types
export type TokenProviderName = 'jwt' | 'database' | 'custom';
export type TokenProviderMap = Record<TokenProviderName, TokenProvider>;

// Token utility types
export type TokenExtractor = (req: Record<string, unknown>) => string | null;
export type TokenValidator = (token: string) => Promise<TokenValidation>;
export type TokenGenerator = (payload: TokenPayload) => Promise<TokenResult>;

// Token middleware types
export interface TokenMiddlewareOptions {
  secret?: string;
  algorithms?: string[];
  requestProperty?: string;
  getToken?: TokenExtractor;
  isRevoked?: TokenValidator;
  credentialsRequired?: boolean;
  onExpired?: (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) => void;
  onUnauthorized?: (req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) => void;
}

// Token cache interface
export interface TokenCache {
  get(key: string): Promise<TokenValidation | null>;
  set(key: string, value: TokenValidation, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

// Token blacklist interface
export interface TokenBlacklist {
  add(token: string, expiresAt?: Date): Promise<void>;
  remove(token: string): Promise<void>;
  has(token: string): Promise<boolean>;
  clear(): Promise<void>;
  cleanup(): Promise<number>;
}
