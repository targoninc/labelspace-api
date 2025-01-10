import {Album} from "../../models/db/tri/Album.js";
import { SearchTableConfiguration } from "./SearchTableConfiguration.js";
import {Track} from "../../models/db/tri/Track.js";
import {User} from "../../models/db/tri/User.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {TrackEnricher} from "../../models/enrichers/TrackEnricher.js";

export class SearchConfigurations {
    static albums: SearchTableConfiguration<Album> = {
        tableName: "albums",
        type: "album",
        searchableFields: ["title", "artists"],
        urlPrefix: "album",
        urlIdField: "id",
        hasImageField: "has_cover",
        displayField: "title",
        subtitleFunction: a => `by @${a.user?.username}` ?? "Unknown user",
        enrichAfterSearchFunction: async (db, a) => {
            return await AlbumEnricher.enrichManyAsync(db, a, {
                tracks: true
            });
        }
    };

    static tracks: SearchTableConfiguration<Track> = {
        tableName: "tracks",
        type: "track",
        searchableFields: ["title", "isrc", "artists", "credits"],
        urlPrefix: "track",
        urlIdField: "id",
        hasImageField: "has_cover",
        displayField: "title",
        subtitleFunction: t => t.artists,
        enrichAfterSearchFunction: async (db, a) => {
            return await TrackEnricher.enrichManyAsync(db, a, {
                album: true
            });
        }
    };

    static users: SearchTableConfiguration<User> = {
        tableName: "users",
        type: "user",
        searchableFields: ["username", "description"],
        urlPrefix: "profile",
        urlIdField: "username",
        hasImageField: "has_avatar",
        displayField: "username",
        subtitleFunction: u => `@${u.username}`
    };
}