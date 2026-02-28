import {CLI} from "@targoninc/ts-logging";

export function env<T extends string | number | boolean>(
    name: string,
    fallback: T
): T {
    const value = process.env[name];

    if (value === undefined) {
        return fallback;
    }

    const fallbackType = typeof fallback;

    if (fallbackType === 'string') {
        return value as T;
    }

    if (fallbackType === 'number') {
        const parsed = Number(value);
        if (isNaN(parsed)) {
            console.warn(`Invalid number format for environment variable ${name}: ${value}`);
            return fallback;
        }
        return parsed as T;
    }

    if (fallbackType === 'boolean') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1') {
            return true as T;
        }
        if (lower === 'false' || lower === '0') {
            return false as T;
        }
        return fallback;
    }

    return fallback;
}