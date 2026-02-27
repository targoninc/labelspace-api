import {Application} from "express";
import {Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Authenticator} from "../../../models/Authenticator.js";
import {PassportUser} from "../../../utility/PassportStrategy.js";
import {TriDB} from "../../../utility/DB/TriDB.js";

export class UpdateSettingEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const user = req.user as PassportUser;
        const key = req.body.key;
        const value = req.body.value;

        const possibleKeys = ["theme", "paypalMail"];
        if (!possibleKeys.includes(key)) {
            return res.status(400).json({error: "Invalid setting key, must be one of: " + possibleKeys.join(", ")});
        }

        if (key === "theme") {
            const themes = ["light"];
            if (!themes.includes(value)) {
                return res.status(400).json({error: "Invalid theme, must be one of: " + themes.join(", ")});
            }
        }

        if (key === "paypalMail") {
            if (value != null && typeof value !== "string") {
                return res.status(400).json({error: "Invalid paypal mail, must be a string or null"});
            }

            if (!value?.includes("@")) {
                return res.status(400).json({error: "Invalid paypal mail, must be a valid email address"});
            }
        }

        await this.db.upsertUserSetting(user.id, key, value != null ? value.toString() : null);

        return res.status(200).json({success: true});
    }
}