import {Application, NextFunction, Request, Response} from "express";
import {WebAuthN} from "../../../utility/MFA/WebAuthN.ts";
import {ChallengeStore} from "../../../utility/MFA/ChallengeStore.ts";
import {PostEndpoint} from "../../base/PostEndpoint.ts";

export class GetWebauthnChallengeEndpoint extends PostEndpoint {
    private readonly challengeStore: ChallengeStore;

    constructor(app: Application, path: string, challengeStore: ChallengeStore) {
        super(app, path);
        this.challengeStore = challengeStore;
    }

    async run(req: Request, res: Response, next: NextFunction) {
        const challenge = WebAuthN.generateChallenge();
        this.challengeStore.addChallenge(challenge);
        return res.status(200).send({
            challenge
        });
    }
}
