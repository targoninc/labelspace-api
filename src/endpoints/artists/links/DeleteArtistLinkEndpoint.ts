import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Authenticator} from "../../../models/Authenticator.ts";

export class DeleteArtistLinkEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const {id} = req.body;
        if (!id) {
            return res.status(400).send({error: "Missing id"});
        }

        const link = await this.db.getArtistLinkById(id);
        if (!link) {
            return res.status(404).send({error: "Link not found"});
        }

        const artists = await this.db.getUserArtists(req.user.id);
        if (artists.every(a => a.id !== link.artist_id)) {
            return res.status(403).send({error: "You do not have access to this artist"});
        }

        await this.db.deleteArtistLink(id);

        return res.status(200).send({success: true});
    }
}
