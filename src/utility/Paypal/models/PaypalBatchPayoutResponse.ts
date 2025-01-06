import type {PaypalBatchHeader} from "./PaypalBatchHeader.ts";
import {PaypalBatchStatus} from "./PaypalBatchStatus.ts";

export interface PaypalBatchPayoutResponse {
    batch_header: PaypalBatchHeader;
    payout_batch_id: string;
    batch_status: PaypalBatchStatus;
}