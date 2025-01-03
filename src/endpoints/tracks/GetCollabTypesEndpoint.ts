import {GetEndpoint} from "../base/GetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Request, Response} from "express";

export class GetCollabTypesEndpoint extends GetEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: Request, res: Response) {
        const types = await this.db.getAllCollabTypes();
        return res.send(types);
    }
}