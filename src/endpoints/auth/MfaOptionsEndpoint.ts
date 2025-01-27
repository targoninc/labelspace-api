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
import {CredentialDescriptor} from "@passwordless-id/webauthn/dist/esm/types";
import {getUserMfa} from "../../utility/MFA/MfaFramework.ts";

export class MfaOptionsEndpoint extends PostEndpoint {
    private readonly db: TriDB;
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

        passport.authenticate("local", async (err: Error, user: User) => {
            if (err) {
                CLI.error(err);
                return next(err);
            }

            if (!user) {
                return res.status(401).send({error: "Invalid username or password"});
            }

            user.settings = await this.db.getUserSettings(user.id);
            const mfa = await getUserMfa(user, this.db);

            if (!mfa.enabled) {
                return res.send({
                    user
                });
            }

            if (mfa.webauthn.enabled) {
                return res.send({
                    mfa_needed: true,
                    type: "webauthn",
                    userId: user.id,
                    credentialDescriptors: mfa.webauthn.methods.map(k => (<CredentialDescriptor>{
                        id: k.key_id,
                        transports: k.transports.split(",")
                    }))
                });
            }

            const process = this.mfaStore.createMfaProcess(user.id, mfa.totp.enabled ? "totp" : "email");
            if (process.method_type === "totp") {
                return res.send({
                    mfa_needed: true,
                    type: "totp",
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
            Mail.sendDefault(mfa.email.methods[0].email, mail);
            await this.db.updateUser(user.id, {
                email_mfa_code: code
            });

            return res.send({
                mfa_needed: true,
                type: "email",
                userId: user.id
            });
        })(req, res, next);
    }
}