export interface DataSource {
  id: string
  organization_id: string
  plugin_id: 'google-calendar' | 'airtable' | 'notion' | 'manual'
  plugin_version: string
  config: Record<string, unknown>
  access_token_encrypted?: string
  refresh_token_encrypted?: string
  token_expires_at?: string
  status: 'active' | 'error' | 'disconnected'
  last_sync_at?: string
  last_error?: string
  created_at: string
  updated_at: string
}

export interface CreateDataSourceDTO {
  plugin_id: 'google-calendar' | 'airtable' | 'notion' | 'manual'
  plugin_version: string
  config: Record<string, unknown>
}

export interface UpdateDataSourceDTO {
  config?: Record<string, unknown>
  status?: 'active' | 'error' | 'disconnected'
  last_error?: string
}
