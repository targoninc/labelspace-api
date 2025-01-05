import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import { ColumnProtector } from "../../models/ColumnProtector.js";
import {ProtectionSchemas} from "../../models/enums/ProtectionSchema.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Album} from "../../models/db/tri/Album.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";

export class GetAlbumEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let idParam = req.query.id as string;
        if (!idParam) {
            return res.send({error: "No album id provided"});
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.send({error: "Invalid album id"});
        }

        let album = await this.db.getAlbumById(id);
        if (!album) {
            return res.send({error: "Album not found"});
        }

        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
        });

        album.description ??= "";
        return res.send(album);
    }
}