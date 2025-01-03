import {config} from 'dotenv';
import express from 'express';
import cors from 'cors';
import {GetUserEndpoint} from "./endpoints/user/GetUserEndpoint.js";
import {LoginEndpoint} from "./endpoints/auth/LoginEndpoint.js";
import passport, {SessionOptions} from "passport";
import {UpdateUserEndpoint} from "./endpoints/user/actions/UpdateUserEndpoint.js";
import {ChangePasswordEndpoint} from "./endpoints/auth/ChangePasswordEndpoint.js";
import {GetTrackEndpoint} from "./endpoints/tracks/GetTrackEndpoint.js";
import {CreateTrackEndpoint} from "./endpoints/tracks/actions/CreateTrackEndpoint.js";
import {MfaRequestEndpoint} from "./endpoints/auth/MfaRequestEndpoint.js";
import {GetPermissionsEndpoint} from "./endpoints/user/GetPermissionsEndpoint.js";
import {UpdateSettingEndpoint} from "./endpoints/user/actions/UpdateSettingEndpoint.js";
import {ensureDatabaseConsistency, setupPassport} from "./utility/DB/Database.js";
import {LogoutEndpoint} from "./endpoints/auth/LogoutEndpoint.js";
import {GetTracksByUserEndpoint} from "./endpoints/tracks/GetTracksByUserEndpoint.js";
import {GetAlbumsByUserEndpoint} from "./endpoints/albums/GetAlbumsByUserEndpoint.js";
import {TriDB} from "./utility/DB/TriDB.js";
import {SearchUsersEndpoint} from "./endpoints/search/SearchUsersEndpoint.js";
import {UploadMediaEndpoint} from "./endpoints/media/UploadMediaEndpoint.js";
import {RequestPasswordResetEndpoint} from "./endpoints/auth/RequestPasswordResetEndpoint.js";
import {ResetPasswordEndpoint} from "./endpoints/auth/ResetPasswordEndpoint.js";
import {VerifyEmailEndpoint} from "./endpoints/auth/VerifyEmailEndpoint.js";
import {DeleteTrackEndpoint} from "./endpoints/tracks/DeleteTrackEndpoint.js";
import {DeleteUserEndpoint} from "./endpoints/user/actions/DeleteUserEndpoint.js";
import {GetImageEndpoint} from "./endpoints/media/GetImageEndpoint.js";
import {ExportUserDataEndpoint} from "./endpoints/user/actions/ExportUserDataEndpoint.js";
import {CreateAlbumEndpoint} from "./endpoints/albums/CreateAlbumEndpoint.js";
import {GetAlbumEndpoint} from "./endpoints/albums/GetAlbumEndpoint.js";
import {AddTrackToAlbumEndpoint} from "./endpoints/albums/AddTrackToAlbumEndpoint.js";
import {RemoveTrackFromAlbumEndpoint} from "./endpoints/albums/RemoveTrackFromAlbumEndpoint.js";
import {DeleteMediaEndpoint} from "./endpoints/media/DeleteMediaEndpoint.js";
import {UpdateTrackFullEndpoint} from "./endpoints/tracks/actions/UpdateTrackFullEndpoint.js";
import {CLI, configureDBLogging} from "./utility/CLI.js";
import {GetLogsEndpoint} from "./endpoints/logs/GetLogsEndpoint.js";
import {SearchTracksEndpoint} from "./endpoints/search/SearchTracksEndpoint.js";
import {SearchAlbumsEndpoint} from "./endpoints/search/SearchAlbumsEndpoint.js";
import {SendActivationEmailEndpoint} from "./endpoints/user/actions/SendActivationEmailEndpoint.js";
import { RoyaltiesByMonthEndpoint } from './endpoints/statistics/RoyaltiesByMonthEndpoint.js';
import { RoyaltiesByTrackEndpoint } from './endpoints/statistics/RoyaltiesByTrackEndpoint.js';
import {rateLimit} from "express-rate-limit";
import * as path from "node:path";
import {GetUsersEndpoint} from "./endpoints/user/GetUsersEndpoint.ts";

config();

// @ts-ignore
BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};

