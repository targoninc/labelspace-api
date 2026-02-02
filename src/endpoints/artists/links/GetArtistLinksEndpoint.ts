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
        const name = req.query.name as string;
        if (!name) {
            return res.status(400).send("Missing artist 'name' parameter");
        }

        const links = await this.db.getArtistLinksByName(name.trim());

        return res.send(links);
    }
}