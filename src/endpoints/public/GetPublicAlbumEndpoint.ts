import {Application, Response} from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {MediaFileType} from "../../models/enums/MediaFileType.ts";

export class GetPublicAlbumEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: Response) {
        let idParam = req.query.id as string;
        if (!idParam) {
            return res.status(400).send({error: "No album id provided"});
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).send({error: "Invalid album id"});
        }

        let album = await this.db.getAlbumById(id);
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        const albumReleaseTime = new Date(album.release_date).getTime();
        if (albumReleaseTime > new Date().getTime()) {
            return res.status(404).send({error: "Album not found"});
        }

        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
            links: true,
            trackEarnings: false,
        });

        return res.send(album);
    }
}
