import * as fs from "node:fs";
import {TriDB} from "../src/utility/DB/TriDB.ts";

export async function importPayments(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
    const lines = fs.readFileSync(srcFile, "utf8").split("\n");

    const header = lines[0].split(",");
    const data = lines.slice(1).map(l => l.split(",").map(s => s.trim().replaceAll('"', "")));

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO finance.payments (created_at, updated_at, status, user_id, amount, payout_batch_id) VALUES (?, ?, 'paid', ?, ?, 'unknown') ON DUPLICATE KEY UPDATE amount = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const userId = await db.getUserIdByArtistName(row[header.indexOf("artist")]);
        if (!userId) {
            console.error("User not found: " + row[header.indexOf("artist")]);
            process.exit(1);
        }

        const params = [
            new Date(row[header.indexOf("date")]),
            new Date(row[header.indexOf("date")]),
            userId,
            row[header.indexOf("amount")],
            row[header.indexOf("amount")]
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        console.log(query, params);
        await db.query(query, params);
    }
}
