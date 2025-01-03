import {TriDB} from "../../utility/DB/TriDB.js";
import {User} from "../db/tri/User.js";
import {UserEnricher} from "../enrichers/UserEnricher.js";

export async function enrichUser(db: TriDB, user: User): Promise<User> {
    await UserEnricher.enrichAsync(db, user, {
        badges: true,
        follows: true,
        following: true
    });

    return user;
}

export async function getUser(db: TriDB, userId: number): Promise<User> {
    const baseUser = await db.getUserById(userId);
    return enrichUser(db, baseUser);
}

export async function getUserByUsername(db: TriDB, username: string): Promise<User> {
    const baseUser = await db.getUserByUsername(username);
    return enrichUser(db, baseUser);
}