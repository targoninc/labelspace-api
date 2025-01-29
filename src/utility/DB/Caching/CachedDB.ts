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
    private readonly config: CacheConfig;

    constructor(cacheConfig: CacheConfig) {
        super(
            env("MARIADB_HOST"),
            parseInt(env("MARIADB_PORT")),
            env("MARIADB_USER"),
            env("MARIADB_PASSWORD"),
            env("MARIADB_NAME")
        );

        this.config = cacheConfig;
        if (cacheConfig.type) {
            this.cache = cacheConfig.type === 'redis'
                ? new RedisCache(cacheConfig)
                : new MemcachedCache(cacheConfig);
            this.cache?.delPrefix("");
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

    private generateCacheKey(tableNames: string[], sql: string, params: any[]): string {
        const tableKey = this.tableKey(tableNames);
        const sqlKey = this.toKey(sql);
        const paramsKey = this.toKey(JSON.stringify(params));
        return `${tableKey}:${sqlKey}:${paramsKey}`;
    }

    private tableKey(tableNames: string[]) {
        return this.toKey(tableNames.join(','));
    }

    private toKey(input: string) {
        return Buffer.from(input).toString('base64');
    }

    public static getTableNamesFromStatement(sql: string): string[] {
        // Define a regex pattern to capture table names after specific keywords
        const regex = /(?:from|join|update|into)\s+([`"]?[\w.]+[`"]?)/gi;
        const tableNames: string[] = [];

        let match: RegExpExecArray | null;
        // Use regex to find all matches in the SQL statement
        while ((match = regex.exec(sql)) !== null) {
            // Push the captured table name (first group) into the tableNames array
            tableNames.push(match[1].replace(/[`"]/g, ""));
        }

        return tableNames;
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        const isCacheable = sql.trim().toLowerCase().startsWith('select');

        const tableNames = CachedDB.getTableNamesFromStatement(sql);
        if (!isCacheable) {
            if (tableNames.length > 0) {
                console.log(`Invalidating cache for ${tableNames.join(',')}`);
                this.cache?.delPrefix(this.tableKey(tableNames));
            }

            const result = super.query<T>(sql, params);
            result.metadata = {
                cached: false
            };
            return result;
        }

        const cacheKey = this.generateCacheKey(tableNames, sql, params);

        try {
            const cached = await this.cache?.get(cacheKey);
            if (cached) {
                CLI.debug(`Cache hit for query: ${sql}`, {
                    logToDb: false
                });
                const result = JSON.parse(cached);
                result.metadata = {
                    cached: true
                };
                return result;
            }
        } catch (error) {
            CLI.error(`Cache error: ${error}`);
        }

        // If not in cache or error, get from database
        const results = await super.query<T>(sql, params);

        // Cache the results if query was successful
        if (results && this.cache && !this.config.noCacheTables?.some(t => sql.includes(t))) {
            try {
                await this.cache.set(cacheKey, JSON.stringify(results), this.queryTimeout);
            } catch (error) {
                CLI.error(`Error setting cache: ${error}`);
            }
        }
        results.metadata = {
            cached: false
        };

        return results;
    }

    async queryFirst<T>(sql: string, params: any[] = []): Promise<T | null> {
        if (!sql.includes("LIMIT 1")) {
            sql += " LIMIT 1";
        }
        const rows = await this.query<T>(sql, params);
        if (rows && rows.length > 0) {
            const result = rows[0];
            result.metadata = rows.metadata;
            return result;
        }
        return null;
    }

    async querySingleValue<T>(sql: string, params: any[] = []): Promise<T | null> {
        const row = await this.queryFirst<any>(sql, params);
        if (row) {
            const result = row[Object.keys(row)[0]];
            result.metadata = row.metadata;
            return result;
        }
        return null;
    }

    // Method to invalidate cache for specific queries
    async invalidateCache(sql: string, params: any[] = []): Promise<void> {
        const tableNames = CachedDB.getTableNamesFromStatement(sql);
        const cacheKey = this.generateCacheKey(tableNames, sql, params);
        await this.cache?.del(cacheKey);
    }

    // Method to clear entire cache
    async clearCache(): Promise<void> {
        await this.cache?.clear();
    }
}