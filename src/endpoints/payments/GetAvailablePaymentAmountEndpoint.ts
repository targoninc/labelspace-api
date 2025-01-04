import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import type {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";

export class GetAvailablePaymentAmountEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const artists = await this.db.getUserArtists(user.id);
        const artistNames = artists.map(a => a.name);

        const available = await this.db.getAvailablePaymentAmount(user.id, artistNames);
        return res.send(available);
    }
}