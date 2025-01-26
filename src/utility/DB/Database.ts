import {possibleUsersettings} from "../../models/enums/PossibleUsersettings.js";
import {TriDB} from "./TriDB.js";
import {ConnectSessionKnexStore} from "connect-session-knex";
import knexConstructor, {Knex} from "knex";
import {env} from "../Environment.js";
import session from "express-session";
import passport from "passport";
import {PassportDeserializeUser, PassportSerializeUser, PassportStrategy} from "../PassportStrategy.js";
import {Permissions} from "../../models/enums/Permissions.js";
import {Application} from "express";
import {CLI} from "../CLI.js";
import {importAll} from "../../importers/importAll.ts";
import {uuidv4} from "uuidv7";

export async function ensureDatabaseConsistency(db: TriDB) {
    await ensurePossibleUsersettings(db);
    await ensurePermissions(db);
    await ensureSessionStore(db);
    await ensurePassKeyUserIds(db);
    await ensureData(db);
}

async function ensurePassKeyUserIds(db: TriDB) {
    CLI.debug("Ensuring passkey user ids");
    const users = await db.getUsers();
    for (const user of users) {
        if (!user.passkey_user_id) {
            const passkeyUserId = uuidv4();
            await db.updateUser(user.id, {
                passkey_user_id: passkeyUserId
            });
        }
    }
}

async function ensureData(db: TriDB) {
    const users = await db.getUsers();
    if (!users || users.length === 0) {
        await importAll(db, process.env.IMPORT_DATA_DIR);
    }
}

async function ensurePossibleUsersettings(db: TriDB) {
    CLI.debug("Ensuring possible user settings");
    const targetKeys = Object.keys(possibleUsersettings);
    const existingValues = await db.getPossibleUserSettings();
    const missingValues = targetKeys.filter(key => !existingValues.some(existingValue => existingValue.name === key));
    if (missingValues.length > 0) {
        for (const value of missingValues) {
            const targetValue = possibleUsersettings[value];
            await db.createPossibleUserSetting(targetValue.name, targetValue.description, targetValue.type);
        }
    }
}

async function ensurePermissions(db: TriDB) {
    CLI.debug("Ensuring permissions");
    const targetValues = Object.values(Permissions);
    const existingValues = await db.getPermissions();
    const missingValues = targetValues.filter(value => !existingValues.some(existingValue => existingValue.name === value));
    if (missingValues.length > 0) {
        for (const value of missingValues) {
            await db.createPermission(value);
        }
    }
}

async function ensureSessionStore(db: TriDB) {
    try {
        await db.query("CREATE SCHEMA sessions");
    } catch (e) {
        // Ignore error if schema already exists
    }
}

export function getSessionStore() {
    return new ConnectSessionKnexStore({
        knex: knexConstructor(<Knex.Config>{
            client: "mysql2",
            connection: {
                host: env('MARIADB_HOST'),
                user: env('MARIADB_USER'),
                password: env('MARIADB_PASSWORD'),
                database: env('MARIADB_SESSION_DB'),
                port: env('MARIADB_PORT'),
                charset: "utf8mb4",
                supportBigNumbers: true,
            },
        }),
        cleanupInterval: 0, // disable session cleanup
    });
}

export function setupPassport(app: Application, db: TriDB) {
    app.use(session({
        secret: env('SESSION_SECRET', ""),
        store: getSessionStore(),
        resave: false,
        saveUninitialized: false,
        cookie: {
            domain: process.env.COOKIE_DOMAIN,
            sameSite: "strict"
        },
    }));
    passport.use(PassportStrategy(db));
    passport.serializeUser(PassportSerializeUser());
    passport.deserializeUser(PassportDeserializeUser(db));
}