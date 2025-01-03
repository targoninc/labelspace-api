import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {ProtectionSchemas} from "../../models/enums/ProtectionSchema.js";
import {ColumnProtector} from "../../models/ColumnProtector.js";
import {getUser, getUserByUsername} from "../../models/enums/ExtendedUser.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../../models/db/tri/User.js";
import {UserEnricher} from "../../models/enrichers/UserEnricher.js";
import {GetEndpoint} from "../base/GetEndpoint.js";

export class GetUserEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let selfUser = req.user;

        let user = await this.db.getUserById(selfUser.id);

        user = await UserEnricher.enrichAsync(this.db, user, {
            settings: true,
            artists: true,
            emails: true,
        });
        return res.send(user);
    }
}