import { supabase } from '../lib/db.js'

export interface UpdateOrganizationData {
  name?: string
  sms_limit_per_hour?: number
  default_token_expiry_hours?: number
}

export class OrganizationService {
  /**
   * Get organization by ID
   */
  async getOrganization(orgId: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (error) {
      throw new Error(`Failed to get organization: ${error.message}`)
    }

    return data
  }

  /**
   * Update organization
   */
  async updateOrganization(orgId: string, updateData: UpdateOrganizationData) {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update organization: ${error.message}`)
    }

    return data
  }
}

export const organizationService = new OrganizationService()
