import {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";
import {exportToFile} from "@targoninc/data-exporter";
import {CLI} from "@targoninc/ts-logging";

export class QuarterlyReportEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!(await Authenticator.userHasPermission(req.user, Permissions.importData, this.db))) {
            return res.status(403).send("You are not allowed to export a quarterly report.");
        }

        if (!req.body.year || !req.body.quarter) {
            return res.status(400).send("year or quarter is missing");
        }

        const year = parseInt(req.body.year);
        const quarter = Math.max(1, Math.min(4, parseInt(req.body.quarter)));
        CLI.info(`Generating quarterly report for quarter ${quarter} in ${year}`);

        const endMonth = quarter * 3;
        const startMonth = endMonth - 2;

        const startDate = `${year}-${startMonth}-01`;
        let endDate = `${year}-${endMonth + 1}-01`;
        if (endMonth === 12) {
            endDate = `${year + 1}-01-01`;
        }

        function getMonthString(year: number, month: number) {
            const lookup = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthStr = lookup[month];
            return `${monthStr}-${year}`;
        }

        const months = [
            getMonthString(year, startMonth - 1),
            getMonthString(year, startMonth),
            getMonthString(year, startMonth + 1),
        ].map(m => `'${m}'`).join(`,`);

        let artists = await this.db.getArtistsFull();
        artists = artists.filter(a => a.user_id);

        let rows: ReportRow[] = [];
        for (const artist of artists) {
            artist.user = (await this.db.getUserById(artist.user_id!))!;
            if (!artist.user?.legal_name) {
                console.warn(`No legal name for artist ${artist.name}`);
                continue;
            }

            const royalties = await this.db.getRoyaltiesByArtistAndTimeframe(artist.name, months);
            const earnings = royalties * .85;
            const paid = await this.db.getUserPaidAmountByTimeframe(artist.user_id!, startDate, endDate);

            rows.push({
                artist_name: artist.name,
                legal_name: artist.user.legal_name,
                country: artist.user.country,
                amount_royalties: royalties,
                amount_earned: earnings,
                amount_paid: paid,
            });
        }

        const headers = Object.keys(rows[0]);
        const fileData = await exportToFile({
            headings: headers,
            data: rows.map((r: Record<string, any>) => headers.map(h => r[h])),
        }, "csv");

        CLI.success(`Successfully generated quarterly report!`);
        return res.send({
            data: fileData
        });
    }
}

interface ReportRow {
    artist_name: string;
    legal_name: string;
    country: string;
    amount_royalties: number;
    amount_earned: number;
    amount_paid: number;
}