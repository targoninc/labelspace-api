import {readdir} from "node:fs/promises";
import {env} from "./Environment.ts";
import {MediaFileType} from "../models/enums/MediaFileType.ts";

export async function migrateAttachments() {
    const dir = env<string>("ARTIST_SPACE_STORAGE_PATH") + `/tridrive-1/${MediaFileType.albumFile}`;
    const existingAttachments = await readdir(dir);
    console.log(`Found ${existingAttachments.length} attachments in storage.`);

    for (const attachment of existingAttachments) {
        console.log(`Migrating attachment: ${attachment}`);
        // do nothing for now
    }
}