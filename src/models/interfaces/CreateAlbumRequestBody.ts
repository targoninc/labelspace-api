export interface CreateAlbumRequestBody {
    artists: string;
    title: string;
    upc?: string;
    release_date?: Date;
    price?: number;
}