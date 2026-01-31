export interface DashboardToken {
    id: string;
    token_hash: string;
    worker_id: string;
    organization_id: string;
    expires_at: string;
    revoked_at?: string;
    created_at: string;
}

export interface CreateTokenDTO {
    worker_id: string;
    organization_id: string;
    expires_in_hours: number;
}

export interface TokenValidationResult {
    valid: boolean;
    worker_id?: string;
    organization_id?: string;
    error?: 'expired' | 'invalid' | 'revoked';
}
