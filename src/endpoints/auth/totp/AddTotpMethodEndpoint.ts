import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {TOTP} from "../../../utility/MFA/TOTP.ts";

export class AddTotpMethodEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        let {name} = req.body;
        if (!name || name.trim().length === 0) {
            name = Math.random().toString(36).substring(2, 15);
        }

        const secret = TOTP.newSecret();
        await this.db.addTotpMethod(req.user.id, name, secret);

        const imageUrl = await TOTP.generateQR(req.user, secret);
        return res.status(200).send({
            secret,
            qrDataUrl: imageUrl
        });
    }
}