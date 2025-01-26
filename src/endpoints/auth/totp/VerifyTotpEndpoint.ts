import {AuthenticatedRequest} from "../../base/AuthenticatedPostEndpoint.ts";
import {TriDB} from "../../../utility/DB/TriDB.ts";
import {Application, NextFunction, Response} from "express";
import {TOTP} from "../../../utility/MFA/TOTP.ts";
import {MfaStore} from "../../../utility/MFA/MfaStore.ts";
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
        const {userId, token, type} = req.body;
        if (!userId || userId === 0) {
            return res.status(400).send({error: "No user id provided"});
        }
        if (!token || token.trim().length === 0) {
            return res.status(400).send({error: "No token provided"});
        }

        switch (type) {
            case "totp":
                const userTotp = await this.db.getUserTotp(userId);
                if (!userTotp || userTotp.length === 0) {
                    return res.status(404).send({error: "MFA method not found"});
                }

                for (const totp of userTotp) {
                    if (TOTP.checkToken(token, totp.secret)) {
                        if (this.mfaStore.hasUncompletedMfaProcess(userId)) {
                            this.mfaStore.completeMfaProcesses(userId);
                        }
                        await this.db.verifyTotp(userId, totp.id);
                        return res.status(200).send({message: "MFA verified"});
                    } else {
                        const manualToken = TOTP.generateToken(totp.secret);
                        console.log(`current: ${token}, manual: ${manualToken}`);
                        console.error(`Invalid token for user ${userId}: ${token} (${totp.secret})`);
                    }
                }

                return res.status(400).send({error: "Invalid token"});
            case "email":
                const primaryEmail = await this.db.getUserPrimaryEmail(userId);
                if (!primaryEmail || !primaryEmail.verified) {
                    return res.status(401).send({error: "This case should never happen! Please contact us."});
                } else {
                    const user = await this.db.getUserById(userId);
                    const emailToken = user.email_mfa_code;
                    if (token !== emailToken) {
                        return res.status(400).send({error: "Invalid token"});
                    }

                    if (this.mfaStore.hasUncompletedMfaProcess(userId)) {
                        this.mfaStore.completeMfaProcesses(userId);
                    }

                    await this.db.updateUser(userId, {
                        email_mfa_code: ""
                    });
                    return res.status(200).send({message: "MFA verified"});
                }
            default:
                return res.status(400).send({error: "Invalid type"});
        }


    }
}