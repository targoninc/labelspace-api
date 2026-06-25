import {AuthenticatedPostEndpoint} from "../base/AuthenticatedPostEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {SubmissionVote} from "../../models/enums/SubmissionVote.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";

export class VoteOnSubmissionEndpoint extends AuthenticatedPostEndpoint {
    private db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const {submission_id, vote, comment} = req.body;
        if (!Object.values(SubmissionVote).includes(vote)) {
            return res.status(400).send({error: "Invalid vote"});
        }
        await this.db.upsertSubmissionRating(submission_id, req.user.id, vote, comment ?? null);
        return res.send("OK");
    }
}
