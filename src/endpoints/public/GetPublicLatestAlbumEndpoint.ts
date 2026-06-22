import {Application, Response} from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";

export class GetPublicLatestAlbumEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: Response) {
        let album = await this.db.getLatestAlbum();
        if (!album) {
            return res.status(404).send({error: "No albums found"});
        }

        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
            links: true,
            trackEarnings: false,
        });

        return res.send(album);
    }
}
