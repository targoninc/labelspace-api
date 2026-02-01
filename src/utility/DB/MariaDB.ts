import dbInterface from "mariadb";
import {CLI} from "@targoninc/ts-logging";
import {env} from "../Environment.js";

export class MariaDB {
    private readonly host: string;
    private readonly port: number;
    private readonly user: string;
    private readonly password: string;
    private readonly database: string;
    private connectionPool: dbInterface.Pool | null = null;
    private maxRetries: number = 3;
    private retryDelay: number = 2000; // ms
    private connectionTimeout: number = 30000; // ms

    constructor(host: string, port: number | null = null, user: string | null = null, password: string | null = null, database = "tri") {
        CLI.debug(`Initializing MariaDB connection to ${host}:${port}/${database}`);
        this.host = host;
        this.port = port || 3306;
        this.user = (user || process.env.MARIADB_USER)!;
        if (!this.user) {
            throw new Error("No MariaDB user specified.");
        }
        this.password = (password || process.env.MARIADB_PASSWORD)!;
        if (!this.password) {
            throw new Error("No MariaDB password specified.");
        }
        this.database = database;
        this.connectionPool = null;
    }

    async initialize(): Promise<boolean> {
        try {
            this.connectionPool = dbInterface.createPool({
                host: this.host,
                port: this.port,
                user: this.user,
                password: this.password,
                database: this.database,
                timezone: 'Z',
                connectionLimit: parseInt(env("DB_CONNECTION_LIMIT", "10")),
                acquireTimeout: this.connectionTimeout,
                connectTimeout: this.connectionTimeout,
                idleTimeout: 60000,
                minimumIdle: 1,
                resetAfterUse: true,
            });

            // Test the connection
            const testConn = await this.connectionPool.getConnection();
            await testConn.query("SET NAMES utf8mb4");
            await testConn.query("SET time_zone = '+00:00'");
            await testConn.release();

            CLI.success(`DB pool initialized and connected.`);
            return true;
        } catch (e: any) {
            CLI.error(`Failed to initialize DB pool: ${e.message}`);
            return false;
        }
    }

    private async getConnectionFromPool(): Promise<dbInterface.Connection> {
        if (!this.connectionPool) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error("Unable to initialize database connection pool.");
            }
        }

        try {
            return await this.connectionPool!.getConnection();
        } catch (e: any) {
            CLI.error(`Failed to get connection from pool: ${e.message}`);
            throw e;
        }
    }

    private async withConnection<T>(operation: (conn: dbInterface.Connection) => Promise<T>): Promise<T> {
        let retries = 0;
        let lastError: any;

        while (retries <= this.maxRetries) {
            let conn: dbInterface.Connection | null = null;

            try {
                const connStart = performance.now();
                conn = await this.getConnectionFromPool();
                const connTime = performance.now() - connStart;

                if (connTime > 200) {
                    CLI.debug(`Connection acquisition took ${connTime.toFixed(2)}ms`);
                }

                return await operation(conn);
            } catch (error: any) {
                lastError = error;

                if (error.code === 'ER_GET_CONNECTION_TIMEOUT' ||
                    error.code === 'ER_CMD_CONNECTION_CLOSED' ||
                    error.code === 'PROTOCOL_CONNECTION_LOST' ||
                    error.toString().includes('Connection timeout')) {

                    retries++;
                    CLI.warning(`Database connection error (${error.code || 'unknown'}). Retry ${retries}/${this.maxRetries}`);

                    // For connection pool issues, try to recreate the pool
                    if (retries > 1) {
                        try {
                            await this.closePool();
                            await this.initialize();
                        } catch (poolError) {
                            CLI.error(`Failed to recreate connection pool: ${poolError}`);
                        }
                    }

                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    // Non-connection related errors, rethrow
                    throw error;
                }
            } finally {
                if (conn) {
                    try {
                        await conn.end();
                    } catch (releaseError) {
                        CLI.debug(`Error releasing connection: ${releaseError}`);
                    }
                }
            }
        }

        throw lastError || new Error("Max connection retries exceeded");
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        // Convert Date objects in params to ISO strings (without T and Z) for MariaDB
        // Also handle ISO strings that might have been passed manually
        const processedParams = params.map(param => {
            if (param instanceof Date) {
                return param.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
            }
            if (typeof param === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(param)) {
                return param.replace('T', ' ').replace(/\.\d+Z$/, '').replace('Z', '');
            }
            return param;
        });

        return this.withConnection(async (conn) => {
            const start = performance.now();
            const result = await conn.query({
                sql,
                bigIntAsNumber: true,
                dateStrings: true
            }, processedParams) as any[];

            const diff = performance.now() - start;
            if (diff > 200) {
                CLI.debug(`Query took ${diff.toFixed(2)}ms: ${sql}`, {
                    logToDb: true,
                    info: {
                        sql,
                        params
                    }
                });
            }

            // Convert date strings to UTC Date objects
            if (result && Array.isArray(result)) {
                for (const row of result) {
                    if (typeof row === 'object' && row !== null) {
                        for (const key in row) {
                            const val = row[key];
                            // MariaDB DATETIME strings are usually YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
                            if (typeof val === 'string' && (
                                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val) ||
                                /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+$/.test(val) ||
                                /^\d{4}-\d{2}-\d{2}$/.test(val) ||
                                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(val)
                            )) {
                                const date = new Date(val.includes(' ') ? val.replace(' ', 'T') + 'Z' : val.includes('T') ? val : val + 'T00:00:00Z');
                                if (!isNaN(date.getTime())) {
                                    row[key] = date;
                                }
                            }
                        }
                    }
                }
            }

            return result as T[];
        });
    }

    async queryFirst(sql: string, params: any[] = []): Promise<any> {
        if (!sql.toLowerCase().includes("limit 1")) {
            sql += " LIMIT 1";
        }
        const rows = await this.query(sql, params);
        return rows && rows.length > 0 ? rows[0] : null;
    }

    async querySingleValue(sql: string, params: any[] = []): Promise<any> {
        const row = await this.queryFirst(sql, params);
        return row ? row[Object.keys(row)[0]] : null;
    }

    async closePool(): Promise<void> {
        if (this.connectionPool) {
            try {
                await this.connectionPool.end();
                this.connectionPool = null;
                CLI.debug("Database connection pool closed");
            } catch (error) {
                CLI.error(`Error closing connection pool: ${error}`);
            }
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.query("SELECT 1");
            return true;
        } catch (error) {
            CLI.error(`Database health check failed: ${error}`);
            return false;
        }
    }
}