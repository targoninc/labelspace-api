import {link, MailBuilder, paragraph, Mail} from "@targoninc/ts-mail";
import {env} from "../Environment.js";

const uiUrl = env<string>("CORS_ORIGINS").split(",").at(0);

export class NewsletterMailer {
    static sendVerificationEmail(email: string, code: string) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Verify your newsletter subscription")
            .heading("Welcome to the Tri Records Newsletter!")
            .paragraph("Thank you for signing up for our release newsletter. To complete your subscription, please verify your email address by clicking the link below:")
            .card([
                link(`${uiUrl}/verify-signup?email=${email}&code=${code}`, "Verify Subscription")
            ])
            .paragraph("If you did not sign up for this, you can safely ignore this email.")
            .paragraph("---")
            .signature("the Tri Records Team", "Targon Industries UG")
            .link(`${uiUrl}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }

    static sendSubscriptionEmail(email: string, code: string) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("You have been subscribed to the Tri Records Newsletter")
            .heading("Subscription Confirmed")
            .paragraph("You have successfully subscribed to the Tri Records newsletter! We're excited to keep you updated on our latest releases and news.")
            .paragraph("If you ever wish to unsubscribe, you can do so at any time by clicking the link at the bottom of our emails.")
            .signature("the Tri Records Team", "Targon Industries UG")
            .link(`${uiUrl}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }

    static sendUnsubscribeEmail(email: string) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("You have been unsubscribed from the Tri Records Newsletter")
            .heading("You have been unsubscribed")
            .paragraph("You have successfully unsubscribed from the Tri Records newsletter. We're sorry to see you go!")
            .paragraph("If this was a mistake or you change your mind, you can always sign up again on our website.")
            .signature("the Tri Records Team", "Targon Industries UG")
            .get();

        Mail.sendDefault(email, mail);
    }
}
