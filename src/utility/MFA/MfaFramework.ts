import {User} from "../../models/db/tri/User.ts";
import {TriDB} from "../DB/TriDB.ts";

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