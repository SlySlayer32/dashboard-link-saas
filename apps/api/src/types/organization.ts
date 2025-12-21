export interface OrganizationSettings {
  smsSenderId?: string;
  defaultTokenExpiry?: number; // in hours (1-168)
  customMetadata?: Record<string, any>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  settings?: OrganizationSettings;
}

export interface OrganizationResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    settings: OrganizationSettings;
    createdAt: string;
    updatedAt: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  settings?: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface GetOrganizationResponse {
  success: boolean;
  data: Organization;
}

export interface UpdateOrganizationResponse {
  success: boolean;
  data: Organization;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
