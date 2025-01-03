import {PassportUser} from "../utility/PassportStrategy.js";
import {Request, Response} from "express";
import {User} from "./db/tri/User.js";
import {Permissions} from "./enums/Permissions.js";
import {TriDB} from "../utility/DB/TriDB.js";

export class Authenticator {
    static guardEndpoint(req: Request, res: Response) {
        if (!req.user || !req.isAuthenticated()) {
            res.status(401).send({error: "Not authenticated"});
            return false;
        }

        const user = req.user as PassportUser;
        if (user.mfa_needed && !user.mfa_completed) {
            res.status(401).send({error: "MFA required, but not completed"});
            return false;
        }

        return true;
    }

    static async userHasPermission(user: User, permissionName: Permissions, db: TriDB) {
        const permission = await db.getPermissionByName(permissionName);
        if (!permission) {
            return false;
        }
        return await db.userHasPermission(user.id, permission.id);
    }
}