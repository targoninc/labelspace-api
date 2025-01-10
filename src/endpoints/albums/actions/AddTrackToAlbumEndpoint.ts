import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";
import {Permissions} from "../../../models/enums/Permissions.ts";

export class AddTrackToAlbumEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to edit albums.");
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
            await this.db.addTrackToAlbum(id, track_id);
        }

        return res.send(`Track successfully added to ${album_ids.length - addedErrors} albums`);
    }
}