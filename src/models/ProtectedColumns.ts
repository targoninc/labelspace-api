import {User} from "./db/tri/User.js";
import {Track} from "./db/tri/Track.js";
import {Album} from "./db/tri/Album.js";
import {UserEmail} from "./db/tri/UserEmail.js";

/**
 * Only these columns can be accessed by the owning user of each entity
 * Or by roles that have been granted access to the entity
 */
export class ProtectedColumns {
    static track: (keyof Track)[] = ["isrc", "upc", "secretcode", "monetization"]
    static comments = ["arr:comment"]
    static user: (keyof User)[] = ["mfa_enabled", "emails", "password_hash", "verification_status", "updated_at", "deleted_at", "lastlogin", "secondlastlogin", "password_updated_at", "tos_agreed_at", "ip", "password_token"]
    static album: (keyof Album)[] = ["secretcode"];
    static email: (keyof UserEmail)[] = ["verification_code"];
}