import {SetupFeeFailureAction} from "./SetupFeeFailureAction.js";
import {PaypalAmount} from "./PaypalAmount.js";

export interface PaymentPreference {
    auto_bill_outstanding: boolean;
    setup_fee_failure_action: SetupFeeFailureAction;
    payment_failure_threshold: number;
    setup_fee: PaypalAmount;
}