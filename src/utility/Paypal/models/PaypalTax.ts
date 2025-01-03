export interface PaypalTax {
    inclusive: boolean;
    /** Pattern: `^((-?[0-9]+)|(-?([0-9]+)?[.][0-9]+))$` */
    percentage: string;
}