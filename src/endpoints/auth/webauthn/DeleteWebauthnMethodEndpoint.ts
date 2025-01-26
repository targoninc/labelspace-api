import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";
import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";

export class DeleteWebauthnMethodEndpoint extends AuthenticatedPostEndpoint {
    private readonly db: TriDB;
    private readonly challengeStore: ChallengeStore;

    constructor(app: Application, path: string, db: TriDB, challengeStore: ChallengeStore) {
        super(app, path);
        this.db = db;
        this.challengeStore = challengeStore;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const request = req.body as {
            key_id: string,
            challenge: string
        };
        if (!this.challengeStore.hasCompletedChallenge(request.challenge)) {
            return res.status(401).send({error: "Challenge not found"});
        }

        const publicKey = await this.db.getPublicKey(request.key_id);
        if (!publicKey) {
            return res.status(401).send({error: "Public key not found"});
        }

        this.challengeStore.removeChallenge(request.challenge);
        await this.db.deletePublicKey(request.key_id);

        return res.status(200).send({message: "Successfully deleted passkey"});
    }
}
