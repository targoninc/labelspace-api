import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {UserEmail} from "../db/tri/UserEmail.js";
import {Usersetting} from "../db/tri/Usersetting.js";
import type {Artist} from "../db/tri/Artist.ts";

export interface UserEnrichmentConfig {
    tracks?: boolean;
    albums?: boolean;
    settings?: boolean;
    emails?: boolean;
    artists?: boolean;
}

export class UserEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, user: User, config: UserEnrichmentConfig): Promise<User> {
        if (!user) {
            return user;
        }

        user.artists = await enrichIfAsync<Artist[]>(config.artists, () => db.getUserArtists(user.id), []);
        user.settings = await enrichIfAsync<Usersetting[]>(config.settings, () => db.getUserSettings(user.id), []);
        user.emails = await enrichIfAsync<UserEmail[]>(config.emails, () => db.getUserEmails(user.id), []);

        return user;
    }
}