import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {Visibility} from "../../models/enums/Visibility.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Track} from "../../models/db/tri/Track.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";

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

        const notUploader = !req.isAuthenticated() || track.user_id !== req.user.id;

        track = await TrackEnricher.enrichAsync(this.db, track, {
            user: true,
            protect: notUploader
        }, req.user);

        return res.send({
            track: <Track>{
                ...track,
                description: track.description ?? "",
                loudness_data: track.loudness_data ?? "[]",
                length: track.length ?? 0,
            },
            canEdit: !notUploader
        });
    }
}