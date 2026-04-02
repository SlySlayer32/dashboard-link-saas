export interface ScheduleItem {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  location?: string
  sourceType?: 'google-calendar' | 'airtable' | 'notion' | 'manual'
  sourceId?: string
  metadata?: Record<string, unknown>
}

export interface ScheduleRequest {
  worker_id: string
  organization_id: string
  date?: string // ISO date, defaults to today
}
