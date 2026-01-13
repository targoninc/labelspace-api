import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";

export class CreateAlbumAttachmentEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let {albumId, name} = req.body;
        if (!albumId || !name) {
            return res.status(400).send({error: "Missing albumId"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.fileManagement, this.db))) {
            return res.status(403).send("You are not allowed to create attachments.");
        }

        const album = await this.db.getAlbumById(albumId);
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        const attachmentId = await this.db.createAlbumAttachment(albumId, name, "");
        return res.send({attachmentId});
    }
}