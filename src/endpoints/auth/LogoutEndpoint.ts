import {Application, NextFunction, Request, Response} from "express";
import {PostEndpoint} from "../base/PostEndpoint.js";

export class LogoutEndpoint extends PostEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    async run(req: Request, res: Response, next: NextFunction) {
        req.logout(() => {
            const isHttps = req.headers['x-forwarded-proto'] === 'https';

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: isHttps,
                sameSite: 'none'
            });

            res.send({message: "User has been successfully logged out."});
        });
    }
}