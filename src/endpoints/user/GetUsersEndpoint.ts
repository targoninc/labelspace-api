import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {CLI} from "../../utility/CLI.ts";
import {UserEnricher} from "../../models/enrichers/UserEnricher.ts";

export class GetUsersEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let user = req.user;
        CLI.debug("Getting users for user " + user.id);

        if (await Authenticator.userHasPermission(user, Permissions.userManagement, this.db)) {
            const users = await this.db.getUsers();

            for (let user of users) {
                user = await UserEnricher.enrichAsync(this.db, user, {
                    artists: true,
                    permissions: true,
                    public_keys: true,
                    totp: true,
                    emails: true
                });
            }

            return res.send(users);
        }

        return res.send([user]);
    }
}