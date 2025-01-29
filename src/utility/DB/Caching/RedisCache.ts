import {ICache} from "./ICache.ts";
import {CacheConfig} from "./CacheConfig.ts";
import Redis from "ioredis";
import {CLI} from "../../CLI.ts";
import {RedisOptions} from "ioredis/built/redis/RedisOptions";

export class RedisCache implements ICache {
    private client: Redis;
    private readonly prefix: string;
    private readonly defaultTtl: number;

    constructor(config: CacheConfig) {
        try {
            CLI.debug("Connecting to Redis", {
                logToDb: false
            });
            this.client = new Redis(<RedisOptions>{
                url: `redis://${config.host ?? "localhost"}:${config.port ?? 6379}`
            });
            CLI.success("Connected to Redis", {
                logToDb: false
            });
            this.prefix = config.prefix || 'db:';
            this.defaultTtl = config.ttl || 3600;
        } catch (e: any) {
            CLI.error(e);
        }
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get(key: string): Promise<string | null> {
        return new Promise((resolve, reject) => {
            this.client.get(this.getKey(key), (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        await this.client.setex(this.getKey(key), ttl || this.defaultTtl, value);
    }

    async del(key: string): Promise<void> {
        await this.client.del(this.getKey(key));
    }

    async clear(): Promise<void> {
        const keys = await this.client.keys(`${this.prefix}*`);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }
}