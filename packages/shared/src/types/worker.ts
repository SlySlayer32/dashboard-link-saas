export interface Worker {
  id: string;
  organization_id: string;
  name: string;
  phone: string; // E.164 format: +61412345678
  email?: string;
  active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkerToken {
  id: string;
  worker_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
  revoked: boolean;
}
