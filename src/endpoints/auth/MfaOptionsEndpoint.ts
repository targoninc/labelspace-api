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
import {getMfaOptions, getUserMfa} from "../../utility/MFA/MfaFramework.ts";

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

            const options = await getMfaOptions(user, this.db);
            return res.send(options);
        })(req, res, next);
    }
}