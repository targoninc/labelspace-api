import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {importAll} from "../../../importers/importAll.ts";
import * as path from "node:path";
import * as fs from "node:fs";

export class ImportDataEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.importData, this.db))) {
            return res.status(403).send("You are not allowed to import data.");
        }

        const workingDir = process.cwd();
        const dataDir = path.join(workingDir, "data");
        console.log("Importing data from " + dataDir);
        if (!fs.existsSync(dataDir)) {
            return res.status(400).send({error: "Data directory not found"});
        }

        try {
            await importAll(this.db, dataDir);
        } catch (e) {
            return res.status(500).send({error: `Failed to import data: ${e.message}`});
        }

        return res.status(200).send();
    }
}