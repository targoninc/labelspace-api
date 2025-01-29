import {CachedDB} from "../CachedDB.ts";
import {test, expect} from "bun:test";
import {TriDB} from "../../TriDB.ts";
import {configDotenv} from "dotenv";

configDotenv();

test("gets table names from statement", () => {
    const testSql = `SELECT *
                     FROM users
                              INNER JOIN tests
                     WHERE id = 1`;
    const result = CachedDB.getTableNamesFromStatement(testSql);
    expect(result).toEqual(["users", "tests"]);
});

test("correctly caches record", async () => {
    const db = new TriDB();
    const sql = "SELECT 1";
    await db.invalidateCache(sql);
    const result = await db.query(sql);
    expect(result.metadata.cached).toBeFalse();
    expect(result.length).toEqual(1);
    const secondResult = await db.query(sql);
    expect(secondResult.metadata.cached).toBeTrue();
    expect(secondResult.length).toEqual(1);
})

test("doesn't cache deactivated cache write", async () => {
    const db = new TriDB();
    const sql = "SELECT 1";
    await db.invalidateCache(sql);
    const result = await db.query(sql, [], {
        disableCacheWrite: true
    });
    expect(result.metadata.cached).toBeFalse();
    expect(result.length).toEqual(1);
    const secondResult = await db.query(sql);
    expect(secondResult.metadata.cached).toBeFalse();
    expect(secondResult.length).toEqual(1);
})
