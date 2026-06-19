export class CreateReservationRequest {
    EvaluateTravelCache: any;
    Preferences: string[];
    JourneyExtras: JourneyExtras[];
    OutwardReservation : string;
    ReturnReservation : string;
    IsSeason: boolean;
    Traveller: Traveller;
    IsReserved: boolean;
    IsNreBasket : boolean;
    NreBasket: string;
    SkipTravelExtraPage : boolean;
}
export class JourneyExtras {
    OfferId: number;
    ServiceId: number;
    SelectCount: number;
    IsReturn: boolean;
    SolutionNodeRef: string;
    OldSolutionNodeRef: string;
}
export class CreateReservationResponse {
    IsNreBasket: boolean;
    ReservationCache: string;
    ReservationMessage: string;
    IsBlock: boolean;
    OutwardBike: BicycleModel;
    ReturnBike: BicycleModel;
    IsReviewMergedFlowEnabled: boolean;
}
export class Traveller {
    Title: string;
    FirstName: string;
    LastName: string;
    PostCode: string;
    PhotoCardId: string;
}
export class BicycleModel {
    OfferId: number;
    ServiceId: number;
    BicycleCount: number;
}
