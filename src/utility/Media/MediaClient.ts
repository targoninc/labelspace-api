import {TriDB} from "../DB/TriDB.js";
import {FileStorage} from "../Storage/FileStorage.js";
import {MediaFileType} from "../../models/enums/MediaFileType.js";
import {User} from "../../models/db/tri/User.js";
import {CLI} from "../CLI.js";
import {AudioProcessor} from "./AudioProcessor.js";
import {ImageProcessor} from "./ImageProcessor.js";
import * as fs from "node:fs";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

const storage = new FileStorage();

export class MediaClient {
    static async validateMedia(db: TriDB, type: MediaFileType, referenceId: number, fileName: string,
                               requestingUser: User, file: Express.Multer.File) {
        switch (type) {
            case MediaFileType.audio:
                const track = await db.getTrackById(referenceId);
                if (!track) {
                    return {
                        code: 404,
                        error: "Track not found."
                    };
                }

                if (!await Authenticator.userHasPermission(requestingUser, Permissions.releaseManagement, db)) {
                    return {
                        code: 403,
                        error: "You do not have permission to upload this file."
                    };
                }

                const allowedExtensions = ["mp3", "m4a", "flac", "ogg", "wav", "webm"];
                const originalExtension = file.originalname.split(".").pop()?.replace("/", "") ?? ".unknown";
                if (!allowedExtensions.includes(originalExtension)) {
                    return {
                        code: 403,
                        error: "Invalid file type. Must be one of " + allowedExtensions.join(", ")
                    };
                }
                break;
            case MediaFileType.artistLogo:
                const artist = await db.getArtistById(referenceId);
                if (!artist) {
                    return {
                        code: 404,
                        error: "Artist not found."
                    };
                }

                const userArtists = await db.getUserArtists(requestingUser.id);
                if (!userArtists.some(a => a.id === artist.id)) {
                    return {
                        code: 403,
                        error: "You do not have permission to upload this logo."
                    };
                }

                break;
            default:
                break;
        }

        return null;
    }

    static async uploadMedia(db: TriDB, type: MediaFileType, referenceId: number, fileName: string, file: Express.Multer.File) {
        await MediaClient.deleteMediaForEntity(db, type, referenceId);
        CLI.debug("Uploading media...");
        const blob = file.buffer;
        await storage.save(type, referenceId, fileName, blob);
        CLI.success("Media uploaded");
        await MediaClient.finalizeUpload(db, type, referenceId, fileName);
        return null;
    }

    static async addMedia(db: TriDB, type: MediaFileType, referenceId: number, fileName: string, sourceFilePath: string) {
        await MediaClient.deleteMediaForEntity(db, type, referenceId);
        CLI.debug("Adding media...");
        const blob = fs.readFileSync(sourceFilePath);
        await storage.save(type, referenceId, fileName, blob);
        CLI.success("Media added");
        await MediaClient.finalizeUpload(db, type, referenceId, fileName);
        return null;
    }

    static async finalizeUpload(db: TriDB, type: MediaFileType, referenceId: number, fileName: string) {
        const sourceFile = FileStorage.filePath(type, referenceId, fileName);

        if (type === MediaFileType.audio) {
            await MediaClient.postProcessAudio(referenceId, type, db, sourceFile);
        } else if (type === MediaFileType.file) {
            return;
        } else if (MediaClient.isImageType(type)) {
            await MediaClient.postProcessImage(referenceId, type, db, sourceFile);
        }
    }

