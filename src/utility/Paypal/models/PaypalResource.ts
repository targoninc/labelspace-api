import {PaypalSubscriber} from "./PaypalSubscriber.js";
import {PaypalAmount} from "./PaypalAmount.js";
import {PaypalBillingInfo} from "./PaypalBillingInfo.js";
import {PaypalResourceLink} from "./PaypalResourceLink.js";

export interface PaypalResource {
    quantity: string;
    subscriber: PaypalSubscriber;
    create_time: string;
    plan_overridden: boolean;
    shipping_amount: PaypalAmount;
    start_time: string;
    update_time: string;
    billing_info: PaypalBillingInfo;
    links: PaypalResourceLink[];
    id: string;
    plan_id: string;
    status: string;
    status_update_time: string;
}