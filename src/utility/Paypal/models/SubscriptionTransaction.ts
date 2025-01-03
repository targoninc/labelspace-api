import {PaypalPaymentStatus} from "./PaypalPaymentStatus.js";
import {AmountWithBreakdown} from "./AmountWithBreakdown.js";
import {PaypalPerson} from "./PaypalPerson.js";

export interface SubscriptionTransaction {
    status: PaypalPaymentStatus;
    id: string;
    amount_with_breakdown: AmountWithBreakdown;
    payer_name: PaypalPerson;
    payer_email: string;
    /** Pattern: `^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])[T,t]([0-1][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)([.][0-9]+)?([Zz]|[+-][0-9]{2}:[0-9]{2})$` */
    time: string;
}