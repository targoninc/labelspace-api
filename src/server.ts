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
import {TriDB} from "./utility/DB/TriDB.js";
import {SearchUsersEndpoint} from "./endpoints/search/SearchUsersEndpoint.js";
import {UploadMediaEndpoint} from "./endpoints/media/UploadMediaEndpoint.js";
import {RequestPasswordResetEndpoint} from "./endpoints/auth/RequestPasswordResetEndpoint.js";
import {ResetPasswordEndpoint} from "./endpoints/auth/ResetPasswordEndpoint.js";
import {VerifyEmailEndpoint} from "./endpoints/auth/VerifyEmailEndpoint.js";
import {DeleteTrackEndpoint} from "./endpoints/tracks/actions/DeleteTrackEndpoint.js";
import {GetImageEndpoint} from "./endpoints/media/GetImageEndpoint.js";
import {ExportUserDataEndpoint} from "./endpoints/user/actions/ExportUserDataEndpoint.js";
import {CreateAlbumEndpoint} from "./endpoints/albums/actions/CreateAlbumEndpoint.js";
import {GetAlbumEndpoint} from "./endpoints/albums/GetAlbumEndpoint.js";
import {RemoveTrackFromAlbumEndpoint} from "./endpoints/albums/actions/RemoveTrackFromAlbumEndpoint.js";
import {DeleteMediaEndpoint} from "./endpoints/media/DeleteMediaEndpoint.js";
import {UpdateTrackFullEndpoint} from "./endpoints/tracks/actions/UpdateTrackFullEndpoint.js";
import {CLI, configureDBLogging} from "@targoninc/ts-logging";
import {GetLogsEndpoint} from "./endpoints/logs/GetLogsEndpoint.js";
import {SearchTracksEndpoint} from "./endpoints/search/SearchTracksEndpoint.js";
import {SearchAlbumsEndpoint} from "./endpoints/search/SearchAlbumsEndpoint.js";
import {SendActivationEmailEndpoint} from "./endpoints/user/actions/SendActivationEmailEndpoint.js";
import { RoyaltiesByMonthEndpoint } from './endpoints/statistics/RoyaltiesByMonthEndpoint.js';
import { RoyaltiesByTrackEndpoint } from './endpoints/statistics/RoyaltiesByTrackEndpoint.js';
import {rateLimit} from "express-rate-limit";
import * as path from "node:path";
import {GetUsersEndpoint} from "./endpoints/user/GetUsersEndpoint.ts";
import {RoyaltiesByYearEndpoint} from "./endpoints/statistics/RoyaltiesByYearEndpoint.ts";
import {GetPaymentsEndpoint} from "./endpoints/payments/GetPaymentsEndpoint.ts";
import {GetAvailablePaymentAmountEndpoint} from "./endpoints/payments/GetAvailablePaymentAmountEndpoint.ts";
import {GetAlbumsEndpoint} from "./endpoints/albums/GetAlbumsEndpoint.ts";
import {ImportDataEndpoint} from "./endpoints/data/ImportDataEndpoint.ts";
import {RoyaltiesByArtistEndpoint} from "./endpoints/statistics/RoyaltiesByArtistEndpoint.ts";
import {RequestPaymentEndpoint} from "./endpoints/payments/RequestPaymentEndpoint.ts";
import {AddDataEndpoint} from "./endpoints/data/AddDataEndpoint.ts";
import {PaypalEventsWebhookEndpoint} from "./endpoints/webhooks/PaypalEventsWebhookEndpoint.ts";
import {UpdateAlbumFullEndpoint} from "./endpoints/albums/actions/UpdateAlbumFullEndpoint.ts";
import {GetTracksEndpoint} from "./endpoints/tracks/GetTracksEndpoint.ts";
import {AddTrackToAlbumEndpoint} from "./endpoints/albums/actions/AddTrackToAlbumEndpoint.ts";
import {BandcampWorker} from "./utility/Bandcamp/BandcampWorker.ts";
import {SubmitReleaseEndpoint} from "./endpoints/submissions/SubmitReleaseEndpoint.ts";
import {GetArtistsEndpoint} from "./endpoints/artists/GetArtistsEndpoint.ts";
import {GetArtistEndpoint} from "./endpoints/artists/GetArtistEndpoint.ts";
import {UpdateArtistEndpoint} from "./endpoints/artists/UpdateArtistEndpoint.ts";
import {RoyaltiesByServiceEndpoint} from "./endpoints/statistics/RoyaltiesByServiceEndpoint.ts";
import {AddTotpMethodEndpoint} from "./endpoints/auth/totp/AddTotpMethodEndpoint.ts";
import {VerifyTotpEndpoint} from "./endpoints/auth/totp/VerifyTotpEndpoint.ts";
import {DeleteTotpMethodEndpoint} from "./endpoints/auth/totp/DeleteTotpMethodEndpoint.ts";
import {MfaStore} from "./utility/MFA/MfaStore.ts";
import {GetWebauthnChallengeEndpoint} from "./endpoints/auth/webauthn/GetWebauthnChallengeEndpoint.ts";
import {RegisterWebauthnMethodEndpoint} from "./endpoints/auth/webauthn/RegisterWebauthnMethodEndpoint.ts";
import {ChallengeStore} from "./utility/MFA/ChallengeStore.ts";
import {VerifyWebauthnMethodEndpoint} from "./endpoints/auth/webauthn/VerifyWebauthnMethodEndpoint.ts";
import {DeleteWebauthnMethodEndpoint} from "./endpoints/auth/webauthn/DeleteWebauthnMethodEndpoint.ts";
import {UpdateTotpMethodEndpoint} from "./endpoints/auth/totp/UpdateTotpMethodEndpoint.ts";
import {MfaOptionsEndpoint} from "./endpoints/auth/MfaOptionsEndpoint.ts";
import {RoyaltiesByCountryEndpoint} from "./endpoints/statistics/RoyaltiesByCountryEndpoint.ts";
import {GetFileEndpoint} from "./endpoints/media/GetFileEndpoint.ts";
import {QuarterlyReportEndpoint} from "./endpoints/statistics/QuarterlyReportEndpoint.ts";

