import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import type {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {PaymentStatus} from "../../models/enums/PaymentStatus.ts";
import {Paypal} from "../../utility/Paypal/Paypal.ts";

export class RequestPaymentEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        const artists = await this.db.getUserArtists(user.id);
        const artistNames = artists.map(a => a.name);

        const available = await this.db.getAvailablePaymentAmount(user.id, artistNames);
        if (available.available <= 0) {
            return res.status(400).send({error: "Not enough money available"});
        }

        const minimum = 10;
        if (available.available < minimum) {
            return res.status(400).send({error: `Money is available, but below minimum (minimum ${minimum})`});
        }

        await this.db.createPaymentRequest(user.id, available.available, PaymentStatus.requested);

        //Paypal.send

        return res.send();
    }
}