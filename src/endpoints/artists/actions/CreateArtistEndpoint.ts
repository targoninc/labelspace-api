import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {uuidv4} from "uuidv7";
import bcrypt from "bcryptjs";
import {AccountMailer} from "../../../utility/Mail/AccountMailer.ts";
import {env} from "../../../utility/Environment.ts";
import {COMPANY_NAME, LABEL_NAME, MAIL_LOGO_URL, PORTAL_NAME} from "../../../utility/Constants.ts";
import {Mail, MailBuilder, paragraph} from "@targoninc/ts-mail";

interface ArtistCreateRequest {
    name: string;
    linked_user_id: number;
}

export class CreateArtistEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.userManagement, this.db))) {
            return res.status(403).send("You are not allowed to create artists.");
        }

        let body = req.body as ArtistCreateRequest;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const existingByName = await this.db.getArtistByName(body.name);
        if (existingByName) {
            return res.status(400).send({error: "Artist name already exists"});
        }

        const linkedUser = await this.db.getUserById(body.linked_user_id);
        if (!linkedUser) {
            return res.status(400).send({error: "Linked user not found"});
        }

        const artistId = await this.db.createArtist(body.name, body.linked_user_id);
        if (!artistId) {
            return res.status(500).send({error: "Failed to create artist"});
        }

        const emails = await this.db.getEmailsByUserId(body.linked_user_id);

        for (const email of emails) {
            AccountMailer.sendArtistCreateEmail(email.email, linkedUser, body.name);
        }

        const subMails = env<string>("SUBMISSION_MAILS").split(",");
        for (const mail of subMails) {
            AccountMailer.sendArtistCreateEmail(mail, linkedUser, body.name);
        }

        return res.send(`Artist created`);
    }
}