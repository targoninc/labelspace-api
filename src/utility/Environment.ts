export function env<T>(name: string, fallback: T = undefined): T {
    return process.env[name] as unknown as T ?? fallback;
}