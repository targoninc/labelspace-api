import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";
import {readCsvAsync} from "../utility/CsvReader.ts";
import path from "node:path";
import {MediaClient} from "../utility/Media/MediaClient.ts";
import {MediaFileType} from "../models/enums/MediaFileType.ts";

export async function importAlbums(db: TriDB, srcFile: string, tracksSrcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        return;
    }
    if (!fs.existsSync(tracksSrcFile)) {
        console.error("File not found: " + tracksSrcFile);
        return;
    }
    const relativeLogoPath = "./images/releases/";
    const coverSrcPath = path.join(path.dirname(srcFile), relativeLogoPath);

    const lines = fs.readFileSync(srcFile, "utf8");
    const data = await readCsvAsync<any>(lines);

    const lines2 = fs.readFileSync(tracksSrcFile, "utf8");
    const tracksData = await readCsvAsync<any>(lines2);

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO tri.albums (id, compilation_id, upc, title, artists, release_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        let compilationId: any = row.compilation_id;
        if (compilationId === "") {
            compilationId = null;
        } else {
            compilationId = parseInt(compilationId);
        }
        if (compilationId === 0) {
            compilationId = null;
        }

        const firstTrack = tracksData.find(t => t.albumid === row.album_id);
        if (!firstTrack) {
            console.error("No track found for album " + row.album_id);
            continue;
        }

        const params = [
            row.album_id,
            compilationId,
            row.upc,
            row.album_name,
            row.artists,
            new Date(firstTrack.date),
            new Date(firstTrack.date),
            new Date(firstTrack.date),
            row.album_name,
        ];

        if (params.some(p => p === undefined)) {
            console.error("Undefined parameter found", params);
            return;
        }
        await db.query(query, params);

        const album = await db.getAlbumById(row.album_id);
        if (album.has_cover) {
            console.log("Album already has cover: " + album.title);
            continue;
        }

        const imageName = row.image;
        if (!imageName || imageName === "") {
            continue;
        }

        const imagePath = path.join(coverSrcPath, imageName + ".png");
        if (!fs.existsSync(imagePath)) {
            console.error("Cover not found: " + imagePath);
            continue;
        }
        await MediaClient.addMedia(db, MediaFileType.albumCover, album.id, "source.png", imagePath);
        await db.setAlbumHasCover(album.id, true);
        console.log("Added cover for album " + album.title);
    }
}
