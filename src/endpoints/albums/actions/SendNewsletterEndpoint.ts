import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";
import {NewsletterMailer} from "../../../utility/Mail/NewsletterMailer.ts";

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

        const imageUrl = `https://artists-api.trirecords.eu/media/image?mediaFileType=albumCover&id=${album.id}&quality=500`;
        const releaseUrl = `https://trirecords.eu/album/${album.id}`;
        const title = album.artists + " - " + album.title;

        const isTest = true;
        if (isTest) {
            NewsletterMailer.sendReleaseEmail("alex@targoninc.com", "cantlmao", title, releaseUrl, imageUrl);
            return res.send(`Test newsletter sent`);
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