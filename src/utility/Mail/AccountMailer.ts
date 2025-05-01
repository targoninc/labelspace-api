import {link, MailBuilder, paragraph, Mail} from "@targoninc/ts-mail";
import {UserEmail} from "../../models/db/tri/UserEmail.js";
import {User} from "../../models/db/tri/User.js";

export class AccountMailer {
    static sendActivationEmails(emails: UserEmail[], user: User) {
        const toVerify = emails.filter(e => !e.verified);

        const uiUrl = process.env.CORS_ORIGIN;
        for (const email of toVerify) {
            const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
                .subject("Your email address was just associated with a Tri Artist account")
                .heading("Your email address was just associated with a Tri Artist account")
                .paragraph(`Your email address was just associated with a Tri Artist account (${uiUrl}/profile/${user.username}).`)
                .card([
                    paragraph("To verify your email address, click the following link"),
                    link(`${uiUrl}/verify-email?code=${email.verification_code}`)
                ])
                .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
                .signature("the Tri Records Team", "Targon Industries UG")
                .get();

            Mail.sendDefault(email.email, mail);
        }
    }
}