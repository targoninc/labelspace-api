export interface UpdateTrackRequest {
    id: number;
    title?: string;
    artistname?: string;
    isrc?: string;
    upc?: string;
    visibility?: string;
    monetization?: boolean;
    genre?: string;
    description?: string;
    release_date?: Date;
    price?: number;
}
