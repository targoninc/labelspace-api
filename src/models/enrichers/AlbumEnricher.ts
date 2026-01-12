import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {Album} from "../db/tri/Album.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Track} from "../db/tri/Track.js";
import {AlbumAttachment} from "../db/tri/AlbumAttachment.ts";

export interface AlbumEnrichmentConfig {
    tracks?: boolean;
    trackEarnings?: boolean;
}

export class AlbumEnricher extends IEnricher {
    static enrich(db: TriDB, base: Album, config: AlbumEnrichmentConfig): Album {
        throw new Error("Method not implemented.");
    }

    static async enrichAsync(db: TriDB, base: Album, config: AlbumEnrichmentConfig): Promise<Album> {
        base.tracks = await enrichIfAsync<Track[]>(config.tracks, async () => {
            return await db.getTracksByAlbumIds([base.id]);
        }, []);

        if (config.trackEarnings) {
            for (const t of base.tracks) {
                t.earnings = await db.getTrackTotalRoyalty(t.isrc);
            }
        }

        return base;
    }

    static enrichMany(db: TriDB, base: Album[], config: AlbumEnrichmentConfig): Album[] {
        throw new Error("Method not implemented.");
    }

    static async enrichManyAsync(db: TriDB, albums: Album[], config: AlbumEnrichmentConfig): Promise<Album[]> {
        const albumIds = albums.map(album => album.id);
        const tracks = await enrichIfAsync<Track[]>(config.tracks, () => db.getTracksByAlbumIds(albumIds), []);

        albums.forEach(album => {
            album.tracks = tracks?.filter(t => t.album_id === album.id) ?? [];
        });

        return albums;
    }
}