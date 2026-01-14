import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class GetTrackEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let idParam = req.query.id as string;
        if (!idParam) {
            return res.status(400).send({error: "No track id provided"});
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).send({error: "Invalid track id"});
        }

        let track = await this.db.getTrackById(id);
        if (!track) {
            return res.status(404).send({error: "Track not found"});
        }

        const hasReleaseManagementPermission = await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db);
        const trackReleaseTime = new Date(track.release_date).getTime();
        const userArtists = await this.db.getUserArtists(id);
        const trackArtists = track.artists.split(",").map(a => a.trim());

        if (trackReleaseTime > new Date().getTime() && !hasReleaseManagementPermission && !userArtists.some(a => trackArtists.includes(a.name))) {
            return res.status(404).send({error: "Track not found"});
        }

        const addData = !!req.user;
        track = await TrackEnricher.enrichAsync(this.db, track, {
            album: true,
            albumEarnings: addData,
        }, req.user);

        if (addData) {
            track.earnings = await this.db.getTrackTotalRoyalty(track.isrc);
        }

        return res.send({
            ...track,
            loudness_data: track.loudness_data ?? "[]",
            length: track.length ?? 0,
        });
    }
}