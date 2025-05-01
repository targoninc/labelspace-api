import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {CLI} from "@targoninc/ts-logging";
import {UploadTrackRequestBody} from "../../../models/interfaces/UploadTrackRequestBody.js";
import {Permissions} from "../../../models/enums/Permissions.ts";

export class CreateTrackEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

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
            return res.status(403).send("You are not allowed to create tracks.");
        }

        let body: UploadTrackRequestBody = req.body;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const today = new Date();
        const title = body.title ?? `Track (${today.toDateString()})`;
        const isrc = body.isrc ?? "";
        const genre = body.genre ?? "";
        const release_date = new Date(body.release_date ?? today.toISOString());
        const price = body.price ?? 1;
        const artists = body.artists ?? "";
        const credits = body.credits ?? "";
        const link_spotify = body.link_spotify ?? "";
        const link_youtube = body.link_youtube ?? "";
        const link_soundcloud = body.link_soundcloud ?? "";
        const link_applemusic = body.link_applemusic ?? "";
        const link_bandcamp = body.link_bandcamp ?? "";
        const link_lyda = body.link_lyda ?? "";

        CLI.debug("Creating track...");
        const track = await this.db.createTrack({
            title,
            isrc,
            genre,
            release_date,
            price,
            artists,
            credits,
            link_spotify,
            link_youtube,
            link_soundcloud,
            link_applemusic,
            link_bandcamp,
            link_lyda,
        });
        if (!track) {
            CLI.error("Failed to create track");
            return res.status(500).send({error: "Failed to create track"});
        }
        CLI.success("Created track");

        return res.send(track);
    }
}
