import dbInterface from "mariadb";
import {CLI} from "../CLI.js";
import {env} from "../Environment.js";

export class MariaDB {
    private readonly host: string;
    private readonly port: number;
    private readonly user: string;
    private readonly password: string;
    private readonly database: string;
    private readonly connectionPool: dbInterface.Pool;

    constructor(host: string, port: number|null = null, user: string|null = null, password: string|null = null, database = "tri") {
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
        this.connectionPool = dbInterface.createPool({
            host: this.host,
            port: this.port,
            user: this.user,
            password: this.password,
            database: this.database,
            connectionLimit: parseInt(env("DB_CONNECTION_LIMIT", "10")),
        });
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        try {
            const start = performance.now();
            const out = await this.connectionPool.query({
                sql,
                bigIntAsNumber: true
            }, params);
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
            return out as T[];
        } catch (e: any) {
            if (e.toString().includes("Can't create database")) {
                return [];
            } else {
                CLI.error(e);
                return [];
            }
        }
    }

    async queryFirst(sql: string, params: any[] = []): Promise<any> {
        if (!sql.includes("LIMIT 1")) {
            sql += " LIMIT 1";
        }
        const rows = await this.query(sql, params);
        return rows && rows.length > 0 ? rows[0] : null;
    }

    async querySingleValue(sql: string, params: any[] = []): Promise<any> {
        const row = await this.queryFirst(sql, params);
        return row ? row[Object.keys(row)[0]] : null;
    }
}