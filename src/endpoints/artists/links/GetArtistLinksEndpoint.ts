import {GetEndpoint} from "../../base/GetEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import type {AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";

export class GetArtistLinksEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const id = parseInt(<string>req.query.id?.toString());
        if (!id) {
            return res.status(400).send("Missing artist 'id' parameter");
        }

        const links = await this.db.getArtistLinksById(id);

        return res.send(links);
    }
}