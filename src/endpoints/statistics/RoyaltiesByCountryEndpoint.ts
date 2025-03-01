import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import { Statistic } from "../../models/interfaces/Statistic.js";

export class RoyaltiesByCountryEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const artists = await this.db.getUserArtists(user.id);
        const artistNames = artists.map(a => a.name);

        const stats = await this.db.getRoyaltiesByCountry(artistNames, 15);
        if (!stats || stats.length === 0) {
            return res.send([]);
        }

        return res.send(stats);
    }
}