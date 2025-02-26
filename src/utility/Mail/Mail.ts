import nodemailer from "nodemailer";
import {Options} from "nodemailer/lib/mailer";
import {CLI} from "../CLI.js";
import {MailBuild} from "./MailBuild.js";

export type Email = Options;

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? "25"),
    secure: process.env.MAIL_SECURE === "true",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    },
});

export class Mail {
    static send(email: Email) {
        CLI.debug(`Sending email to ${email.to}: ${email.subject}`);
        email.from = process.env.MAIL_USER;
        transporter.sendMail(email, (error, info) => {
            if (error) {
                CLI.error("Error sending email: " + JSON.stringify(error));
            } else {
                CLI.info("Email sent: " + JSON.stringify(info));
            }
        });
    }

    static sendDefault(email: string, mailBuild: MailBuild) {
        Mail.send({
            to: email.trim(),
            subject: mailBuild.subject,
            replyTo: "administration@targoninc.com",
            priority: "normal",
            text: mailBuild.text,
            html: mailBuild.html,
        })
    }
}
