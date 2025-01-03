import {TriDB} from "./DB/TriDB.js";
import {uuidv7 } from "uuidv7";
import {LogLevel} from "../models/enums/LogLevel.js";
import {IP} from "./IP.js";

let dbLoggingConfigured = false;
let loggingDb: TriDB | null = null;

export function stack() {
    // @ts-ignore
    return (new Error()).stack.split("\n").slice(3).join("\n");
}

export function configureDBLogging(db: TriDB) {
    if (dbLoggingConfigured) {
        return;
    }
    dbLoggingConfigured = true;
    loggingDb = db;
}

export interface LogConfig {
    newLine?: boolean;
    logToDb?: boolean;
    info?: Record<string, any>;
}

export class CLI {
    static withColor(text: string, color: number, newLine = true) {
        process.stdout.write(`\x1b[${color}m${text}\x1b[0m${newLine ? "\n" : ""}`);
    }

    static logToDb(logLevel: number, message: string, info?: Record<string, any>) {
        if (dbLoggingConfigured && loggingDb) {
            loggingDb.log(logLevel, message, stack(), uuidv7(), process.env.HOSTNAME ?? IP.getOwn() ?? "unknown", info ?? {});
        }
    }

    static error(text: string | Error, config: LogConfig = {}) {
        this.withColor(text.toString(), 31, config.newLine);
        if (config.logToDb === false) {
            return;
        }
        this.logToDb(LogLevel.error, text.constructor === Error ? text.message : text.toString(), config.info);
    }

    static warning(text: string, config: LogConfig = {}) {
        this.withColor(text, 33, config.newLine);
        if (config.logToDb === false) {
            return;
        }
        this.logToDb(LogLevel.warning, text, config.info);
    }

    static info(text: string, config: LogConfig = {}) {
        this.withColor(text, 36, config.newLine);
        if (config.logToDb === false) {
            return;
        }
        this.logToDb(LogLevel.info, text, config.info);
    }

    static success(text: string, config: LogConfig = {}) {
        this.withColor(text, 32, config.newLine);
        if (config.logToDb) {
            this.logToDb(LogLevel.success, text, config.info);
        }
    }

    static debug(text: string, config: LogConfig = {}) {
        this.withColor(text, 35, config.newLine);
        if (config.logToDb) {
            this.logToDb(LogLevel.debug, text, config.info);
        }
    }

    static write(text: string, newLine = true) {
        process.stdout.write(text + (newLine ? "\n" : ""));
    }

    static rewrite(text: string) {
        // @ts-ignore
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(text);
    }

    static trace(toLog: any) {
        CLI.object(toLog);
        // @ts-ignore
        const stack = new Error().stack
            .split("\n")
            .slice(2)
            .join("\n");
        CLI.debug(stack);
    }

    static object(obj: any) {
        CLI.debug(JSON.stringify(obj, null, 4));
    }
}
