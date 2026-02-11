import {Album} from "./Album.js";
import {User} from "./User.js";
import {Split} from "../finance/Split.ts";

export interface Track {
    earnings?: number;
    repost_user_id?: number;
    user?: User;
    albums?: Album[];
    splits?: Split[];
    id: number;
    title: string;
    artists: string;
    isrc: string;
    credits: string;
    loudness_data: string;
    genre: string;
    length: number;
    release_date: Date;
    updated_at: Date;
    created_at: Date;
    price: number;
    has_cover: boolean;
    processed: boolean;
    link_spotify: string;
    link_youtube: string;
    link_soundcloud: string;
    link_applemusic: string;
    link_bandcamp: string;
    link_lyda: string;
}