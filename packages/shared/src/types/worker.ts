export interface Worker {
  id: string;
  organization_id: string;
  full_name: string;
  phone_number: string; // E.164 format: +61412345678
  calendar_email?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkerDTO {
  full_name: string;
  phone_number: string;
  calendar_email?: string;
}

export interface UpdateWorkerDTO {
  full_name?: string;
  phone_number?: string;
  calendar_email?: string;
}
