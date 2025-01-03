export interface PaypalCycleExecution {
    tenure_type: string;
    sequence: number;
    cycles_completed: number;
    cycles_remaining: number;
    current_pricing_scheme_version: number;
    total_cycles: number;
}