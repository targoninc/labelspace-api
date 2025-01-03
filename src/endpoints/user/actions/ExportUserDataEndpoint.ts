import {AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {DatabaseEntityCollector} from "../../../utility/DB/DatabaseEntityCollector.js";
import {AuthenticatedGetEndpoint} from "../../base/AuthenticatedGetEndpoint.js";

export class ExportUserDataEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = await DatabaseEntityCollector.collectEntity(this.db, "users", req.user.id);

        res.status(200).json(user);
    }
}
