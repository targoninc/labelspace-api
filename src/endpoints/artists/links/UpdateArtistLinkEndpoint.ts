import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Authenticator} from "../../../models/Authenticator.ts";

export class UpdateArtistLinkEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const {id, text, url} = req.body;
        if (!id || !text || !url || text.length === 0 || url.length === 0) {
            return res.status(400).send({error: "Missing id, text or url"});
        }

        const link = await this.db.getArtistLinkById(id);
        if (!link) {
            return res.status(404).send({error: "Link not found"});
        }

        const artist = await this.db.getArtistById(link.artist_id);
        if (!artist || artist?.user_id !== req.user.id) {
            return res.status(403).send({error: "You do not have access to this artist"});
        }

        if (text.length > 32) {
            return res.status(400).send({error: "Text is too long (max 32 characters)"});
        }

        if (!url.includes("https://") || !url.includes(".")) {
            return res.status(400).send({error: "URL must be a valid HTTPS link"});
        }

        if (url.length > 512) {
            return res.status(400).send({error: "URL is too long (max 512 characters)"});
        }

        await this.db.updateArtistLink(id, text, url);

        return res.status(200).send({success: true});
    }
}
