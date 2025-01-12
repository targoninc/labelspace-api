import dbInterface from "mariadb";
import {CLI} from "../CLI.js";
import {env} from "../Environment.js";

export class MariaDB {
    private readonly host: string;
    private readonly port: number;
    private readonly user: string;
    private readonly password: string;
    private readonly database: string;
    connectionPool: dbInterface.Pool | null = null;
    private connection: dbInterface.Connection | null = null;

    constructor(host: string, port: number|null = null, user: string|null = null, password: string|null = null, database = "tri") {
        CLI.debug(`Initializing MariaDB connection to ${host}:${port}/${database}`);
        this.host = host;
        this.port = port || 3306;
        this.user = user || process.env.MARIADB_USER;
        this.password = password || process.env.MARIADB_PASSWORD;
        this.database = database;
        this.connection = null;
        this.connectionPool = null;
    }

    async connect(tryReconnection = true) {
        try {
            this.connectionPool = dbInterface.createPool({
                host: this.host,
                port: this.port,
                user: this.user,
                password: this.password,
                database: this.database,
                connectionLimit: parseInt(env("DB_CONNECTION_LIMIT", "10")),
            });
            this.connection = await this.connectionPool.getConnection();
        } catch (e: any) {
            if (tryReconnection) {
                await this.tryToReConnect();
            } else {
                CLI.debug(e);
                return false;
            }
        }

        if (!this.connection) {
            return false;
        }
        await this.connection.query("SET NAMES utf8mb4");
        CLI.success(`DB connected.`);
        return true;
    }

    async tryToReConnect(reconnectTimeout = 10) {
        let connected = false;
        let tryCount = 0;
        reconnectTimeout *= 1000;

        while (!connected) {
            tryCount++;
            CLI.debug(`Attempting to reconnect to DB... (try ${tryCount})`);

            connected = await this.connect(false);
            if (!connected) {
                CLI.debug(`Failed to connect to DB.`);
            }
            await new Promise((res, rej) => {
                setTimeout(() => {
                    res();
                }, reconnectTimeout);
            });
        }
    }

    async close() {
        await this.connection?.end();
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.connectionPool) {
            CLI.warning("Connecting to database...");
            await this.connect();
        }
        let conn = this.connection;
        if (!conn || !conn.isValid()) {
            CLI.warning("Reconnecting to database because existing connection is invalid...");
            conn = await this.connectionPool!.getConnection();
        }
        try {
            const start = performance.now();
            const out = await conn.query({
                sql,
                bigIntAsNumber: true
            }, params);
            const diff = performance.now() - start;
            if (diff > 100) {
                CLI.debug(`Query took ${diff.toFixed(2)}ms: ${sql}`, {
                    logToDb: true,
                    info: {
                        sql,
                        params
                    }
                });
            }
            return out;
        } catch (e) {
            if (e.toString().includes("ER_CMD_CONNECTION_CLOSED")) {
                CLI.warning("Reconnecting to database...");
                conn = await this.connectionPool!.getConnection();
                return await conn.query({
                    sql,
                    bigIntAsNumber: true
                }, params);
            } else if (e.toString().includes("Can't create database")) {
                return;
            }
            CLI.error(e);
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