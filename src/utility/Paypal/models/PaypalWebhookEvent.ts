import {PaypalResource} from "./PaypalResource.js";
import {PaypalWebhookTransmission} from "./PaypalWebhookTransmission.js";
import {PaypalResourceLink} from "./PaypalResourceLink.js";

export interface PaypalWebhookEvent {
    id: string;
    create_time: string;
    resource_type: string;
    event_type: string;
    summary: string;
    resource: PaypalResource;
    status: string;
    transmissions: PaypalWebhookTransmission[];
    links: PaypalResourceLink[];
    event_version: string;
    resource_version: string;
}