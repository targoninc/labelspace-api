import {SubscriptionTransaction} from "./SubscriptionTransaction.js";
import {PaypalResourceLink} from "./PaypalResourceLink.js";

export interface SubscriptionTransactionsResponse {
    transactions: SubscriptionTransaction[];
    total_items: number;
    total_pages: number;
    links: PaypalResourceLink[];
}