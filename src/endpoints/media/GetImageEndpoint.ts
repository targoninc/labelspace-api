import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {GetEndpoint} from "../base/GetEndpoint.js";
import * as fs from "node:fs";
import {FileStorage} from "../../utility/Storage/FileStorage.js";
import {MediaFileType} from "../../models/enums/MediaFileType.js";

export class GetImageEndpoint extends GetEndpoint {
    db: TriDB;

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

            const validQualities = ["50", "100", "500"];
            const quality = (req.query.quality as string) ?? validQualities.at(-1);
            if (!validQualities.includes(quality)) {
                return res.status(400).send("Invalid quality provided, must be one of " + validQualities.join(", "));
            }

            const filePath = FileStorage.filePath(mediaFileType, referenceId, `${quality}.webp`);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send("File not found.");
            }

            res.header("Content-Type", "image/webp");
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            const promise = new Promise((resolve, reject) => {
                fileStream.on("error", reject);
                fileStream.on("end", () => {
                    res.end();
                    fileStream.destroy();
                    resolve();
                });
            });

            await promise;
        } catch (error) {
            console.error("Error during file request:", error);
            res.status(500).send("Internal server error.");
        }
    }
}