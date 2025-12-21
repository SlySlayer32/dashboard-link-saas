import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import type { 
  Organization,
  UpdateOrganizationRequest,
  GetOrganizationResponse,
  UpdateOrganizationResponse
} from '../types/organization';

const organizations = new Hono();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// All routes require authentication
organizations.use('*', authMiddleware);

/**
 * Get current organization details
 */
organizations.get('/', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');

  try {
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*, organizations(*)')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized'
        }
      }, 403);
    }

    if (!admin.organizations) {
      return c.json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        }
      }, 404);
    }

    // Transform to match expected response format
    const orgData: Organization = {
      id: admin.organizations.id,
      name: admin.organizations.name,
      settings: {
        smsSenderId: admin.organizations.settings?.sms_sender_id || 'DashLink',
        defaultTokenExpiry: (admin.organizations.settings?.default_token_expiry || 3600) / 3600, // Convert seconds to hours
        customMetadata: admin.organizations.settings?.custom_metadata || {}
      },
      created_at: admin.organizations.created_at,
      updated_at: admin.organizations.updated_at
    };

    const response: GetOrganizationResponse = {
      success: true,
      data: orgData
    };

    return c.json(response);
  } catch (error) {
    console.error('Get organization error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve organization'
      }
    }, 500);
  }
});

/**
 * Update organization settings
 */
organizations.put('/', async (c) => {
  // @ts-ignore - Hono context typing issue
  const userId = c.get('userId');
  const body: UpdateOrganizationRequest = await c.req.json();

  try {
    // Get admin and organization
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('organization_id')
      .eq('auth_user_id', userId)
      .single();

    if (adminError || !admin) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized'
        }
      }, 403);
    }

    // Get current organization data
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', admin.organization_id)
      .single();

    if (fetchError || !currentOrg) {
      return c.json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        }
      }, 404);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Update name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: 'Organization name is required'
          }
        }, 400);
      }
      updateData.name = body.name.trim();
    }

    // Prepare settings update
    let settings = currentOrg.settings || {};

    if (body.settings) {
      // Validate and update SMS sender ID
      if (body.settings.smsSenderId !== undefined) {
        if (body.settings.smsSenderId && body.settings.smsSenderId.length > 11) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_SENDER_ID',
              message: 'SMS sender ID must be 11 characters or less'
            }
          }, 400);
        }
        settings.sms_sender_id = body.settings.smsSenderId;
      }

      // Validate and update default token expiry
      if (body.settings.defaultTokenExpiry !== undefined) {
        if (body.settings.defaultTokenExpiry < 1 || body.settings.defaultTokenExpiry > 168) {
          return c.json({
            success: false,
            error: {
              code: 'INVALID_TOKEN_EXPIRY',
              message: 'Default token expiry must be between 1 and 168 hours'
            }
          }, 400);
        }
        settings.default_token_expiry = body.settings.defaultTokenExpiry * 3600; // Convert hours to seconds
      }

      // Update custom metadata
      if (body.settings.customMetadata !== undefined) {
        settings.custom_metadata = body.settings.customMetadata;
      }

      updateData.settings = settings;
    }

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', admin.organization_id)
      .select()
      .single();

    if (updateError) {
      return c.json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: updateError.message
        }
      }, 400);
    }

    // Transform response
    const responseData: Organization = {
      id: updatedOrg.id,
      name: updatedOrg.name,
      settings: {
        smsSenderId: updatedOrg.settings?.sms_sender_id || 'DashLink',
        defaultTokenExpiry: (updatedOrg.settings?.default_token_expiry || 3600) / 3600,
        customMetadata: updatedOrg.settings?.custom_metadata || {}
      },
      created_at: updatedOrg.created_at,
      updated_at: updatedOrg.updated_at
    };

    const response: UpdateOrganizationResponse = {
      success: true,
      data: responseData
    };

    return c.json(response);
  } catch (error) {
    console.error('Update organization error:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update organization'
      }
    }, 500);
  }
});

export default organizations;
