import bcrypt from "bcryptjs";
import passportLocal from "passport-local";
import {User} from "../models/db/tri/User.js";
import {TriDB} from "./DB/TriDB.js";

const LocalStrategy = passportLocal.Strategy;

export function PassportStrategy(db: TriDB) {
    return new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password"
        },
        async (username: string, password: string, done: (err: Error | null, user?: any, info?: any) => void) => {
            const user = await db.getUserByUsername(username);
            if (!user) {
                return done(null, false, {message: "Incorrect username."});
            }
            if (!bcrypt.compareSync(password, user.password_hash)) {
                return done(null, false, {message: "Incorrect password."});
            }
            return done(null, user);
        }
    )
}

export function PassportSerializeUser() {
    return (user: any, done: (err: Error | null, user?: any, info?: any) => void) => {
        done(null, user.id);
    }
}

export function PassportDeserializeUser(db: TriDB) {
    return async (id: number, done: (err: Error | null, user?: any, info?: any) => void) => {
        const user: PassportUser = await db.getUserById(id) as PassportUser;
        // @ts-ignore
        delete user.password_hash;

        user.mfa_needed = user.mfa_enabled;
        user.mfa_completed = false;

        done(null, user);
    }
}

export interface PassportUser extends User {
    mfa_needed?: boolean,
    mfa_completed?: boolean,
}