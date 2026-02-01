import type {TriDB} from "../DB/TriDB.ts";
import {Bandcamp} from "./Bandcamp.ts";
import type {SalesReport} from "./SalesReport.ts";
import {BandcampReportStatus} from "./BandcampReportStatus.ts";
import type {Royalty} from "../../models/db/finance/Royalty.ts";
import type {BandcampSale} from "./BandcampSale.ts";
import type {Track} from "../../models/db/tri/Track.ts";
import {CLI} from "@targoninc/ts-logging";
import {heading, Mail, MailBuilder, paragraph} from "@targoninc/ts-mail";
import {env} from "../Environment.ts";

export class BandcampWorker {
    private readonly db: TriDB;
    private readonly refreshIntervalInMinutes = 60;

    constructor(db: TriDB) {
        this.db = db;
    }

    run() {
        setInterval(async () => {
            await this.getReport();
        }, this.refreshIntervalInMinutes * 60 * 1000);
        this.getReport().then();
    }

    private async getReport() {
        const lastReportDateAsString = (await this.db.getLastBandcampReportTime());
        let lastReportTime = lastReportDateAsString ? new Date(lastReportDateAsString) : new Date(2025, 0, 1);
        const report = await Bandcamp.getSalesReport(lastReportTime, new Date());

        if (report.sales.length === 0) {
            CLI.debug("No sales found", {
                logToDb: true,
                info: {
                    report
                }
            });
            return;
        }

        const existingReport = await this.db.getBandcampReportByJson(report);
        if (existingReport) {
            CLI.debug("Report already processed, skipping", {
                logToDb: true,
                info: {
                    reportId: existingReport.id
                }
            });
            return;
        }

        const id = await this.db.insertBandcampReport(report);
        await this.mapAndInsertReport(id, report);
        return report;
    }

    private async mapAndInsertReport(id: number, report: SalesReport) {
        const sales = report.sales;
        const royalties: Royalty[] = [];

        for (let i = 0; i < sales.length; i++) {
            const sale = sales[i];
            CLI.debug(`Processing sale ${i}/${sales.length}`, {
                logToDb: true,
                info: {
                    sale
                }
            });
            try {
                const royaltiesInner = await this.mapSale(sale);
                royaltiesInner.forEach(r => royalties.push(r));
            } catch (e: any) {
                CLI.error(e);
                await this.db.updateBandcampReportStatus(id, BandcampReportStatus.error);
                this.sendFailureMail(e);
                return;
            }
        }

        for (const r of royalties) {
            if (!r.royalty_external_id) {
                CLI.warning(`No external id for royalty, skipping: ${JSON.stringify(r)}`);
                continue;
            }

            const existing = await this.db.getRoyaltyByExternalId(r.royalty_external_id ?? "");
            if (!existing) {
                await this.db.insertRoyalty(r);
            }
        }

        await this.db.updateBandcampReportStatus(id, BandcampReportStatus.received);
    }

    private async mapSale(sale: BandcampSale): Promise<Royalty[]> {
        const estimatedPaypalFee = 0.01;
        if (sale.upc && sale.upc != "") {
            return await this.mapSaleByUpc(sale, estimatedPaypalFee);
        } else if (sale.isrc && sale.isrc != "") {
            return await this.mapSaleByIsrc(sale, estimatedPaypalFee);
        } else {
            return await this.mapSaleByLinks(sale, estimatedPaypalFee);
        }
    }

    private async mapSaleByUpc(sale: BandcampSale, estimatedPaypalFee: number) {
        const album = await this.db.getAlbumByUpc(sale.upc);
        if (!album) {
            throw new Error("No album found for upc: " + sale.upc);
        }
        const month = this.getMonthFromSale(sale);
        const tracks = await this.db.getTracksByAlbumIds([album.id]);
        const perTrackRoyalty = sale.net_amount / tracks.length;

        return tracks.map(track => {
            return <Royalty>{
                catalogue: sale.catalog_number,
                count: 1,
                dataprovider: "bandcamp-sync",
                delivery: "Download",
                isrc: track.isrc,
                label: "Tri",
                mixver: this.getVersionFromTrack(track),
                period1: month,
                period2: month,
                provider: "Bandcamp",
                releaseartists: album.artists,
                releasename: album.title,
                royalty: perTrackRoyalty * (1 - estimatedPaypalFee),
                salevoid: "Sale",
                territory: sale.country_code,
                title: track.title,
                trackartists: sale.artist,
                type: sale.package,
                upc: album?.upc ?? "",
                royalty_external_id: sale.bandcamp_transaction_id.toString()
            }
        });
    }

