import {link, image, Mail, MailBuilder} from "@targoninc/ts-mail";
import {COMPANY_NAME, LABEL_NAME, LABEL_UI_URL, MAIL_LOGO_URL} from "../Constants.ts";

export class NewsletterMailer {
    static sendVerificationEmail(email: string, code: string) {
        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject("Verify your newsletter subscription")
            .heading(`Welcome to the ${LABEL_NAME} Newsletter!`)
            .paragraph("Thank you for signing up for our release newsletter. To complete your subscription, please verify your email address by clicking the link below:")
            .card([
                link(`${LABEL_UI_URL}/verify-signup?email=${email}&code=${code}`, "Verify Subscription")
            ])
            .paragraph("If you did not sign up for this, you can safely ignore this email.")
            .paragraph("---")
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .link(`${LABEL_UI_URL}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }

    static sendSubscriptionEmail(email: string, code: string) {
        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`You have been subscribed to the ${LABEL_NAME} Newsletter`)
            .heading("Subscription Confirmed")
            .paragraph(`You have successfully subscribed to the ${LABEL_NAME} newsletter! We're excited to keep you updated on our latest releases.`)
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .link(`${LABEL_UI_URL}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }

    static sendUnsubscribeEmail(email: string) {
        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`You have been unsubscribed from the ${LABEL_NAME} Newsletter`)
            .heading("You have been unsubscribed")
            .paragraph(`You have successfully unsubscribed from the ${LABEL_NAME} newsletter. We're sorry to see you go!`)
            .paragraph("If this was a mistake or you change your mind, you can always sign up again on our website.")
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
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
            `Straight from the ${LABEL_NAME} files`,
            "Engineered to hit",
            "No AI could ever replicate this",
            "Crafted with care",
        ];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];

        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`New Release: ${releaseTitle}`)
            .heading(`Out now everywhere: ${releaseTitle}`)
            .paragraph(`${phrase}, check it out:`)
            .card([
                link(releaseUrl, `Listen to ${releaseTitle}`),
                image(imageUrl, releaseTitle, 500, 500),
            ])
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .link(`${LABEL_UI_URL}/unsubscribe?email=${email}&code=${code}`, " Unsubscribe")
            .get();

        Mail.sendDefault(email, mail);
    }
}
