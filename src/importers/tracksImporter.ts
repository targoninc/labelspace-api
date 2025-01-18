import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";
import {readCsvAsync} from "../utility/CsvReader.ts";
import {MediaClient} from "../utility/Media/MediaClient.ts";
import {MediaFileType} from "../models/enums/MediaFileType.ts";
import {FileStorage} from "../utility/Storage/FileStorage.ts";

export async function importTracks(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        return;
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

        await db.query(createTrackQuery, createParams);

        const track = await db.getTrackById(row.id);
        if (track.has_cover) {
            console.log("Track already has cover: " + track.title);
            continue;
        }

        const album = await db.getAlbumById(row.albumid);
        if (!album || !album.has_cover) {
            console.error("No album found for track: " + track.title);
            continue;
        }
        const imagePath = FileStorage.filePath(MediaFileType.albumCover, album.id, "source.png");
        if (!fs.existsSync(imagePath)) {
            console.error("Cover not found: " + imagePath);
            continue;
        }
        await MediaClient.addMedia(db, MediaFileType.trackCover, track.id, "source.png", imagePath);
        await db.setTrackHasCover(track.id, true);
        console.log("Added cover for track " + track.title);
    }
}
