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

    private parseDateQuery(value: unknown, key: string) {
        if (typeof value !== "string" || value.trim() === "") {
            return undefined;
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid ${key}`);
        }

        return date.toISOString();
    }

    async run(req: any, res: any) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.canViewLogs, this.db))) {
            return res.status(403).send("You are not allowed to view logs.");
        }

        const validTypes = Object.values(LogLevel).filter((value): value is LogLevel => typeof value === "number");
        let logLevel: LogLevel | undefined;
        if (typeof req.query.logLevel === "string" && req.query.logLevel.trim() !== "") {
            const parsedLogLevel = parseInt(req.query.logLevel, 10);
            if (Number.isNaN(parsedLogLevel) || !validTypes.includes(parsedLogLevel)) {
                return res.status(400).send({error: "Invalid log level"});
            }
            logLevel = validTypes.find(value => value === parsedLogLevel);
        }

        const offset = parseInt(req.query.offset as string ?? "0", 10);
        const limit = parseInt(req.query.limit as string ?? "100", 10);
        if (Number.isNaN(offset) || Number.isNaN(limit)) {
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

        let startTime: string | undefined;
        let endTime: string | undefined;

        try {
            startTime = this.parseDateQuery(req.query.startTime, "start time");
            endTime = this.parseDateQuery(req.query.endTime, "end time");
        } catch (error) {
            return res.status(400).send({error: error instanceof Error ? error.message : "Invalid date filter"});
        }

        if (startTime && endTime && startTime > endTime) {
            return res.status(400).send({error: "Start time must be before end time"});
        }

        const message = typeof req.query.message === "string" ? req.query.message.trim() : undefined;
        const logs = await this.db.getLogs({
            logLevel,
            message,
            startTime,
            endTime,
            offset,
            limit,
        });
        return res.send(logs);
    }
}
