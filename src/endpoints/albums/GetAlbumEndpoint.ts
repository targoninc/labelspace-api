import {Application, Response} from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../utility/DB/TriDB.js";
import {AlbumEnricher} from "../../models/enrichers/AlbumEnricher.js";
import {Permissions} from "../../models/enums/Permissions.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {FileStorage} from "../../utility/Storage/FileStorage.ts";
import {MediaFileType} from "../../models/enums/MediaFileType.ts";

export class GetAlbumEndpoint extends GetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        let idParam = req.query.id as string;
        if (!idParam) {
            return res.status(400).send({error: "No album id provided"});
        }
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).send({error: "Invalid album id"});
        }

        let album = await this.db.getAlbumById(id);
        if (!album) {
            return res.status(404).send({error: "Album not found"});
        }

        const hasReleaseManagementPermission = await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db);
        const albumReleaseTime = new Date(album.release_date).getTime();
        if (albumReleaseTime > new Date().getTime() && !hasReleaseManagementPermission) {
            return res.status(404).send({error: "Album not found"});
        }

        const addAdditionalData = !!req.user;
        album = await AlbumEnricher.enrichAsync(this.db, album, {
            tracks: true,
            trackEarnings: addAdditionalData,
        });

        if (addAdditionalData) {
            album.earnings = await this.db.getReleaseTotalRoyalty(album.upc) ?? 0;
            album.attachments = await this.db.getAlbumAttachmentsByAlbumId(album.id);

            const userCanManageFiles = await Authenticator.userHasPermission(req.user, Permissions.fileManagement, this.db);
            const userArtists = (await this.db.getUserArtists(req.user.id)).map(a => a.name);
            if (!userCanManageFiles) {
                album.attachments = album.attachments.filter(a => {
                    if (!a.visible_to_artists || a.visible_to_artists.trim() === "") {
                        return false;
                    }

                    const visibleTo = a.visible_to_artists.split(",").map(v => v.trim());
                    return visibleTo.some(v => userArtists.includes(v));
                });
            }
        }

        return res.send(album);
    }
}