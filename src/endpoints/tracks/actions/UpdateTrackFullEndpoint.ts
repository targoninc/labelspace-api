import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {Track} from "../../../models/db/tri/Track.ts";

export class UpdateTrackFullEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to update tracks.");
        }

        const request = req.body as Track;
        if (!request.id) {
            return res.status(400).send("No track id provided.");
        }

        const track = await this.db.getTrackById(request.id);
        if (!track) {
            return res.status(404).send("Track not found.");
        }

        await this.db.updateTrack({
            ...track,
            ...request
        });
        return res.send("Track updated.");
    }
}