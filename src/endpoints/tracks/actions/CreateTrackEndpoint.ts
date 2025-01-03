import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {CLI} from "../../../utility/CLI.js";
import {UploadTrackRequestBody} from "../../../models/interfaces/UploadTrackRequestBody.js";

export class CreateTrackEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!Authenticator.guardEndpoint(req, res)) {
            return;
        }

        let body: UploadTrackRequestBody = req.body;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const today = new Date();
        const title = body.title ?? `Track (${today.toDateString()})`;
        const isrc = body.isrc ?? "";
        const upc = body.upc ?? "";
        const monetization = (body.monetization ?? false) ? 1 : 0;
        const genre = body.genre ?? "";
        const description = body.description ?? "";
        const release_date = new Date(body.release_date ?? today.toISOString());
        const price = body.price ?? 1;

        const secretcode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        CLI.debug("Creating track...");
        const track = await this.db.createTrack({
            user_id: req.user.id,
            title,
            isrc,
            upc,
            monetization: !!monetization,
            secretcode,
            genre,
            description,
            release_date,
            price
        });
        if (!track) {
            CLI.error("Failed to create track");
            return res.status(500).send({error: "Failed to create track"});
        }
        CLI.success("Created track");

        return res.send(track);
    }
}
