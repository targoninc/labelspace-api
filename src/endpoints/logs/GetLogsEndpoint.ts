import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Permissions} from "../../models/enums/Permissions.js";
import {Authenticator} from "../../models/Authenticator.js";
import {LogLevel} from "../../models/enums/LogLevel.js";

export class GetLogsEndpoint extends AuthenticatedGetEndpoint {
    db: TriDB;

    constructor(app: any, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: any, res: any) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.canViewLogs, this.db))) {
            return res.status(403).send("You are not allowed to view logs.");
        }

        let logLevel: LogLevel.info = parseInt(req.query.logLevel as string ?? "0");
        const validTypes = Object.values(LogLevel);
        if (logLevel && !validTypes.includes(logLevel)) {
            logLevel = LogLevel.info;
        }

        const offset = parseInt(req.query.offset as string ?? "0");
        const limit = parseInt(req.query.limit as string ?? "100");
        if (isNaN(offset) || isNaN(limit)) {
            return res.status(400).send({error: "Invalid offset or limit"});
        }

        if (offset < 0) {
            return res.status(400).send({error: "Offset must be positive"});
        }
        if (limit < 0) {
            return res.status(400).send({error: "Limit must be positive"});
        }
        if (limit > 1000) {
            return res.status(400).send({error: "Limit must be less than 1000"});
        }

        const logs = await this.db.getLogs(logLevel, offset, limit);
        return res.send(logs);
    }
}