import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import type {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {GetEndpoint} from "../base/GetEndpoint.ts";
import {ArtistEnricher} from "../../models/enrichers/ArtistEnricher.ts";
import {Artist} from "../../models/db/tri/Artist.ts";

export class GetArtistEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const name = req.query.name as string;
        if (!name) {
            return res.status(400).send("Missing name parameter");
        }

        const fullArtist = await this.db.getArtistByName(name);
        if (!fullArtist) {
            return res.status(404).send("Artist not found");
        }

        let artist = <Artist>{
            name: fullArtist.name,
            id: fullArtist.id,
            has_logo: fullArtist.has_logo,
        };

        artist = await ArtistEnricher.enrichAsync(this.db, artist, {
            albums: true,
            tracks: true
        });

        return res.send(artist);
    }
}