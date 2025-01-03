import {IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Comment} from "../db/tri/Comment.js";
import {ProtectionSchemas} from "../enums/ProtectionSchema.js";
import {ColumnProtector} from "../ColumnProtector.js";

export interface CommentEnrichmentConfig {
    user?: boolean;
    track?: boolean;
}

export class CommentEnricher extends IEnricher {
    static async enrichManyAsync(db: TriDB, base: Comment[], config: CommentEnrichmentConfig): Promise<Comment[]> {
        if (config.user) {
            const userIds = base.map(c => c.user_id);
            const users = await db.getUsersByIds(userIds);
            base.forEach(c => {
                c.user = users.find(u => u.id === c.user_id);
                c.user = ColumnProtector.protect(c.user, ProtectionSchemas.user);
            });
        }
        if (config.track) {
            const trackIds = base.map(c => c.track_id);
            const tracks = await db.getTracksByIds(trackIds);
            base.forEach(c => {
                c.track = tracks.find(t => t.id === c.track_id);
                c.track = ColumnProtector.protect(c.track, ProtectionSchemas.track);
            });
        }

        return base;
    }
}