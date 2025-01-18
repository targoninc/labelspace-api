import { Application, Response } from "express";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import type {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {GetEndpoint} from "../base/GetEndpoint.ts";
import {ArtistEnricher} from "../../models/enrichers/ArtistEnricher.ts";

export class GetArtistsEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let artists = await this.db.getArtists();
        artists = await ArtistEnricher.enrichManyAsync(this.db, artists, {
            albums: true
        });

        return res.send(artists);
    }
}