import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {MediaClient} from "../../../utility/Media/MediaClient.ts";
import {MediaFileType} from "../../../models/enums/MediaFileType.ts";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";

export class DeleteAlbumAttachmentEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const {attachmentId} = req.body;
        if (!attachmentId) {
            return res.status(400).send({error: "Missing attachmentId"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.fileManagement, this.db))) {
            return res.status(403).send("You are not allowed to delete attachments.");
        }

        const attachment = await this.db.getAlbumAttachmentById(attachmentId);
        if (!attachment) {
            return res.status(404).send({error: "Attachment not found"});
        }

        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.albumFile, attachmentId);
        await this.db.deleteAlbumAttachment(attachmentId);

        return res.send({attachmentId});
    }
}