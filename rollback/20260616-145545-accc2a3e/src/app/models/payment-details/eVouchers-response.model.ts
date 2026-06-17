export class EVouchersResponse {
    Vouchers: VoucherDetail[];
    VoucherMessage: string;
}

export class VoucherDetail {
    VoucherId: string;
    FraudCode: string;
    ExpiryDate: string;
    Price: number;
    Currency: string;
    Usage: string;
}
