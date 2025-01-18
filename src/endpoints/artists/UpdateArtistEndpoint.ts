import {Application} from "express";
import {Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {CLI} from "../../utility/CLI.ts";
import {Artist} from "../../models/db/tri/Artist.ts";

export class UpdateArtistEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        Authenticator.guardEndpoint(req, res);

        const artist = req.body as Artist;
        if (!artist) {
            return res.status(400).send({error: "No artist provided"});
        }

        const artistName = artist.name;
        if (!artistName || artistName.length === 0) {
            return res.status(400).send({error: "No artist name provided"});
        }
        const artists = await this.db.getUserArtists(req.user.id);
        if (artists.every(a => a.name !== artistName)) {
            return res.status(400).send({error: "Artist not found"});
        }

        const updatedArtist: Partial<Artist> = {
            description: artist.description ?? artist.description,
        };

        CLI.debug(`Updating artist ${artistName} with ${JSON.stringify(updatedArtist)}`);
        await this.db.updateArtist(artistName, updatedArtist);

        return res.status(200).send({success: true});
    }
}