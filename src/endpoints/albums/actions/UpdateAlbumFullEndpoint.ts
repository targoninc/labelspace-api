import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.js";
import {TriDB} from "../../../utility/DB/TriDB.js";
import {Application, Response} from "express";
import {Authenticator} from "../../../models/Authenticator.ts";
import {Permissions} from "../../../models/enums/Permissions.ts";
import type {CreateAlbumRequestBody} from "../../../models/interfaces/UpdateAlbumRequestBody.ts";
import {CLI} from "../../../utility/CLI.ts";

export class UpdateAlbumFullEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        if (!user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        CLI.debug("Getting permissions...");
        if (!(await Authenticator.userHasPermission(req.user, Permissions.releaseManagement, this.db))) {
            return res.status(403).send("You are not allowed to update albums.");
        }
        CLI.debug("Got permission!");

        const request = req.body as CreateAlbumRequestBody;
        CLI.debug("Got body!");
        if (!request.id) {
            CLI.debug("no id ~");
            return res.status(400).send("No album id provided.");
        }

        CLI.debug("Getting album for update...");
        const album = await this.db.getAlbumById(request.id);
        if (!album) {
            return res.status(404).send("Album not found.");
        }

        CLI.debug("Updating album...");
        await this.db.updateAlbum({
            ...album,
            ...request,
            release_date: request.release_date ? new Date(request.release_date) : album.release_date,
        });
        return res.send("Album updated.");
    }
}