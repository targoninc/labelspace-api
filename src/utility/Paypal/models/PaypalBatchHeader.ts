export interface PaypalBatchHeader {
    sender_batch_id: string;
    recipient_type: string;
    email_subject: string;
    email_message: string;
    note: string;
}