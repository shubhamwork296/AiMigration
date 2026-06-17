export class EnhancedFareModel {
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
    FareDetails: EnhancedFareDetails[];
    FareList: any;
    IsSeatAvailable:boolean;
    TicketTypeCode: string;
    TicketTypeName: string;
    ValidityInformation: string;
    IsLimited: boolean;
    FareDescription: [];
    InOffer: boolean;
    IsRailCardAvailableForFare: boolean;
    IsRailSale : boolean;
    }
  
    export class EnhancedFareDetails {
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
  