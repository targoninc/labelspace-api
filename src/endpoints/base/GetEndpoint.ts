import {Application, NextFunction, Request, Response} from "express";

export class GetEndpoint {
    app: Application;
    path: string;

    constructor(app: Application, path: string) {
        this.app = app;
        this.path = path;
    }

    register(interceptors: NextFunction[] = []) {
        this.app.get(this.path, ...interceptors, this.run.bind(this));
    }

    run(req: Request, res: Response, next: NextFunction) {
        res.send("Not implemented");
    }
}