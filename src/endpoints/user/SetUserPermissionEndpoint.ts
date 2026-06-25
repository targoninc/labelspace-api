import {AuthenticatedPostEndpoint} from "../base/AuthenticatedPostEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";

export class SetUserPermissionEndpoint extends AuthenticatedPostEndpoint {
    private db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!(await Authenticator.userHasPermission(req.user, Permissions.userManagement, this.db))) {
            return res.status(403).send({error: "Not authorized"});
        }

        const {userId, permissionName, value} = req.body;
        if (!userId || !permissionName || value === undefined) {
            return res.status(400).send({error: "Missing required fields"});
        }

        await this.db.setUserPermission(userId, permissionName, value);
        return res.send("OK");
    }
}
