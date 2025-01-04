import * as fs from "node:fs";
import {TriDB} from "../src/utility/DB/TriDB.ts";
import {configDotenv} from "dotenv";
import {Password} from "../src/utility/Password.ts";
import bcrypt from "bcryptjs";

configDotenv();
const db = new TriDB();

async function importUsers(db: TriDB, srcFile: string) {
    if (!fs.existsSync(srcFile)) {
        console.error("File not found: " + srcFile);
        process.exit(1);
    }
    const lines = fs.readFileSync(srcFile, "utf8").trim().split("\n");

    const header = lines[0].split(",");
    const data = lines.slice(1).map(l => l.split(",").map(s => s.trim().replaceAll('"', "")));

    console.log("Inserting " + data.length + " rows...");

    const query = "INSERT INTO tri.users (username, legal_name, country, state, password_hash) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?";
    for (let i = 0; i < data.length; i++) {
        const row = data[i];

        const randomPassword = Math.random().toString(36).substring(2, 15);
        const hash = bcrypt.hashSync(randomPassword, 12);
        const params = [
            row[header.indexOf("username")],
            row[header.indexOf("legal_name")],
            row[header.indexOf("country")],
            row[header.indexOf("state")],
            hash,
            hash
        ];

        if (params.some(p => p === undefined)) {
            return;
        }
        console.log(query, params);
        await db.query(query, params);
    }
}

await importUsers(db, "./data/users.csv");
