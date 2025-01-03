import {PaypalAmount} from "./PaypalAmount.js";

export interface AmountWithBreakdown {
    gross_amount: PaypalAmount;
    total_item_amount: PaypalAmount;
    fee_amount: PaypalAmount;
    shipping_amount: PaypalAmount;
    tax_amount: PaypalAmount;
    net_amount: PaypalAmount;
}