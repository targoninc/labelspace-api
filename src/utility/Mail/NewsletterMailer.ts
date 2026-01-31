import {link, MailBuilder, paragraph, Mail} from "@targoninc/ts-mail";
import {env} from "../Environment.js";

const uiUrl = env<string>("CORS_ORIGINS").split(",").at(0);

export class NewsletterMailer {
    static sendVerificationEmail(email: string, code: string) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Verify your newsletter subscription")
            .heading("Welcome to the Tri Records Newsletter!")
            .paragraph("Thank you for signing up for our newsletter. To complete your subscription, please verify your email address by clicking the link below:")
            .card([
                link(`${uiUrl}/verify-signup?code=${code}`, "Verify Subscription")
            ])
            .paragraph("If you did not sign up for this newsletter, you can safely ignore this email.")
            .paragraph("---")
            .paragraph("If you wish to unsubscribe from our newsletter, you can do so by clicking the following link:")
            .paragraph(`${uiUrl}/unsubscribe?code=${code}`)
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        Mail.sendDefault(email, mail);
    }
}
