import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Authenticator} from "../../../models/Authenticator.js";
import {Permissions} from "../../../models/enums/Permissions.js";
import {MediaClient} from "../../../utility/Media/MediaClient.js";
import {MediaFileType} from "../../../models/enums/MediaFileType.js";

export class DeleteAlbumEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const id = req.body.id;
        if (!id) {
            return res.status(400).send("No album id provided.");
        }

        const album = await this.db.getAlbumById(id);
        if (!album) {
            return res.status(404).send("Album not found.");
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to delete albums.");
        }

        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.albumCover, id);

        await this.db.deleteAlbum(id);

        res.status(200).send("Album deleted.");
    }
}
