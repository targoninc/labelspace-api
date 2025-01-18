import {PostEndpoint} from "../base/PostEndpoint.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {SubmissionRequest} from "../../models/interfaces/SubmissionRequest.ts";
import {CLI} from "../../utility/CLI.ts";
import {Mail} from "../../utility/Mail/Mail.ts";
import {heading, link, MailBuilder, paragraph} from "../../utility/Mail/MailBuilder.ts";

const mails = process.env.SUBMISSION_MAILS.split(",");

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

        const mailContent = MailBuilder.default()
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
            .signature()
            .get();

        for (const mail of mails) {
            Mail.sendDefault(mail, mailContent);
        }

        return res.send("OK");
    }
}

