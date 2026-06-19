export class FareModel {
  Price: number;
  TicketType: string;
  IsMinPrice:boolean;
  TicketClass: string;
  MinPrice: boolean;
  Currency:string;
  OfferId: number;
  ServiceId: number;
  AvailableTicket:number;
  TicketDescription:string;
  TicketRestriction:string;
  FareDetails: FareDetails[];
  FareList: any;
  IsSeatAvailable:boolean;
  TicketTypeCode: string;
  TicketTypeName: string;
  ValidityInformation: string;
  IsLimited: boolean;
  IsRailCardAvailableForFare: boolean;
  }

  export class FareDetails {
    Price: number;
    BasePrice: number;
    Currency: string;
    Railcard: string;
    FarePerson: string;
    IsCheck: boolean;
    TicketType:string;
    TicketDescription:string;
    OfferId:number;
    ServiceId:number;
  }
