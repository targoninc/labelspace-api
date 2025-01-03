export interface PaypalWebhookTransmission {
    webhook_url: string;
    http_status: number;
    reason_phrase: string;
    response_headers: Record<string, string>;
    transmission_id: string;
    status: string;
    timestamp: string;
}