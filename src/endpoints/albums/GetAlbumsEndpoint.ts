import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import type {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {GetEndpoint} from "../base/GetEndpoint.ts";
import {Track} from "../../models/db/tri/Track.ts";
import {Album} from "../../models/db/tri/Album.ts";

export class GetAlbumsEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        const canManage = await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db);
        const onlyReleased = req.query.onlyReleased === "true";

        let albums: Album[];
        if (user && !canManage) {
            const artists = await this.db.getUserArtists(user.id);
            albums = await this.db.getAlbumsVisibleToArtists(artists.map(a => a.name), onlyReleased);
        } else {
            albums = await this.db.getAlbums(!user || onlyReleased);
        }

        const trackCounts = await this.db.getTrackCountByAlbumIds(albums.map(a => a.id));

        albums = albums.map(a => {
            const count = trackCounts.find(c => c.id === a.id)?.count ?? 0;
            a.tracks = Array.from({ length: count }, () => ({} as Track));

            return a;
        });

        return res.send(albums);
    }
}