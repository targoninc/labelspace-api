export interface CreateAlbumRequestBody {
    title: string;
    upc?: string;
    release_date?: Date;
    price?: number;
}