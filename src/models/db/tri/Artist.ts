import {Track} from "./Track.ts";
import {Album} from "./Album.ts";
import {User} from "./User.ts";

export interface Artist {
    tracks?: Track[];
    albums?: Album[];
    user?: User;
    id: number;
    user_id: number|null;
    name: string;
    has_logo: boolean;
    description: string|null;
}