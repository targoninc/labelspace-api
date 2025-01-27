import {ICache} from "./ICache.ts";
import {CacheConfig} from "./CacheConfig.ts";
import * as memjs from "memjs";

export class MemcachedCache implements ICache {
    private client: memjs.Client;
    private readonly prefix: string;
    private readonly defaultTtl: number;

    constructor(config: CacheConfig) {
        this.client = memjs.Client.create(`${config.host || 'localhost'}:${config.port || 11211}`);
        this.prefix = config.prefix || 'db:';
        this.defaultTtl = config.ttl || 3600;
    }

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    async get(key: string): Promise<string | null> {
        const {value} = await this.client.get(this.getKey(key));
        return value ? value.toString() : null;
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        await this.client.set(this.getKey(key), value, {expires: ttl || this.defaultTtl});
    }

    async del(key: string): Promise<void> {
        await this.client.delete(this.getKey(key));
    }

    async clear(): Promise<void> {
        await this.client.flush();
    }
}