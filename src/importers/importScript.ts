import {importAll} from "./importAll.ts";
import {TriDB} from "../utility/DB/TriDB.ts";
import {configDotenv} from "dotenv";

configDotenv();

const db = new TriDB();

const srcDir = "./data";

await importAll(db, srcDir);
