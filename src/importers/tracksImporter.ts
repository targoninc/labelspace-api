import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";
import {readCsvAsync} from "../utility/CsvReader.ts";

export async function importTracks(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
    const content = fs.readFileSync(srcFile, "utf8");

    const data = await readCsvAsync<any>(content);

    console.log("Inserting " + data.length + " rows...");

    const createTrackQuery = "INSERT INTO tri.tracks (id, album_id, artists, title, isrc, credits, loudness_data, genre, length, release_date, link_applemusic, link_bandcamp, link_lyda, link_soundcloud, link_spotify, link_youtube) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?";

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row.title === undefined) {
            continue;
        }

        const createParams = [
            row.id,
            row.albumid,
            row.trackartists,
            row.title,
            row.isrc,
            "", // credits
            "", // loudness_data
            "", // genre
            row.length === '' ? 0 : parseInt(row.length),
            new Date(row.date),
            row.applemusic,
            row.bandcamp,
            row.lyda,
            row.soundcloud,
            row.spotify,
            row.youtube,
            row.title,
        ];

        console.log(createTrackQuery, createParams);
        await db.query(createTrackQuery, createParams);
    }
}
