import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import type {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";

export class GetPaymentsEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const payments = await this.db.getPaymentsByUserId(user.id);

        return res.send(payments);
    }
}