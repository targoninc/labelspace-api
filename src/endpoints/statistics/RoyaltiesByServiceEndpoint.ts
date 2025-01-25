import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import { Statistic } from "../../models/interfaces/Statistic.js";

export class RoyaltiesByServiceEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        let services: Statistic[];
        const upc = req.query.upc as string;
        const isrc = req.query.isrc as string;
        if (upc) {
            services = await this.db.getRoyaltiesByServiceForUPC(upc, 15);
        } else if (isrc) {
            services = await this.db.getRoyaltiesByServiceForISRC(isrc, 15);
        } else {
            const artists = await this.db.getUserArtists(user.id);
            const artistNames = artists.map(a => a.name);

            services = await this.db.getRoyaltiesByService(artistNames, 12);
        }
        if (!services || services.length === 0) {
            return res.send([]);
        }
        if (services[0].id === null) {
            services.shift();
        }

        return res.send(services);
    }
}