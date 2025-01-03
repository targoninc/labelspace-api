import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";

export class GetTracksByUserEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const userId = req.query.id as string;
        if (!userId) {
            return res.status(400).send({error: "No user id provided"});
        }

        const id = parseInt(userId);
        if (isNaN(id)) {
            return res.status(400).send({error: "Invalid user id"});
        }

        let tracks = await this.db.getTracksByUserId(id);
        if (!tracks) {
            return res.send([]);
        }

        const notUploader = !req.isAuthenticated() || id !== req.user!.id;
        tracks = await TrackEnricher.enrichManyAsync(this.db, tracks, {
            user: true,
            protect: notUploader
        });

        return res.send(tracks);
    }
}