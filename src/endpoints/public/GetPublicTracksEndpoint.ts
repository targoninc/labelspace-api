import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {Track} from "../../models/db/tri/Track.ts";

export class GetPublicTracksEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: Response) {
        const tracks = await this.db.getTracks(true);

        const result = await TrackEnricher.enrichManyAsync(this.db, tracks, {
            albums: true,
            albumEarnings: false,
        }, undefined);

        return res.send(result);
    }
}
