import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {Artist} from "../db/tri/Artist.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Track} from "../db/tri/Track.js";
import {Album} from "../db/tri/Album.ts";

export interface ArtistEnrichmentConfig {
    tracks?: boolean;
    albums?: boolean;
}

export class ArtistEnricher extends IEnricher {
    static enrich(db: TriDB, base: Artist, config: ArtistEnrichmentConfig): Artist {
        throw new Error("Method not implemented.");
    }

    static async enrichAsync(db: TriDB, base: Artist, config: ArtistEnrichmentConfig): Promise<Artist> {
        throw new Error("Method not implemented.");
    }

    static enrichMany(db: TriDB, base: Artist[], config: ArtistEnrichmentConfig): Artist[] {
        throw new Error("Method not implemented.");
    }

    static async enrichManyAsync(db: TriDB, artists: Artist[], config: ArtistEnrichmentConfig): Promise<Artist[]> {
        const artistNames = artists.map(artist => artist.name);
        const tracks = await enrichIfAsync<Track[]>(config.tracks, () => db.getTracksByArtists(artistNames), []);
        const albums = await enrichIfAsync<Album[]>(config.albums, () => db.getAlbumsByArtists(artistNames), []);

        artists.forEach(artist => {
            artist.tracks = tracks?.filter(t => t.artists.includes(artist.name)) ?? [];
            artist.albums = albums?.filter(a => a.artists.includes(artist.name)) ?? [];
        });

        return artists;
    }
}