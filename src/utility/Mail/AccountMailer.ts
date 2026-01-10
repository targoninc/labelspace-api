import {link, MailBuilder, paragraph, Mail, heading} from "@targoninc/ts-mail";
import {UserEmail} from "../../models/db/tri/UserEmail.js";
import {User} from "../../models/db/tri/User.js";
import {env} from "../Environment.ts";

const uiUrl = env<string>("CORS_ORIGINS").split(",").at(0);

export class AccountMailer {
    static sendActivationEmails(emails: UserEmail[], user: User) {
        const toVerify = emails.filter(e => !e.verified);

        for (const email of toVerify) {
            const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
                .subject("Your Tri Artist account")
                .heading("Your email address was just associated with a Tri Artist account")
                .paragraph(`Your email address was just associated with the a Tri Artist account (${uiUrl}/profile/${user.username}).`)
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

    static sendRegistrationEmail(email: string, verifCode: string, tempPassword: string, username: string) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Your new Tri Artist account")
            .heading("Your email address was just associated with a Tri Artist account", 1)
            .paragraph(`You can now log in with the following credentials:`)
            .card([
                heading("Change your password after logging in!", 2),
                paragraph(`Username: ${username}`),
                paragraph(`Temporary Password: ${tempPassword}`),
                link(`${uiUrl}/verify-email?code=${verifCode}`, "Verify email & log in")
            ])
            .paragraph("If you did not request this, please contact us immediately at administration@targoninc.com.")
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        Mail.sendDefault(email, mail);
    }
}