import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {Track} from "../db/tri/Track.js";
import type {Album} from "../db/tri/Album.ts";

export interface TrackEnrichmentConfig {
    albums?: boolean;
    albumEarnings?: boolean;
}

export class TrackEnricher extends IEnricher {
    static async enrichAsync(db: TriDB, base: Track, config: TrackEnrichmentConfig, user?: User): Promise<Track> {
        base.albums = await enrichIfAsync<Album[]>(config.albums, async () => {
            const albums = await db.getTrackAlbums(base.id)
            if (!albums) {
                return null;
            }

            if (config.albumEarnings) {
                for (const album of albums) {
                    album.earnings = await db.getReleaseTotalRoyalty(album.upc) ?? 0;
                }
            }

            return albums;
        }, {} as Album);

        return base;
    }

    static async enrichManyAsync(db: TriDB, tracks: Track[], config: TrackEnrichmentConfig, user?: User): Promise<Track[]> {
        const trackIds = tracks.map(t => t.id);
        const albums = await enrichIfAsync<(Album & { track_id: number })[]>(config.albums, () => db.getAlbumsByTrackIds(trackIds), []);

        tracks = tracks.map(t => {
            return {
                ...t,
                album: albums.find(u => u.track_id === t.id)
            }
        });

        return tracks;
    }
}