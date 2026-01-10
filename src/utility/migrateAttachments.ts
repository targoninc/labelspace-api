import {readdir} from "node:fs/promises";
import {env} from "./Environment.ts";
import {MediaFileType} from "../models/enums/MediaFileType.ts";
import {TriDB} from "./DB/TriDB.ts";
import * as fs from "node:fs";

export async function migrateAttachments(db: TriDB) {
    const dir = env<string>("ARTIST_SPACE_STORAGE_PATH") + `/tridrive-1/${MediaFileType.albumFile}`;
    const tmpDir = env<string>("ARTIST_SPACE_STORAGE_PATH") + `/tmp/${MediaFileType.albumFile}/migration`;
    const existingAttachments = await readdir(dir);
    console.log(`Found ${existingAttachments.length} attachments in storage.`);

    for (const albumIdStr of existingAttachments) {
        console.log(`Migrating album: ${albumIdStr}`);
        const albumId = parseInt(albumIdStr);
        const album = await db.getAlbumById(albumId);
        if (!album) {
            console.log(`  - Album not found, skipping.`);
            continue;
        }

        const filesInDir = await readdir(`${dir}/${albumIdStr}`);
        if (filesInDir.length !== 0) {
            console.log(`  - No matching count of files found (${filesInDir.length}), skipping.`);
            continue;
        }

        const file = filesInDir[0];
        const attachmentId = await db.createAlbumAttachment(albumId, file);
        console.log(`  - Created attachment with ID: ${attachmentId}`);

        const oldPath = `${dir}/${albumIdStr}`;
        const newPath = `${tmpDir}/${attachmentId}`;

        // Move files to new location
        await fs.promises.mkdir(tmpDir, { recursive: true });
        await fs.promises.rename(oldPath, newPath);
    }

    const newAttachmentDirs = await readdir(tmpDir);
    for (const newDir of newAttachmentDirs) {
        const oldPath = `${tmpDir}/${newDir}`;
        const newPath = `${dir}/${newDir}`;
        console.log(`Moving attachment to final location: ${newDir}`);

        await fs.promises.rename(oldPath, newPath);
    }

    console.log("Migration completed.");
}