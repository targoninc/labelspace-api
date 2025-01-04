import { Readable } from 'stream';
import csvParser from 'csv-parser';

export async function readCsvAsync<T>(data: string): Promise<T[]> {
    const results: T[] = [];

    // Create a readable stream from the input string
    const stream = Readable.from([data.split("\n").filter(l => l.length > 0).join("\n")]);

    return new Promise<T[]>((resolve, reject) => {
        stream
            .pipe(csvParser())
            .on('data', (row: Record<string, string>) => {
                const parsedRow: Record<string, string | number> & T = {};

                for (const [key, value] of Object.entries(row)) {
                    const triedNumber = parseFloat(value);
                    parsedRow[key] = !isNaN(triedNumber) ? triedNumber : value;
                }

                results.push(parsedRow as T);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}