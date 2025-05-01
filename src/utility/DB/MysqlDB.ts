import mysql from 'mysql2/promise';
import {Connection} from "mysql2";
import {CLI} from "@targoninc/ts-logging";

export class MysqlDB {
    private readonly host: string;
    private readonly port: number;
    private readonly user: string;
    private readonly password: string;
    private readonly database: string;
    private connection: Connection;

    constructor(host, port = null, user = null, password = null, database = "tri") {
        this.host = host;
        this.port = port || 3306;
        this.user = user || process.env.MARIADB_USER;
        this.password = password || process.env.MARIADB_PASSWORD;
        this.database = database;
    }

    async connect() {
        this.connection = await mysql.createConnection({
            host: this.host,
            port: this.port,
            user: this.user,
            password: this.password,
            database: this.database
        });
        CLI.success(`DB connected.`);
    }

    async close() {
        await this.connection.end();
    }

    async query(sql, params) {
        if (!this.connection) {
            await this.connect();
        }
        try {
            const [rows] = await this.connection.execute(sql, params);
            return rows;
        } catch (e) {
            if (e.toString().includes("connection is in closed state")) {
                CLI.warning("Reconnecting to database...");
                await this.connect();
                const [rows] = await this.connection.execute(sql, params);
                return rows;
            } else {
                throw e;
            }
        }
    }

    async queryFirst(sql, params = []): Promise<any> {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    async querySingleValue(sql, params = []): Promise<any> {
        const row = await this.queryFirst(sql, params);
        return row ? row[Object.keys(row)[0]] : null;
    }
}