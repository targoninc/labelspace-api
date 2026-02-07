export async function hashObject(obj: unknown): Promise<string> {
    const normalize = (value: unknown): unknown => {
        if (value === null) return null;
        if (value === undefined) return undefined;
        if (typeof value !== 'object') return value;

        if (Array.isArray(value)) {
            return value.map(normalize);
        }

        const sorted: Record<string, unknown> = {};
        Object.keys(value as object)
            .sort()
            .forEach(key => {
                sorted[key] = normalize((value as Record<string, unknown>)[key]);
            });

        return sorted;
    };

    const normalized = normalize(obj);
    const jsonString = JSON.stringify(normalized);
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
