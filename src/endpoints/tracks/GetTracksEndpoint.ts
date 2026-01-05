import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {Track} from "../../models/db/tri/Track.ts";

export class GetTracksEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        const notAuthenticated = !(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db)) || !req.user;

        const onlyReleased = req.query.onlyReleased === "true";
        let tracks: Track[];
        if (user) {
            const artists = await this.db.getUserArtists(user.id);
            tracks = await this.db.getTracksVisibleToArtists(artists.map(a => a.name), notAuthenticated || onlyReleased);
        } else {
            tracks = await this.db.getTracks(notAuthenticated || onlyReleased);
        }

        tracks = await TrackEnricher.enrichManyAsync(this.db, tracks, {
            album: true,
        }, req.user);

        return res.send(tracks);
    }
}