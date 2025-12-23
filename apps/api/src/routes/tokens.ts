import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { TokenService } from '../services/token.service';
import { logger } from '../utils/logger';

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
  const { page, limit, workerId, status } = c.req.valid('query');
  const organizationId = c.get('organizationId');

  try {
    const result = await TokenService.listTokens(organizationId, {
      page,
      limit,
      workerId,
      status,
    });

    return c.json({
      success: true,
      data: result.tokens,
      pagination: result.pagination,
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
  const organizationId = c.get('organizationId');

  try {
    const stats = await TokenService.getTokenStats(organizationId);

    return c.json({
      success: true,
      data: stats,
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
  const { tokenId } = c.req.valid('json');
  const organizationId = c.get('organizationId');

  try {
    // Verify the token belongs to the organization
    const tokens = await TokenService.listTokens(organizationId, {
      page: 1,
      limit: 1,
    });

    const tokenExists = tokens.tokens.some(t => t.id === tokenId);
    if (!tokenExists) {
      return c.json(
        { success: false, error: 'Token not found' },
        404
      );
    }

    await TokenService.revokeById(tokenId);

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
  const organizationId = c.get('organizationId');

  try {
    const revokedCount = await TokenService.bulkRevokeExpired(organizationId);

    return c.json({
      success: true,
      message: `Revoked ${revokedCount} expired tokens`,
      data: { revokedCount },
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
  const organizationId = c.get('organizationId');

  try {
    // First revoke all existing tokens for this worker
    const existingTokens = await TokenService.listTokens(organizationId, {
      workerId,
      status: 'active',
    });

    for (const token of existingTokens.tokens) {
      await TokenService.revokeById(token.id);
    }

    // Generate new token
    const newToken = await TokenService.generateToken({
      workerId,
      expirySeconds: expiryHours * 3600,
    });

    return c.json({
      success: true,
      data: {
        token: newToken,
        dashboardUrl: TokenService.generateDashboardLink(newToken.token),
      },
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

export default tokens;
