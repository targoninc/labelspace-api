import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {WebAuthN} from "../../../utility/MFA/WebAuthN.ts";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";
import {CLI} from "../../../utility/CLI.ts";
import {WebauthnRegistrationRequest} from "../../../utility/MFA/WebauthnRegistrationRequest.ts";

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
        if (!this.challengeStore.hasChallenge(request.challenge)) {
            return res.status(401).send({error: "Challenge not found"});
        }

        try {
            await WebAuthN.verifyChallenge(request.challenge, request.registration);
        } catch (e: any) {
            CLI.error(e);
            return res.status(401).send({error: "Invalid challenge"});
        }

        return res.status(200).send({
            message: "Successfully registered WebAuthn method"
        });
    }
}
