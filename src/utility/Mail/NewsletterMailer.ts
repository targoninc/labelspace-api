import {link, image, Mail, MailBuilder} from "@targoninc/ts-mail";

const uiUrl = "https://trirecords.eu";

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
            .paragraph("You have successfully subscribed to the Tri Records newsletter! We're excited to keep you updated on our latest releases.")
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

    static sendReleaseEmail(email: string, code: string, releaseTitle: string, releaseUrl: string, imageUrl: string) {
        const phrases = [
            "Fresh out of the DAW",
            "Just dropped",
            "Sounds good on every platform",
            "Just got done baking",
            "Will rock your speakers",
            "DSPs couldn't reject this one",
            "New for your ears",
            "Good for your speakers",
            "Too creative for major labels",
            "Reeks of passion",
            "Studio session budget well spent",
            "Studio session budget ran out so we had to release it",
            "Bassline knocking",
            "With quarter-inch cables plugged in either ear",
            "Released before anyone could stop us",
            "Straight from the Tri Records files",
            "Engineered to hit",
            "No AI could ever replicate this",
            "Crafted with care",
        ];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];

        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject(`New Release: ${releaseTitle}`)
            .heading(`Out now everywhere: ${releaseTitle}`)
            .paragraph(`${phrase}, check it out:`)
            .card([
                link(releaseUrl, `Listen to ${releaseTitle}`),
                image(imageUrl, releaseTitle, 500, 500),
            ])
            .signature("the Tri Records Team", "Targon Industries UG")
            .link(`${uiUrl}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }
}
