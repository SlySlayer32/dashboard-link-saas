export interface ScheduleItem {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    location?: string;
    source_type: 'google-calendar' | 'airtable' | 'notion' | 'manual';
    source_id: string;
    raw_data?: Record<string, unknown>;
}

export interface ScheduleRequest {
    worker_id: string;
    organization_id: string;
    date?: string; // ISO date, defaults to today
}
