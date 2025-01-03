import {exec} from "child_process";
import * as fs from "node:fs";
import {CLI} from "../CLI.js";

export class AudioProcessor {
    /**
     * Gets the loudness data of a file using ffmpeg
     * @param file The file to get the loudness data of
     * @param callback The callback to call with the loudness data
     * @returns {boolean} True if successful, false otherwise
     */
    static getLoudnessData(file: string, callback: Function) {
        try {
            const command = `ffmpeg -i ${file} -af ebur128 -f null /dev/null`;
            CLI.debug("Executing command: " + command);

            const process = exec(command);

            let lines = "";
            process.stdout.on("data", data => {
                lines += data;
            });
            process.stderr.on("data", data => {
                lines += data;
            });
            process.on("close", code => {
                if (code === 0) {
                    CLI.debug(`[${file}] Command finished successfully`);
                    const matches = [...lines.matchAll(/M:\s*(-?\d+\.\d+)/gm)];
                    if (!matches.length) {
                        CLI.info(`[${file}] Could not find any matches in: ${lines.length} lines`);
                        callback(null)
                        return;
                    }
                    CLI.debug(`[${file}] Found ${matches.length} matches`);
                    let data = [];

                    for (const match of matches) {
                        data.push(parseFloat(match[1]));
                    }

                    if (data.length) {
                        CLI.debug(`[${file}] Modifying data...`);
                        const newData = AudioProcessor.modifyLoudnessDataForDB(data);
                        CLI.debug(`[${file}] Returning ${newData.length} loudnesss data points`);
                        callback(newData);
                    } else {
                        CLI.info(`[${file}] Could not find any data`);
                    }
                } else {
                    CLI.error(`[${file}] Command failed with code ` + code);
                }
            });
            process.on("error", error => {
                CLI.error(`[${file}] Command failed with error: ` + error);
            });

            return true;
        } catch (error) {
            CLI.error(error);
            return false;
        }
    }

    static modifyLoudnessDataForDB(data) {
        let reducedData = [];
        const count = 150;
        const min = Math.min(...data);
        const max = Math.max(...data);
        let step = Math.floor(data.length / count);
        for (let i = 0; i < data.length; i += step) {
            if (reducedData.length === count) {
                break;
            }
            let adjustedValue = (data[i] - min) / (max - min);
            adjustedValue = Math.round(adjustedValue * 100) / 100;
            reducedData.push(adjustedValue);
        }
        if (!reducedData) {
            CLI.info("Could not reduce loudness data, using full data");
            reducedData = data;
        }
        return reducedData;
    }

    /**
     * Copies a file with a new bitrate using ffmpeg
     * @param source The source file
     * @param target The target file
     * @param bitrate The new bitrate in kbps
     * @param callback The callback to call when the process is finished
     * @param errorCallback The callback to call when the process runs into an error
     * @returns {boolean} True if successful, false otherwise
     */
    static copyWithNewBitrate(source: string, target: string, bitrate: number, callback: Function, errorCallback: Function): boolean {
        try {
            const isWindows = process.platform === "win32";
            const nullDevice = isWindows ? "nul" : "/dev/null";
            const command = `ffmpeg -probesize 50M -analyzeduration 100M -i ${source} -ab ${bitrate}k ${target} > ${nullDevice} 2> ${nullDevice}`;
            CLI.debug("Executing command: " + command);
            exec(command, () => {
                if (!fs.existsSync(target)) {
                    errorCallback("Target file does not exist");
                } else {
                    callback();
                }
            });
        } catch (error) {
            CLI.error(error);
            return false;
        }
    }

    static getLength(targetFile: string, callback: (length) => Promise<void>) {
        exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${targetFile}`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`ffprobe error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`ffprobe stderr: ${stderr}`);
                return;
            }
            await callback(stdout);
        });
    }
}