import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import { Statistic } from "../../models/interfaces/Statistic.js";

export class RoyaltiesByMonthEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        let months: Statistic[];
        const upc = req.query.upc as string;
        const isrc = req.query.isrc as string;
        if (upc) {
            months = await this.db.getRoyaltiesByMonthForUPC(upc, 36);
        } else if (isrc) {
            months = await this.db.getRoyaltiesByMonthForISRC(isrc, 36);
        } else {
            const artists = await this.db.getUserArtists(user.id);
            const artistNames = artists.map(a => a.name);

            months = await this.db.getRoyaltiesByMonth(artistNames, 12);
        }
        if (!months || months.length === 0) {
            return res.send([]);
        }
        if (months[0].id === null) {
            months.shift();
        }

        return res.send(months.reverse());
    }
}