import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {UserBadge} from "../db/tri/UserBadge.js";
import {User} from "../db/tri/User.js";
import {Follow} from "../db/tri/Follow.js";
import {Badge} from "../db/tri/Badge.js";
import {UserEmail} from "../db/tri/UserEmail.js";
import {Usersetting} from "../db/tri/Usersetting.js";

export interface UserEnrichmentConfig {
    badges?: boolean;
    follows?: boolean;
    following?: boolean;
    tracks?: boolean;
    albums?: boolean;
    playlists?: boolean;
    trackCollaborations?: boolean;
    comments?: boolean;
    settings?: boolean;
    emails?: boolean;
}

export class UserEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, user: User, config: UserEnrichmentConfig): Promise<User> {
        if (!user) {
            return user;
        }

        user.userBadges = await enrichIfAsync<UserBadge[]>(config.badges, () => db.getUserBadges(user.id), []);
        user.badges = await enrichIfAsync<Badge[]>(config.badges, () => db.getBadgesByIds(user.userBadges!.map(ub => ub.badge_id)), []);
        user.follows = await enrichIfAsync<Follow[]>(config.follows, () => db.getFollowsIncoming(user.id), []);
        user.following = await enrichIfAsync<Follow[]>(config.following, () => db.getFollowsOutgoing(user.id), []);
        user.settings = await enrichIfAsync<Usersetting[]>(config.settings, () => db.getUserSettings(user.id), []);
        user.emails = await enrichIfAsync<UserEmail[]>(config.emails, () => db.getUserEmails(user.id), []);

        return user;
    }
}