import {PaypalAmount} from "./PaypalAmount.js";
import {PaypalCycleExecution} from "./PaypalCycleExecution.js";

export interface PaypalBillingInfo {
    outstanding_balance: PaypalAmount;
    cycle_executions: PaypalCycleExecution[];
    next_billing_time: string;
    failed_payments_count: number;
}