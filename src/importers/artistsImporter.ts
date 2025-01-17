import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";
import path from "node:path";
import { MediaClient } from "../utility/Media/MediaClient.ts";
import { MediaFileType } from "../models/enums/MediaFileType.ts";

export async function importArtists(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        return;
    }
    const relativeLogoPath = "./images/logos/";
    const logoSrcPath = path.join(path.dirname(srcFile), relativeLogoPath);
    const lines = fs.readFileSync(srcFile, "utf8").split("\n");

    const header = lines[0].split(",");
    const data = lines.slice(1).map(l => l.split(",").map(s => s.trim().replaceAll('"', "")));

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO tri.artists (user_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const user = await db.getUserByUsername(row[header.indexOf("username")]);
        if (!user) {
            console.error("User not found: " + row[header.indexOf("username")]);
            process.exit(1);
        }

        const params = [
            user.id,
            row[header.indexOf("artistname")],
            row[header.indexOf("artistname")],
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        console.log(query, params);
        await db.query(query, params);

        const artist = await db.getArtistByName(row[header.indexOf("artistname")]);
        if (!artist) {
            console.error("Artist not found: " + row[header.indexOf("artistname")]);
            continue;
        }

        if (artist.has_logo) {
            console.log("Artist already has logo: " + artist.name);
            continue;
        }

        const logoName = row[header.indexOf("logo")];
        if (!logoName || logoName === "") {
            continue;
        }

        const logoPath = path.join(logoSrcPath, logoName + ".png");
        if (!fs.existsSync(logoPath)) {
            console.error("Logo not found: " + logoPath);
            continue;
        }
        const logo = fs.readFileSync(logoPath);
        await MediaClient.addMedia(db, MediaFileType.artistLogo, artist.id, "source.png", logoPath);
        await db.setArtistHasLogo(artist.id, true);
        console.log("Added logo for artist " + artist.name);
    }
}
