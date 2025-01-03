import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {CLI} from "../../utility/CLI.js";
import {GetEndpoint} from "../base/GetEndpoint.js";
import * as fs from "node:fs";
import {FileStorage} from "../../utility/Storage/FileStorage.js";
import {MediaFileType} from "../../models/enums/MediaFileType.js";
import {Visibility} from "../../models/enums/Visibility.js";

interface CacheItem {
    data: Buffer;
    timeout: number;
}

let requestCount = 0;

export class GetAudioEndpoint extends GetEndpoint {
    db: TriDB;
    cache: Map<number, CacheItem>;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
        this.cache = new Map<number, CacheItem>();
    }

    async run(req: AuthenticatedRequest, res: Response) {
        requestCount += 1;
        CLI.debug(`(+) Concurrent request count: ${requestCount}`);
        try {
            const start = performance.now();
            const trackId = req.query.id as string;
            if (!trackId) {
                return res.status(400).send("No trackId provided.");
            }

            const id = parseInt(trackId);
            if (isNaN(id)) {
                return res.status(400).send("Invalid trackId provided.");
            }
            const track = await this.db.getTrackById(id);
            if (!track) {
                return res.status(404).send("Track not found.");
            }

            if (track.visibility === Visibility.private) {
                if (!req.isAuthenticated()) {
                    return res.status(401).send({error: "Not authenticated"});
                }

                if (track.user_id !== req.user.id) {
                    const secretCode = req.query.code as string;
                    if (!secretCode) {
                        return res.status(400).send({error: "No secret code provided"});
                    }
                    if (track.secretcode !== secretCode) {
                        return res.status(403).send({error: "Invalid secret code"});
                    }
                }
            }

            const range = req.headers.range;
            let length, offset;
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : undefined;
                length = end ? (end - start + 1) : 0;
                offset = start;
                if (offset === 0 && length === 0) {
                    offset = undefined;
                    length = undefined;
                } else {
                    CLI.debug(`OFFSET ${offset} | LENGTH ${length}`);
                }
            }

            const validQualities = ["h", "l", "m"];
            let quality = (req.query.quality as string) ?? "h";
            if (!validQualities.includes(quality)) {
                return res.status(400).send("Invalid quality provided, must be one of " + validQualities.join(", "));
            }

            if (quality === "h") {
                if (!req.user) {
                    quality = "m";
                } else {
                    const hasSub = await this.db.userHasSubscription(req.user.id);
                    if (!hasSub) {
                        quality = "m";
                    }
                }
            }

            const filePath = FileStorage.filePath(MediaFileType.audio, id, `${quality}q.mp3`);
            if (!fs.existsSync(filePath)) {
                return res.status(400).send("File could not be found");
            }

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            const promise = new Promise<void>((resolve, reject) => {
                fileStream.on("error", reject);
                fileStream.on("end", () => {
                    res.end();
                    fileStream.destroy();
                    resolve();
                });
            });
            await promise;

            const diff = performance.now();
            const seconds = (diff - start) / 1000;
            requestCount -= 1;
            CLI.debug(`(-) Concurrent request count: ${requestCount} | ${seconds.toFixed(2)}s`);
        } catch (error) {
            console.error("Error during file request:", error);
            res.status(500).send("Internal server error.");
            requestCount -= 1;
            CLI.debug(`(-) Concurrent request count: ${requestCount}`);
        }
    }
}