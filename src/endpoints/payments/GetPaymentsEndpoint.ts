import {AuthenticatedGetEndpoint} from "../base/AuthenticatedGetEndpoint.ts";
import type {TriDB} from "../../utility/DB/TriDB.ts";
import {Application, Response} from "express";
import {AuthenticatedRequest} from "../base/AuthenticatedPostEndpoint.ts";
import {PaymentStatus} from "../../models/enums/PaymentStatus.ts";
import {Authenticator} from "../../models/Authenticator.ts";
import {Permissions} from "../../models/enums/Permissions.ts";

export class GetPaymentsEndpoint extends AuthenticatedGetEndpoint {
    private readonly db: TriDB;

    constructor(app: Application, path: string, db: TriDB) {
        super(app, path);
        this.db = db;
    }

    private parseOptionalQueryString(value: unknown) {
        if (typeof value !== "string") {
            return undefined;
        }

        const trimmedValue = value.trim();
        if (trimmedValue === "" || trimmedValue === "all" || trimmedValue === "undefined" || trimmedValue === "null") {
            return undefined;
        }

        return trimmedValue;
    }

    private parseDateQuery(value: unknown, key: string) {
        const dateValue = this.parseOptionalQueryString(value);
        if (!dateValue) {
            return undefined;
        }

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid ${key}`);
        }

        return date.toISOString();
    }

    private parseAmountQuery(value: unknown, key: string) {
        const amountValue = this.parseOptionalQueryString(value);
        if (!amountValue) {
            return undefined;
        }

        const amount = Number(amountValue);
        if (Number.isNaN(amount)) {
            throw new Error(`Invalid ${key}`);
        }

        return amount;
    }

    async run(req: AuthenticatedRequest, res: Response) {
        const user = req.user;
        const canViewAllPayments = await Authenticator.userHasPermission(user, Permissions.canViewLogs, this.db);
        const validStatuses = Object.values(PaymentStatus);
        const statusValue = this.parseOptionalQueryString(req.query.status);
        const userQuery = canViewAllPayments ? this.parseOptionalQueryString(req.query.userQuery) : undefined;
        if (statusValue && !validStatuses.includes(statusValue as PaymentStatus)) {
            return res.status(400).send({error: "Invalid payment status"});
        }

        let startTime: string | undefined;
        let endTime: string | undefined;
        let minAmount: number | undefined;
        let maxAmount: number | undefined;

        try {
            startTime = this.parseDateQuery(req.query.startTime, "start time");
            endTime = this.parseDateQuery(req.query.endTime, "end time");
            minAmount = this.parseAmountQuery(req.query.minAmount, "minimum amount");
            maxAmount = this.parseAmountQuery(req.query.maxAmount, "maximum amount");
        } catch (error) {
            return res.status(400).send({error: error instanceof Error ? error.message : "Invalid payment filter"});
        }

        if (startTime && endTime && startTime > endTime) {
            return res.status(400).send({error: "Start time must be before end time"});
        }

        if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
            return res.status(400).send({error: "Minimum amount must be less than or equal to maximum amount"});
        }

        const payments = await this.db.getPayments({
            userId: user.id,
            canViewAll: canViewAllPayments,
            status: statusValue as PaymentStatus | undefined,
            startTime,
            endTime,
            minAmount,
            maxAmount,
            userQuery,
        });

        return res.send(payments);
    }
}
