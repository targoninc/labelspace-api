import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {readCsvAsync} from "../../utility/CsvReader.ts";
import {CLI} from "../../utility/CLI.ts";
import type {SymphonicRoyalty} from "./SymphonicRoyalty.ts";
import type {Royalty} from "../../models/db/finance/Royalty.ts";

export class AddDataEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        if (!(await Authenticator.userHasPermission(req.user, Permissions.importData, this.db))) {
            return res.status(403).send("You are not allowed to import data.");
        }

        const csv = req.body.data;
        if (!csv) {
            return res.status(400).send({error: "No CSV data provided"});
        }

        const type = req.body.type;
        if (!type) {
            return res.status(400).send({error: "No type provided"});
        }
        const validTypes = ["royalties"];
        if (!validTypes.includes(type)) {
            return res.status(400).send({error: "Invalid type"});
        }

        try {
            await this.importRoyalties(csv);
        } catch (e) {
            return res.status(500).send({error: `Failed to import data: ${e.message}`});
        }

        return res.status(200).send();
    }

    private async importRoyalties(csv: string) {
        const data = await readCsvAsync<SymphonicRoyalty>(csv);
        if (!data) {
            throw new Error("Failed to read CSV");
        }

        const currentTopId = await this.db.getTopRoyaltyId();
        const period1Key = "Reporting Period";
        const period2Key = "Activity Period";

        for (const row of data) {
            try {
                row[period1Key] = this.mapDate(row[period1Key]);
                row[period2Key] = this.mapDate(row[period2Key]);

                await this.db.insertRoyalty(this.mapRoyalty(row));
            } catch (e) {
                await this.db.deleteRoyaltiesAboveId(currentTopId);
                CLI.error(`Failed to import data: ${e.message}`);
                throw e;
            }
        }
    }

    private mapDate(input: string) {
        const period1Length = input.length;
        return input.substr(0, 1).toUpperCase() +
            input.substr(1, 2).toLowerCase() + "-20" +
            input.substring(period1Length - 2, period1Length);
    }

    private mapRoyalty(row: SymphonicRoyalty): Royalty {
        return <Royalty>{
            period1: row["Reporting Period"],
            type: row["Content Type"],
            royalty: row["Royalty ($US)"],
            label: row["Label"],
            releasename: row["Release Name"], title: "",
            releaseartists: row["Release Artists"],
            upc: row["UPC Code"],
            catalogue: row["Catalogue"],
            tracktitle: row["Track Title"],
            mixver: row["Mix Version"],
            isrc: row["ISRC Code"],
            trackartists: row["Track Artists"],
            provider: row["Provider"],
            period2: row["Activity Period"],
            territory: row["Territory"],
            delivery: row["Delivery"],
            salevoid: row["Sale or Void"],
            count: parseInt(row["Count"]),
            dataprovider: row["Data Provider"],
            updated_at: new Date(row["Updated At"]),
            id: 0
        };
    }
}