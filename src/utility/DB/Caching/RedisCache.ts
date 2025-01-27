import {ICache} from "./ICache.ts";
import {CacheConfig} from "./CacheConfig.ts";
import Redis from "ioredis";

export class RedisCache implements ICache {
    private client: Redis;
    private readonly prefix: string;
    private readonly defaultTtl: number;

    constructor(config: CacheConfig) {
        this.client = new Redis({
            host: config.host || 'localhost',
            port: config.port || 6379
        });
        this.prefix = config.prefix || 'db:';
        this.defaultTtl = config.ttl || 3600;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(this.getKey(key));
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