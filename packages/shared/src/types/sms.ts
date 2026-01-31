export interface SMSLog {
    id: string;
    organization_id: string;
    worker_id?: string;
    phone_number: string;
    message_content: string;
    token_id?: string;
    status: 'sent' | 'delivered' | 'failed';
    provider_message_id?: string;
    error_reason?: string;
    sent_by?: string;
    sent_at: string;
    delivered_at?: string;
    created_at: string;
}

export interface SendSMSDTO {
    worker_id: string;
    message?: string;
    expiry_hours?: number;
}

export interface SendBulkSMSDTO {
    worker_ids: string[];
    message?: string;
    expiry_hours?: number;
}

export interface SMSProvider {
    sendSMS(to: string, message: string): Promise<SMSResult>;
}

export interface SMSResult {
    success: boolean;
    message_id?: string;
    error?: string;
}
