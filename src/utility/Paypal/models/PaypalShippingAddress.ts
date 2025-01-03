import {PaypalPerson} from "./PaypalPerson.js";
import {PaypalAddress} from "./PaypalAddress.js";

export interface PaypalShippingAddress {
    name: Partial<PaypalPerson>;
    address: PaypalAddress;
}