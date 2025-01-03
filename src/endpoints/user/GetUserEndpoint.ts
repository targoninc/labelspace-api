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
        let id = req.query.id as string | undefined;
        let name = req.query.name as string | undefined;
        if (selfUser && parseInt(id ?? "0") === selfUser.id) {
            id = undefined;
        } else if (selfUser && name === selfUser.username) {
            name = undefined;
        }
        let user: User;

        if (id && id !== "undefined") {
            const idNumber = parseInt(id);
            user = await getUser(this.db, idNumber);
            if (!user) {
                return res.status(404).send({error: "User not found"});
            }

            user = ColumnProtector.protect<User>(user, ProtectionSchemas.user);
        } else if (name && name !== "undefined") {
            user = await getUserByUsername(this.db, name);
            if (!user) {
                return res.status(404).send({error: "User not found"});
            }

            user = ColumnProtector.protect<User>(user, ProtectionSchemas.user);
        } else {
            if (!selfUser) {
                return res.status(401).send({error: "Not authenticated"});
            }

            user = selfUser;
        }

        user = await UserEnricher.enrichAsync(this.db, user, {
            settings: selfUser && user.id === selfUser.id,
            emails: selfUser && user.id === selfUser.id
        });
        return res.send(user);
    }
}