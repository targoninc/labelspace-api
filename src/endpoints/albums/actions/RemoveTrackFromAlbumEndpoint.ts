import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";

export class RemoveTrackFromAlbumEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!Authenticator.guardEndpoint(req, res)) {
            return;
        }

        let body = req.body;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const { album_ids, track_id } = body;
        if (!album_ids || album_ids.length === 0) {
            return res.status(400).send({error: "No album_ids provided"});
        }

        if (!track_id) {
            return res.status(400).send({error: "No track_id provided"});
        }

        let addedErrors = 0;
        for (const id of album_ids) {
            await this.db.removeTrackFromAlbum(id, req.user.id, track_id);
        }

        return res.send(`Track successfully added to ${album_ids.length - addedErrors} albums`);
    }
}