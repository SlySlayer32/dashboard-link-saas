export interface AccessLog {
    id: string;
    organization_id: string;
    worker_id: string;
    token_id?: string;
    accessed_at: string;
    ip_address?: string;
    user_agent?: string;
    validation_status: 'success' | 'expired' | 'invalid' | 'revoked';
    created_at: string;
}

export interface CreateAccessLogDTO {
    worker_id: string;
    organization_id: string;
    token_id?: string;
    ip_address?: string;
    user_agent?: string;
    validation_status: 'success' | 'expired' | 'invalid' | 'revoked';
}
