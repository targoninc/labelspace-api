import passport from "passport";
import {Application, NextFunction, Request, Response} from "express";
import {CLI} from "../../utility/CLI.js";
import {IP} from "../../utility/IP.js";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../../models/db/tri/User.js";
import {MfaStore} from "../../utility/MfaStore.ts";

export class LoginEndpoint extends PostEndpoint {
    db: TriDB;
    private readonly mfaStore: MfaStore;

    constructor(app: Application, path: string, db: TriDB, mfaStore: MfaStore) {
        super(app, path);
        this.db = db;
        this.mfaStore = mfaStore;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const cleanUsername = req.body.username.trim().toLowerCase();
        const existing = await this.db.getUserByUsername(cleanUsername);

        if (!existing) {
            return res.status(401).send({error: "Invalid username or password"});
        }

        passport.authenticate("local", async (err: Error, user: any, info: any, status: number) => {
            if (err) {
                CLI.error(err);
                return next(err);
            }

            if (!user) {
                CLI.warning(`No user, status: ${status}, info: ${JSON.stringify(info)}`);
                return res.status(401).send({error: "Invalid username or password"});
            }

            if (this.mfaStore.hasUncompletedMfaProcess(user.id)) {
                return res.status(401).send({error: "MFA required"});
            }

            const primaryEmail = await this.db.getUserPrimaryEmail(user.id);
            const userTotp = await this.db.getUserTotp(user.id);
            const useTotp = userTotp && userTotp.length > 0 && userTotp.some(t => t.verified);
            const needsMfa = useTotp || (primaryEmail && primaryEmail.verified);
            if (needsMfa && !this.mfaStore.hasCompletedMfaProcess(user.id)) {
                return res.status(401).send({error: "MFA required"});
            }

            req.logIn(user, async (err) => {
                if (err) {
                    return next(err);
                }
                const outUser = <User>{
                    username: user.username,
                    emails: user.emails,
                    mfa_enabled: user.mfa_enabled,
                    verified: user.verified,
                    verification_status: user.verification_status,
                    ip: user.ip
                };

                const ip = IP.get(req);
                const now = new Date();
                const utcNow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
                await this.db.updateUser(user.id, {
                    secondlastlogin: user.lastlogin,
                    lastlogin: utcNow,
                    ip: ip
                });

                return res.send({
                    user: outUser
                });
            });
        })(req, res, next);
    }
}