import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {Track} from "../db/tri/Track.js";
import type {Album} from "../db/tri/Album.ts";

export interface TrackEnrichmentConfig {
    album?: boolean
}

export class TrackEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, base: Track, config: TrackEnrichmentConfig, user?: User): Promise<Track> {
        base.album = await enrichIfAsync<Album>(config.album, async () => {
            const album = await db.getAlbumById(base.album_id ?? 0)
            if (!album) {
                return null;
            }
            album.earnings = await db.getReleaseTotalRoyalty(album.upc);

            return album;
        }, {} as Album);

        return base;
    }

    static async enrichManyAsync(db: TriDB, tracks: Track[], config: TrackEnrichmentConfig, user?: User): Promise<Track[]> {
        const albumIds = tracks.map(t => t.album_id);
        const albums = await enrichIfAsync<Album[]>(config.album, () => db.getAlbumsByIds(albumIds), []);

        tracks = tracks.map(t => {
            return {
                ...t,
                album: albums.find(u => u.id === t.album_id)
            }
        });

        return tracks;
    }
}