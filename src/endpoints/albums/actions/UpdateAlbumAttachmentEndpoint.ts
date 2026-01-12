import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {MediaClient} from "../../../utility/Media/MediaClient.ts";
import {MediaFileType} from "../../../models/enums/MediaFileType.ts";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";

export class UpdateAlbumAttachmentEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const {attachmentId, visible_to_artists} = req.body;
        if (!attachmentId) {
            return res.status(400).send({error: "Missing attachmentId or visible_to_artists"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.fileManagement, this.db))) {
            return res.status(403).send("You are not allowed to update attachments.");
        }

        const attachment = await this.db.getAlbumAttachmentById(attachmentId);
        if (!attachment) {
            return res.status(404).send({error: "Attachment not found"});
        }

        await this.db.updateAlbumAttachment(attachmentId, visible_to_artists ?? "");
        return res.send("OK");
    }
}