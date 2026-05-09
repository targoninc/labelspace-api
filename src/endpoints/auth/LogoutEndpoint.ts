import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";
import {getSessionCookieOptions} from "../../utility/DB/Database.js";

export class LogoutEndpoint extends PostEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    async run(req: Request, res: Response, next: NextFunction) {
        req.logout((err) => {
            if (err) {
                return next(err);
            }

            req.session.destroy((sessionError) => {
                if (sessionError) {
                    return next(sessionError);
                }

                res.clearCookie("connect.sid", {
                    path: "/",
                    ...getSessionCookieOptions(),
                });

                res.send({message: "User has been successfully logged out."});
            });
        });
    }
}
