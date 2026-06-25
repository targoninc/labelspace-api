import {GetEndpoint} from "../base/GetEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";

export class GetSubmissionsEndpoint extends GetEndpoint {
    db: TriDB;
    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const submissions = await this.db.getSubmissions();
        for (const s of submissions) {
            s.currentUserRating = s.ratings?.find(r => r.user_id === req.user.id) ?? null;
        }
        return res.json(submissions);
    }
}
