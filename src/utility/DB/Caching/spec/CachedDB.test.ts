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
    await db.invalidateCache("SELECT 1");
    const result = await db.query("SELECT 1");
    expect(result.metadata).toEqual({
        cached: false
    });
    expect(result.length).toEqual(1);
    const secondResult = await db.query("SELECT 1");
    expect(secondResult.metadata).toEqual({
        cached: true
    });
    expect(secondResult.length).toEqual(1);
})
