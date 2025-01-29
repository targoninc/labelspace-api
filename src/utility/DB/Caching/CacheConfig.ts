export interface CacheConfig {
    type: "redis" | "memcached";
    ttl?: number;  // in seconds
    host?: string;
    port?: number;
    prefix?: string;
    noCacheTables?: string[];
}