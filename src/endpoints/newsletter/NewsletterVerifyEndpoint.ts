import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {CLI} from "@targoninc/ts-logging";

export class NewsletterVerifyEndpoint extends PostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        let { code, email } = req.body;
        if (!code || code.trim().length === 0) {
            return res.status(400).send({error: "No verification code provided"});
        }
        code = code.trim();

        if (!email || email.trim().length === 0) {
            return res.status(400).send({error: "No email provided"});
        }
        email = email.trim().toLowerCase();

        const signup = await this.db.getNewsletterSignupByEmail(email);
        if (!signup) {
            CLI.warning(`Newsletter verification failed for code ${code}`);
            return res.status(400).send({error: "Invalid verification code"});
        }

        if (signup.code !== code) {
            CLI.warning(`Newsletter verification failed for email ${email}`);
            return res.status(400).send({error: "Invalid verification code"});
        }

        CLI.success(`Newsletter signup verified for email ${signup.email}`);
        await this.db.verifyNewsletterSignup(email);

        return res.send({message: "Subscription verified"});
    }
}
