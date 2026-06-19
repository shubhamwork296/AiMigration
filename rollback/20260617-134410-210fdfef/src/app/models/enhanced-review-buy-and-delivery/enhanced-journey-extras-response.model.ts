export class EnhancedTravelExtraResponseDto {
    ReviewBuyCache: string;
    reservationResponse: ReservationResponse;
}

export class ReservationResponse {
    CreateReservationResponse: string;
    IsBlock: boolean;
    IsReviewMergedFlowEnabled: boolean;
    ReservationCache: boolean;
    ReservationMessage: boolean;
    ReturnBike: BikeDetail;
    OutwardBike: BikeDetail;
}

export class BikeDetail {
    BicycleCount: number;
    OfferId: number;
    ServiceId: number;
}