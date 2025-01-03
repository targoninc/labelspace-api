export interface UploadTrackRequestBody {
    title: string,
    isrc: string,
    upc: string,
    visibility: string,
    monetization: boolean,
    genre: string,
    description: string,
    release_date: string,
    price: number,
}