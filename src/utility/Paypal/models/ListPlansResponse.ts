import {PaypalResourceLink} from "./PaypalResourceLink.js";
import {PaypalPlan} from "./PaypalPlan.js";

export interface ListPlansResponse {
    plans: PaypalPlan[];
    total_items: number;
    total_pages: number;
    links: PaypalResourceLink[];
}