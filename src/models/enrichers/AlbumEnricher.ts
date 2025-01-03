import {enrichIfAsync, IEnricher} from "./IEnricher.js";
import {Album} from "../db/tri/Album.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumTrack} from "../db/tri/AlbumTrack.js";
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
        base.tracks = await enrichIfAsync<AlbumTrack[]>(config.tracks, async () => {
            const aTracks = await db.getAlbumTracksByAlbumIds([base.id]);
            const trackIds = aTracks.map(pt => pt.track_id);
            const tracks = await db.getTracksByIds(trackIds);

            aTracks.map(at => {
                at.track = tracks.find(t => t.id === at.track_id);

                return at;
            });
            return aTracks;
        }, []);

        return base;
    }

    static enrichMany(db: TriDB, base: Album[], config: AlbumEnrichmentConfig): Album[] {
        throw new Error("Method not implemented.");
    }

    static async enrichManyAsync(db: TriDB, albums: Album[], config: AlbumEnrichmentConfig): Promise<Album[]> {
        const albumIds = albums.map(album => album.id);
        const albumTracks = await enrichIfAsync<AlbumTrack[]>(config.tracks, () => db.getAlbumTracksByAlbumIds(albumIds), []);
        const tracks = await enrichIfAsync<Track[]>(config.tracks, () => db.getTracksByIds(albumTracks.map(at => at.track_id)), []);
        const users = await enrichIfAsync<User[]>(config.user, () => db.getUsersByAlbumIds(albumIds), []);

        albums.forEach(album => {
            const thisAlbumTracks = albumTracks?.filter(at => at.album_id === album.id) ?? [];
            album.tracks = thisAlbumTracks.map(at => {
                at.track = tracks?.find(t => t.id === at.track_id);
                return at;
            });
            album.user = users?.find(user => user.id === album.user_id);
        });

        return albums;
    }
}