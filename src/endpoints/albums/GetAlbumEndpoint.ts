import { Application, Response } from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class GetAlbumEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let idParam = req.query.id as string;
        if (!idParam) {
            return res.send({error: "No album id provided"});
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.send({error: "Invalid album id"});
        }

        let album = await this.db.getAlbumById(id);
        if (!album) {
            return res.send({error: "Album not found"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            if (new Date(album.release_date).getTime() > new Date().getTime()) {
                return res.status(403).send("You are not allowed to view this album.");
            }
        }

        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
        });
        album.earnings = await this.db.getReleaseTotalRoyalty(album.upc);

        return res.send(album);
    }
}