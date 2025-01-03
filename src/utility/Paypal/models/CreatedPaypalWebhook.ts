import {PaypalResourceLink} from "./PaypalResourceLink.js";
import {PaypalWebhookEventType} from "./PaypalWebhookEventType.js";

export interface CreatedPaypalWebhook {
    id: string;
    url: string;
    event_types: PaypalWebhookEventType[];
    links: PaypalResourceLink[];
}
