export class RouteDetailsResponse {
  TravelChanges: TravelChange[];
  DarwinText: [];
}

export class TravelChange{
  TravelSolutionName:string;
  Arrival: string;
  ArrivalTime: string;
  Departure: string;
  DepartureTime: string;
  RouteType:string;
  CallingPoints: CallingPoints[];
  Facilities: Facility[];
  SaleCompanyId : string;
  IsDelayed : string;
}

export class Facility {
  FacilityType: string;

}

export class CallingPoints {
  Location: string;
  ArrivalTime:string;
  DepartureTime:string;
  IsRouteLocation: boolean;
  IsDelay: boolean;
  DarwinArrivalTime: string;
  DarwinDepartureTime: string;
  IsBusReplacementAvailable: boolean;
}
