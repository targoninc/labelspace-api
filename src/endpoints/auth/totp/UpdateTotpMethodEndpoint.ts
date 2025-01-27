import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {TOTP} from "../../../utility/MFA/TOTP.ts";

export class UpdateTotpMethodEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        let {name, id} = req.body;
        if (!id || id === 0) {
            return res.status(400).send({error: "No id provided"});
        }
        if (!name || name.trim().length === 0) {
            name = Math.random().toString(36).substring(2, 15);
        }

        await this.db.updateTotpMethodName(id, name);
        return res.status(200).send({message: "MFA method updated"});
    }
}