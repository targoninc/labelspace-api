import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {CLI} from "@targoninc/ts-logging";
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

            await UserEnricher.enrichManyAsync(this.db, users, {
                artists: true,
                permissions: true,
                public_keys: true,
                totp: true,
                emails: true
            });

            await Promise.all(users.map(async user => {
                const artistNames = (user.artists ?? []).map(a => a.name);
                user.available = await this.db.getAvailablePaymentAmount(user.id, artistNames);
            }));

            return res.send(users);
        }

        return res.send([user]);
    }
}