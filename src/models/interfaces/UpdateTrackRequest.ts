export interface UpdateTrackRequest {
    id: number;
    title?: string;
    artists?: string;
    isrc?: string;
    genre?: string;
    release_date?: Date;
    price?: number;
}
