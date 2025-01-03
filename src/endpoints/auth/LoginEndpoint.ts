import passport from "passport";
import {Application, NextFunction, Request, Response} from "express";
import {CLI} from "../../utility/CLI.js";
import {IP} from "../../utility/IP.js";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../../models/db/tri/User.js";

export class LoginEndpoint extends PostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const cleanUsername = req.body.username.trim().toLowerCase();
        const existing = await this.db.getUserByUsername(cleanUsername);

        if (!existing) {
            return res.status(401).send({error: "Invalid username or password"});
        }

        if (!existing.ip) {
            const ip = IP.get(req);
            await this.db.updateUser(existing.id, {
                ip: ip
            });
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

            req.logIn(user, async (err) => {
                if (err) {
                    return next(err);
                }
                const outUser = <User>{
                    username: user.username,
                    displayname: user.displayname,
                    emails: user.emails,
                    mfa_enabled: user.mfa_enabled,
                    verified: user.verified,
                    verification_status: user.verification_status,
                    ip: user.ip
                };
                return res.send({
                    user: outUser
                });
            });
        })(req, res, next);
    }
}