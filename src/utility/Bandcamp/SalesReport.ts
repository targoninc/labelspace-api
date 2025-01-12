import type {BandcampPayout} from "./BandcampPayout.ts";
import type {BandcampSale} from "./BandcampSale.ts";

export interface SalesReport {
    sales: BandcampSale[];
    payouts: BandcampPayout[];
}