import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {Album} from "../db/tri/Album.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Track} from "../db/tri/Track.js";
import {User} from "../db/tri/User.js";

export interface AlbumEnrichmentConfig {
    tracks?: boolean;
    user?: boolean;
}

export class AlbumEnricher extends IEnricher {
    static enrich(db: TriDB, base: Album, config: AlbumEnrichmentConfig): Album {
        throw new Error("Method not implemented.");
    }

    static async enrichAsync(db: TriDB, base: Album, config: AlbumEnrichmentConfig): Promise<Album> {
        base.user = await enrichIfAsync<User>(config.user, () => db.getUserById(base.user_id), null);
        base.tracks = await enrichIfAsync<Track[]>(config.tracks, async () => {
            return await db.getAlbumTracksByAlbumIds([base.id]);
        }, []);

        return base;
    }

    static enrichMany(db: TriDB, base: Album[], config: AlbumEnrichmentConfig): Album[] {
        throw new Error("Method not implemented.");
    }

    static async enrichManyAsync(db: TriDB, albums: Album[], config: AlbumEnrichmentConfig): Promise<Album[]> {
        const albumIds = albums.map(album => album.id);
        const tracks = await enrichIfAsync<Track[]>(config.tracks, () => db.getAlbumTracksByAlbumIds(albumIds), []);
        const users = await enrichIfAsync<User[]>(config.user, () => db.getUsersByAlbumIds(albumIds), []);

        albums.forEach(album => {
            album.tracks = tracks?.filter(t => t.album_id === album.id) ?? [];
            album.user = users?.find(user => user.id === album.user_id);
        });

        return albums;
    }
}