import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import type {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";

export class GetAlbumsEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to view albums.");
        }

        let albums = await this.db.getAlbums();
        albums = await AlbumEnricher.enrichManyAsync(this.db, albums, {
            tracks: true
        });

        return res.send(albums);
    }
}