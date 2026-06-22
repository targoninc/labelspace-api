import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {SearchRequest} from "../../models/interfaces/SearchRequest.js";
import {SearchEngine} from "../../utility/Search/SearchEngine.js";
import {SearchConfigurations} from "../../utility/Search/SearchConfigurations.js";

export class SearchPublicTracksEndpoint extends GetEndpoint {
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

    async run(req: any, res: Response) {
        let request: SearchRequest = {
            query: req.query.search as string,
            limit: parseInt(req.query.limit as string ?? "10"),
            offset: parseInt(req.query.offset as string ?? "0")
        };

        if (!this.validateRequest(res, request)) {
            return;
        }

        const searchResults = await SearchEngine.search(this.db, SearchConfigurations.tracks, request, true);
        return res.status(200).send(searchResults);
    }
}
