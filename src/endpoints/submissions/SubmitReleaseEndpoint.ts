import {PostEndpoint} from "../base/PostEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {SubmissionRequest} from "../../models/interfaces/SubmissionRequest.ts";
import {CLI} from "@targoninc/ts-logging";
import {heading, link, MailBuilder, paragraph, Mail} from "@targoninc/ts-mail";

const mails = process.env.SUBMISSION_MAILS?.split(",") ?? [];

export class SubmitReleaseEndpoint extends PostEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const request = req.body as SubmissionRequest;
        if (!request.link || !request.desiredReleaseDate || !request.artistName || !request.email || !request.message) {
            return res.status(400).send("Invalid request");
        }

        CLI.info("Received submission request", {
            logToDb: true,
            info: {
                request,
            }
        });

        const forSubmitterMail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Your Tri Records submission")
            .heading("We've received your Tri Records submission!")
            .paragraph(`You just submitted a release as artist ${request.artistName} with a desired release date of ${request.desiredReleaseDate}`)
            .paragraph("You can expect a response from us within the next 3-5 days. Sometimes it can take longer. Thank you for your patience!")
            .card([
                paragraph(request.message)
            ])
            .card([
                heading("Link to your submission", 2),
                link(request.link),
            ])
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        const forTriMail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Tri Records submission")
            .heading("Tri Records submission")
            .paragraph(`New release submission from ${request.artistName} for ${request.desiredReleaseDate}`)
            .paragraph("From: " + request.email)
            .card([
                paragraph(request.message)
            ])
            .card([
                heading("Link", 2),
                link(request.link),
            ])
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        for (const mail of mails) {
            Mail.sendDefault(mail, forTriMail);
        }

        Mail.sendDefault(request.email, forSubmitterMail);

        return res.send("OK");
    }
}

