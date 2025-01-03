import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {Track} from "../db/tri/Track.js";
import {ColumnProtector} from "../ColumnProtector.js";
import {ProtectionSchemas} from "../enums/ProtectionSchema.js";

export interface TrackEnrichmentConfig {
    user?: boolean;
    protect?: boolean;
}

export class TrackEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, base: Track, config: TrackEnrichmentConfig, user?: User): Promise<Track> {
        base.user = await enrichIfAsync<User>(config.user, () => db.getUserById(base.user_id, user?.id ?? -1), {} as User);

        if (config.protect !== false) {
            base = ColumnProtector.protect(base, ProtectionSchemas.track);
        }

        return base;
    }

    static async enrichManyAsync(db: TriDB, tracks: Track[], config: TrackEnrichmentConfig, user?: User): Promise<Track[]> {
        const userIds = tracks.map(t => t.user_id);
        const users = await enrichIfAsync<User[]>(config.user, () => db.getUsersByIds(userIds), []);

        tracks = tracks.map(t => {
            return {
                ...t,
                user: users.find(u => u.id === t.user_id),
            }
        });

        return tracks;
    }
}