const neededEnvVars = ["SESSION_SECRET", "MARIADB_SESSION_DB", "MARIADB_HOST", "MARIADB_PORT", "MARIADB_USER",
    "MARIADB_PASSWORD", "MARIADB_NAME", "COOKIE_DOMAIN", "CORS_ORIGIN", "MAIL_HOST", "MAIL_PORT", "MAIL_SECURE",
    "MAIL_USER", "MAIL_PASSWORD", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"];
let missingEnvVars = neededEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
}

const db = new TriDB();
await ensureDatabaseConsistency(db);

configureDBLogging(db);

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
setupPassport(app, db);

app.use(passport.initialize());
app.use(passport.session(<SessionOptions>{}));
app.use(express.json());

const rateLimitWindowInMin = 1;
app.use(rateLimit({
    windowMs: rateLimitWindowInMin * 60 * 1000,
    limit: 500,
    message: `Too many requests, please try again in ${rateLimitWindowInMin} minutes.`
}));

// region Users
new DeleteUserEndpoint(app, "/user/actions/delete", db).register();
new LoginEndpoint(app, "/user/actions/login", db).register();
new LogoutEndpoint(app, "/user/actions/logout").register();
new ChangePasswordEndpoint(app, "/user/actions/change-password", db).register();
new RequestPasswordResetEndpoint(app, "/user/actions/request-password-reset", db).register();
new ResetPasswordEndpoint(app, "/user/actions/reset-password", db).register();
new GetUserEndpoint(app, "/user/get", db).register();
new GetUsersEndpoint(app, "/users/get", db).register();
new UpdateUserEndpoint(app, "/user/actions/update", db).register();
new MfaRequestEndpoint(app, "/user/actions/mfa-request", db).register();
new UpdateSettingEndpoint(app, "/user/actions/update-setting", db).register();
new VerifyEmailEndpoint(app, "/user/actions/verify-email", db).register();
new ExportUserDataEndpoint(app, "/user/export", db).register();
new SendActivationEmailEndpoint(app, "/user/actions/send-activation-email", db).register();
// endregion

// region Permissions
new GetPermissionsEndpoint(app, "/user/permissions", db).register();
// endregion

// region Tracks
new GetTrackEndpoint(app, "/tracks/byId", db).register();
new CreateTrackEndpoint(app, "/tracks/create", db).register();
new DeleteTrackEndpoint(app, "/tracks/actions/delete", db).register();
new GetTracksByUserEndpoint(app, "/tracks/byUserId", db).register();
new UpdateTrackFullEndpoint(app, "/tracks/actions/updateFull", db).register();
// endregion

// region Albums
new GetAlbumEndpoint(app, "/albums/byId", db).register();
new GetAlbumsByUserEndpoint(app, "/albums/byUserId", db).register();
new CreateAlbumEndpoint(app, "/albums/actions/new", db).register();
new AddTrackToAlbumEndpoint(app, "/albums/actions/addTrack", db).register();
new RemoveTrackFromAlbumEndpoint(app, "/albums/actions/removeTrack", db).register();
// endregion

// region Media
new UploadMediaEndpoint(app, "/media/upload", db).register();
new GetImageEndpoint(app, "/media/image", db).register();
new DeleteMediaEndpoint(app, "/media/delete", db).register();
// endregion

// region Statistics
new RoyaltiesByMonthEndpoint(app, "/statistics/royaltiesByMonth", db).register();
new RoyaltiesByTrackEndpoint(app, "/statistics/royaltiesByTrack", db).register();
// endregion

// region Search
new SearchUsersEndpoint(app, "/search/users", db).register();
new SearchTracksEndpoint(app, "/search/tracks", db).register();
new SearchAlbumsEndpoint(app, "/search/albums", db).register();
// endregion

// region Logs
new GetLogsEndpoint(app, "/audit/logs", db).register();
// endregion

app.get("/security.txt", (req, res) => {
    CLI.debug("Serving security.txt", {
        logToDb: true,
        info: {
            request: req.originalUrl,
            headers: req.headers,
            body: req.body
        }
    });
    res.sendFile(path.join(__dirname, "./security.txt"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    CLI.info(`Server is running on port http://localhost:${port}`);
});
