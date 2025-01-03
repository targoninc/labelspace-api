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

export class MfaRequestEndpoint extends PostEndpoint {
    private db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
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

            req.logIn(user, async (err) => {
                if (err) {
                    CLI.error(err);
                    return next(err);
                }

                user.settings = await this.db.getUserSettings(user.id);

                if (!user.mfa_enabled) {
                    return res.send({
                        user
                    });
                }

                // TODO: Rewrite this to be stored elsewhere (in-memory cache for mfa processes?)
                user.mfa_needed = true;
                user.mfa_completed = false;

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

                const primaryEmail = await this.db.getUserPrimaryEmail(user.id);
                if (!primaryEmail) {
                    throw new Error("User has no primary email");
                }
                Mail.sendDefault(primaryEmail.email, mail);

                return res.send({
                    mfa_needed: true
                });
            });
        })(req, res, next);
    }
}