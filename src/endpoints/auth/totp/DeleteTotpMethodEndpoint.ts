import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {TOTP} from "../../../utility/MFA/TOTP.ts";

export class DeleteTotpMethodEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        const id = req.body.id as number;
        if (!id || id === 0) {
            return res.status(400).send({error: "No id provided"});
        }

        const totp = await this.db.getTotp(req.user.id, id);
        if (!totp) {
            return res.status(404).send({error: "MFA method not found"});
        }

        if (!totp.verified) {
            await this.db.deleteTotpMethod(req.user.id, id);
            return res.status(200).send({message: "MFA method deleted"});
        }

        const token = req.body.token as string;
        if (!token || token.trim().length === 0) {
            return res.status(400).send({error: "No token provided"});
        }

        if (!TOTP.checkToken(token, totp.secret)) {
            return res.status(400).send({error: "Invalid token"});
        }
        await this.db.deleteTotpMethod(req.user.id, id);

        return res.status(200).send({message: "MFA method deleted"});
    }
}