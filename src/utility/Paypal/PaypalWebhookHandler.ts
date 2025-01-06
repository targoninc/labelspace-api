import {PaypalWebhookEvent} from "./models/PaypalWebhookEvent.js";
import {TriDB} from "../DB/TriDB.js";
import {CLI} from "../CLI.js";

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

        // TODO: Handle webhook events (for payouts)
    }
}