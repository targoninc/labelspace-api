import {AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {TOTP} from "../../../utility/TOTP/TOTP.ts";
import {MfaStore} from "../../../utility/MfaStore.ts";
import {PostEndpoint} from "../../base/PostEndpoint.ts";

export class VerifyTotpEndpoint extends PostEndpoint {
    private readonly db: TriDB;
    private readonly mfaStore: MfaStore;

    constructor(app: Application, path: string, db: TriDB, mfaStore: MfaStore) {
        super(app, path);
        this.db = db;
        this.mfaStore = mfaStore;
    }

    async run(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        const {userId, token} = req.body;
        if (!userId || userId === 0) {
            return res.status(400).send({error: "No user id provided"});
        }
        if (!token || token.trim().length === 0) {
            return res.status(400).send({error: "No token provided"});
        }

        const userTotp = await this.db.getUserTotp(userId);
        if (!userTotp || userTotp.length === 0) {
            return res.status(404).send({error: "TOTP method not found"});
        }

        for (const totp of userTotp) {
            if (TOTP.checkToken(token, totp.secret)) {
                if (this.mfaStore.hasUncompletedMfaProcess(userId)) {
                    this.mfaStore.completeMfaProcesses(userId);
                }
                await this.db.verifyTotp(userId, totp.id);
                return res.status(200).send({message: "TOTP verified"});
            } else {
                const manualToken = TOTP.generateToken(totp.secret);
                console.log(`current: ${token}, manual: ${manualToken}`);
                console.error(`Invalid token for user ${userId}: ${token} (${totp.secret})`);
            }
        }

        return res.status(400).send({error: "Invalid token"});
    }
}