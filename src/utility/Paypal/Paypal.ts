import {SubscriptionTransactionsResponse} from "./models/SubscriptionTransactionsResponse.js";
import {ListPlansResponse} from "./models/ListPlansResponse.js";
import {CreatedPaypalWebhook} from "./models/CreatedPaypalWebhook.js";
import {PaypalWebhookList} from "./models/PaypalWebhookList.js";
import type {PaypalBatchHeader} from "./models/PaypalBatchHeader.ts";
import type {PaypalPayoutItem} from "./models/PaypalPayoutItem.ts";
import type {PaypalBatchPayoutResponse} from "./models/PaypalBatchPayoutResponse.ts";
import {PAYPAL_API_BASE_URL} from "../Constants.js";

let bearerToken: string|null = null;

export class Paypal {
    static async authenticate() {
        if (!process.env.PAYPAL_CLIENT_ID) {
            throw new Error("Missing PayPal client id");
        }
        if (!process.env.PAYPAL_CLIENT_SECRET) {
            throw new Error("Missing PayPal secret");
        }

        const res = await fetch(`${PAYPAL_API_BASE_URL}/oauth2/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)
            },
            body: "grant_type=client_credentials"
        });
        if (res.status !== 200) {
            throw new Error("Failed to initialize PayPal, status code " + res.status);
        }
        const data = await res.json();
        bearerToken = data.access_token;
    }

    static async callEndpoint(method: string, endpoint: string, body: any = null, expectsResponse = false, isRetry = false): Promise<any> {
        const res = await fetch(`${PAYPAL_API_BASE_URL}/${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + bearerToken
            },
            body: body ? JSON.stringify(body) : null
        });
        if (res.status === 401 || res.status === 403) {
            if (isRetry) {
                throw new Error("Calling PayPal endpoint failed twice - giving up");
            }
            await Paypal.authenticate();
            return await Paypal.callEndpoint(method, endpoint, body, expectsResponse, true);
        }
        if (!res.ok) {
            console.log(await res.text());
            throw new Error(`Failed to call PayPal endpoint ${endpoint}, status code ` + res.status);
        }
        if (!expectsResponse) {
            return undefined;
        }
        return await res.json();
    }

    static async callEndpointWithResponse<T>(method: string, endpoint: string, body: any = null): Promise<T> {
        return await Paypal.callEndpoint(method, endpoint, body, true) as T;
    }

    /**
     * Cancels a subscription
     * @param id The subscription id (e.g. P-123456789)
     * @param reason The reason for the cancellation
     */
    static async cancelSubscription(id: string, reason: string) {
        return await Paypal.callEndpoint("POST", "billing/subscriptions/" + id + "/cancel", {
            reason
        });
    }

    /**
     * Suspends a subscription
     * @param id The subscription id (e.g. P-123456789)
     * @param reason The reason for the suspension
     */
    static async suspendSubscription(id: string, reason: string) {
        return await Paypal.callEndpoint("POST", "billing/subscriptions/" + id + "/suspend", {
            reason
        });
    }

    /**
     * Activates a subscription that was previously suspended
     * @param id The subscription id (e.g. P-123456789)
     * @param reason The reason for the reactivation
     */
    static async activateSubscription(id: string, reason: string) {
        return await Paypal.callEndpoint("POST", "billing/subscriptions/" + id + "/activate", {
            reason
        });
    }

    /**
     * Lists all transactions made for a given subscription
     * @param id
     */
    static async listSubscriptionTransactions(id: string) {
        return await Paypal.callEndpointWithResponse<SubscriptionTransactionsResponse>("GET", "billing/subscriptions/" + id + "/transactions");
    }

    static async listPlans() {
        return await Paypal.callEndpointWithResponse<ListPlansResponse>("GET", "billing/plans");
    }

    static async createWebhook(url: string | null) {
        return await Paypal.callEndpointWithResponse<CreatedPaypalWebhook>("POST", "notifications/webhooks", {
            url,
            event_types: [{
                name: "*"
            }]
        });
    }

    static async deleteWebhook(id: string) {
        return await Paypal.callEndpoint("DELETE", "notifications/webhooks/" + id);
    }

    static async listWebhooks() {
        return await Paypal.callEndpointWithResponse<PaypalWebhookList>("GET", "notifications/webhooks");
    }

    static async createBatchPayout(items: PaypalPayoutItem[], batchHeader: PaypalBatchHeader) {
        return await Paypal.callEndpointWithResponse<PaypalBatchPayoutResponse>("POST", "payments/payouts", {
            sender_batch_header: batchHeader,
            items
        });
    }
}