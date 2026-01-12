import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";
import * as fs from "node:fs";
import {FileStorage} from "../../utility/Storage/FileStorage.ts";
import {MediaFileType} from "../../models/enums/MediaFileType.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";

export class GetFileEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        try {
            const id = req.query.id as string;
            const mediaFileType = req.query.mediaFileType as MediaFileType;
            if (!id) {
                return res.status(400).send("No id provided.");
            }
            const referenceId = parseInt(id);
            if (!mediaFileType) {
                return res.status(400).send("No mediaFileType provided.");
            } else if (!Object.values(MediaFileType).includes(mediaFileType)) {
                return res.status(400).send(`Invalid mediaFileType provided (${mediaFileType}), must be one of ` + Object.values(MediaFileType).join(", "));
            }

            const attachment = await this.db.getAlbumAttachmentById(referenceId);
            if (!attachment) {
                return res.status(404).send("Album not found.");
            }

            let artistNames: string[] = [];
            if (attachment.visible_to_artists) {
                artistNames = attachment.visible_to_artists.split(",").map(a => a.trim());
            } else {
                const album = await this.db.getAlbumById(attachment.album_id);
                if (!album) {
                    return res.status(404).send("Album not found.");
                }

                artistNames = album.artists.split(",").map(a => a.trim());
            }

            const userArtists = await this.db.getUserArtists(req.user.id);
            if (!userArtists.some(a => artistNames.includes(a.name))) {
                if (!await Authenticator.userHasPermission(req.user, Permissions.fileManagement, this.db)) {
                    return res.status(403).send("You do not have permission to view this file.");
                }
            }

            await this.getFile(res, mediaFileType, referenceId, attachment.name);
        } catch (error) {
            console.error("Error during file request:", error);
            res.status(500).send("Internal server error.");
        }
    }

    async getFile(res: Response, mediaFileType: MediaFileType, referenceId: number, fileName: string) {
        const filePath = FileStorage.filePath(mediaFileType, referenceId, fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).send("File not found.");
        }

        switch (fileName.split(".").pop()?.toLowerCase()) {
            case "pdf":
                res.header("Content-Type", "application/pdf");
                break;
            default:
                res.header("Content-Type", "application/octet-stream");
                break;
        }
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return new Promise<void>((resolve, reject) => {
            fileStream.on("error", reject);
            fileStream.on("end", () => {
                res.end();
                fileStream.destroy();
                resolve();
            });
        });
    }
}