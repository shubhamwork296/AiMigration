export class PaymentResponse {
    AuthorizationUrl: string;
    OrderId: number;
    TravelId: number;
    Status: string;
    StatusMessage: string;
    IsBasketJourneyValid: boolean;
    BasketJourneyMessage: string;
    ReviewBuyCache: string;
}
