import {env} from "../Environment.js";
import {Album} from "../../models/db/tri/Album.js";
import {User} from "../../models/db/tri/User.js";
import {PossibleUsersetting} from "../../models/db/tri/PossibleUsersetting.js";
import {Usersetting} from "../../models/db/tri/Usersetting.js";
import {Track} from "../../models/db/tri/Track.js";
import {UserPermission} from "../../models/db/tri/UserPermission.js";
import {AlbumTrack} from "../../models/db/tri/AlbumTrack.js";
import {Permission} from "../../models/db/tri/Permission.js";
import {Permissions} from "../../models/enums/Permissions.js";
import {MariaDB} from "./MariaDB.js";
import {UpdateTrackRequest} from "../../models/interfaces/UpdateTrackRequest.js";
import {CLI} from "../CLI.js";
import {LogLevel} from "../../models/enums/LogLevel.js";
import {Log} from "../../models/db/tri/Log.js";
import {SearchTableConfiguration} from "../Search/SearchTableConfiguration.js";
import {SearchRequest} from "../../models/interfaces/SearchRequest.js";
import {SearchMode} from "../Search/SearchMode.js";
import {UserEmail} from "../../models/db/tri/UserEmail.js";
import {Statistic} from "../../models/interfaces/Statistic.js";
import type {Payment} from "../../models/db/finance/Payment.ts";
import {PaymentStatus} from "../../models/enums/PaymentStatus.ts";
import type {PaypalPayoutItem} from "../Paypal/models/PaypalPayoutItem.ts";
import type {PaypalBatchStatus} from "../Paypal/models/PaypalBatchStatus.ts";
import type {Royalty} from "../../models/db/finance/Royalty.ts";
import type {PaypalWebhook} from "../Paypal/internalModels/PaypalWebhook.ts";
import type {SalesReport} from "../Bandcamp/SalesReport.ts";
import type {BandcampReportStatus} from "../Bandcamp/BandcampReportStatus.ts";
import { Artist } from "../../models/db/tri/Artist.ts";
import { PaypalBatchPayment } from "../../models/db/finance/PaypalBatchPayment.ts";

export class TriDB extends MariaDB {
    private lastLogCleanup: number = 0;

    constructor() {
        super(env("MARIADB_HOST"), parseInt(env("MARIADB_PORT")), env("MARIADB_USER"), env("MARIADB_PASSWORD"), env("MARIADB_NAME"));

        setInterval(() => {
            CLI.debug("Pinging database", {
                logToDb: false
            });
            this.query("SELECT 1").then();
        }, 1000 * 60 * 5);
    }

    async getAlbumsByUserId(userId: number): Promise<Album[]> {
        return await this.query("SELECT * FROM tri.albums WHERE user_id = ?", [userId]);
    }

    async getUserById(userId: number, followingId: number = -1): Promise<User> {
        const user = await this.queryFirst("SELECT * FROM tri.users WHERE id = ?", [userId]);
        return user;
    }

    async getUserByEmail(email: string): Promise<User> {
        return await this.queryFirst("SELECT u.* FROM tri.users u INNER JOIN tri.user_emails ue ON u.id = ue.user_id WHERE ue.email = ?", [email]);
    }

    async getUserByUsername(username: string): Promise<User> {
        return await this.queryFirst("SELECT * FROM tri.users WHERE username = ?", [username]);
    }

    async updateUser(userId: number, updateObject: Partial<User>): Promise<void> {
        let query = "UPDATE tri.users SET ";
        const updates = []
        for (const key in updateObject) {
            updates.push(`${key} = ?`);
        }
        query += updates.join(", ");
        query += ` WHERE id = ?`;
        await this.query(query, [
            ...Object.values(updateObject),
            userId,
            userId
        ]);
    }

    async getPossibleUserSettings(): Promise<PossibleUsersetting[]> {
        return await this.query("SELECT * FROM tri.possible_usersettings");
    }

    async getUserSettings(userId: number): Promise<Usersetting[]> {
        return await this.query("SELECT * FROM tri.user_settings WHERE user_id = ?", [userId]);
    }

