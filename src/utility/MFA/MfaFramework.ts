import {User} from "../../models/db/tri/User.ts";
import {TriDB} from "../DB/TriDB.ts";
import {CredentialDescriptor} from "@passwordless-id/webauthn/dist/esm/types";
import {MfaOption} from "./Enums/MfaOption.ts";

export async function getUserMfa(user: User, db: TriDB) {
    const primaryEmail = await db.getUserPrimaryEmail(user.id);
    const userTotp = await db.getUserTotp(user.id);
    const userPublicKeys = await db.getUserPublicKeys(user.passkey_user_id);
    const useTotp = userTotp && userTotp.length > 0 && userTotp.some(t => t.verified);
    const useWebauthn = userPublicKeys && userPublicKeys.length > 0;
    return {
        enabled: useTotp || useWebauthn || (primaryEmail && primaryEmail.verified),
        totp: {
            enabled: useTotp,
            methods: userTotp
        },
        webauthn: {
            enabled: useWebauthn,
            methods: userPublicKeys
        },
        email: {
            enabled: primaryEmail && primaryEmail.verified,
            methods: [primaryEmail]
        }
    };
}

export async function getMfaOptions(user: User, db: TriDB) {
    const mfa = await getUserMfa(user, db);
    const options = [];
    if (mfa.enabled) {
        if (mfa.webauthn.enabled) {
            options.push({
                type: MfaOption.webauthn,
                credentialDescriptors: mfa.webauthn.methods.map(k => (<CredentialDescriptor>{
                    id: k.key_id,
                    transports: k.transports.split(",")
                }))
            });
        }

        if (mfa.totp.enabled) {
            options.push({
                type: MfaOption.totp
            });
        }

        const firstMail = mfa.email.methods[0];
        if (mfa.email.enabled && firstMail) {
            options.push({
                type: MfaOption.email,
                email: firstMail.email
            });
        }
    }
    return options;
}