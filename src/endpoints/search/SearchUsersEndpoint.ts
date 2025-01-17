import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Request, Response} from "express";
import {SearchRequest} from "../../models/interfaces/SearchRequest.js";
import {User} from "../../models/db/tri/User.js";
import {SearchResult} from "../../utility/Search/SearchResult.js";
import {SearchEngine} from "../../utility/Search/SearchEngine.js";
import {SearchConfigurations} from "../../utility/Search/SearchConfigurations.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class SearchUsersEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    validateRequest(res: Response, request: any) {
        if (!request.query) {
            res.status(400).send("No query provided");
            return false;
        }

        if (isNaN(request.limit)) {
            res.status(400).send("Invalid limit");
            return false;
        }

        if (isNaN(request.offset)) {
            res.status(400).send("Invalid offset");
            return false;
        }

        return true;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to search users.");
        }

        let request: SearchRequest = {
            query: req.query.search as string,
            limit: parseInt(req.query.limit as string ?? "10"),
            offset: parseInt(req.query.offset as string ?? "0")
        };

        if (!this.validateRequest(res, request)) {
            return;
        }

        const searchResults = await SearchEngine.search(this.db, SearchConfigurations.users, request);
        return res.status(200).send(searchResults);
    }
}