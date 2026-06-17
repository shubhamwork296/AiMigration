export class EnhancedRouteDetailsResponse {
    TravelChanges: EnhancedTravelChange[];
    DarwinText: [];
    IsReservationTabEnabled: boolean;
}

export class EnhancedTravelChange {
    TravelSolutionName: string;
    Arrival: string;
    ArrivalTime: string;
    Departure: string;
    DepartureTime: string;
    RouteType: string;
    CallingPoints: EnhancedCallingPoints[];
    Facilities: EnhancedFacility[];
    SaleCompanyId: string;
    IsDelayed: string;
    InLegSeatReservationEnable: boolean;
}

export class EnhancedFacility {
    FacilityType: string;

}

export class EnhancedCallingPoints {
    Location: string;
    ArrivalTime: string;
    DepartureTime: string;
    IsRouteLocation: boolean;
    IsDelay: boolean;
    DarwinArrivalTime: string;
    DarwinDepartureTime: string;
    IsBusReplacementAvailable: boolean;
}
