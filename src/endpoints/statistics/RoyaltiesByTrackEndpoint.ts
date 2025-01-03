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

        const tracks = await this.db.getRoyaltiesByTrack(user.id, 15);
        const othersSum = await this.db.getTrackPlayCountSumWithExcludedIds(user.id, tracks.map(track => track.id));
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