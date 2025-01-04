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

    const query = "INSERT INTO tri.albums (compilation_id, upc, title) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const params = [
            row[header.indexOf("compilation_id")],
            row[header.indexOf("upc")],
            row[header.indexOf("album_name")],
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        console.log(query, params);
        await db.query(query, params);
    }
}
