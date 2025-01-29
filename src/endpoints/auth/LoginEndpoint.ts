import passport from "passport";
import {Application, NextFunction, Request, Response} from "express";
import {CLI} from "../../utility/CLI.js";
import {IP} from "../../utility/IP.js";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../../models/db/tri/User.js";
import {MfaStore} from "../../utility/MFA/MfaStore.ts";
import {ChallengeStore} from "../../utility/MFA/ChallengeStore.ts";
import {getUserMfa} from "../../utility/MFA/MfaFramework.ts";

export class LoginEndpoint extends PostEndpoint {
    private readonly db: TriDB;
    private readonly mfaStore: MfaStore;
    private readonly challengeStore: ChallengeStore;

    constructor(app: Application, path: string, db: TriDB, mfaStore: MfaStore, challengeStore: ChallengeStore) {
        super(app, path);
        this.db = db;
        this.mfaStore = mfaStore;
        this.challengeStore = challengeStore;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const cleanUsername = req.body.username.trim().toLowerCase();
        const challenge = req.body.challenge as string|undefined;
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

            const mfa = await getUserMfa(user, this.db);

            if (mfa.enabled) {
                if (!this.mfaStore.hasCompletedMfaProcess(user.id) ||
                    !this.challengeStore.hasCompletedChallenge(challenge))
                {
                    CLI.debug(`MFA not completed ${!this.mfaStore.hasCompletedMfaProcess(user.id)} ${!this.challengeStore.hasCompletedChallenge(challenge)}`);
                    return res.status(401).send({error: "MFA required"});
                }
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