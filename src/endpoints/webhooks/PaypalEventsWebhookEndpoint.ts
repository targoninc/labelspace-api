import {PostEndpoint} from "../base/PostEndpoint.js";
import {Application, Request, Response} from "express";
import {PaypalWebhookEvent} from "../../utility/Paypal/models/PaypalWebhookEvent.js";
import {CLI} from "@targoninc/ts-logging";
import {verifyPaypalWebhookEvent} from "../../utility/Paypal/PaypalHelpers.js";
import {PaypalWebhookHandler} from "../../utility/Paypal/PaypalWebhookHandler.js";
import type {TriDB} from "../../utility/DB/TriDB.ts";
import type {PaypalWebhook} from "../../utility/Paypal/internalModels/PaypalWebhook.ts";

export class PaypalEventsWebhookEndpoint extends PostEndpoint {
    private readonly db: TriDB;
    private readonly handler: PaypalWebhookHandler;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
        this.handler = new PaypalWebhookHandler(this.db);
    }

    async run(req: Request & { rawBody: string }, res: Response) {
        const event = req.body as PaypalWebhookEvent;

        CLI.debug("Paypal webhook event received", {
            logToDb: true,
            info: {
                body: req.body,
                headers: req.headers
            }
        });

        const verified = await verifyPaypalWebhookEvent(event, req);
        if (!verified) {
            return res.status(400).send({error: "Invalid signature"});
        }

        CLI.debug("Paypal webhook event verified", { logToDb: true });
        const dbEntry = <PaypalWebhook>{
            content: JSON.stringify(event),
            id: event.id,
            type: event.event_type,
            paypal_user_id: event.resource?.subscriber?.payer_id ?? "",
        };
        await this.db.insertPaypalWebhookEvent(dbEntry);

        try {
            await this.handler.handle(event);
        } catch (e: any) {
            CLI.error(e, {
                info: {
                    event
                }
            });
            return res.status(500).send({error: "Failed to handle webhook event"});
        }

        return res.status(200).send({success: true});
    }
}