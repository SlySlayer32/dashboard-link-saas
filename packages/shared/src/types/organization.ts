export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  settings?: {
    sms_sender_id?: string;
    default_token_expiry?: number; // in seconds
  };
}

export interface Admin {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  created_at: string;
}
