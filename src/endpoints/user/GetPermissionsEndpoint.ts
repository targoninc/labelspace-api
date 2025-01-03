import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {UserPermission} from "../../models/db/tri/UserPermission.js";
import {Permission} from "../../models/db/tri/Permission.js";
import {GetEndpoint} from "../base/GetEndpoint.js";

export class GetPermissionsEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let selfUser = req.user;
        if (!selfUser) {
            return res.status(200).send([]);
        }

        const userPermissions: UserPermission[] = await this.db.getUserPermissions(selfUser.id);
        if (userPermissions.length === 0) {
            return res.status(200).json([]);
        }
        const permissions: Permission[] = await this.db.getPermissionsByIds(userPermissions.map(up => up.permission_id));

        res.status(200).json(permissions);
    }
}