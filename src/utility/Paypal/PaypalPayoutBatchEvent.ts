import type {PaypalPayoutBatchHeader} from "./PaypalPayoutBatchHeader.ts";
import type {PaypalResourceLink} from "./models/PaypalResourceLink.ts";

export interface PaypalPayoutBatchEvent {
    id: string;
    event_version: string;
    create_time: string;
    resource_type: string;
    event_type: string;
    summary: string;
    resource: {
        batch_header: PaypalPayoutBatchHeader;
        links: PaypalResourceLink[];
    };
    links: PaypalResourceLink[];
}