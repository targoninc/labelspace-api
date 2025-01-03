import {AuthenticatedPostEndpoint} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application} from "express";
import {MediaClient} from "../../utility/Media/MediaClient.js";

export class DeleteMediaEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req, res) {
        const type = req.body.type;
        const referenceId = req.body.referenceId;
        if (!type || !referenceId) {
            return res.status(400).send("No type or referenceId provided.");
        }

        try {
            await MediaClient.deleteMediaForEntity(this.db, type, referenceId);
        } catch (e) {
            console.error("Error deleting media:", e);
            return res.status(500).send(e);
        }

        return res.status(200).send("Media deleted.");
    }
}