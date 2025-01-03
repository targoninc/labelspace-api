import {PaypalWebhookEvent} from "./models/PaypalWebhookEvent.js";
import {TriDB} from "../DB/TriDB.js";
import {PaypalSubscriber} from "./models/PaypalSubscriber.js";
import {CLI} from "../CLI.js";
import {PaypalBillingInfo} from "./models/PaypalBillingInfo.js";
import {PaypalResource} from "./models/PaypalResource.js";
import {SubscriptionStatus} from "../../models/enums/SubscriptionStatus.js";
import {PaypalSubscriptionStatus} from "./models/PaypalSubscriptionStatus.js";

export class PaypalWebhookHandler {
    private readonly db: TriDB;

    constructor(db: TriDB) {
        this.db = db;
    }

    async handle(event: PaypalWebhookEvent) {
        CLI.debug("Handling webhook event", {
            logToDb: true,
            info: {
                event
            }
        });
        const planId = event.resource.plan_id;
        const plan = await this.db.getPlanByExternalId(planId);
        if (!plan) {
            throw new Error(`Plan with external ID ${planId} not found`);
        }

        const subscriber = event.resource.subscriber;
        if (subscriber) {
            const userId = await this.db.getUserIdBySubscriptionId(event.resource.id);
            if (!userId) {
                throw new Error(`User with external subscription ID ${event.resource.id} not found`);
            }
            await this.handleSubscriberData(subscriber, userId);
        }

        const subscription = await this.db.getSubscriptionByExternalId(event.resource.id);
        if (subscription) {
            await this.updateSubscription(event.resource);

            if (event.resource.billing_info) {
                await this.handleBillingInfo(event.resource.id, event.resource.billing_info);
            }
        } else {
            throw new Error(`Subscription with external ID ${event.resource.id} not found`);
        }
    }

    async handleBillingInfo(subscriptionId: string, billingInfo: PaypalBillingInfo) {
        const logInfo = {
            logToDb: true,
            info: {
                subscriptionId,
                billingInfo
            }
        };
        CLI.debug("Handling billing info", logInfo);
        const nextBillingTime = new Date(billingInfo.next_billing_time);
        await this.db.updateSubscriptionByExternalId(subscriptionId, nextBillingTime, billingInfo.outstanding_balance.value, billingInfo.outstanding_balance.currency_code);
        CLI.success("Billing info updated", logInfo);
    }

    async handleSubscriberData(subscriber: PaypalSubscriber, userId: number) {
        const logInfo = {
            logToDb: true,
            info: {
                userId,
                subscriber
            }
        };
        CLI.debug("Updating subscriber data", logInfo);
        await this.db.addOrUpdatePaypalUser(subscriber.payer_id, userId, subscriber.name.given_name, subscriber.name.surname, subscriber.email_address);
        CLI.success("Subscriber data updated", logInfo);
    }

    private async updateSubscription(resource: PaypalResource) {
        const logInfo = {
            logToDb: true,
            info: {
                resource
            }
        };
        CLI.debug("Updating subscription", logInfo);
        const statusMap: Record<PaypalSubscriptionStatus, SubscriptionStatus> = {
            [PaypalSubscriptionStatus.Created]: SubscriptionStatus.created,
            [PaypalSubscriptionStatus.ApprovalPending]: SubscriptionStatus.pending,
            [PaypalSubscriptionStatus.Active]: SubscriptionStatus.active,
            [PaypalSubscriptionStatus.Inactive]: SubscriptionStatus.cancelled,
            [PaypalSubscriptionStatus.Suspended]: SubscriptionStatus.cancelled,
            [PaypalSubscriptionStatus.Expired]: SubscriptionStatus.cancelled,
        };
        const newStatus = statusMap[resource.status];
        if (!newStatus) {
            CLI.error(`Unknown subscription status ${resource.status}`);
            throw new Error(`Unknown subscription status ${resource.status}`);
        }

        await this.db.updateSubscriptionStatusByExternalId(resource.id, newStatus);
        CLI.success("Subscription updated", logInfo);
    }
}