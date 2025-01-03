import {Application, Response} from "express";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {Authenticator} from "../../../models/Authenticator.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {MediaClient} from "../../../utility/Media/MediaClient.js";
import {MediaFileType} from "../../../models/enums/MediaFileType.js";
import {CLI} from "../../../utility/CLI.js";
import {Paypal} from "../../../utility/Paypal/Paypal.js";

export class DeleteUserEndpoint extends AuthenticatedPostEndpoint {
    db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        if (!Authenticator.guardEndpoint(req, res)) {
            return;
        }

        const user = req.user;
        if (!user) {
            return res.status(400).json({message: "User not found."});
        }

        await this.deleteAllMedia(user.id);
        await this.db.deleteUser(user.id);

        req.logout(() => {
            const isHttps = req.headers['x-forwarded-proto'] === 'https';

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: isHttps,
                sameSite: 'none'
            });

            res.send({message: "Account deleted successfully."});
        });
    }

    async deleteAllMedia(userId: number) {
        await this.deleteAllAlbumMedia(userId);
        await this.deleteAllTrackMedia(userId);
        await this.deleteAllUserMedia(userId);
    }

    async deleteAllAlbumMedia(userId: number) {
        CLI.debug("Deleting all album media for user " + userId);
        const albums = await this.db.getAlbumsByUserId(userId);
        for (const album of albums) {
            await MediaClient.deleteMediaForEntity(this.db, MediaFileType.albumCover, album.id);
        }
        CLI.success("Deleted all album media for user " + userId);
    }

    async deleteAllTrackMedia(userId: number) {
        CLI.debug("Deleting all track media for user " + userId);
        const tracks = await this.db.getTracksByUserId(userId);
        for (const track of tracks) {
            await MediaClient.deleteMediaForEntity(this.db, MediaFileType.trackCover, track.id);
            await MediaClient.deleteMediaForEntity(this.db, MediaFileType.audio, track.id);
        }
        CLI.success("Deleted all track media for user " + userId);
    }

    async deleteAllUserMedia(userId: number) {
        CLI.debug("Deleting all user media for user " + userId);
        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.userAvatar, userId);
        await MediaClient.deleteMediaForEntity(this.db, MediaFileType.userBanner, userId);
        CLI.success("Deleted all user media for user " + userId);
    }
}