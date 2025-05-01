import type {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {PaymentStatus} from "../../models/enums/PaymentStatus.ts";
import {Paypal} from "../../utility/Paypal/Paypal.ts";
import {Mail} from "../../utility/Mail/Mail.ts";
import {MailBuilder} from "../../utility/Mail/MailBuilder.ts";
import {CLI} from "@targoninc/ts-logging";
import type {PaypalBatchHeader} from "../../utility/Paypal/models/PaypalBatchHeader.ts";
import type {PaypalPayoutItem} from "../../utility/Paypal/models/PaypalPayoutItem.ts";
import {PaypalBatchStatus} from "../../utility/Paypal/models/PaypalBatchStatus.ts";
import {uuidv4} from "uuidv7";

export class RequestPaymentEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const artists = await this.db.getUserArtists(user.id);
        const artistNames = artists.map(a => a.name);

        const available = await this.db.getAvailablePaymentAmount(user.id, artistNames);
        const av = parseFloat(available.available);
        if (av <= 0) {
            return res.status(400).send({error: "Not enough money available"});
        }

        const minimum = 0.01;
        if (av < minimum) {
            return res.status(400).send({error: `Money is available, but below minimum (minimum ${minimum})`});
        }

        const userMails = await this.db.getUserEmails(user.id);
        const paypalMail = userMails.find(m => m.primary && m.verified);
        if (!paypalMail) {
            return res.status(400).send({error: "No valid paypal mail found"});
        }

        CLI.info(`Requesting payment for ${user.id} for ${av}`);
        const batchId = uuidv4();
        await this.db.createPayment(user.id, av, PaymentStatus.requested, batchId);

        const mailContent = MailBuilder.default()
            .subject("Tri Artist payment requested")
            .heading("Tri Artist payment requested")
            .paragraph(`You have requested a payment for your Tri Artist account (${user.username}) for ${available.available} USD.`)
            .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
            .signature()
            .get();

        for (const mail of userMails) {
            if (mail.verified || mail.primary) {
                Mail.sendDefault(mail.email, mailContent);
            }
        }

        const items: PaypalPayoutItem[] = [
            {
                amount: {
                    currency: "USD",
                    value: available.available.toString()
                },
                receiver: paypalMail.email
            }
        ];
        await this.db.createPaypalBatchPayment(items, batchId);
        await this.db.updatePaymentByBatchId(batchId, PaymentStatus.requested);

        const batchHeader: PaypalBatchHeader = {
            sender_batch_id: batchId,
            note: "Artist Space payment",
            recipient_type: "EMAIL",
            email_subject: "Artist Space payment",
            email_message: "Artist Space payment for " + user.username + " over " + available.available + " USD"
        }
        try {
            CLI.debug("Creating batch payout", {
                logToDb: true,
                info: {
                    items,
                    batchHeader
                }
            });
            await Paypal.createBatchPayout(items, batchHeader);
            await this.db.updatePaypalBatchPaymentStatus(batchId, PaypalBatchStatus.PENDING);
        } catch (e) {
            console.error(e);
            return res.status(500).send({error: "Failed to create batch payout"});
        }

        return res.status(200).send();
    }
}