import {AuthenticatedPostEndpoint} from "../base/AuthenticatedPostEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {TriDB} from "../../utility/DB/TriDB.ts";

export class ConvertSubmissionEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;
    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!(await Authenticator.userHasPermission(req.user, Permissions.convertSubmissions, this.db))) {
            return res.status(403).send({error: "Not authorized"});
        }

        const {submission_id, action} = req.body;
        if (!submission_id || !action) {
            return res.status(400).send({error: "Missing required fields"});
        }

        const submission = await this.db.getSubmissionById(submission_id);
        if (!submission) {
            return res.status(404).send({error: "Submission not found"});
        }
        if (action === "revert_rejection") {
            await this.db.revertSubmissionRejection(submission_id);
            return res.send("OK");
        }

        if (action === "revert_acceptance") {
            await this.db.revertSubmissionAcceptance(submission_id);
            return res.send("OK");
        }

        if (submission.accepted || submission.rejected) {
            return res.status(400).send({error: "Submission already processed"});
        }

        if (action === "accept") {
            await this.db.acceptSubmission(submission_id, req.user.id);
            return res.send("OK");
        } else if (action === "reject") {
            await this.db.rejectSubmission(submission_id, req.user.id);
            return res.send("OK");
        }

        return res.status(400).send({error: "Invalid action"});
    }
}
