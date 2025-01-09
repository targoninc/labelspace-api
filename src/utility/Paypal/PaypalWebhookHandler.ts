import {PaypalWebhookEvent} from "./models/PaypalWebhookEvent.js";
import {TriDB} from "../DB/TriDB.js";
import {CLI} from "../CLI.js";
import type {PaypalPayoutBatchEvent} from "./PaypalPayoutBatchEvent.ts";
import {PaymentStatus} from "../../models/enums/PaymentStatus.ts";

export class PaypalWebhookHandler {
    private readonly db: TriDB;

    constructor(db: TriDB) {
        this.db = db;
    }

    async handle(event: PaypalWebhookEvent) {
        CLI.debug("Handling webhook event", {
            logToDb: true,
            info: {
                event
            }
        });

        switch (event.event_type) {
            case "PAYMENT.PAYOUTSBATCH.PROCESSING":
                await this.handlePayoutBatchProcessing(event as PaypalPayoutBatchEvent);
                break;
            case "PAYMENT.PAYOUTSBATCH.SUCCESS":
                await this.handlePayoutBatchSuccess(event as PaypalPayoutBatchEvent);
                break;
        }
    }

    private async handlePayoutBatchProcessing(event: PaypalPayoutBatchEvent) {
        await this.handlePayoutBatchUpdate(event, PaymentStatus.processing);
    }

    private async handlePayoutBatchSuccess(event: PaypalPayoutBatchEvent) {
        await this.handlePayoutBatchUpdate(event, PaymentStatus.paid);
    }

    private async handlePayoutBatchUpdate(event: PaypalPayoutBatchEvent, newStatus: PaymentStatus) {
        const ownBatchId = event.resource?.batch_header.sender_batch_header.sender_batch_id;
        if (!ownBatchId) {
            throw new Error("Sender Batch ID not defined in event");
        }
        const batchPayment = await this.db.getPaypalBatchPayment(ownBatchId);
        if (!batchPayment) {
            throw new Error(`Correlating PayPal batch payment not found for own batch ID ${ownBatchId}`);
        }
        await this.db.updateBatchPaymentStatus(ownBatchId, event.resource?.batch_header.batch_status);

        const payment = await this.db.getPaymentByBatchId(ownBatchId);
        if (!payment) {
            throw new Error(`Correlating payment not found for own batch ID ${ownBatchId}`);
        }
        await this.db.updatePaymentByBatchId(ownBatchId, newStatus);
    }
}