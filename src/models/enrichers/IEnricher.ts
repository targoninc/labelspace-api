export async function enrichIfAsync<T>(configProperty: boolean | undefined, enrichmentFunction: () => Promise<T>, defaultValue: T): Promise<T> {
    if (!configProperty) {
        return defaultValue;
    }

    return await enrichmentFunction() as T;
}

export abstract class IEnricher {
    static enrich<T = any>(db, base, config): T {
        throw new Error("Method not implemented.");
    }

    static async enrichAsync<T = any>(db, base, config): Promise<T> {
        throw new Error("Method not implemented.");
    }

    static enrichMany<T = any>(db, base, config): T[] {
        throw new Error("Method not implemented.");
    }

    static async enrichManyAsync<T = any>(db, base, config): Promise<T[]> {
        throw new Error("Method not implemented.");
    }
}