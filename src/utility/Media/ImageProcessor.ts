import sharp from 'sharp';
import { CLI } from '../CLI.js';
import * as fs from "node:fs";

sharp.cache(false);
sharp.simd(true);

export class ImageProcessor {
    static resizeImage(fileName: string, targetFileName: string, width: number, height: number, callback: Function) {
        sharp(fileName)
            .resize(width, height)
            .toFile(targetFileName)
            .then(() => {
                CLI.debug(`Image resized to ${width}x${height} and saved as ${targetFileName}`);
                callback();
            })
            .catch((err) => {
                CLI.error('Error resizing image: ' + err);
            });
    }

    static async resizeImageAsync(fileName: string, targetFileName: string, width: number, height: number) {
        await sharp(fileName)
            .rotate()
            .resize(width, height)
            .toFile(targetFileName);
    }

    static async getAspectRatio(fileName: string) {
        try {
            const metadata = await sharp(fileName).metadata();
            if (metadata.width && metadata.height) {
                const aspectRatio = metadata.width / metadata.height;
                return {
                    width: metadata.width,
                    height: metadata.height,
                    aspectRatio: aspectRatio
                };
            } else {
                CLI.error('Could not determine the width and height of the image');
                return null;
            }
        } catch (err) {
            CLI.error('Error retrieving image metadata: ' + err);
            return null;
        }
    }

    static async cropToCenter(sourceFile: string, aspectRatio: number, currentDimensions: { width: number, height: number, aspectRatio: number }) {
        const { width, height } = currentDimensions;

        let newWidth: number, newHeight: number;
        if (width / height > aspectRatio) {
            newWidth = Math.round(height * aspectRatio);
            newHeight = height;
        } else {
            newWidth = width;
            newHeight = Math.round(width / aspectRatio);
        }

        const x = Math.round((width - newWidth) / 2);
        const y = Math.round((height - newHeight) / 2);

        const tmpFileName = sourceFile.replace("source.", "source_tmp.");
        try {
            CLI.debug(`Cropping image to center with dimensions ${newWidth}x${newHeight} @ ${x}:${y}`);
            await sharp(sourceFile)
                .rotate()
                .extract({ left: x, top: y, width: newWidth, height: newHeight })
                .toFile(tmpFileName);
            fs.renameSync(tmpFileName, sourceFile);
            CLI.debug(`Image cropped to center with dimensions ${newWidth}x${newHeight} and saved over ${sourceFile}`);
        } catch (err) {
            console.error('Error cropping image: ', err);
        }
    }

    static async resaveImage(sourceFile: string) {
        const tmpFile = sourceFile.replace("source.", "source_tmp.");
        await sharp(sourceFile)
            .rotate()
            .toFile(tmpFile);
        await sharp(tmpFile).toFile(sourceFile);
        fs.unlinkSync(tmpFile);
    }
}