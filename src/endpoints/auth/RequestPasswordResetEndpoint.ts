import {Application, NextFunction, Request, Response} from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Mail, link, MailBuilder, paragraph} from "@targoninc/ts-mail";
import {v4 as uuidv4} from "uuid";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {CLI} from "@targoninc/ts-logging";
import {
    COMPANY_CONTACT,
    COMPANY_NAME,
    LABEL_NAME,
    MAIL_LOGO_URL,
    PORTAL_NAME,
    PORTAL_UI_URL
} from "../../utility/Constants.ts";

export class RequestPasswordResetEndpoint extends PostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const username = req.body.username;
        if (!username || username.trim().length === 0) {
            return res.status(400).send({error: "No username provided"});
        }

        const user = await this.db.getUserByUsername(username);
        if (!user) {
            return res.status(404).send({error: "User not found"});
        }

        const token = uuidv4();
        await this.db.updateUser(user.id, {
            password_token: token
        });

        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`${PORTAL_NAME} password reset requested`)
            .heading(`${PORTAL_NAME} password reset requested`)
            .paragraph(`You have requested a password reset for your ${PORTAL_NAME} account (${user.username}).`)
            .card([
                paragraph("To reset your password, click the link below:"),
                link(`${PORTAL_UI_URL}/password-reset?token=${token}`)
            ])
            .paragraph(`If you did not request this, please contact us immediately at ${COMPANY_CONTACT}.`)
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .get();

        const emails = await this.db.getUserEmails(user.id);
        let anySent = false;
        for (const email of emails) {
            if (email.verified || email.primary) {
                Mail.sendDefault(email.email, mail);
                anySent = true;
            }
        }
        if (!anySent) {
            CLI.warning(`No emails verified or primary for ${user.id}, no mail sent`);
            return res.status(500).send({error: "No valid addresses found"});
        }

        return res.send({message: "Password changed"});
    }
}