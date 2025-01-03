import {Application, NextFunction, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import bcrypt from "bcryptjs";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Password} from "../../utility/Password.js";
import {password} from "bun";

export class ChangePasswordEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        const {oldPassword, newPassword, newPasswordConfirm} = req.body;

        const passwordValidationResult = Password.validate(newPassword, newPasswordConfirm, oldPassword);
        if (!passwordValidationResult.hashedPassword) {
            return res.status(passwordValidationResult.code).send({error: passwordValidationResult.error});
        }

        await this.db.updateUser(req.user.id, {
            password_hash: passwordValidationResult.hashedPassword,
            password_updated_at: new Date()
        });
        return res.send({message: "Password changed"});
    }
}