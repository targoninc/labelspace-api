import {Application, NextFunction, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {CLI, IP} from "@targoninc/ts-logging";
import passport from "passport";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Mail, heading, MailBuilder, paragraph} from "@targoninc/ts-mail";
import {User} from "../../models/db/tri/User.js";
import {MfaStore} from "../../utility/MFA/MfaStore.ts";
import {getMfaOptions} from "../../utility/MFA/MfaFramework.ts";
import {MfaOption} from "../../utility/MFA/Enums/MfaOption.ts";
import {COMPANY_CONTACT, COMPANY_NAME, LABEL_NAME, MAIL_LOGO_URL, PORTAL_NAME} from "../../utility/Constants.ts";

export class MfaRequestEndpoint extends PostEndpoint {
    private readonly db: TriDB;
    private readonly mfaStore: MfaStore;

    constructor(app: Application, path: string, db: TriDB, mfaStore: MfaStore) {
        super(app, path);
        this.db = db;
        this.mfaStore = mfaStore;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const cleanUsername = req.body.username.trim().toLowerCase();
        const selectedMethod = req.body.method.trim().toLowerCase();
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

            const availableOptions = await getMfaOptions(user, this.db);
            const preferredOptions = [selectedMethod].concat(availableOptions.map(k => k.type)).filter(t => !!t) as MfaOption[];
            if (availableOptions.length === 0) {
                return res.status(400).send({error: "MFA not enabled"});
            }

            for (const option of preferredOptions) {
                const hasOption = availableOptions.some(k => k.type === option);
                if (!hasOption) {
                    continue;
                }

                switch (option) {
                    case MfaOption.webauthn:
                        return res.send({
                            mfa_needed: true,
                            type: MfaOption.webauthn,
                            userId: user.id,
                            credentialDescriptors: availableOptions.find(k => k.type === MfaOption.webauthn)?.credentialDescriptors
                        });
                    case MfaOption.totp:
                        this.mfaStore.createMfaProcess(user.id, MfaOption.totp);

                        return res.send({
                            mfa_needed: true,
                            type: MfaOption.totp,
                            userId: user.id
                        });
                    case MfaOption.email:
                        this.mfaStore.createMfaProcess(user.id, MfaOption.email);
                        await this.sendMfaMail(existing, availableOptions, user);

                        return res.send({
                            mfa_needed: true,
                            type: MfaOption.email,
                            userId: user.id
                        });
                    default:
                        return res.status(400).send({
                            error: "Requested MFA option is not supported"
                        });
                }
            }
        })(req, res, next);
    }

    private async sendMfaMail(existing: User, availableOptions: any[], user: User) {
        const code = Math.random().toString(36).substring(7);
        CLI.info(`MFA code for ${existing.username}: ${code}`);

        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`Your ${PORTAL_NAME} code`)
            .heading(`Your ${PORTAL_NAME} code`)
            .paragraph(`You have requested logging into your ${PORTAL_NAME} account.`)
            .card([
                paragraph("Your code"),
                heading(code, 2)
            ])
            .paragraph(`If you did not request this, please contact us immediately at ${COMPANY_CONTACT}.`)
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .get();
        const emailOption = availableOptions.find(k => k.type === MfaOption.email);
        Mail.sendDefault(emailOption.email, mail);
        await this.db.updateUser(user.id, {
            email_mfa_code: code
        });
    }
}