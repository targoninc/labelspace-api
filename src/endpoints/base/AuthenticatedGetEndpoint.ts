import {GetEndpoint} from "./GetEndpoint.js";
import {Application, NextFunction, Request, Response} from "express";
import {CLI} from "../../utility/CLI.js";

export class AuthenticatedGetEndpoint extends GetEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    register(interceptors = []) {
        super.register([
            this.intercept.bind(this) as NextFunction,
            ...interceptors
        ]);
    }

    intercept(req: Request & { requestId: string, isAuthenticated: () => boolean }, res: Response, next: NextFunction): void {
        if (req.isAuthenticated()) {
            req.requestId = Math.random().toString(36).substring(7);
            return next();
        }
        res.status(401).send({error: "Not authenticated"});
    }
}