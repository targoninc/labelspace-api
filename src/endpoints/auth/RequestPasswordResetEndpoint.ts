import {Application, NextFunction, Request, Response} from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Mail} from "../../utility/Mail/Mail.js";
import {v4 as uuidv4} from "uuid";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {link, MailBuilder, paragraph} from "../../utility/Mail/MailBuilder.js";

export class RequestPasswordResetEndpoint extends PostEndpoint {
    db: TriDB;

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

        const mail = MailBuilder.default()
            .subject("Tri Artist password reset requested")
            .heading("Tri Artist password reset requested")
            .paragraph(`You have requested a password reset for your Tri Artist account (${user.username}).`)
            .card([
                paragraph("To reset your password, click the link below:"),
                link(`https://artists.trirecords.eu/password-reset?token=${token}`)
            ])
            .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
            .signature()
            .get();

        const emails = await this.db.getUserEmails(user.id);
        for (const email of emails) {
            if (email.verified || email.primary) {
                Mail.sendDefault(email.email, mail);
            }
        }

        return res.send({message: "Password changed"});
    }
}