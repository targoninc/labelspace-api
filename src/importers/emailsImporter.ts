import * as fs from "node:fs";
import {TriDB} from "../utility/DB/TriDB.ts";

export async function importEmails(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        return;
    }
    const lines = fs.readFileSync(srcFile, "utf8").trim().split("\n");

    const header = lines[0].split(",");
    const data = lines.slice(1).map(l => l.split(",").map(s => s.trim().replaceAll('"', "")));

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO tri.user_emails (user_id, email, user_emails.primary, verified, verification_code) VALUES (?, ?, true, true, ?) ON DUPLICATE KEY UPDATE verification_code = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const user = await db.getUserByUsername(row[header.indexOf("username")]);
        if (!user) {
            console.error("User not found: " + row[header.indexOf("username")]);
            process.exit(1);
        }

        const timestamp = new Date().getTime();
        const params = [
            user.id,
            row[header.indexOf("email")],
            `@${timestamp}`,
            `@${timestamp}`,
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        await db.query(query, params);
    }
}
