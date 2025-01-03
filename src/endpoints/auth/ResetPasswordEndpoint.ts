import {Application, NextFunction, Request, Response} from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Mail} from "../../utility/Mail/Mail.js";
import {Password} from "../../utility/Password.js";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {CLI} from "../../utility/CLI.js";
import bcrypt from "bcryptjs";
import {MailBuilder} from "../../utility/Mail/MailBuilder.js";

export class ResetPasswordEndpoint extends PostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const {token, newPassword, newPasswordConfirm} = req.body;
        CLI.debug(`Resetting password for token ${token}`);
        if (!token) {
            return res.status(400).send({error: "No token provided"});
        }

        const user = await this.db.getUserByToken(token);
        if (!user) {
            return res.status(404).send({error: "User not found"});
        }

        if (token !== user.password_token) {
            return res.status(400).send({error: "Invalid token"});
        }

        const passwordValidationResult = Password.validateNewPassword(newPassword, newPasswordConfirm);
        if (!passwordValidationResult.hashedPassword) {
            return res.status(passwordValidationResult.code).send({error: passwordValidationResult.error});
        }

        if (bcrypt.compareSync(newPassword, user.password_hash)) {
            return res.status(400).send({error: "New password must be different from old password"});
        }

        CLI.debug(`Updating password for user ${user.id}`);
        await this.db.updateUser(user.id, {
            password_hash: passwordValidationResult.hashedPassword,
            password_token: null,
            password_updated_at: new Date()
        });

        const mail = MailBuilder.default()
            .subject("Your Tri Artist password was reset")
            .heading("Your Tri Artist password was reset")
            .paragraph("Your password was changed.")
            .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
            .signature()
            .get();

        const emails = await this.db.getUserEmails(user.id);
        for (const email of emails) {
            if (email.verified || email.primary) {
                Mail.sendDefault(email.email, mail);
            }
        }

        return res.send({message: "Password changed"});
    }
}