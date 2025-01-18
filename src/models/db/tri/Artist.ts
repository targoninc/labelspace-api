import {Track} from "./Track.ts";
import {Album} from "./Album.ts";

export interface Artist {
    tracks?: Track[];
    albums?: Album[];
    id: number;
    user_id: number|null;
    name: string;
    legal_name: string;
    country: string|null;
    state: string|null;
    has_logo: boolean;
}