    private static async postProcessImage(referenceId: number,
                                          type: MediaFileType.trackCover | MediaFileType.albumCover | MediaFileType.artistLogo,
                                          db: TriDB, sourceFile: string) {
        const defaultImageExtension = "webp";
        CLI.debug(sourceFile);
        let dimensions = await ImageProcessor.getAspectRatio(sourceFile);
        if (!dimensions) {
            throw new Error("Could not determine aspect ratio of image.");
        }

        const maxSize = 4192;
        if (Math.max(dimensions.width, dimensions.height) > maxSize) {
            CLI.debug(`Image is too large. Resizing to ${maxSize}px.`);
            const tempFileName = sourceFile.replace("source.", "source_tmp.");
            fs.renameSync(sourceFile, tempFileName);
            const scalingFactor = maxSize / Math.max(dimensions.width, dimensions.height);
            await ImageProcessor.resizeImageAsync(tempFileName, sourceFile, Math.floor(dimensions.width * scalingFactor), Math.floor(dimensions.height * scalingFactor));
            fs.unlinkSync(tempFileName);
            dimensions = await ImageProcessor.getAspectRatio(sourceFile);
            if (!dimensions) {
                throw new Error("Could not determine aspect ratio of image.");
            }
        }

        const isSquareType = MediaClient.isSquareType(type);
        if (isSquareType && dimensions.aspectRatio !== 1) {
            await ImageProcessor.cropToCenter(sourceFile, 1, dimensions);
        }
        const heights = [50, 100, 500];
        let widths = [50, 100, 500];

        const promise = new Promise<void>((resolve, reject) => {
            let done = 0;
            const updateProgress = () => {
                done++;
                if (done === heights.length) {
                    resolve();
                }
            }

            for (let i = 0; i < heights.length; i++) {
                const height = heights[i];
                const targetFilePath = FileStorage.filePath(type, referenceId, `${height}.${defaultImageExtension}`);
                ImageProcessor.resizeImage(sourceFile, targetFilePath, widths[i], height, updateProgress);
            }
        });

        await promise;
        const hasImage = true;
        await MediaClient.setImageToggleInDb(type, db, referenceId, hasImage);
        CLI.success(`Image upload for ID ${referenceId} finalized`);
    }

    private static async setImageToggleInDb(type: MediaFileType, db: TriDB, referenceId: number, hasImage: boolean) {
        switch (type) {
            case MediaFileType.trackCover:
                await db.setTrackHasCover(referenceId, hasImage);
                break;
            case MediaFileType.albumCover:
                await db.setAlbumHasCover(referenceId, hasImage);
                break;
            case MediaFileType.artistLogo:
                await db.setArtistHasLogo(referenceId, hasImage);
                break;
        }
    }

    private static async postProcessAudio(referenceId: number, type: MediaFileType.audio, db: TriDB, sourceFile: string) {
        CLI.debug(`Finalizing audio upload for ID ${referenceId}...`);
        const targetFormat = "mp3";
        const targetFileHQ = FileStorage.filePath(type, referenceId, `hq.${targetFormat}`);
        const targetFileMQ = FileStorage.filePath(type, referenceId, `mq.${targetFormat}`);
        const targetFileLQ = FileStorage.filePath(type, referenceId, `lq.${targetFormat}`);

        const promise = new Promise<void>((resolve, reject) => {
            let done = 0;
            const updateProgress = () => {
                done++;
                if (done === 3) {
                    CLI.debug(`Analyzing ${targetFileHQ}...`);
                    AudioProcessor.getLength(targetFileHQ, async length => {
                        await db.setTrackLength(referenceId, length);
                    });

                    AudioProcessor.getLoudnessData(targetFileHQ, async data => {
                        await db.setTrackLoudnessData(referenceId, JSON.stringify(data));

                        resolve();
                    });
                }
            }
            const error = (err: Error) => {
                reject(err);
            }

            CLI.debug(`Copying ${sourceFile} to ${targetFileHQ}...`);
            AudioProcessor.copyWithNewBitrate(sourceFile, targetFileHQ, 320, updateProgress, error);
            CLI.debug(`Copying ${sourceFile} to ${targetFileMQ}...`);
            AudioProcessor.copyWithNewBitrate(sourceFile, targetFileMQ, 128, updateProgress, error);
            CLI.debug(`Copying ${sourceFile} to ${targetFileLQ}...`);
            AudioProcessor.copyWithNewBitrate(sourceFile, targetFileLQ, 92, updateProgress, error);

            CLI.success(`Audio upload for ID ${referenceId} finalized`);
        });

        await promise;
        await db.setTrackProcessed(referenceId);
    }

    static isImageType(type: MediaFileType) {
        const types = [
            MediaFileType.trackCover,
            MediaFileType.albumCover,
            MediaFileType.artistLogo,
        ];
        return types.includes(type);
    }

    static isSquareType(type: MediaFileType) {
        const types = [
            MediaFileType.trackCover,
            MediaFileType.artistLogo,
            MediaFileType.albumCover,
        ];
        return types.includes(type);
    }

    static async deleteMediaForEntity(db: TriDB, type: MediaFileType, referenceId: number) {
        CLI.debug("Deleting media...");
        await storage.deleteEntity(type, referenceId);

        const hasImage = false;
        await MediaClient.setImageToggleInDb(type, db, referenceId, hasImage);
        CLI.success("Media deleted");
        return null;
    }
}