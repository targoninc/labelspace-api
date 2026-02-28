import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {UserEmail} from "../db/tri/UserEmail.js";
import {Usersetting} from "../db/tri/Usersetting.js";
import type {Artist} from "../db/tri/Artist.ts";
import type {Permission} from "../db/tri/Permission.ts";
import {UserTotp} from "../db/tri/UserTotp.ts";
import {PublicKey} from "../db/tri/PublicKey.ts";

export interface UserEnrichmentConfig {
    tracks?: boolean;
    albums?: boolean;
    settings?: boolean;
    emails?: boolean;
    artists?: boolean;
    permissions?: boolean;
    totp?: boolean;
    public_keys?: boolean;
}

export class UserEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, user: User, config: UserEnrichmentConfig): Promise<User> {
        if (!user) {
            return user;
        }

        user.artists = await enrichIfAsync<Artist[]>(config.artists, () => db.getUserArtists(user.id), []);
        user.settings = await enrichIfAsync<Usersetting[]>(config.settings, () => db.getUserSettings(user.id), []);
        user.emails = await enrichIfAsync<UserEmail[]>(config.emails, () => db.getEmailsByUserId(user.id), []);
        user.permissions = await enrichIfAsync<Permission[]>(config.permissions, async () => {
            const userPerms = await db.getUserPermissions(user.id);
            return await db.getPermissionsByIds(userPerms.map(p => p.permission_id));
        }, []);
        user.totp = await enrichIfAsync<UserTotp[]>(config.totp, async () => {
            const userTotp = await db.getUserTotp(user.id);
            return userTotp.map(t => (<UserTotp>{
                id: t.id,
                name: t.name,
                verified: t.verified,
                created_at: t.created_at,
                updated_at: t.updated_at,
            }));
        }, []);
        user.public_keys = await enrichIfAsync<PublicKey[]>(config.public_keys, () => db.getUserPublicKeys(user.passkey_user_id), []);

        return user;
    }

    static async enrichManyAsync(db: TriDB, users: User[], config: UserEnrichmentConfig): Promise<User[]> {
        if (!users || users.length === 0) return users;

        const ids = users.map(u => u.id);
        const passkeyIds = config.public_keys ? users.map(u => u.passkey_user_id).filter(Boolean) : [];

        const [artists, settings, emails, userPerms, totpRows, publicKeys] = await Promise.all([
            config.artists    ? db.getArtistsByUserIds(ids)           : Promise.resolve([]),
            config.settings   ? db.getSettingsByUserIds(ids)          : Promise.resolve([]),
            config.emails     ? db.getEmailsByUserIds(ids)            : Promise.resolve([]),
            config.permissions? db.getPermissionsByUserIds(ids)       : Promise.resolve([]),
            config.totp       ? db.getTotpByUserIds(ids)              : Promise.resolve([]),
            config.public_keys? db.getPublicKeysByPasskeyUserIds(passkeyIds as string[]) : Promise.resolve([]),
        ]);

        let allPermissions: Permission[] = [];
        if (config.permissions && userPerms.length > 0) {
            const permIds = [...new Set(userPerms.map(p => p.permission_id))];
            allPermissions = await db.getPermissionsByIds(permIds);
        }

        for (const user of users) {
            if (config.artists)     user.artists     = artists.filter(a => a.user_id === user.id);
            if (config.settings)    user.settings    = settings.filter(s => s.user_id === user.id);
            if (config.emails)      user.emails      = emails.filter(e => e.user_id === user.id);
            if (config.permissions) {
                const ids = userPerms.filter(p => p.user_id === user.id).map(p => p.permission_id);
                user.permissions = allPermissions.filter(p => ids.includes(p.id));
            }
            if (config.totp) {
                user.totp = totpRows
                    .filter(t => t.user_id === user.id)
                    .map(t => (<UserTotp>{
                        id: t.id,
                        name: t.name,
                        verified: t.verified,
                        created_at: t.created_at,
                        updated_at: t.updated_at,
                    }));
            }
            if (config.public_keys) user.public_keys = publicKeys.filter(k => k.passkey_user_id === user.passkey_user_id);
        }

        return users;
    }
}