import {link, MailBuilder, paragraph} from "./MailBuilder.js";
import {Mail} from "./Mail.js";
import {UserEmail} from "../../models/db/tri/UserEmail.js";
import {User} from "../../models/db/tri/User.js";

export class AccountMailer {
    static sendActivationEmails(emails: UserEmail[], user: User) {
        const toVerify = emails.filter(e => !e.verified);

        const uiUrl = process.env.CORS_ORIGIN;
        for (const email of toVerify) {
            const mail = MailBuilder.default()
                .subject("Your email address was just associated with a Tri Artist account")
                .heading("Your email address was just associated with a Tri Artist account")
                .paragraph(`Your email address was just associated with a Tri Artist account (${uiUrl}/profile/${user.username}).`)
                .card([
                    paragraph("To verify your email address, click the following link"),
                    link(`${uiUrl}/verify-email?code=${email.verification_code}`)
                ])
                .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
                .signature()
                .get();

            Mail.sendDefault(email.email, mail);
        }
    }
}