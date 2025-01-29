import {CachedDB} from "../CachedDB.ts";
import {test, expect} from "bun:test";

test("gets table names from statement", () => {
    const testSql = `SELECT *
                     FROM users
                              INNER JOIN tests
                     WHERE id = 1`;
    const result = CachedDB.getTableNamesFromStatement(testSql);
    expect(result).toEqual(["users", "tests"]);
})