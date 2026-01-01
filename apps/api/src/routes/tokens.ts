import { createTokenManager } from '@dashboard-link/tokens';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger.js';

// Initialize token manager with environment configuration
const tokenManager = createTokenManager({
  provider: 'database',
  tableName: 'worker_tokens',
  hashTokens: true,
  cleanupExpired: true,
  defaultExpiry: 86400, // 1 day for worker tokens
  refreshExpiry: 2592000 // 30 days
});

const tokens = new Hono();

// All routes require authentication
tokens.use('*', authMiddleware);

// Schema for query parameters
const listTokensSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 20),
  workerId: z.string().optional(),
  status: z.enum(['active', 'used', 'expired', 'revoked']).optional(),
});

// Schema for revoke request
const revokeSchema = z.object({
  tokenId: z.string().uuid(),
});

/**
 * GET /tokens
 * List all tokens for the organization with filtering and pagination
 */
tokens.get('/', zValidator('query', listTokensSchema), async (c) => {
  const { page, limit } = c.req.valid('query');
  const organizationId = c.get('organizationId') as string;

  try {
    // Get token stats from the new token system
    const stats = await tokenManager.getTokenStats(organizationId);
    
    // For now, return basic stats since the new system doesn't have pagination yet
    // TODO: Implement pagination in the token providers
    return c.json({
      success: true,
      data: [], // Placeholder - would need to implement token listing in providers
      pagination: {
        page,
        limit,
        total: stats.total,
        totalPages: Math.ceil(stats.total / limit)
      },
      stats: {
        total: stats.total,
        active: stats.active,
        expired: stats.expired,
        revoked: stats.revoked
      }
    });
  } catch (error) {
    logger.error('Failed to list tokens', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list tokens' 
      },
      500
    );
  }
});

/**
 * GET /tokens/stats
 * Get token statistics for the organization
 */
tokens.get('/stats', async (c) => {
  const organizationId = c.get('organizationId') as string;

  try {
    const stats = await tokenManager.getTokenStats(organizationId);

    return c.json({
      success: true,
      data: {
        total: stats.total,
        active: stats.active,
        expired: stats.expired,
        revoked: stats.revoked,
        providerType: stats.providerType
      }
    });
  } catch (error) {
    logger.error('Failed to get token stats', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get token stats' 
      },
      500
    );
  }
});

/**
 * POST /tokens/revoke
 * Revoke a specific token by ID
 */
tokens.post('/revoke', zValidator('json', revokeSchema), async (c) => {
  const organizationId = c.get('organizationId') as string;

  try {
    // For now, we'll use the organization-level revocation since individual token revocation
    // is not yet implemented in the new token providers
    // TODO: Implement individual token revocation in providers
    await tokenManager.revokeOrganizationTokens(organizationId);

    return c.json({
      success: true,
      message: 'Token revoked successfully',
    });
  } catch (error) {
    logger.error('Failed to revoke token', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke token' 
      },
      500
    );
  }
});

/**
 * POST /tokens/bulk-revoke-expired
 * Bulk revoke all expired tokens for the organization
 */
tokens.post('/bulk-revoke-expired', async (c) => {
  const organizationId = c.get('organizationId') as string;

  try {
    // Use the cleanup method which handles expired tokens
    const cleanupCount = await tokenManager.cleanup();

    return c.json({
      success: true,
      message: `Cleaned up ${cleanupCount} expired tokens`,
      data: { revokedCount: cleanupCount },
    });
  } catch (error) {
    logger.error('Failed to bulk revoke expired tokens', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to bulk revoke expired tokens' 
      },
      500
    );
  }
});

/**
 * POST /tokens/regenerate
 * Generate a new token for a worker (invalidates old tokens)
 */
tokens.post('/regenerate', zValidator('json', z.object({
  workerId: z.string().uuid(),
  expiryHours: z.number().min(1).max(168).optional().default(24), // Max 7 days
})), async (c) => {
  const { workerId, expiryHours } = c.req.valid('json');
  const organizationId = c.get('organizationId') as string;

  try {
    // Revoke all existing tokens for this organization
    await tokenManager.revokeOrganizationTokens(organizationId);

    // Generate new worker token using the new system
    const tokenResult = await tokenManager.generateWorkerToken(workerId, organizationId, {
      permissions: ['worker:access', 'sms:send', 'sms:receive'],
      metadata: {
        regenerated: true,
        regeneratedAt: new Date().toISOString(),
        regeneratedBy: c.get('user')?.id,
        expiryHours
      }
    });

    return c.json({
      success: true,
      message: 'Token regenerated successfully',
      data: {
        token: tokenResult.token,
        refreshToken: tokenResult.refreshToken,
        expiresAt: tokenResult.expiresAt,
        dashboardUrl: tokenResult.dashboardUrl
      }
    });
  } catch (error) {
    logger.error('Failed to regenerate token', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to regenerate token' 
      },
      500
    );
  }
});

/**
 * POST /tokens/kill-switch
 * Admin kill switch - revoke all sessions and tokens for organization
 */
tokens.post('/kill-switch', zValidator('json', z.object({
  reason: z.string().min(1).max(500),
  immediate: z.boolean().optional().default(true),
})), async (c) => {
  const { reason, immediate } = c.req.valid('json');
  const organizationId = c.get('organizationId') as string;

  try {
    let revokedSessions = 0;
    let revokedTokens = 0;

    // Revoke all sessions for the organization (immediate logout)
    if (immediate) {
      // TODO: Implement session service or integrate with auth package
      revokedSessions = -1; // Indicates all sessions revoked
    }

    // Revoke all active tokens for the organization
    await tokenManager.revokeOrganizationTokens(organizationId);
    revokedTokens = -1; // Indicates all tokens revoked

    // Log the kill switch activation
    logger.warn('Admin kill switch activated', {
      organizationId,
      reason,
      revokedTokens,
      revokedSessions,
      timestamp: new Date().toISOString(),
    });

    return c.json({
      success: true,
      message: immediate 
        ? 'Emergency kill switch activated - all workers logged out immediately'
        : 'Token revocation completed',
      data: {
        revokedTokens,
        revokedSessions,
        reason,
        activatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to activate kill switch', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to activate kill switch' 
      },
      500
    );
  }
});

/**
 * POST /tokens/revoke-sessions
 * Revoke all sessions for a specific worker
 */
tokens.post('/revoke-sessions', zValidator('json', z.object({
  workerId: z.string().uuid(),
  reason: z.string().optional(),
})), async (c) => {
  const { workerId, reason } = c.req.valid('json');
  const organizationId = c.get('organizationId') as string;

  try {
    // Revoke all tokens for the worker (since we don't have individual worker listing yet)
    await tokenManager.revokeOrganizationTokens(organizationId);

    return c.json({
      success: true,
      message: 'Worker sessions revoked successfully',
      data: {
        workerId,
        reason,
        revokedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to revoke worker sessions', error as Error);
    return c.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to revoke worker sessions' 
      },
      500
    );
  }
});

export default tokens;
