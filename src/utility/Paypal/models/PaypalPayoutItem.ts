import {PaypalRecipientType} from "./PaypalRecipientType.ts";
import type {PaypalAmount} from "./PaypalAmount.ts";
import type {AlternateNotificationMethod} from "./AlternateNotificationMethod.ts";
import type {VenmoApplicationContext} from "./VenmoApplicationContext.ts";
import {PaypalPayoutPurpose} from "./PaypalPayoutPurpose.ts";

export interface PaypalPayoutItem {
    recipient_type?: PaypalRecipientType;
    note?: string;
    receiver: string;
    sender_item_id?: string;
    recipient_wallet?: string;
    amount: PaypalAmount;
    alternate_notification_method?: AlternateNotificationMethod;
    notification_language?: string;
    application_context?: VenmoApplicationContext;
    purpose?: PaypalPayoutPurpose;
}