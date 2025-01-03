import {CLI} from "../CLI.js";
import {Request} from "express";
import {Paypal} from "./Paypal.js";
import {PaypalWebhookEvent} from "./models/PaypalWebhookEvent.js";

const verificationUrl = "notifications/verify-webhook-signature";

export const headerKeys = [
    "paypal-transmission-id",
    "paypal-transmission-time",
    "paypal-cert-url",
    "paypal-auth-algo",
    "paypal-transmission-sig",
];

export async function verifyPaypalWebhookEvent(event: PaypalWebhookEvent, request: Request & { rawBody: string }) {
    const headers = request.headers as Record<string, string>;
    if (!process.env.PAYPAL_WEBHOOK_ID) {
        CLI.error("No webhook id provided", {
            logToDb: true,
            info: {
                requestHeaders: headers,
            }
        });
        return false;
    }

    const verificationBody = {
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event
    };
    const body = await Paypal.callEndpointWithResponse<any>("POST", verificationUrl, verificationBody);

    if (body.verification_status !== "SUCCESS") {
        CLI.error("Failed to verify webhook event", {
            logToDb: true,
            info: {
                body,
                verificationBody,
                requestHeaders: headers,
            }
        });
        return false;
    }

    return true;
}