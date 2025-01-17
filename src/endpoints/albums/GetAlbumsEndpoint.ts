import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import type {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {GetEndpoint} from "../base/GetEndpoint.ts";

export class GetAlbumsEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const notAuthenticated = !(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db));

        let albums = await this.db.getAlbums(notAuthenticated);
        albums = await AlbumEnricher.enrichManyAsync(this.db, albums, {
            tracks: true
        });

        return res.send(albums);
    }
}