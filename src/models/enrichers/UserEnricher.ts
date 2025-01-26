import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {UserEmail} from "../db/tri/UserEmail.js";
import {Usersetting} from "../db/tri/Usersetting.js";
import type {Artist} from "../db/tri/Artist.ts";
import type {Permission} from "../db/tri/Permission.ts";
import {UserTotp} from "../db/tri/UserTotp.ts";

export interface UserEnrichmentConfig {
    tracks?: boolean;
    albums?: boolean;
    settings?: boolean;
    emails?: boolean;
    artists?: boolean;
    permissions?: boolean;
    totp?: boolean;
}

export class UserEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, user: User, config: UserEnrichmentConfig): Promise<User> {
        if (!user) {
            return user;
        }

        user.artists = await enrichIfAsync<Artist[]>(config.artists, () => db.getUserArtists(user.id), []);
        user.settings = await enrichIfAsync<Usersetting[]>(config.settings, () => db.getUserSettings(user.id), []);
        user.emails = await enrichIfAsync<UserEmail[]>(config.emails, () => db.getUserEmails(user.id), []);
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

        return user;
    }
}