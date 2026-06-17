export class RefundDetailsRequestDto {
    TravelId: number;
    TravelSolutionId: number;
    CustomerKey: string;
    BookingReferenceNumber: number;
}

export class RefundDetailsResponseDto {
    NoOfAdult: number
    NoOfChild: number;
    RefundDetails: RefundResponseDetails[];
    OutwardDetails: RefundOutwardReturnDetailsDto;
    ReturnDetails: RefundOutwardReturnDetailsDto;
    RefundSummary: RefundSummary;
    IsReturnJourney: boolean;
    DeliveryModeName: string;
    PaymentMode: string;
    GACouponCode: string;
}

export class RefundResponseDetails {
    TicketPrice: number;
    Discount: number;
    Price: number;
    IsRefundable: boolean;
    IsRailcardApplied: boolean;
    IsOutward: boolean;
    IsAdult: boolean;
    OfferId: number;
    RetOfferId: number;
    TravelId: number;
    TravelSolutionId: number;
    AdminFee: number;
    IsRefunded: boolean;
    ReservedSeat: string;
    BikeOfferServiceId: number;
    RetBikeOfferServiceId: number;
    IsTravelExtraExists: boolean;
    Selected: boolean;
    TravelExtraName: string;
    OfferServiceId: number;
    NonRefundablePrice: number;
}

export class RefundSummary {
    TotalPrice: number;
    AdminFee: number;
    eTicket: number;
    RefundAmount: number;
    NonRefundablePrice: number;
}

export class RefundOutwardReturnDetailsDto {
    TravelType: string;
    TravelDate: string;
    Changes: number;
    TicketType: string;
    TicketClass: string;
    Duration: string;
    Price: number;
    Currency: string;
    DepartureDateTime: string;
    ArrivalDateTime: string;
    Operator: number;
    SaleCompany: string;
    DepartureId: number;
    ArrivalId: number;
    DepartureLocationName: string;
    ArrivalLocationName: string;
    OperatorChange: number;
    ArrivalTime: string;
    DepartureTime: string;
    RailCardList: RailCardModel[];
}

export class ProcessOrderRequestDto {
    TravelId: number;
    CustomerKey: string;
    Email: string;
    TravelSolutionId: number;
    PartialRefund: boolean;
    PostSaleData: PostSaleData[];
    IsReturnJourney: boolean;
}

export class PostSaleData {
    OfferId: number;
    RetOfferId: number;
    TravelId: number;
    TravelSolutionId: number;
    BikeOfferServiceId: number;
    RetBikeOfferServiceId: number;
}

export class ProcessOrderResponseDto {
    TravelId: number;
    TravelSolutionId: number;
    TicketStatus: string;
}
export class RailCardModel {
    RailCard: string;
    RailCardCount: number;
}