import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {CLI} from "@targoninc/ts-logging";

export class NewsletterUnsubscribeEndpoint extends PostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        let { code, email } = req.body;
        if (!code || code.trim().length === 0) {
            return res.status(400).send({error: "No unsubscribe code provided"});
        }

        if (!email || email.trim().length === 0) {
            return res.status(400).send({error: "No email provided"});
        }

        code = code.trim();
        email = email.trim().toLowerCase();

        const signup = await this.db.getNewsletterSignupByEmail(email);
        if (!signup) {
            return res.status(200).send({message: "Unsubscribed successfully"});
        }

        await this.db.deleteNewsletterSignupByCode(email, code);
        CLI.info(`Newsletter unsubscribe successful for email ${signup.email}`);

        return res.status(200).send({message: "Unsubscribed successfully"});
    }
}
