import type {PaypalBatchStatus} from "./models/PaypalBatchStatus.ts";
import type {PaypalPayoutAmount} from "./models/PaypalPayoutAmount.ts";

export interface PaypalPayoutBatchHeader {
    payout_batch_id: string;
    batch_status: PaypalBatchStatus;
    time_created: string;
    time_completed: string;
    time_closed: string;
    sender_batch_header: {
        sender_batch_id: string;
    },
    funding_source: string;
    amount: PaypalPayoutAmount;
    fees: PaypalPayoutAmount;
    payments: number;
}