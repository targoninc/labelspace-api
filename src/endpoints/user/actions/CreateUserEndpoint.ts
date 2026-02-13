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

interface UserRegistration {
    username: string;
    legal_name: string;
    temp_password: string;
    email: string;
    country: string;
    state?: string;
}

export class CreateUserEndpoint extends AuthenticatedPostEndpoint {
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
            return res.status(403).send("You are not allowed to create users.");
        }

        let body = req.body as UserRegistration;
        if (!body) {
            return res.status(400).send({error: "No body provided"});
        }

        const existingByUsername = await this.db.getUserByUsername(body.username);
        if (existingByUsername) {
            return res.status(400).send({error: "Username already exists"});
        }

        const existingByEmail = await this.db.getUserByEmail(body.email);
        if (existingByEmail) {
            return res.status(400).send({error: "Email already tied to another user"});
        }

        if (!body.legal_name) {
            return res.status(400).send({error: "No legal_name provided"});
        }

        if (!body.country) {
            return res.status(400).send({error: "No country provided"});
        }

        if (body.temp_password.length < 16) {
            return res.status(400).send({error: "Password must be at least 16 characters long"});
        }

        if (!body.email.includes("@")) {
            return res.status(400).send({error: "Invalid email address"});
        }

        const passKeyUserId = uuidv4();
        const passwordHash = bcrypt.hashSync(body.temp_password, 12);
        const userId = await this.db.createUser(body.username, body.legal_name, passKeyUserId, passwordHash, body.country, body.state);

        if (!userId) {
            return res.status(500).send({error: "Failed to create user"});
        }

        const verifCode = Math.random().toString(36).substring(7);
        const address = {
            email: body.email,
            user_id: userId,
            verification_code: verifCode,
            verified: false,
            primary: true,
            verified_at: null
        };
        await this.db.setUserEmails(userId, [address]);

        AccountMailer.sendRegistrationEmail(body.email, verifCode, body.temp_password, body.username);

        const mailContent = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`New ${PORTAL_NAME} account created`)
            .heading(`A new ${PORTAL_NAME} account was just created`)
            .card([
                paragraph(`Username: ${body.username}`),
                paragraph(`Temporary Password: ${body.temp_password}`),
                paragraph(`Email: ${body.email}`),
                paragraph(`Country: ${body.country}`),
                paragraph(`Legal Name: ${body.legal_name}`),
                paragraph(`State: ${body.state}`),
            ])
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .get();

        const subMails = env<string>("SUBMISSION_MAILS").split(",");
        for (const mail of subMails) {
            Mail.sendDefault(mail, mailContent);
        }

        return res.send(`User created`);
    }
}