import {Application} from "express";
import {Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Authenticator} from "../../../models/Authenticator.js";
import {PassportUser} from "../../../utility/PassportStrategy.js";
import {TriDB} from "../../../utility/DB/TriDB.js";

export class UpdateSettingEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const user = req.user as PassportUser;
        const key = req.body.setting;
        const value = req.body.value;

        if (key === "theme") {
            const themes = ["light"];
            if (!themes.includes(value)) {
                return res.status(400).json({error: "Invalid theme, must be one of: " + themes.join(", ")});
            }
        }

        const booleanKeys = ["playFromAutoQueue"];
        if (booleanKeys.includes(key) || booleanKeys.some(k => k.endsWith("*") && key.startsWith(k.replace("*", "")))) {
            if (typeof value !== "boolean") {
                return res.status(400).json({error: "Invalid value, must be a boolean"});
            }
        }

        await this.db.upsertUserSetting(user.id, key, value != null ? value.toString() : null);

        return res.status(200).json({success: true});
    }
}