config();

// @ts-ignore
BigInt.prototype.toJSON = function () {
    const int = Number.parseInt(this.toString());
    return int ?? this.toString();
};

const neededEnvVars = ["SESSION_SECRET", "SUBMISSION_MAILS", "MARIADB_SESSION_DB", "MARIADB_HOST", "MARIADB_PORT", "MARIADB_USER",
    "MARIADB_PASSWORD", "MARIADB_NAME", "COOKIE_DOMAIN", "CORS_ORIGINS", "MAIL_HOST", "MAIL_PORT", "MAIL_SECURE",
    "MAIL_USER", "MAIL_PASSWORD", "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET"];
let missingEnvVars = neededEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
}

const db = new TriDB();
await ensureDatabaseConsistency(db);

configureDBLogging(db);

const app = express();
const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? [];
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
setupPassport(app, db);

app.use(passport.initialize());
app.use(passport.session(<SessionOptions>{}));
app.use(express.json({
    limit: "100mb"
}));

const rateLimitWindowInMin = 1;
app.use(rateLimit({
    windowMs: rateLimitWindowInMin * 60 * 1000,
    limit: 500,
    message: `Too many requests, please try again in ${rateLimitWindowInMin} minutes.`,
    validate: {
        xForwardedForHeader: false
    }
}));

const mfaStore = new MfaStore();
const challengeStore = new ChallengeStore();

// region Artists
new GetArtistsEndpoint(app, "/artists/get", db).register();
new GetArtistEndpoint(app, "/artists/byName", db).register();
new UpdateArtistEndpoint(app, "/artists/update", db).register();
// endregion

