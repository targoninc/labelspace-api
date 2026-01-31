import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {CLI} from "@targoninc/ts-logging";
import {NewsletterMailer} from "../../utility/Mail/NewsletterMailer.ts";

export class NewsletterUnsubscribeEndpoint extends PostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        let { code, email } = req.body;
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            return res.status(400).send({error: "No unsubscribe code provided"});
        }

        if (!email || typeof email !== 'string' || email.trim().length === 0) {
            return res.status(400).send({error: "No email provided"});
        }

        code = code.trim();
        email = email.trim().toLowerCase();

        const signup = await this.db.getNewsletterSignupByEmail(email);
        if (!signup) {
            return res.status(200).send({message: "Unsubscribed successfully"});
        }

        if (signup.code !== code) {
            CLI.warning(`Newsletter unsubscribe failed: code mismatch for email ${email}`);
            return res.status(200).send({message: "Unsubscribed successfully"});
        }

        await this.db.deleteNewsletterSignupByEmailAndCode(email, code);
        CLI.info(`Newsletter unsubscribe successful for email ${signup.email}`);

        NewsletterMailer.sendUnsubscribeEmail(email);

        return res.status(200).send({message: "Unsubscribed successfully"});
    }
}
