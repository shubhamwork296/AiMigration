export class PaymentDetailResponse {
    Vouchers: VoucherDetail[];
    VoucherMessage: string;
    BillingAddress: BillingDetailsResponse
    PaymentModes: string[];
    ReviewBuyCache: string;
    PaymentCards: PaymentCard[];
    IsBasketJourneyValid:boolean= false;
    BasketJourneyMessage:string;
    GpayEnabled: boolean;
    ApayEnabled: boolean;
}

export class VoucherDetail {
    VoucherId: string;
    FraudCode: string;
    ExpiryDate: string;
    Price: number;
    Currency: string;
    Usage: string;
}

export class BillingDetailsResponse {
    Addresses: CustomerAddress[];
  }
  export class CustomerAddress {
    Address: Address;
    AddressType: string;
    IsDefault: boolean;
  }
  export class Address {
    Address1: string;
    Address2: string;
    Address3: string;
    PostCode: string;
    CountryCode: string;
    City: string;
    Country: string;
  }



export class PaymentCard {
  BillingAgreementId: string;
  CardNumber: string;
  CardType: string;
  CardExpiry: string;
  CardExpiryWithMonthName: string;
}
