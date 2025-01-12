import {Bandcamp} from "./Bandcamp.ts";
import * as fs from "node:fs";

const json = await Bandcamp.getSalesReport(new Date(2024, 0, 1));
fs.writeFileSync("salesReport.json", JSON.stringify(json));
