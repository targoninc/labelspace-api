import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.js";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {uuidv4} from "uuidv7";
import bcrypt from "bcryptjs";
import {link, Mail, MailBuilder, paragraph} from "@targoninc/ts-mail";
import {AccountMailer} from "../../../utility/Mail/AccountMailer.ts";
import {User} from "../../../models/db/tri/User.ts";
import {env} from "../../../utility/Environment.ts";

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

        const mailContent = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("New Tri Artist account created")
            .heading("A new Tri Artist account was just created")
            .card([
                paragraph(`Username: ${user.username}`),
                paragraph(`Temporary Password: ${body.temp_password}`),
                paragraph(`Email: ${body.email}`),
                paragraph(`Country: ${body.country}`),
                paragraph(`Legal Name: ${body.legal_name}`),
                paragraph(`State: ${body.state}`),
            ])
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        const subMails = env<string>("SUBMISSION_MAILS").split(",");
        for (const mail of subMails) {
            Mail.sendDefault(mail, mailContent);
        }

        return res.send(`User created`);
    }
}