import * as fs from "node:fs";
import {TriDB} from "../src/utility/DB/TriDB.ts";
import {readCsvAsync} from "../src/utility/CsvReader.ts";

export async function importAlbums(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
    const lines = fs.readFileSync(srcFile, "utf8");

    const data = await readCsvAsync<any>(lines);
    const header = Object.keys(data[0]);

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO tri.albums (id, compilation_id, upc, title) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        let compilationId: any = row.compilation_id;
        if (compilationId === "") {
            compilationId = null;
        } else {
            compilationId = parseInt(compilationId);
        }
        const params = [
            row.album_id,
            compilationId,
            row.upc,
            row.album_name,
            row.album_name,
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        console.log(query, params);
        await db.query(query, params);
    }
}
