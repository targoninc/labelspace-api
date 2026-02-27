import {TriDB} from "./DB/TriDB.ts";
import {TrackLink} from "../models/db/tri/TrackLink.ts";

export async function migrateLinks(db: TriDB) {
    const tracks = await db.getTracks(false);

    for (const track of tracks) {
        const linksToAdd: TrackLink[] = [];
        const linkKeys = Object.keys(track).filter(k => k.startsWith("link_"));

        for (const key of linkKeys) {
            // @ts-ignore fuck you
            const url = track[key];
            if (url) {
                linksToAdd.push({
                    track_id: track.id,
                    url,
                    host: new URL(url).host,
                    shown: true
                });
            }

            for (const link of linksToAdd) {
                await db.createTrackLink(link.track_id, link.url, link.shown);
            }
        }
    }
}