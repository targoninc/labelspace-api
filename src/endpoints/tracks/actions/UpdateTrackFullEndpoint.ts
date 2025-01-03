import {AuthenticatedPostEndpoint} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application} from "express";
import {UpdateTrackRequest} from "../../../models/interfaces/UpdateTrackRequest.js";

export class UpdateTrackFullEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req, res) {
        const request = req.body as UpdateTrackRequest;
        if (!request.id) {
            return res.status(400).send("No track id provided.");
        }

        const track = await this.db.getTrackById(request.id);
        if (!track) {
            return res.status(404).send("Track not found.");
        }

        await this.db.updateTrack(request);
        return res.send("Track updated.");
    }
}