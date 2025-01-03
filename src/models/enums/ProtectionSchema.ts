import {ProtectedColumns} from "../ProtectedColumns.js";
import {Track} from "../db/tri/Track.js";
import {Album} from "../db/tri/Album.js";
import {User} from "../db/tri/User.js";
import {UserEmail} from "../db/tri/UserEmail.js";

/**
 * A protection schema defines which columns should be protected and which columns should be protected recursively.
 */
export interface ProtectionSchema<T> {
    /**
     * The columns that should be protected. An array of strings.
     */
    self: string[],
    /**
     * The children columns that should be recursively protected. An array of strings. Will use their respective protection schemas.
     */
    children?: (keyof T)[],
    /**
     * The array form of the children columns. If a property is found to have this name, each element will use the assigned protection schema.
     */
    arrayForm?: string
}

export class ProtectionSchemas {
    static [key: string]: ProtectionSchema<any>;

    static track: ProtectionSchema<Track> = {
        self: ProtectedColumns.track,
        children: ["user"],
        arrayForm: "tracks"
    }
    static album: ProtectionSchema<Album> = {
        self: ProtectedColumns.album,
        children: ["tracks"],
        arrayForm: "albums"
    }
    static user: ProtectionSchema<User> = {
        self: ProtectedColumns.user,
        arrayForm: "users"
    }
    static email: ProtectionSchema<UserEmail> = {
        self: ProtectedColumns.email,
        arrayForm: "emails"
    }
}