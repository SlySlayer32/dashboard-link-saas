/**
 * Base Token Provider
 * 
 * Abstract base class for token providers
 * Implements common functionality and defines the TokenProvider interface
 */

import type {
    TokenAuditLog,
    TokenConfig,
    TokenEvent,
    TokenEventHandler,
    TokenPayload,
    TokenProvider,
    TokenProviderCapabilities,
    TokenResult,
    TokenSecurityConfig,
    TokenValidation
} from '@dashboard-link/shared';

export abstract class BaseTokenProvider implements TokenProvider {
  protected config: TokenConfig;
  protected securityConfig: TokenSecurityConfig;
  protected eventHandlers: TokenEventHandler[] = [];
  protected auditLogs: TokenAuditLog[] = [];

  constructor(config: TokenConfig, securityConfig?: TokenSecurityConfig) {
    this.config = config;
    this.securityConfig = securityConfig || this.getDefaultSecurityConfig();
  }

  // Abstract methods that must be implemented by concrete providers
  abstract generate(payload: TokenPayload): Promise<TokenResult>;
  abstract validate(token: string): Promise<TokenValidation>;
  abstract refresh(refreshToken: string): Promise<TokenResult>;
  abstract revoke(token: string): Promise<void>;
  abstract exists(token: string): Promise<boolean>;
  abstract getMetadata(token: string): Promise<Record<string, unknown> | null>;
  abstract cleanup(): Promise<number>;
  abstract healthCheck(): Promise<boolean>;
  abstract getType(): 'jwt' | 'database';

  // Common utility methods
  protected createTokenPayload(
    userId: string,
    options: {
      organizationId?: string;
      sessionId?: string;
      role?: string;
      permissions?: string[];
      metadata?: Record<string, unknown>;
      expiresIn?: number;
    } = {}
  ): TokenPayload {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = options.expiresIn || this.config.defaultExpiry || 3600;

    return {
      userId,
      organizationId: options.organizationId,
      sessionId: options.sessionId,
      role: options.role,
      permissions: options.permissions,
      metadata: options.metadata,
      issuedAt: now,
      expiresAt: now + expiresIn
    };
  }

  protected createTokenResult(
    token: string,
    payload: TokenPayload,
    refreshToken?: string,
    metadata?: Record<string, unknown>
  ): TokenResult {
    return {
      token,
      refreshToken,
      expiresAt: new Date(payload.expiresAt * 1000),
      tokenType: this.getType(),
      metadata
    };
  }

  protected createValidationResult(
    valid: boolean,
    payload?: TokenPayload,
    error?: string,
    errorCode?: 'EXPIRED' | 'INVALID' | 'NOT_FOUND' | 'REVOKED',
    metadata?: Record<string, unknown>
  ): TokenValidation {
    return {
      valid,
      payload,
      error,
      errorCode,
      metadata
    };
  }

