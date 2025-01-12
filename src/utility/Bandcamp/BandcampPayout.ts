export interface BandcampPayout {
    date: string,
    paid_to: string,
    item_type: string,
    currency: string,
    transaction_fee: number,
    fee_type: string,
    item_total: number,
    amount_you_received: number,
    bandcamp_transaction_id: string,
    paypal_transaction_id: string,
}