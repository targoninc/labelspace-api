import {Application, NextFunction, Request, RequestHandler, Response} from "express";
import {PostEndpoint} from "./PostEndpoint.js";
import {User} from "../../models/db/tri/User.js";

export class AuthenticatedPostEndpoint extends PostEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    register(interceptors: (NextFunction | RequestHandler)[] = []) {
        super.register([
            this.intercept.bind(this) as NextFunction,
            ...(interceptors as NextFunction[])
        ]);
    }

    intercept(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
        if (req.isAuthenticated()) {
            req.requestId = Math.random().toString(36).substring(7);
            return next();
        }
        res.status(401).send({error: "Not authenticated"});
    }
}

// noinspection JSAnnotator
export interface AuthenticatedRequest extends Request {
    user: User;
    requestId: string;
}