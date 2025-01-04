import type {TriDB} from "../src/utility/DB/TriDB.ts";
import * as path from "node:path";
import {importUsers} from "./usersImporter.ts";
import {importEmails} from "./emailsImporter.ts";
import {importArtists} from "./artistsImporter.ts";
import {importCompilations} from "./compilationsImporter.ts";
import {importAlbums} from "./albumsImporter.ts";
import {importPayments} from "./paymentsImporter.ts";

export async function importAll(db: TriDB, srcDir: string) {
    await importUsers(db, path.join(srcDir, "users.csv"));
    await importEmails(db, path.join(srcDir, "emails.csv"));
    await importArtists(db, path.join(srcDir, "artists.csv"));
    await importPayments(db, path.join(srcDir, "payments.csv"));

    await importCompilations(db, path.join(srcDir, "compilations.csv"));
    await importAlbums(db, path.join(srcDir, "albums.csv"));
}
