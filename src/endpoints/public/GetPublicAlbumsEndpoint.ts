import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {GetEndpoint} from "../base/GetEndpoint.ts";
import {Track} from "../../models/db/tri/Track.ts";
import {Album} from "../../models/db/tri/Album.ts";

export class GetPublicAlbumsEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: Response) {
        const albums = await this.db.getAlbums(true);

        const trackCounts = await this.db.getAlbumTrackCounts();

        const result = albums.map(a => {
            const count = trackCounts.find(c => c.id === a.id)?.count ?? 0;
            a.tracks = Array.from({ length: count }, () => ({} as Track));
            return a;
        });

        return res.send(result);
    }
}
