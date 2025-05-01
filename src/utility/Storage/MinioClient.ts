import * as Minio from 'minio'
import {BucketItem} from "minio";
import {CLI} from "@targoninc/ts-logging";

export class MinioClient {
    private client: Minio.Client;

    constructor() {
        this.client = new Minio.Client({
            endPoint: process.env.MINIO_HOST,
            port: parseInt(process.env.MINIO_PORT ?? "9000"),
            useSSL: true,
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }

    async getObjectAsStream(bucket: string, file: string, offset: number = 0, length: number = undefined) {
        return await this.client.getPartialObject(bucket, file, offset, length);
    }

    async getObjectAsBuffer(bucket: string, file: string, offset: number = 0, length: number = undefined) {
        const stream = await this.client.getPartialObject(bucket, file, offset, length);
        let data = Buffer.alloc(0);
        stream.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
        });
        return data;
    }

    async uploadBuffer(bucket: string, file: string, buffer: Buffer) {
        return await this.client.putObject(bucket, file, buffer);
    }

    async getAllObjectsWithPrefix(bucket: string, prefix: string): Promise<BucketItem[]> {
        return await new Promise((resolve, reject) => {
            const objectsListTemp = [];
            const stream = this.client.listObjectsV2(bucket, prefix);

            stream.on('data', obj => objectsListTemp.push(obj));
            stream.on('error', reject);
            stream.on('end', () => {
                resolve(objectsListTemp);
            });
        });
    }
}