// region Users
new MfaOptionsEndpoint(app, "/mfa/options", db, mfaStore).register();
new MfaRequestEndpoint(app, "/mfa/request", db, mfaStore).register();
new LoginEndpoint(app, "/user/actions/login", db, mfaStore, challengeStore).register();
new LogoutEndpoint(app, "/user/actions/logout").register();
new ChangePasswordEndpoint(app, "/user/actions/change-password", db).register();
new RequestPasswordResetEndpoint(app, "/user/actions/request-password-reset", db).register();
new ResetPasswordEndpoint(app, "/user/actions/reset-password", db).register();
new GetUserEndpoint(app, "/user/get", db).register();
new GetUsersEndpoint(app, "/users/get", db).register();
new UpdateUserEndpoint(app, "/user/actions/update", db).register();
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
new GetTracksEndpoint(app, "/tracks/get", db).register();
new CreateTrackEndpoint(app, "/tracks/create", db).register();
new DeleteTrackEndpoint(app, "/tracks/actions/delete", db).register();
new UpdateTrackFullEndpoint(app, "/tracks/actions/update", db).register();
// endregion

// region Albums
new GetAlbumEndpoint(app, "/albums/byId", db).register();
new GetAlbumsEndpoint(app, "/albums/get", db).register();
new CreateAlbumEndpoint(app, "/albums/actions/new", db).register();
new AddTrackToAlbumEndpoint(app, "/albums/actions/addTrack", db).register();
new RemoveTrackFromAlbumEndpoint(app, "/albums/actions/removeTrack", db).register();
new UpdateAlbumFullEndpoint(app, "/albums/actions/update", db).register();
// endregion

// region Media
new UploadMediaEndpoint(app, "/media/upload", db).register();
new GetImageEndpoint(app, "/media/image", db).register();
new DeleteMediaEndpoint(app, "/media/delete", db).register();
new GetFileEndpoint(app, "/media/file", db).register();
// endregion

// region Statistics
new RoyaltiesByMonthEndpoint(app, "/statistics/royaltiesByMonth", db).register();
new RoyaltiesByYearEndpoint(app, "/statistics/royaltiesByYear", db).register();
new RoyaltiesByTrackEndpoint(app, "/statistics/royaltiesByTrack", db).register();
new RoyaltiesByArtistEndpoint(app, "/statistics/royaltiesByArtist", db).register();
new RoyaltiesByServiceEndpoint(app, "/statistics/royaltiesByService", db).register();
new RoyaltiesByCountryEndpoint(app, "/statistics/royaltiesByCountry", db).register();
new QuarterlyReportEndpoint(app, "/statistics/quarterlyReport", db).register();
// endregion

// region Payments
new GetPaymentsEndpoint(app, "/payments/get", db).register();
new GetAvailablePaymentAmountEndpoint(app, "/payments/available", db).register();
new RequestPaymentEndpoint(app, "/payments/request", db).register();
// endregion

// region Search
new SearchUsersEndpoint(app, "/search/users", db).register();
new SearchTracksEndpoint(app, "/search/tracks", db).register();
new SearchAlbumsEndpoint(app, "/search/albums", db).register();
// endregion

// region Logs
new GetLogsEndpoint(app, "/logs/get", db).register();
// endregion

// region Data
new ImportDataEndpoint(app, "/data/import", db).register();
new AddDataEndpoint(app, "/data/add", db).register();
// endregion

// region Submissions
new SubmitReleaseEndpoint(app, "/submissions/create").register();
// endregion

// region Webhooks
new PaypalEventsWebhookEndpoint(app, "/webhooks/paypal", db).register();
// endregion

// region MFA
new AddTotpMethodEndpoint(app, "/totp/add", db).register();
new VerifyTotpEndpoint(app, "/totp/verify", db, mfaStore).register();
new DeleteTotpMethodEndpoint(app, "/totp/delete", db).register();
new UpdateTotpMethodEndpoint(app, "/totp/update", db).register();

new GetWebauthnChallengeEndpoint(app, "/webauthn/challenge", challengeStore).register();
new RegisterWebauthnMethodEndpoint(app, "/webauthn/register", db, challengeStore).register();
new VerifyWebauthnMethodEndpoint(app, "/webauthn/verify", db, challengeStore).register();
new DeleteWebauthnMethodEndpoint(app, "/webauthn/delete", db, challengeStore).register();
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

const port = parseInt(process.env.PORT ?? "8080");
app.listen(port, () => {
    CLI.info(`Server is running on port http://localhost:${port}`);
});

//await setupNgrok(port);

const bandcampWorker = new BandcampWorker(db);
bandcampWorker.run();
