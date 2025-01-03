import {Album} from "../../models/db/tri/Album.js";
import { SearchTableConfiguration } from "./SearchTableConfiguration.js";
import {Track} from "../../models/db/tri/Track.js";
import {User} from "../../models/db/tri/User.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";
import {PlaylistEnricher} from "../../models/enrichers/PlaylistEnricher.js";

export class SearchConfigurations {
    static albums: SearchTableConfiguration<Album> = {
        tableName: "albums",
        type: "album",
        searchableFields: ["title", "upc", "description"],
        urlPrefix: "album",
        urlIdField: "id",
        hasImageField: "has_cover",
        displayField: "title",
        subtitleFunction: a => `by @${a.user?.username}` ?? "Unknown user",
        enrichAfterSearchFunction: async (db, a) => {
            return await AlbumEnricher.enrichManyAsync(db, a, {
                user: true
            });
        }
    };

    static tracks: SearchTableConfiguration<Track> = {
        tableName: "tracks",
        type: "track",
        searchableFields: ["title", "isrc", "description"],
        urlPrefix: "track",
        urlIdField: "id",
        hasImageField: "has_cover",
        displayField: "title",
        subtitleFunction: t => `by @${t.user?.username}` ?? "Unknown user",
        enrichAfterSearchFunction: async (db, a) => {
            return await TrackEnricher.enrichManyAsync(db, a, {
                user: true
            });
        }
    };

    static users: SearchTableConfiguration<User> = {
        tableName: "users",
        type: "user",
        searchableFields: ["username", "displayname", "description"],
        urlPrefix: "profile",
        urlIdField: "username",
        hasImageField: "has_avatar",
        displayField: "displayname",
        subtitleFunction: u => `@${u.username}`
    };

    static playlists: SearchTableConfiguration<any> = {
        tableName: "playlists",
        type: "playlist",
        searchableFields: ["title", "description"],
        urlPrefix: "playlist",
        urlIdField: "id",
        hasImageField: "has_cover",
        displayField: "title",
        subtitleFunction: p => `by @${p.user?.username}` ?? "Unknown user",
        enrichAfterSearchFunction: async (db, a) => {
            return await PlaylistEnricher.enrichManyAsync(db, a, {
                user: true
            });
        }
    };
}