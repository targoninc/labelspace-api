import {User} from "./User.js";
import type {Track} from "./Track.ts";

export interface Album {
    files?: string[];
    earnings?: number;
    tracks?: Track[];
    user?: User;
    id: number;
    title: string;
    upc: string;
    release_date: Date;
    created_at: Date;
    updated_at: Date;
    has_cover: boolean;
    price: number;
    artists: string;
}