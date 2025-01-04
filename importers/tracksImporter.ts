import * as fs from "node:fs";
import {TriDB} from "../src/utility/DB/TriDB.ts";

export async function importAlbums(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
    const lines = fs.readFileSync(srcFile, "utf8").trim().split("\n");

    const header = lines[0].split(",");
    const data = lines.slice(1).map(l => l.split(",").map(s => s.trim().replaceAll('"', "")));

    console.log("Inserting " + data.length + " rows...");

    const createTrackQuery = "INSERT INTO tri.tracks (artists, title, isrc, credits, loudness_data, genre, length, release_date, link_applemusic, link_bandcamp, link_lyda, link_soundcloud, link_spotify, link_youtube) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?";
    const linkTrackToAlbumQuery = "INSERT INTO tri.albumtracks (album_id, track_id, position) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE position = ?";

    const albumPositions = new Map<string, number>();
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const createParams = [
            row[header.indexOf("trackartists")],
            row[header.indexOf("title")],
            row[header.indexOf("isrc")],
            "", // credits
            "", // loudness_data
            "", // genre
            row[header.indexOf("length")],
            new Date(row[header.indexOf("release_date")]),
            row[header.indexOf("applemusic")],
            row[header.indexOf("bandcamp")],
            row[header.indexOf("lyda")],
            row[header.indexOf("soundcloud")],
            row[header.indexOf("spotify")],
            row[header.indexOf("youtube")],
            row[header.indexOf("title")],
        ];

        console.log(createTrackQuery, createParams);
        await db.query(createTrackQuery, createParams);

        const track = await db.getTrackByIsrc(row[header.indexOf("isrc")]);
        if (!track) {
            throw new Error("Track not found: " + row[header.indexOf("isrc")]);
        }

        const upc = row[header.indexOf("upc")];
        if (upc) {
            const album = await db.getAlbumByUpc(upc);
            if (!album) {
                throw new Error("Album not found: " + upc);
            }

            const position = (albumPositions.get(upc) ?? -1) + 1;
            albumPositions.set(upc, position);

            const linkParams = [
                album.id,
                track.id,
                position,
                position
            ];

            console.log(linkTrackToAlbumQuery, linkParams);
            await db.query(linkTrackToAlbumQuery, linkParams);
        }
    }
}
