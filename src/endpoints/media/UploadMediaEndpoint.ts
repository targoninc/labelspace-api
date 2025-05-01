import { AuthenticatedPostEndpoint } from "../base/AuthenticatedPostEndpoint.js";
import { Application, Response } from "express";
import { AuthenticatedRequest } from "../base/AuthenticatedPostEndpoint.js";
import { Authenticator } from "../../models/Authenticator.js";
import { TriDB } from "../../utility/DB/TriDB.js";
import multer from "multer";
import {MediaClient} from "../../utility/Media/MediaClient.js";
import {MediaFileType} from "../../models/enums/MediaFileType.js";
import {CLI} from "@targoninc/ts-logging";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export class UploadMediaEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    register(interceptors = []) {
        super.register([
            upload.single('file')
        ]);
    }

    async run(req: AuthenticatedRequest, res: Response) {
        try {
            Authenticator.guardEndpoint(req, res);

            if (!req.file) {
                res.status(400).send("No file uploaded.");
                return;
            }

            let incomingId = req.body.referenceId as string;
            const fileType = req.body.type as MediaFileType;
            if (!incomingId) {
                res.status(400).send("No referenceId provided.");
                return;
            }
            const referenceId = parseInt(incomingId);

            if (!fileType) {
                res.status(400).send("No fileType provided.");
                return;
            } else if (!Object.values(MediaFileType).includes(fileType)) {
                res.status(400).send("Invalid fileType provided, must be one of " + Object.values(MediaFileType).join(", "));
                return;
            }

            const error = await MediaClient.validateMedia(this.db, fileType, referenceId, req.file.originalname, req.user, req.file);
            if (error) {
                return res.status(error.code).send(error.error);
            }

            const originalExtension = req.file.originalname.split(".").pop()?.replace("/", "") ?? ".mp3";

            let fileName;
            if (fileType === MediaFileType.albumFile) {
                fileName = req.body.fileName ?? req.file.originalname;
            } else {
                fileName = `source.${originalExtension.toLowerCase()}`;
            }
            const startTime = performance.now();
            try {
                await MediaClient.uploadMedia(this.db, fileType, referenceId, fileName, req.file);
            } catch (e: any) {
                console.error("Error during file upload:", e);
                res.status(500).send(e.toString());
                return;
            }
            const diff = performance.now() - startTime;
            CLI.debug(`Uploaded media in ${diff}ms`);

            return res.status(200).send("Media file uploaded successfully.");
        } catch (error) {
            console.error("Error during file upload:", error);
            res.status(500).send("Internal server error.");
        }
    }
}