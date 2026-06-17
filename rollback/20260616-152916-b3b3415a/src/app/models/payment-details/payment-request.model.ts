import { Address } from './billing-address-response.model';


export class PaymentPageRequest {
    ReviewBuyCache: string;
    BillingAddress: Address;
    Vouchers: Voucher[];
    FirstName: string;
    LastName: string;
    CustomerKey: string;
    Email: string;
    PaymentMethod: string;
    SaveCard: boolean;
    BillingAgreementId: string;
    PaymentId: string;
    ShopId: string;
    EvaluateCache: string;
    IsRenewSeason:boolean;
    UserName: string;
    IsCOJ: boolean;
    AuthToken:string;
    IsPostSale: boolean;
}

export class Voucher {
    VoucherId: string;
    FraudCode: string;
    Amount: number;
    Currency: string;
}
