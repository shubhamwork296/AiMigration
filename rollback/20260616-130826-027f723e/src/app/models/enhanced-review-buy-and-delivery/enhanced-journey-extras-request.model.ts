export class EnhancedJourneyExtrasRequest {
    ReviewBuyCache: string;
    JourneyCreationDate: string;
    IsSeason: boolean;
    IsNreBasket: boolean;
    IsAddTravelExtra: boolean;
    TravelExtraList: TravelExtraList[];
    OutwardReservation: string;
    ReturnReservation: string;
    IsReserved: boolean;
    Title: string;
    Name: string;
    Surname: string;
    IsAdult: boolean;
}

export class TravelExtraList {
    OfferId: number;
    ServiceId: number;
    SelectCount: number;
    IsReturn: boolean;
    SolutionNodeRef: string;
    OfferedServiceId: string;
    OldSolutionNodeRef: string;
    IsAddTravelExtra: boolean;
    extraType? : string;
}