import {PaypalPlanStatus} from "./PaypalPlanStatus.js";
import {PaypalResourceLink} from "./PaypalResourceLink.js";
import {PaymentPreference} from "./PaymentPreference.js";
import {PaypalTax} from "./PaypalTax.js";

export interface PaypalPlan {
    id: string;
    product_id: string;
    name: string;
    status: PaypalPlanStatus;
    description: string;
    billing_cycles: any[];
    quantity_supported: boolean;
    links: PaypalResourceLink[];
    payment_preferences: PaymentPreference[];
    taxes: PaypalTax;
    create_time: string;
    update_time: string;
}