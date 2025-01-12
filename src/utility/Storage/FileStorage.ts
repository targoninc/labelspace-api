import {mkdir, readdir, rm} from "node:fs/promises";
import {MediaFileType} from "../../models/enums/MediaFileType.js";
import type {IStorage} from "./IStorage.js";
import * as Bun from "bun";
import {CLI} from "../CLI.js";

const STORAGE_DRIVES = 1;
const DEFAULT_BASE_PATH = "mock/storage";
let BASE_PATH = process.env.ARTIST_SPACE_STORAGE_PATH || DEFAULT_BASE_PATH;

async function checkAndSetBasePath() {
    try {
        const rootDirs = await readdir("/", {withFileTypes: true});
        const mntExists = rootDirs.some(dirent => dirent.name === "mnt");
        if (!mntExists) {
            return;
        }

        const mntDirectories = await readdir("/mnt", {withFileTypes: true});
        const anyMountExists = mntDirectories.some(dirent => dirent.isDirectory());

        if (anyMountExists) {
            BASE_PATH = "/mnt";
        }
    } catch (error) {
        console.error("Error accessing /mnt:", error);
    }
}

await checkAndSetBasePath();
CLI.debug(`Using base path for storage: ${BASE_PATH}`);

if (BASE_PATH === DEFAULT_BASE_PATH) {
    await mkdir(BASE_PATH, {recursive: true, mode: "0700"});
}

export class FileStorage implements IStorage {
    private static drive(driveId: number) {
        return `${BASE_PATH}/lydrive-${driveId}`;
    }

    private static selectDriveById(fileType: MediaFileType, entityId: number) {
        if (STORAGE_DRIVES === 1) {
            return 1;
        }

        return 1;
    }

    private static entityPath(fileType: MediaFileType, entityId: number) {
        return FileStorage.drive(FileStorage.selectDriveById(fileType, entityId)) + "/" + fileType + "/" + entityId;
    }

    static filePath(fileType: MediaFileType, entityId: number, fileName: string = "") {
        return FileStorage.entityPath(fileType, entityId) + "/" + fileName;
    }

    async deleteEntity(fileType: MediaFileType, entityId: number) {
        const entityPath = FileStorage.entityPath(fileType, entityId);

        await rm(entityPath, {recursive: true, force: true});
    }

    async save(fileType: MediaFileType, entityId: number, fileName: string = "", data: Buffer) {
        const entityPath = FileStorage.entityPath(fileType, entityId);
        const filePath = FileStorage.filePath(fileType, entityId, fileName);

        await mkdir(entityPath, {recursive: true});
        await Bun.write(filePath, data);
    }

    async getEntityFiles(fileType: MediaFileType, entityId: number) {
        const entityPath = FileStorage.entityPath(fileType, entityId);
        const files = await readdir(entityPath);
        return files.filter(file => file !== "." && file !== "..");
    }
}