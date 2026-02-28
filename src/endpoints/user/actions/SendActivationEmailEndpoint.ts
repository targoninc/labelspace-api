import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Application, Response} from "express";
import {AccountMailer} from "../../../utility/Mail/AccountMailer.js";
import {TriDB} from "../../../utility/DB/TriDB.js";

export class SendActivationEmailEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const emails = await this.db.getEmailsByUserId(user.id);
        if (emails.length === 0) {
            throw new Error("User has no emails");
        }

        AccountMailer.sendActivationEmails(emails, user);

        return res.status(200).send();
    }
}