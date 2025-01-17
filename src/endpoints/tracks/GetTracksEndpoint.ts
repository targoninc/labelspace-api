import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class GetTracksEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const notAuthenticated = !(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db));
        const tracks = await this.db.getTracks(notAuthenticated);

        for (let track of tracks) {
            track = await TrackEnricher.enrichAsync(this.db, track, {
                album: true,
            }, req.user);
        }

        return res.send(tracks);
    }
}