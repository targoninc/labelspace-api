import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Authenticator} from "../../models/Authenticator.js";
import {Permissions} from "../../models/enums/Permissions.js";
import {MediaClient} from "../../utility/Media/MediaClient.js";
import {MediaFileType} from "../../models/enums/MediaFileType.js";

export class DeleteTrackEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const id = req.body.id;
        if (!id) {
            return res.status(400).send("No track id provided.");
        }

        const track = await this.db.getTrackById(id);
        if (!track) {
            return res.status(404).send("Track not found.");
        }

        if (track.user_id !== req.user.id) {
            if (!(await Authenticator.userHasPermission(req.user, Permissions.canDeleteTracksOfOthers, this.db))) {
                return res.status(403).send("You are not allowed to delete this track.");
            }
        }

        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.audio, track.id);
        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.trackCover, track.id);

        await this.db.deleteTrack(id);

        res.status(200).send("Track deleted.");
    }
}