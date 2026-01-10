import {Application, Response} from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Permissions} from "../../models/enums/Permissions.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {FileStorage} from "../../utility/Storage/FileStorage.ts";
import {MediaFileType} from "../../models/enums/MediaFileType.ts";

export class GetLatestAlbumEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let album = await this.db.getLatestAlbum();
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
        });

        return res.send(album);
    }
}