    async getTrackById(id: number): Promise<Track> {
        return await this.queryFirst("SELECT * FROM tri.tracks WHERE id = ?", [id]);
    }

    async getUsersByIds(userIds: number[]): Promise<User[]> {
        if (userIds.length === 0) {
            return [];
        }
        return await this.query("SELECT * FROM tri.users WHERE id IN (?)", [userIds]);
    }

    async getTracksByIds(numbers: number[]): Promise<Track[]> {
        if (numbers.length === 0) {
            return [];
        }
        return await this.query("SELECT * FROM tri.tracks WHERE id IN (?)", [numbers]);
    }

    async createTrack(track: Partial<Track>): Promise<Track> {
        await this.query(`INSERT INTO tri.tracks (title, artists, isrc, credits, genre, release_date, link_spotify, link_youtube, link_soundcloud, link_applemusic, link_bandcamp, link_lyda)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            track.title,
            track.artists,
            track.isrc,
            track.credits,
            track.genre,
            track.release_date,
            track.link_spotify,
            track.link_youtube,
            track.link_soundcloud,
            track.link_applemusic,
            track.link_bandcamp,
            track.link_lyda,
        ]);
        const id = await this.querySingleValue("SELECT id FROM tri.tracks WHERE title = ? ORDER BY created_at DESC LIMIT 1", [track.title]);
        return await this.getTrackById(id);
    }

    async createAlbum(album: Album): Promise<Album> {
        await this.query("INSERT INTO tri.albums (title, upc, release_date, price, artists) VALUES (?, ?, ?, ?, ?)", [
            album.title,
            album.upc,
            album.release_date,
            album.price,
            album.artists,
        ]);
        const id = await this.querySingleValue("SELECT id FROM tri.albums WHERE title = ? ORDER BY created_at DESC LIMIT 1", [album.title]);
        return await this.getAlbumById(id);
    }

    async getUserPermissions(id: number): Promise<UserPermission[]> {
        return await this.query("SELECT * FROM tri.users_permissions WHERE user_id = ?", [id]);
    }

    async upsertUserSetting(userId: number, key: any, value: string): Promise<void> {
        await this.query("INSERT INTO tri.user_settings (user_id, `key`, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = ?", [
            userId,
            key,
            value,
            value
        ])
    }

    async createPossibleUserSetting(name: string, description: string, type: "boolean" | "string"): Promise<void> {
        await this.query("INSERT INTO tri.possible_usersettings (name, description, type) VALUES (?, ?, ?)", [
            name,
            description,
            type
        ]);
    }

    async getTracksByAlbumIds(albumIds: number[]): Promise<Track[]> {
        if (albumIds.length === 0) {
            return [];
        }
        return await this.query("SELECT * FROM tri.tracks WHERE album_id IN (?)", [albumIds]);
    }

    async getRoyaltiesByTrack(artistNames: string[], limit: number): Promise<Statistic[]> {
        const {artistConditions, artistNamesLike} = this.getArtistLike(artistNames);

        return await this.query(`SELECT r.isrc         as id,
                                        r.title        as label,
                                        SUM(r.royalty) as value
                                 FROM finance.royalties r
                                 WHERE ${artistConditions}
                                 GROUP BY r.isrc
                                 ORDER BY SUM(r.royalty) DESC
                                 LIMIT ?`,
            [...artistNamesLike, limit]);
    }

    async getRoyaltiesByArtist(artistNames: string[], limit: number): Promise<Statistic[]> {
        const rows = [];
        for (const artistName of artistNames) {
            const likeCondition = `%${artistName}%`;

            const row = await this.queryFirst(`
                        SELECT ?              as id,
                               ?              as label,
                               SUM(r.royalty) as value
                        FROM finance.royalties r
                        WHERE r.trackartists LIKE ?
                        LIMIT 1`,
                [artistName, artistName, likeCondition]);
            if (row) {
                rows.push(row);
            }
        }
        return rows;
    }

    getArtistEqual(artistNames: string[]) {
        return artistNames.map(() => "r.trackartists = ?").join(" OR ");
    }

    getArtistLike(artistNames: string[]) {
        const artistConditions = artistNames.map(() => "r.trackartists LIKE ?").join(" OR ");
        const artistNamesLike = artistNames.map(name => `%${name}%`);

        return {
            artistConditions,
            artistNamesLike
        };
    }

    async getRoyaltiesByMonth(artistNames: string[], limit: number): Promise<Statistic[]> {
        const {artistConditions, artistNamesLike} = this.getArtistLike(artistNames);

        return await this.query(
            `SELECT r.period1    as id,
                    r.period1    as label,
                    SUM(royalty) as value
             FROM finance.royalties r
             WHERE ${artistConditions}
             GROUP BY r.period1
             ORDER BY STR_TO_DATE(CONCAT('01-', r.period1), '%d-%b-%Y') DESC
             LIMIT ?`,
            [...artistNamesLike, limit]
        );
    }

    async getRoyaltiesByMonthForUPC(upc: string, limit: number): Promise<Statistic[]> {
        return await this.query(
            `SELECT r.period1    as id,
                    r.period1    as label,
                    SUM(royalty) as value
             FROM finance.royalties r
             WHERE r.upc = ?
             GROUP BY r.period1
             ORDER BY STR_TO_DATE(CONCAT('01-', r.period1), '%d-%b-%Y') DESC
             LIMIT ?`,
            [upc, limit]
        );
    }

    async getRoyaltiesByMonthForISRC(isrc: string, limit: number): Promise<Statistic[]> {

        return await this.query(
            `SELECT r.period1    as id,
                    r.period1    as label,
                    SUM(royalty) as value
             FROM finance.royalties r
             WHERE r.isrc = ?
             GROUP BY r.period1
             ORDER BY STR_TO_DATE(CONCAT('01-', r.period1), '%d-%b-%Y') DESC
             LIMIT ?`,
            [isrc, limit]
        );
    }

    async getRoyaltiesByYear(artistNames: string[], limit: number): Promise<Statistic[]> {
        const {artistConditions, artistNamesLike} = this.getArtistLike(artistNames);

        return await this.query(
            `SELECT SUBSTR(r.period1, 5) as id,
                    SUBSTR(r.period1, 5) as label,
                    SUM(royalty)         as value
             FROM finance.royalties r
             WHERE ${artistConditions}
             GROUP BY SUBSTR(r.period1, 5)
             ORDER BY STR_TO_DATE(CONCAT('01-', r.period1), '%d-%b-%Y') DESC
             LIMIT ?`,
            [...artistNamesLike, limit]
        );
    }

    async getRoyaltySumWithExcludedIsrcs(artistNames: string[], isrcs: number[]): Promise<number> {
        if (isrcs.length === 0) {
            return 0;
        }

        const artistConditions = artistNames.map(() => "r.trackartists LIKE ?").join(" OR ");
        const artistNamesLike = artistNames.map(name => `%${name}%`);

        const qMarks = isrcs.map(() => "?").join(", ");
        let sql = `SELECT SUM(r.royalty) as value
                   FROM finance.royalties r
                   WHERE r.isrc NOT IN (${qMarks})
                     AND ${artistConditions}`;
        return await this.querySingleValue(sql, [...artistNamesLike, ...isrcs]);
    }

    async getPermissionsByIds(ids: number[]): Promise<Permission[]> {
        if (ids.length === 0) {
            return [];
        }

        const qs = ids.map(() => "?").join(",");
        return await this.query(`SELECT *
                                 FROM tri.permissions
                                 WHERE id IN (${qs})`, ids);
    }

    async getPermissions(): Promise<Permission[]> {
        return await this.query("SELECT * FROM tri.permissions");
    }

    async createPermission(name: string) {
        await this.query("INSERT INTO tri.permissions (name, description) VALUES (?, ?)", [name, ""]);
    }

    async userHasPermissionWithName(userId: number, permissionName: Permissions): Promise<boolean> {
        return await this.querySingleValue("SELECT COUNT(*) FROM tri.users_permissions WHERE user_id = ? AND permission_id = (SELECT id FROM tri.permissions WHERE name = ?)", [userId, permissionName]) > 0;
    }

    async getUserByToken(token: string): Promise<User> {
        return await this.queryFirst("SELECT * FROM tri.users WHERE password_token = ? AND password_token IS NOT NULL", [token]);
    }

    async deleteTrack(id: number) {
        await this.query("DELETE FROM tri.tracks WHERE id = ?", [id]);
    }

    async deleteUser(id: number) {
        await this.query("DELETE FROM tri.users WHERE id = ?", [id]);
    }

    async setTrackProcessed(id: number) {
        await this.query("UPDATE tri.tracks SET processed = 1 WHERE id = ?", [id]);
    }

    async setTrackLoudnessData(id: number, loudnessData: string) {
        await this.query("UPDATE tri.tracks SET loudness_data = ? WHERE id = ?", [loudnessData, id]);
    }

    async setTrackLength(id: number, length: number) {
        await this.query("UPDATE tri.tracks SET length = ? WHERE id = ?", [length, id]);
    }

    async getAlbumById(id: number): Promise<Album> {
        return await this.queryFirst("SELECT * FROM tri.albums WHERE id = ?", [id]);
    }

    async updateTrack(request: Track) {
        await this.query("UPDATE tri.tracks SET title = ?, isrc = ?, artists = ?, genre = ?, release_date = ?, price = ? WHERE id = ?", [
            request.title,
            request.isrc,
            request.artists,
            request.genre ?? "other",
            new Date(request.release_date ?? new Date().getTime()).toISOString().split("T")[0],
            request.price,
            request.id
        ]);
    }

    async setTrackHasCover(referenceId: number, b: boolean) {
        await this.query("UPDATE tri.tracks SET has_cover = ? WHERE id = ?", [b, referenceId]);
    }

    async setAlbumHasCover(referenceId: number, b: boolean) {
        await this.query("UPDATE tri.albums SET has_cover = ? WHERE id = ?", [b, referenceId]);
    }

    async setUserHasAvatar(referenceId: number, b: boolean) {
        await this.query("UPDATE tri.users SET has_avatar = ? WHERE id = ?", [b, referenceId]);
    }

    async setUserHasBanner(referenceId: number, b: boolean) {
        await this.query("UPDATE tri.users SET has_banner = ? WHERE id = ?", [b, referenceId]);
    }

    async cleanLogs() {
        return await this.query("DELETE FROM tri.logs WHERE time < NOW() - INTERVAL 7 DAY");
    }

    log(logLevel: LogLevel, message: string, stack: string, correlation_id: string, host: string, properties: any = {}) {
        this.query("INSERT INTO tri.logs (logLevel, message, stack, correlation_id, host, properties) VALUES (?, ?, ?, ?, ?, ?)",
            [logLevel, message, stack, correlation_id, host, JSON.stringify(properties)])
            .then(async () => {
                const cleanupIntervalMinutes = 60;
                if (Date.now() - this.lastLogCleanup > 1000 * 60 * cleanupIntervalMinutes) {
                    await this.cleanLogs();
                    this.lastLogCleanup = Date.now();
                }
            })
            .catch(e => console.error(e));
    }

    async getLogs(logLevel: number, offset: number, limit: number): Promise<Log[]> {
        if (logLevel === LogLevel.debug) {
            return await this.query("SELECT * FROM tri.logs ORDER BY order_id DESC LIMIT ? OFFSET ?", [limit, offset]);
        }
        return await this.query("SELECT * FROM tri.logs WHERE logLevel >= ? ORDER BY order_id DESC LIMIT ? OFFSET ?", [logLevel, limit, offset]);
    }

    async searchGeneric<T>(searchConfiguration: SearchTableConfiguration<T>, request: SearchRequest, noAuth: boolean, searchMode: SearchMode): Promise<T[]> {
        if (searchMode === SearchMode.exact) {
            let exactQuery = "SELECT * FROM " + searchConfiguration.tableName + " WHERE " + searchConfiguration.searchableFields.map(f => `${f.toString()} = ?`).join(" OR ");
            if (noAuth) {
                exactQuery += " AND " + searchConfiguration.noAuthCondition;
            }
            return await this.query(exactQuery + " LIMIT ? OFFSET ?",
                [...searchConfiguration.searchableFields.map(() => request.query), request.limit, request.offset]);
        } else if (searchMode === SearchMode.partial) {
            const queryValue = `%${request.query}%`.replaceAll("_", "%");
            const values = searchConfiguration.searchableFields.map(() => [queryValue, request.query]).flat();
            let partialQuery = "SELECT * FROM " + searchConfiguration.tableName + " WHERE " + searchConfiguration.searchableFields.map(f => `${f.toString()} LIKE ? AND ${f.toString()} != ?`).join(" OR ");
            if (noAuth) {
                partialQuery += " AND " + searchConfiguration.noAuthCondition;
            }
            return await this.query(partialQuery + " LIMIT ? OFFSET ?",
                [...values, request.limit, request.offset]);
        } else {
            throw new Error("Invalid search mode, must be exact or partial.");
        }
    }

    async setUserEmails(user_id: number, emails: UserEmail[]) {
        for (const email of emails) {
            await this.query("INSERT INTO tri.user_emails (user_id, email, `primary`, verification_code) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `primary` = ?",
                [user_id, email.email, email.primary, email.verification_code, email.primary]);
        }
    }

    async getUserEmails(id: number): Promise<UserEmail[]> {
        return await this.query("SELECT * FROM tri.user_emails WHERE user_id = ?", [id]);
    }

    async getUserPrimaryEmail(id: number): Promise<UserEmail> {
        return await this.queryFirst("SELECT * FROM tri.user_emails WHERE user_id = ? AND `primary` = 1", [id]);
    }

    async verifyEmail(user_id: number, email: string) {
        await this.query("UPDATE tri.user_emails SET verified = 1, verified_at = CURRENT_TIMESTAMP WHERE user_id = ? AND email = ?", [user_id, email]);
    }

    async deleteUserEmail(user_id: number, email: string) {
        await this.query("DELETE FROM tri.user_emails WHERE user_id = ? AND email = ?", [user_id, email]);
    }

    async getUsers(): Promise<User[]> {
        return await this.query("SELECT * FROM tri.users");
    }

    async getUserArtists(userId: number): Promise<Artist[]> {
        return await this.query("SELECT * FROM tri.artists WHERE user_id = ?", [userId]);
    }

    async getUserIdByArtistName(artistName: string) {
        return await this.querySingleValue("SELECT user_id FROM tri.artists WHERE name = ?", [artistName]);
    }

    async getPaymentsByUserId(id: number): Promise<Payment[]> {
        return await this.query("SELECT * FROM finance.payments WHERE user_id = ? ORDER BY created_at DESC", [id]);
    }

    async getArtistRoyalty(artistNames: string[]) {
        const artistConditions = this.getArtistEqual(artistNames);

        return await this.querySingleValue("SELECT SUM(r.royalty) FROM finance.royalties r WHERE " + artistConditions, [...artistNames]);
    }

    async getArtistSplitSum(artistNames: string[]) {
        let splitSum = 0;

        for (const artistName of artistNames) {
            const addRows = await this.query<{
                royalty: number;
                split: number;
            }>("SELECT r.royalty, split FROM finance.royalties r INNER JOIN finance.splits ON r.isrc = splits.isrc WHERE artist = ? AND r.trackartists LIKE ? AND NOT r.trackartists = ?",
                [artistName, `%${artistName}%`, artistName]);

            for (const row of addRows) {
                splitSum += row.royalty * row.split;
            }
        }

        return splitSum;
    }

    async getArtistTotalRoyalty(artistNames: string[]) {
        const total = await this.getArtistRoyalty(artistNames);
        const collabSum = await this.getArtistSplitSum(artistNames);

        return total + collabSum;
    }

    async getUserPaidAmount(id: number) {
        return await this.querySingleValue("SELECT SUM(amount) FROM finance.payments WHERE user_id = ?", [id]);
    }

    async getAvailablePaymentAmount(id: number, artistNames: string[]) {
        const total = await this.getArtistTotalRoyalty(artistNames);
        const paidOut = await this.getUserPaidAmount(id);

        const artistCut = 0.85;
        const artistTotal = total * artistCut;
        return {
            total: artistTotal,
            paidOut,
            available: artistTotal - paidOut
        };
    }

    async getAlbums(notAuthenticated: boolean): Promise<Album[]> {
        if (notAuthenticated) {
            return await this.query("SELECT * FROM tri.albums WHERE release_date < CURRENT_TIMESTAMP ORDER BY release_date DESC");
        }
        return await this.query("SELECT * FROM tri.albums ORDER BY release_date DESC");
    }

    async createPayment(userId: number, amount: number, status: PaymentStatus, batchId: string) {
        await this.query("INSERT INTO finance.payments (user_id, amount, status, payout_batch_id) VALUES (?, ?, ?, ?)",
            [userId, amount, status, batchId]);
    }

    async getAlbumsByIds(albumIds: (number | undefined)[]): Promise<Album[]> {
        const realIds = albumIds.filter(id => id !== undefined);
        if (realIds.length === 0) {
            return [];
        }
        return await this.query("SELECT * FROM tri.albums WHERE id IN (?)", [realIds.join(",")]);
    }

    async createPaypalBatchPayment(items: PaypalPayoutItem[], guid: string) {
        await this.query("INSERT INTO finance.paypal_batch_payments (request_items_json, paypal_batch_id) VALUES (?, ?)", [JSON.stringify(items), guid]);
    }

    async updatePaypalBatchPaymentStatus(senderBatchId: string, status: PaypalBatchStatus) {
        await this.query("UPDATE finance.paypal_batch_payments SET paypal_batch_status = ? WHERE id = ?", [status, senderBatchId]);
    }

    async getTopRoyaltyId(): Promise<number> {
        return await this.querySingleValue("SELECT MAX(id) FROM finance.royalties");
    }

    async deleteRoyaltiesAboveId(currentTopId: number) {
        await this.query("DELETE FROM finance.royalties WHERE id > ?", [currentTopId]);
    }

    async insertRoyalty(row: Royalty) {
        await this.query(`INSERT INTO finance.royalties
                          (period1, label, releasename, releaseartists, upc, catalogue, title, mixver, isrc,
                           trackartists, provider, period2, territory, delivery, type, salevoid, count, 
                           royalty, dataprovider, id)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            row.period1,
            row.label,
            row.releasename,
            row.releaseartists,
            row.upc,
            row.catalogue,
            row.title,
            row.mixver,
            row.isrc,
            row.trackartists,
            row.provider,
            row.period2,
            row.territory,
            row.delivery,
            row.type,
            row.salevoid,
            row.count,
            row.royalty,
            row.dataprovider,
            row.id
        ]);
    }

    async insertPaypalWebhookEvent(dbEntry: PaypalWebhook) {
        await this.query(`INSERT INTO finance.paypal_webhooks (id, type, content, paypal_user_id)
                          VALUES (?, ?, ?, ?) ON DUPLICATE KEY
                UPDATE type = ?, content = ?, paypal_user_id = ?`,
            [dbEntry.id, dbEntry.type, dbEntry.content, dbEntry.paypal_user_id, dbEntry.type, dbEntry.content, dbEntry.paypal_user_id]);
    }

    async getPaypalBatchPayment(ownBatchId: string): Promise<PaypalBatchPayment|null> {
        return await this.queryFirst("SELECT * FROM finance.paypal_batch_payments WHERE paypal_batch_id = ?", [ownBatchId]);
    }

    async updateBatchPaymentStatus(ownBatchId: string, batch_status: PaypalBatchStatus | undefined) {
        await this.query("UPDATE finance.paypal_batch_payments SET paypal_batch_status = ? WHERE paypal_batch_id = ?",
            [batch_status, ownBatchId]);
    }

    async getPaymentByBatchId(ownBatchId: string): Promise<PaymentRequest|null> {
        return await this.queryFirst("SELECT * FROM finance.payments WHERE payout_batch_id = ?", [ownBatchId]);
    }

    async updatePaymentByBatchId(ownBatchId: string, status: PaymentStatus) {
        await this.query("UPDATE finance.payments SET status = ? WHERE payout_batch_id = ?", [status, ownBatchId]);
    }

    async updateAlbum(album: Partial<Album>) {
        await this.query("UPDATE tri.albums SET title = ?, upc = ?, release_date = ?, price = ? WHERE id = ?",
            [album.title, album.upc, album.release_date, album.price, album.id]);
    }

    async removeTrackFromAlbum(album_id: number, track_id: number) {
        await this.query("UPDATE tri.tracks SET album_id = NULL WHERE album_id = ? AND id = ?", [album_id, track_id]);
    }

    async getTracks(notAuthenticated: boolean): Promise<Track[]> {
        if (notAuthenticated) {
            return await this.query("SELECT * FROM tri.tracks WHERE release_date < CURRENT_TIMESTAMP ORDER BY release_date DESC");
        }
        return await this.query("SELECT * FROM tri.tracks ORDER BY release_date DESC");
    }

    async addTrackToAlbum(album_id: number, track_id: number) {
        await this.query("UPDATE tri.tracks SET album_id = ? WHERE id = ?", [album_id, track_id]);
    }

    async getLastBandcampReportTime(): Promise<Date> {
        return await this.querySingleValue("SELECT created_at FROM finance.bandcamp_sync ORDER BY created_at DESC LIMIT 1");
    }

    async insertBandcampReport(report: SalesReport): Promise<number> {
        await this.query("INSERT INTO finance.bandcamp_sync (report) VALUES (?)", [JSON.stringify(report)]);
        return await this.querySingleValue("SELECT id FROM finance.bandcamp_sync ORDER BY created_at DESC LIMIT 1");
    }

    async updateBandcampReportStatus(id: number, received: BandcampReportStatus) {
        await this.query("UPDATE finance.bandcamp_sync SET status = ? WHERE id = ?", [received, id]);
    }

    async getAlbumByUpc(upc: string): Promise<Album|null> {
        return await this.queryFirst("SELECT * FROM tri.albums WHERE upc = ?", [upc]);
    }

    async getTrackByIsrc(isrc: string): Promise<Track|null> {
        return await this.queryFirst("SELECT * FROM tri.tracks WHERE isrc = ?", [isrc]);
    }

    async getTracksByBandcampLink(item_url: string): Promise<Track[]> {
        return await this.query("SELECT * FROM tri.tracks WHERE link_bandcamp = ?", [item_url]);
    }

    async setArtistHasLogo(referenceId: number, hasImage: boolean) {
        await this.query("UPDATE tri.artists SET has_logo = ? WHERE id = ?", [hasImage, referenceId]);
    }

    async getArtistById(referenceId: number): Promise<Artist|null> {
        return await this.queryFirst("SELECT * FROM tri.artists WHERE id = ?", [referenceId]);
    }

    async getArtistByName(name: string): Promise<Artist|null> {
        return await this.queryFirst("SELECT * FROM tri.artists WHERE name = ?", [name]);
    }

    async getArtists(): Promise<Artist[]> {
        return await this.query("SELECT id, name, has_logo FROM tri.artists");
    }

    async getTracksByArtists(artistNames: string[]) {
        if (artistNames.length === 0) {
            return [];
        }
        const likeQuery = artistNames.map(() => "artists LIKE ?").join(" OR ");
        const artistNamesLike = artistNames.map(name => `%${name}%`);

        return await this.query(`SELECT * FROM tri.tracks WHERE ${likeQuery}`, [...artistNamesLike]);
    }

    async getAlbumsByArtists(artistNames: string[]) {
        if (artistNames.length === 0) {
            return [];
        }
        const likeQuery = artistNames.map(() => "artists LIKE ?").join(" OR ");
        const artistNamesLike = artistNames.map(name => `%${name}%`);

        return await this.query(`SELECT * FROM tri.albums WHERE ${likeQuery}`, [...artistNamesLike]);
    }
}