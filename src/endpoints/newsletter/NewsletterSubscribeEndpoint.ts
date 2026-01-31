import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {NewsletterMailer} from "../../utility/Mail/NewsletterMailer.js";
import {uuidv4} from "uuidv7";

export class NewsletterSubscribeEndpoint extends PostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        let { email } = req.body;

        email = email?.trim().toLowerCase();
        if (!email || !email.includes("@") || email.length < 3) {
            return res.status(400).send({error: "Invalid email provided"});
        }

        const existing = await this.db.getNewsletterSignupByEmail(email);
        if (existing) {
            if (!existing.verified) {
                // Resend verification email if not verified yet
                NewsletterMailer.sendVerificationEmail(email, existing.code);
            }
            return res.status(200).send({message: "Subscription successful"});
        }

        const code = uuidv4().substring(0, 16);
        await this.db.createNewsletterSignup(email, code);
        
        NewsletterMailer.sendVerificationEmail(email, code);

        return res.status(200).send({message: "Subscription successful"});
    }
}
