import {Visibility} from "../enums/Visibility.js";

export interface CreateAlbumRequestBody {
    title: string;
    description?: string;
    upc?: string;
    release_date?: Date;
    visibility?: Visibility;
    price?: number;
}