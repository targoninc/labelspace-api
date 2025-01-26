import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Request, Response} from "express";
import {WebAuthN} from "../../../utility/MFA/WebAuthN.ts";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";
import {CLI} from "../../../utility/CLI.ts";
import {WebauthnVerificationRequest} from "../../../utility/MFA/WebauthnVerificationRequest.ts";
import {PostEndpoint} from "../../base/PostEndpoint.ts";

export class VerifyWebauthnMethodEndpoint extends PostEndpoint {
    private readonly db: TriDB;
    private readonly challengeStore: ChallengeStore;

    constructor(app: Application, path: string, db: TriDB, challengeStore: ChallengeStore) {
        super(app, path);
        this.db = db;
        this.challengeStore = challengeStore;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const request = req.body as WebauthnVerificationRequest;
        if (!this.challengeStore.hasUncompletedChallenge(request.challenge)) {
            return res.status(401).send({error: "Challenge not found"});
        }

        const publicKey = await this.db.getPublicKey(request.verification.id);
        if (!publicKey) {
            return res.status(401).send({error: "Public key not found"});
        }

        try {
            await WebAuthN.verifyChallenge(request.challenge, request.verification, publicKey);
            this.challengeStore.completeChallenge(request.challenge);
        } catch (e: any) {
            CLI.error(e);
            return res.status(401).send({error: "Invalid challenge"});
        }

        return res.status(200).send({
            message: "Successfully registered passkey"
        });
    }
}
