import {AuthenticatedPostEndpoint, AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {WebAuthN} from "../../../utility/MFA/WebAuthN.ts";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";

export class AddWebauthnMethodEndpoint extends AuthenticatedPostEndpoint {
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

        const challenge = WebAuthN.generateChallenge();
        this.challengeStore.addChallenge(challenge);
        return res.status(200).send({
            challenge
        });
    }
}
