import {Application, NextFunction, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {CLI} from "../../utility/CLI.js";

export class VerifyEmailEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        let { activationCode } = req.body;
        if (!activationCode || activationCode.trim().length === 0) {
            return res.status(401).send({error: "No verification code provided"});
        }
        activationCode = activationCode.trim();

        const emails = await this.db.getUserEmails(req.user.id);
        const matchingEmail = emails.find(e => e.verification_code === activationCode);
        if (!matchingEmail) {
            CLI.warning(`User ${req.user.username} tried to verify email with code ${activationCode}, but no such email found`);
            return res.status(400).send({error: "Wrong verification code"});
        }

        if (matchingEmail.verified) {
            return res.status(400).send({error: "Email is already verified"});
        }

        await this.db.verifyEmail(matchingEmail.user_id, matchingEmail.email);
        CLI.info(`User ${req.user.username} verified email ${matchingEmail.email}`);

        return res.send({message: "Email verified"});
    }
}