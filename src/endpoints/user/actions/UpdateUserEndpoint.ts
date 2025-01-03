import {Application} from "express";
import {Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Authenticator} from "../../../models/Authenticator.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {CLI} from "../../../utility/CLI.js";
import {User} from "../../../models/db/tri/User.js";
import {uuidv4} from "uuidv7";
import {AccountMailer} from "../../../utility/Mail/AccountMailer.js";
import {UserEmail} from "../../../models/db/tri/UserEmail.js";

export class UpdateUserEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const user = req.body.user as User;
        if (!user) {
            return res.status(400).send({error: "No user provided"});
        }

        if (Object.values(user).some(v => v.length === 0)) {
            return res.status(400).send({error: "User must have a username, description or emails"});
        }

        const updatedUser: Partial<User> = {
            username: user.username ?? req.user.username,
            description: user.description ?? req.user.description,
        };

        if (!updatedUser.username || updatedUser.username.trim().length === 0) {
            return res.status(400).send({error: "User must have a username"});
        }

        if (updatedUser.username !== req.user.username) {
            const existing = await this.db.getUserByUsername(updatedUser.username);
            if (existing && existing.id !== req.user.id) {
                return res.status(400).send({error: "Username already in use"});
            }
        }

        CLI.debug(`Updating user ${req.user.id} with ${JSON.stringify(user)}`);
        await this.db.updateUser(req.user.id, updatedUser);

        if (user.emails) {
            let emails = user.emails as UserEmail[];
            if (!emails) {
                return res.status(400).send({error: "No emails provided"});
            }

            emails = emails.filter(e => e.email && e.email.trim().length > 0);
            if (emails.length === 0) {
                return res.status(400).send({error: "No emails provided"});
            }
            const primaryCount = emails.filter(e => e.primary).length;
            if (primaryCount > 1) {
                return res.status(400).send({error: "Only one primary email allowed"});
            } else if (primaryCount === 0) {
                return res.status(400).send({error: "No primary email provided"});
            }

            for (const userEmail of emails) {
                const existing = await this.db.getUserByEmail(userEmail.email);
                if (existing && existing.id !== user.id) {
                    CLI.warning(`Email ${userEmail.email} (tried to add by user ${user.username}) already in use by user ${existing.username}`);
                    return res.status(400).send({error: `Email ${userEmail.email} already in use`});
                }
            }
            await this.db.setUserEmails(user.id, emails);
            const existingEmails = await this.db.getUserEmails(user.id);
            for (const existingEmail of existingEmails) {
                if (!emails.some(e => e.email === existingEmail.email)) {
                    await this.db.deleteUserEmail(user.id, existingEmail.email);
                }
            }
        }

        return res.status(200).send({success: true});
    }
}