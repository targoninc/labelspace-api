import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";

export class GetPublicTrackEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: Response) {
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

        const trackReleaseTime = new Date(track.release_date).getTime();
        if (trackReleaseTime > new Date().getTime()) {
            return res.status(404).send({error: "Track not found"});
        }

        track = await TrackEnricher.enrichAsync(this.db, track, {
            albums: true,
            links: true,
            albumEarnings: false,
            splits: false,
        }, undefined);

        track.albums = track.albums?.filter(a => new Date(a.release_date).getTime() <= new Date().getTime());

        return res.send({
            ...track,
            loudness_data: track.loudness_data ?? "[]",
            length: track.length ?? 0,
        });
    }
}
