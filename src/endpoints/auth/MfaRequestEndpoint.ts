import {Application, NextFunction, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {CLI} from "../../utility/CLI.js";
import {IP} from "../../utility/IP.js";
import passport from "passport";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Mail} from "../../utility/Mail/Mail.js";
import {heading, MailBuilder, paragraph} from "../../utility/Mail/MailBuilder.js";
import {User} from "../../models/db/tri/User.js";
import {MfaStore} from "../../utility/MFA/MfaStore.ts";

export class MfaRequestEndpoint extends PostEndpoint {
    private db: TriDB;
    private readonly mfaStore: MfaStore;

    constructor(app: Application, path: string, db: TriDB, mfaStore: MfaStore) {
        super(app, path);
        this.db = db;
        this.mfaStore = mfaStore;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const cleanUsername = req.body.username.trim().toLowerCase();
        const existing = await this.db.getUserByUsername(cleanUsername);

        if (!existing) {
            return res.status(401).send({error: "Invalid username or password"});
        }

        if (existing && !existing.ip) {
            const ip = IP.get(req);
            await this.db.updateUser(existing.id, {
                ip: ip
            });
        }

        passport.authenticate("local", async (err: Error, user: User) => {
            if (err) {
                CLI.error(err);
                return next(err);
            }

            if (!user) {
                return res.status(401).send({error: "Invalid username or password"});
            }

            user.settings = await this.db.getUserSettings(user.id);
            const primaryEmail = await this.db.getUserPrimaryEmail(user.id);
            const userTotp = await this.db.getUserTotp(user.id);
            const useTotp = userTotp && userTotp.length > 0 && userTotp.some(t => t.verified);
            const needsMfa = useTotp;

            if (!needsMfa) {
                return res.send({
                    user,
                    mfa_needed: false
                });
            }

            const process = this.mfaStore.createMfaProcess(user.id, useTotp ? "totp" : "email");
            if (process.method_type === "totp") {
                return res.send({
                    mfa_needed: true,
                    userId: user.id
                });
            }

            const code = Math.random().toString(36).substring(7);
            CLI.info(`MFA code for ${existing.username}: ${code}`);

            const mail = MailBuilder.default()
                .subject("Your Tri Artist code")
                .heading("Your Tri Artist code")
                .paragraph("You have requested logging into your Tri Artist account.")
                .card([
                    paragraph("Your code"),
                    heading(code, 2)
                ])
                .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
                .signature()
                .get();
            Mail.sendDefault(primaryEmail.email, mail);
            await this.db.updateUser(user.id, {
                email_mfa_code: code
            });

            return res.send({
                mfa_needed: true,
                userId: user.id
            });
        })(req, res, next);
    }
}