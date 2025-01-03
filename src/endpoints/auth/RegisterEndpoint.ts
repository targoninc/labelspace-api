import {PostEndpoint} from "../base/PostEndpoint.js";
import {Application, NextFunction, Request, Response} from "express";
import {IP} from "../../utility/IP.js";
import bcrypt from "bcryptjs";
import {CLI} from "../../utility/CLI.js";
import {User} from "../../models/db/tri/User.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import passport from "passport";
import {v4 as uuidv4} from "uuid";
import {AccountMailer} from "../../utility/Mail/AccountMailer.js";

export class RegisterEndpoint extends PostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        CLI.info("Trying to register user");

        const body = req.body;
        const cleanUsername = body.username ? body.username.toLowerCase() : null;
        if (cleanUsername.length < 3) {
            CLI.warning(`Username must be at least 3 characters long`);
            return res.status(400).send({error: "Username must be at least 3 characters long"});
        }
        let cleanDisplayname = body.displayname ? body.displayname.trim() : null;
        if (!cleanDisplayname) {
            cleanDisplayname = cleanUsername;
        }

        const email = body.email ? body.email.trim().toLowerCase() : null;
        if (!email) {
            CLI.warning(`Email is required`);
            return res.status(400).send({error: "Email is required"});
        }
        const existingEmail = await this.db.getUserByEmail(email);
        if (existingEmail) {
            CLI.warning(`Email ${email} already exists`);
            return res.status(403).send({error: "Email already exists"});
        }

        const password = body.password ? body.password.trim() : null;
        if (!password) {
            CLI.warning(`Password is required`);
            return res.status(400).send({error: "Password is required"});
        }

        const existing = await this.db.getUserByUsername(cleanUsername);
        if (existing) {
            CLI.warning(`Username ${cleanUsername} already exists`);
            return res.status(403).send({error: "Username already exists"});
        }

        const ip = IP.get(req);
        const hashedPassword = bcrypt.hashSync(password, 10);
        const activationCode = uuidv4();
        await this.db.createUser(<User>{
            username: cleanUsername,
            displayname: cleanDisplayname,
            password_hash: hashedPassword,
        }, ip);

        const user = await this.db.getUserByUsername(cleanUsername);
        if (!user) {
            return res.status(500).send({ error: "Could not create user" });
        }

        user.emails = [
            {
                user_id: user.id,
                email,
                primary: true,
                verification_code: activationCode,
                verified: false,
                verified_at: null
            }
        ];
        await this.db.setUserEmails(user.id, user.emails);
        AccountMailer.sendActivationEmails(user.emails, user);

        passport.authenticate("local", async (err: Error, user: any, info: any, status: number) => {
            if (err) {
                CLI.error(err);
                return next(err);
            }

            if (!user) {
                CLI.warning(`No user, status: ${status}, info: ${JSON.stringify(info)}`);
                return res.status(401).send({error: "Invalid email or password"});
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