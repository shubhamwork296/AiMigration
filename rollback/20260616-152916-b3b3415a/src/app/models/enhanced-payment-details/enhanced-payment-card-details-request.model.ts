export class EnhancedUpdatePaymentCardsDto {
  CustomerKey: string;
  PaymentCards: EnhancedPaymentCard[];
}

export class EnhancedPaymentDetailResponse {
    Vouchers: EnhancedVoucherDetail[];
    VoucherMessage: string;
    BillingAddress: EnhancedBillingDetailsResponse
    PaymentModes: string[];
    ReviewBuyCache: string;
    PaymentCards: EnhancedPaymentCard[];
    IsBasketJourneyValid:boolean= false;
    BasketJourneyMessage:string;
    GpayEnabled: boolean;
    ApayEnabled: boolean;
}

export class EnhancedVoucherDetail {
    VoucherId: string;
    FraudCode: string;
    ExpiryDate: string;
    Price: number;
    Currency: string;
    Usage: string;
}

export class EnhancedBillingDetailsResponse {
    Addresses: EnhancedCustomerAddress[];
  }
  export class EnhancedCustomerAddress {
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

export class EnhancedPaymentCard {
  BillingAgreementId: string;
  CardNumber: string;
  CardType: string;
  CardExpiry: string;
  CardExpiryWithMonthName: string;
  BusinessCard: boolean;
  CardTypeNumber: number;
  ExpirationMonth: number;
  ExpirationMonthSpecified: boolean;
  ExpirationYear: number;
  ExpirationYearSpecified: boolean;
  TraceChainId: string;
  TranslatedFundingPan: string;
  Par: string;
}

export class EnhancedChangeReplaceResponseDto
{
    PaymentDetailResponse: EnhancedPaymentDetailResponse;
    AdminFee: AdminFee;
    EvaluateCache: string;
}

export class AdminFee
{
    Amount: number;
    Currency: number;
}
