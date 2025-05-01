import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {UserEnricher} from "../../models/enrichers/UserEnricher.js";
import {GetEndpoint} from "../base/GetEndpoint.js";

export class GetUserEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let selfUser = req.user;
        if (!selfUser) {
            return res.status(401).send({error: "Not authenticated"});
        }

        let user = await this.db.getUserById(selfUser.id);
        if (!user) {
            return res.status(404).send({error: "User not found"});
        }

        user = await UserEnricher.enrichAsync(this.db, user, {
            settings: true,
            artists: true,
            emails: true,
            permissions: true,
            totp: true,
            public_keys: true,
        });
        return res.send(user);
    }
}