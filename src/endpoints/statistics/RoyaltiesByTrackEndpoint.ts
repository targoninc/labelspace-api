import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {Application} from "express";
import {Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import { Statistic } from "../../models/interfaces/Statistic.js";

export class RoyaltiesByTrackEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const artists = await this.db.getUserArtists(user.id);
        const artistNames = artists.map(a => a.name);

        const tracks = await this.db.getRoyaltiesByTrack(artistNames, 15);
        if (!tracks || tracks.length === 0) {
            return res.send([]);
        }
        const othersSum = await this.db.getRoyaltySumWithExcludedIsrcs(artistNames, tracks.map(track => track.id));
        if (othersSum > 0) {
            tracks.push(<Statistic>{
                id: 0,
                label: "Others",
                value: othersSum
            });
        }

        return res.send(tracks);
    }
}