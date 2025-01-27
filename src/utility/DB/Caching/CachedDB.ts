import {MariaDB} from "../MariaDB.ts";
import {env} from "../../Environment.ts";
import {CLI} from "../../CLI.ts";
import {ICache} from "./ICache.ts";
import {CacheConfig} from "./CacheConfig.ts";
import {RedisCache} from "./RedisCache.ts";
import {MemcachedCache} from "./MemcachedCache.ts";

export class CachedDB extends MariaDB {
    private readonly cache: ICache|undefined;
    private readonly queryTimeout: number;

    constructor(cacheConfig: CacheConfig) {
        super(
            env("MARIADB_HOST"),
            parseInt(env("MARIADB_PORT")),
            env("MARIADB_USER"),
            env("MARIADB_PASSWORD"),
            env("MARIADB_NAME")
        );

        if (cacheConfig.type) {
            this.cache = cacheConfig.type === 'redis'
                ? new RedisCache(cacheConfig)
                : new MemcachedCache(cacheConfig);
        }

        this.queryTimeout = parseInt(env("QUERY_CACHE_TTL", "3600"));

        // Keep the database connection alive
        setInterval(() => {
            CLI.debug("Pinging database", {
                logToDb: false
            });
            this.query("SELECT 1").then();
        }, 1000 * 60 * 5);
    }

    private generateCacheKey(sql: string, params: any[]): string {
        return Buffer.from(`${sql}:${JSON.stringify(params)}`).toString('base64');
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        const isCacheable = sql.trim().toLowerCase().startsWith('select');

        if (!isCacheable) {
            return super.query<T>(sql, params);
        }

        const cacheKey = this.generateCacheKey(sql, params);

        try {
            // Try to get from cache
            const cached = await this.cache?.get(cacheKey);
            if (cached) {
                CLI.debug(`Cache hit for query: ${sql}`);
                return JSON.parse(cached);
            }
        } catch (error) {
            CLI.error(`Cache error: ${error}`);
        }

        // If not in cache or error, get from database
        const results = await super.query<T>(sql, params);

        // Cache the results if query was successful
        if (results && this.cache) {
            try {
                await this.cache.set(cacheKey, JSON.stringify(results), this.queryTimeout);
            } catch (error) {
                CLI.error(`Error setting cache: ${error}`);
            }
        }

        return results;
    }

    async queryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
        if (!sql.includes("LIMIT 1")) {
            sql += " LIMIT 1";
        }
        const rows = await this.query<T>(sql, params);
        return rows && rows.length > 0 ? rows[0] : null;
    }

    async querySingleValue<T>(sql: string, params: any[] = []): Promise<T | null> {
        const row = await this.queryFirst<any>(sql, params);
        return row ? row[Object.keys(row)[0]] : null;
    }

    // Method to invalidate cache for specific queries
    async invalidateCache(sql: string, params: any[] = []): Promise<void> {
        const cacheKey = this.generateCacheKey(sql, params);
        await this.cache?.del(cacheKey);
    }

    // Method to clear entire cache
    async clearCache(): Promise<void> {
        await this.cache?.clear();
    }
}