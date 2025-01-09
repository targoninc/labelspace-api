import {PaypalRecipientType} from "./PaypalRecipientType.ts";
import type {AlternateNotificationMethod} from "./AlternateNotificationMethod.ts";
import type {VenmoApplicationContext} from "./VenmoApplicationContext.ts";
import {PaypalPayoutPurpose} from "./PaypalPayoutPurpose.ts";
import type {PaypalPayoutAmount} from "./PaypalPayoutAmount.ts";

export interface PaypalPayoutItem {
    recipient_type?: PaypalRecipientType;
    note?: string;
    receiver: string;
    sender_item_id?: string;
    recipient_wallet?: string;
    amount: PaypalPayoutAmount;
    alternate_notification_method?: AlternateNotificationMethod;
    notification_language?: string;
    application_context?: VenmoApplicationContext;
    purpose?: PaypalPayoutPurpose;
}