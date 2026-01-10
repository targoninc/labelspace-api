import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";

export class CreateAlbumAttachmentEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const {albumId, name, artists} = req.body;
        if (!albumId || !name || !artists) {
            return res.status(400).send({error: "Missing albumId, name or artists"});
        }

        const album = await this.db.getAlbumById(albumId);
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        const artistsList = artists.split(",").map((a: string) => a.trim());
        const tracks = await this.db.getTracksByAlbumIds([albumId]);

        for (const artist of artistsList) {
            const dbArtist = await this.db.getArtistByName(artist);
            if (!dbArtist) {
                return res.status(404).send({error: `Artist not found: ${artist}`});
            }

            const isArtistOnAlbum = album.artists.split(",").map((a: string) => a.trim()).includes(artist);
            const isArtistOnTracks = tracks.some(t => t.artists.split(",").map((a: string) => a.trim()).includes(artist));
            if (!isArtistOnAlbum && !isArtistOnTracks) {
                return res.status(403).send({error: `Artist ${artist} is not associated with the album or its tracks`});
            }
        }

        const attachmentId = await this.db.createAlbumAttachment(albumId, name);

        return res.send({attachmentId});
    }
}