    private async mapSaleByIsrc(sale: BandcampSale, estimatedPaypalFee: number) {
        const targetIsrc = sale.isrc.replaceAll("-", "");

        const track = await this.db.getTrackByIsrc(targetIsrc);
        if (!track) {
            throw new Error("No track found for isrc: " + targetIsrc);
        }
        const album = await this.db.getAlbumById(track.album_id ?? 0);
        if (!album) {
            throw new Error("No album found for track: " + track.title);
        }
        const month = this.getMonthFromSale(sale);

        return [<Royalty>{
            catalogue: sale.catalog_number,
            count: 1,
            dataprovider: "bandcamp-sync",
            delivery: "Download",
            isrc: track.isrc,
            label: "Tri",
            mixver: this.getVersionFromTrack(track),
            period1: month,
            period2: month,
            provider: "Bandcamp",
            releaseartists: album.artists,
            releasename: album.title,
            royalty: sale.net_amount * (1 - estimatedPaypalFee),
            salevoid: "Sale",
            territory: sale.country_code,
            title: track.title,
            trackartists: sale.artist,
            type: sale.package,
            upc: album?.upc ?? "",
            royalty_external_id: sale.bandcamp_transaction_id.toString()
        }];
    }

    private async mapSaleByLinks(sale: BandcampSale, estimatedPaypalFee: number): Promise<Royalty[]> {
        const tracks = await this.db.getTracksByBandcampLink(sale.item_url);
        if (tracks.length === 0) {
            throw new Error("No tracks found for item_url: " + sale.item_url);
        }
        const albums = await this.db.getAlbumsByIds(tracks.map(t => t.album_id));
        const perTrackRoyalty = sale.net_amount / tracks.length;

        return tracks.map(t => {
            let version = this.getVersionFromTrack(t);
            const month = this.getMonthFromSale(sale);
            const album = albums.find(a => a.id === t.album_id);
            if (!album) {
                throw new Error("No album found for track: " + t.title);
            }

            return <Royalty>{
                catalogue: sale.catalog_number,
                count: 1,
                dataprovider: "bandcamp-sync",
                delivery: "Download",
                isrc: t.isrc,
                label: "Tri",
                mixver: version,
                period1: month,
                period2: month,
                provider: "Bandcamp",
                releaseartists: album.artists,
                releasename: album.title,
                royalty: perTrackRoyalty * (1 - estimatedPaypalFee),
                salevoid: "Sale",
                territory: sale.country_code,
                title: t.title,
                trackartists: t.artists,
                type: sale.package,
                upc: album?.upc ?? "",
                royalty_external_id: sale.bandcamp_transaction_id.toString()
            };
        });
    }

    private getMonthFromSale(sale: BandcampSale) {
        const date = new Date(sale.date);
        return date.toLocaleString("en-US", {
            month: "short",
            year: "numeric"
        });
    }

    private getVersionFromTrack(t: Track) {
        let version = "";
        if (t.title.includes("(")) {
            const withinParenthesis = t.title.substring(t.title.indexOf("(") + 1, t.title.indexOf(")"));
            if (!withinParenthesis.includes("feat") && !withinParenthesis.includes("ft")) {
                version = withinParenthesis;
            }
        }
        return version;
    }

    private sendFailureMail(e: any) {
        const mail = MailBuilder.default("https://artists.trirecords.eu/images/LOGO128.png")
            .subject("Bandcamp Sync failed")
            .heading("Bandcamp Sync failed")
            .card([
                paragraph(e.toString()),
            ])
            .get();

        const mails = env("SUBMISSION_MAILS", "").split(",");
        for (const address of mails) {
            Mail.sendDefault(address, mail);
        }
    }
}

