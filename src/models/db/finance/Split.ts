export interface Split {
    isrc: string;
    artist: string;
    /**
     * The percentage of royalty that the artist should receive as a value from 0-1
     */
    split: number;
}