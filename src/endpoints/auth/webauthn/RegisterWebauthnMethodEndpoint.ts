import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {WebAuthN} from "../../../utility/MFA/WebAuthN.ts";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";
import {CLI} from "../../../utility/CLI.ts";
import {WebauthnRegistrationRequest} from "../../../utility/MFA/WebauthnRegistrationRequest.ts";
import {PublicKey} from "../../../models/db/tri/PublicKey.ts";

export class RegisterWebauthnMethodEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;
    private readonly challengeStore: ChallengeStore;

    constructor(app: Application, path: string, db: TriDB, challengeStore: ChallengeStore) {
        super(app, path);
        this.db = db;
        this.challengeStore = challengeStore;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        if (!req.user) {
            return res.status(401).send({error: "Not authenticated"});
        }

        const request = req.body as WebauthnRegistrationRequest;
        if (!this.challengeStore.hasUncompletedChallenge(request.challenge)) {
            return res.status(401).send({error: "Challenge not found"});
        }

        try {
            const registration = await WebAuthN.verifyRegistration(request.challenge, request.registration);
            this.challengeStore.completeChallenge(request.challenge);
            CLI.debug(`Registering passkey ${registration.credential.id} for user ${req.user.id}`);
            await this.db.createOrUpdatePublicKey(<PublicKey>{
                key_id: registration.credential.id,
                public_key: registration.credential.publicKey,
                algorithm: registration.credential.algorithm,
                passkey_user_id: req.user.passkey_user_id,
                name: request.name,
                transports: registration.credential.transports.join(", "),
                backed_up: false,
            });
        } catch (e: any) {
            CLI.error(e);
            return res.status(401).send({error: "Invalid challenge"});
        }

        return res.status(200).send({
            message: "Successfully registered passkey"
        });
    }
}
