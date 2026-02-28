import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {NewsletterMailer} from "../../../utility/Mail/NewsletterMailer.ts";
import {env} from "../../../utility/Environment.ts";
import {LABEL_UI_URL, PORTAL_API_URL} from "../../../utility/Constants.ts";

export class SendNewsletterEndpoint extends AuthenticatedPostEndpoint {
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

        if (!(await Authenticator.userHasPermission(req.user, Permissions.sendNewsletters, this.db))) {
            return res.status(403).send("You are not allowed to send newsletters.");
        }

        const { id } = req.body;
        if (!id) {
            return res.status(400).send({error: "No album id provided"});
        }

        const album = await this.db.getAlbumById(id);
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        const firstTrack = await this.db.getFirstTrack(album.id);
        if (!firstTrack) {
            return res.status(400).send({error: "Album has no tracks"});
        }

        const imageUrl = `${PORTAL_API_URL}/media/image?mediaFileType=albumCover&id=${album.id}&quality=500`;
        const releaseUrl = `${LABEL_UI_URL}/album/${album.id}`;
        const title = album.artists + " - " + album.title;

        const isTest = env("COOKIE_DOMAIN") === "localhost" || env("TEST_NEWSLETTER") === "true";
        if (isTest) {
            NewsletterMailer.sendReleaseEmail("alex@targoninc.com", "cantlmao", title, releaseUrl, imageUrl);
            return res.send(`Test newsletter sent`);
        }

        if (new Date(album.release_date).getTime() > new Date().getTime()) {
            return res.status(400).send({error: "Album is not released yet"});
        }

        if (new Date(firstTrack.release_date).getTime() > new Date().getTime()) {
            return res.status(400).send({error: "Album has no released tracks yet"});
        }

        const links = await this.db.getAlbumLinks(album.id);
        if (links.length < 5) {
            return res.status(400).send({error: "Not enough store links are provided for the first track, must be at least 5"});
        }

        if (album.campaign_sent) {
            return res.status(400).send({error: "Newsletter already sent for this album"});
        }

        let offset = 0;
        while (true) {
            const signup = await this.db.getNewsletterSignup(offset);
            if (!signup) {
                break;
            }

            NewsletterMailer.sendReleaseEmail(signup.email, signup.code, title, releaseUrl, imageUrl);
            offset++;
        }

        await this.db.setCampaignSentForAlbum(id);

        return res.send(`Newsletter sent`);
    }
}