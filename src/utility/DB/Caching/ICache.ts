export interface ICache {
    get(key: string): Promise<string | null>;

    set(key: string, value: string, ttl?: number): Promise<void>;

    del(key: string): Promise<void>;

    delPrefix(prefix: string): Promise<void>;

    clear(): Promise<void>;
}