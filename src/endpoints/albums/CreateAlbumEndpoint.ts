import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../models/Authenticator.js";
import {CreateAlbumRequestBody} from "../../models/interfaces/CreateAlbumRequestBody.js";
import {Visibility} from "../../models/enums/Visibility.js";
import {CLI} from "../../utility/CLI.js";
import {Album} from "../../models/db/tri/Album.js";

export class CreateAlbumEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!Authenticator.guardEndpoint(req, res)) {
            return;
        }

        let body: CreateAlbumRequestBody = req.body;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const today = new Date();
        const title = body.title ?? `Album (${today.toDateString()})`;
        const upc = body.upc ?? "";
        const visibility = body.visibility ?? Visibility.public;
        const description = body.description ?? "";
        const release_date = new Date(body.release_date ?? today.toISOString());
        const price = body.price ?? 1;

        const album = await this.db.createAlbum(<Album>{
            user_id: req.user.id,
            title,
            upc,
            visibility,
            description,
            release_date,
            price
        });
        if (!album) {
            CLI.error("Failed to create album (album not found after creation)");
            return res.status(500).send({error: "Failed to create album"});
        }

        return res.send(album);
    }
}