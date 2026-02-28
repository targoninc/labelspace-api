import {link, MailBuilder, paragraph, Mail, heading} from "@targoninc/ts-mail";
import {UserEmail} from "../../models/db/tri/UserEmail.js";
import {User} from "../../models/db/tri/User.js";
import {COMPANY_CONTACT, COMPANY_NAME, LABEL_NAME, MAIL_LOGO_URL, PORTAL_NAME, PORTAL_UI_URL} from "../Constants.ts";

export class AccountMailer {
    static sendActivationEmails(emails: UserEmail[], user: User) {
        const toVerify = emails.filter(e => !e.verified);

        for (const email of toVerify) {
            const mail = MailBuilder.default(MAIL_LOGO_URL)
                .subject(`Your ${PORTAL_NAME} account`)
                .heading(`Your email address was just associated with a ${PORTAL_NAME} account`)
                .paragraph(`Your email address was just associated with the a ${PORTAL_NAME} account (@${user.username}).`)
                .card([
                    paragraph("To verify your email address, click the following link"),
                    link(`${PORTAL_UI_URL}/verify-email?code=${email.verification_code}`)
                ])
                .paragraph(`If you did not request this, please contact us immediately at ${COMPANY_CONTACT}.`)
                .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
                .get();

            Mail.sendDefault(email.email, mail);
        }
    }

    static sendRegistrationEmail(email: string, verifCode: string, tempPassword: string, username: string) {
        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`Your new ${PORTAL_NAME} account`)
            .heading(`Your email address was just associated with a ${PORTAL_NAME} account`, 1)
            .paragraph(`You can now log in with the following credentials:`)
            .card([
                heading("Change your password after logging in!", 2),
                paragraph(`Username: ${username}`),
                paragraph(`Temporary Password: ${tempPassword}`),
                link(`${PORTAL_UI_URL}/verify-email?code=${verifCode}`, "Verify email & log in")
            ])
            .paragraph(`If you did not request this, please contact us immediately at ${COMPANY_CONTACT}.`)
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .get();

        Mail.sendDefault(email, mail);
    }

    static sendArtistCreateEmail(email: string, linkedUser: User, name: string) {
        const mail = MailBuilder.default(MAIL_LOGO_URL)
            .subject(`New artist profile created on ${PORTAL_NAME}`)
            .heading(`A new artist profile was just created for you`)
            .paragraph(`Your ${PORTAL_NAME} account (@${linkedUser.username}) has been linked to a new artist profile.`)
            .card([
                heading("Artist Details", 2),
                paragraph(`Artist Name: ${name}`),
                paragraph(`Linked Account: @${linkedUser.username}`)
            ])
            .paragraph(`You can now manage the page for this artist through your account.`)
            .paragraph(`If you did not request this, please contact us immediately at ${COMPANY_CONTACT}.`)
            .signature(`the ${LABEL_NAME} Team`, COMPANY_NAME)
            .get();

        Mail.sendDefault(email, mail);
    }
}