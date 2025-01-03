import {PaypalPerson} from "./PaypalPerson.js";
import {PaypalShippingAddress} from "./PaypalShippingAddress.js";

export interface PaypalSubscriber {
    email_address: string;
    payer_id: string;
    name: Partial<PaypalPerson>;
    shipping_address: PaypalShippingAddress;
}