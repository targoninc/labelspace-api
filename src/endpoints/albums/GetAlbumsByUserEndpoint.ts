import { Application, Request, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";

export class GetAlbumsByUserEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response) {
        const userId = req.query.id as string;
        if (!userId) {
            return res.status(400).send({error: "No user id provided"});
        }

        const id = parseInt(userId.toString());
        if (isNaN(id)) {
            return res.status(400).send({error: "Invalid user id"});
        }

        let albums = await this.db.getAlbumsByUserId(id);
        albums = await AlbumEnricher.enrichManyAsync(this.db, albums, {
            user: true,
            tracks: true
        });

        return res.send(albums);
    }
}