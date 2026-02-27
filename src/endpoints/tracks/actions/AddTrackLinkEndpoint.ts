import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {Track} from "../../../models/db/tri/Track.ts";

export class AddTrackLinkEndpoint extends AuthenticatedPostEndpoint {
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
            return res.status(403).send("You are not allowed to modify track links.");
        }

        const { id, url } = req.body;
        if (!id || !url) {
            return res.status(400).send("No track id or url provided.");
        }

        const track = await this.db.getTrackById(id);
        if (!track) {
            return res.status(404).send("Track not found.");
        }

        await this.db.createTrackLink(track.id, url, true);

        return res.send("Link added.");
    }
}