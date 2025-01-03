import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class GetUsersEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let user = req.user;

        if (await Authenticator.userHasPermission(user, Permissions.userManagement, this.db)) {
            return res.send(await this.db.getUsersByIds([user.id]));
        }

        return res.send([user]);
    }
}