import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";

export async function importArtists(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
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
    }
}