  // Event handling
  protected async emitEvent(event: TokenEvent): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error('Error in token event handler:', error);
      }
    }
  }

  addEventHandler(handler: TokenEventHandler): void {
    this.eventHandlers.push(handler);
  }

  removeEventHandler(handler: TokenEventHandler): void {
    const index = this.eventHandlers.indexOf(handler);
    if (index > -1) {
      this.eventHandlers.splice(index, 1);
    }
  }

  // Audit logging
  protected async logAudit(auditLog: Partial<TokenAuditLog>): Promise<void> {
    const log: TokenAuditLog = {
      id: this.generateId(),
      action: auditLog.action!,
      userId: auditLog.userId,
      organizationId: auditLog.organizationId,
      tokenId: auditLog.tokenId,
      tokenType: this.getType(),
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      success: auditLog.success ?? true,
      error: auditLog.error,
      timestamp: new Date(),
      metadata: auditLog.metadata
    };

    this.auditLogs.push(log);

    // In production, this would be stored in a database
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-500); // Keep last 500 logs
    }
  }

  getAuditLogs(limit?: number): TokenAuditLog[] {
    return limit ? this.auditLogs.slice(-limit) : this.auditLogs;
  }

  // Security utilities
  protected getDefaultSecurityConfig(): TokenSecurityConfig {
    return {
      enforceHttps: process.env.NODE_ENV === 'production',
      maxTokenAge: 24 * 60 * 60, // 24 hours
      maxRefreshAge: 30 * 24 * 60 * 60, // 30 days
      requireRefreshRotation: true,
      blacklistEnabled: true,
      auditEnabled: true
    };
  }

  protected validateSecurity(payload: TokenPayload): boolean {
    // Check token age
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - payload.issuedAt;

    if (tokenAge > this.securityConfig.maxTokenAge) {
      return false;
    }

    // Check expiration
    if (payload.expiresAt < now) {
      return false;
    }

    return true;
  }

  protected sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;

    const sanitized: Record<string, unknown> = {};
    const allowedKeys = ['role', 'permissions', 'sessionId', 'organizationId', 'department', 'team'];

    for (const [key, value] of Object.entries(metadata)) {
      if (allowedKeys.includes(key) && value != null) {
        sanitized[key] = value;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  // Utility methods
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected isExpired(payload: TokenPayload): boolean {
    return Math.floor(Date.now() / 1000) > payload.expiresAt;
  }

  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Provider capabilities
  abstract getCapabilities(): TokenProviderCapabilities;

  // Configuration
  getConfig(): TokenConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<TokenConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getSecurityConfig(): TokenSecurityConfig {
    return { ...this.securityConfig };
  }

  updateSecurityConfig(updates: Partial<TokenSecurityConfig>): void {
    this.securityConfig = { ...this.securityConfig, ...updates };
  }

  // Statistics and monitoring
  async getStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    revokedTokens: number;
    lastCleanup?: Date;
  }> {
    // Base implementation - should be overridden by concrete providers
    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      revokedTokens: 0
    };
  }

  // Health check with detailed status
  async getHealthStatus(): Promise<{
    healthy: boolean;
    provider: string;
    type: string;
    lastCheck: Date;
    issues: string[];
    metrics: Record<string, unknown>;
  }> {
    const healthy = await this.healthCheck();
    const capabilities = this.getCapabilities();

    return {
      healthy,
      provider: this.constructor.name,
      type: this.getType(),
      lastCheck: new Date(),
      issues: healthy ? [] : ['Provider health check failed'],
      metrics: {
        capabilities,
        config: this.config,
        securityConfig: this.securityConfig,
        auditLogCount: this.auditLogs.length
      }
    };
  }

  // Cleanup and maintenance
  async performMaintenance(): Promise<{
    cleanupCount: number;
    auditLogCleanup: number;
    issues: string[];
  }> {
    const cleanupCount = await this.cleanup();
    const auditLogCleanup = this.cleanupAuditLogs();
    const issues: string[] = [];

    if (cleanupCount > 0) {
      issues.push(`Cleaned up ${cleanupCount} expired tokens`);
    }

    if (auditLogCleanup > 0) {
      issues.push(`Cleaned up ${auditLogCleanup} old audit logs`);
    }

    return {
      cleanupCount,
      auditLogCleanup,
      issues
    };
  }

  protected cleanupAuditLogs(): number {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const beforeCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);
    return beforeCount - this.auditLogs.length;
  }

  // Token validation helpers
  protected validatePayloadStructure(payload: unknown): TokenPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const p = payload as any;
    
    if (
      typeof p.userId === 'string' &&
      typeof p.issuedAt === 'number' &&
      typeof p.expiresAt === 'number'
    ) {
      return {
        userId: p.userId,
        organizationId: p.organizationId,
        sessionId: p.sessionId,
        role: p.role,
        permissions: Array.isArray(p.permissions) ? p.permissions : undefined,
        metadata: p.metadata,
        issuedAt: p.issuedAt,
        expiresAt: p.expiresAt
      };
    }

    return null;
  }

  // Rate limiting (basic implementation)
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  protected checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this.rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      return false;
    }

    current.count++;
    return true;
  }

  // Cleanup rate limiting entries
  protected cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitMap.entries()) {
      if (now > value.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }
}
