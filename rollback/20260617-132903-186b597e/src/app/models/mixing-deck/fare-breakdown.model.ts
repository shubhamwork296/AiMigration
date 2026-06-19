import { EnhancedPriceBreakDownJourneyExtra } from "../enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";

export class FareBreakdownModel {
  JourneyType: string;
  IsReturnJourney: boolean;
  OutWardJourney: JourneyModel[];
  ReturnJourney: JourneyModel[];
  SeasonJourney: JourneyModel;
  FlexiJourney: JourneyModel;
  OutwardJourneyExtras: JourneyModel[];
  ReturnJourneyExtras: JourneyModel[];
  DeliveryDetails: JourneyModel[];
  DiscountPrice: number = 0;
  DiscountPercent:string;
  DiscountType: string;
  OutwardDepartureTime: string;
  OutwardArrivalTime: string;
  ReturnDepartureTime: string;
  ReturnArrivalTime: string;
  OutwardDuration: string;
  ReturnDuration: string;
  OutChanges: number;
  RetChanges: number;
  CreationDate: string;
  departureLocationName: string;
  arrivalLocationName: string;
  DepartureDate: string;
  ReturnDate: string;
  JourneyTotalPrice?: number;
  Adult?: number;
  Child?: number;
  EvoucherPrice?: number;
  XmlId?: string;
  OpenReturnExpiryDate?: string;
  IsPureReturnJourney?: boolean;
  OutwardJourneyExtrasPerPassenger: JourneyModel[];
  ReturnJourneyExtrasPerPassenger: JourneyModel[];
}

export class JourneyModel {
  Passenger: string;
  RailCard: string;
  PricePerPerson: number;
  TotalPrice: number;
  IsCheck: boolean;
  JourneyExtrasTitle: string;
  JourneyDeliveryTitle: string;
  ServiceId:number;
  OfferId:number;
  SolutionNodeRef: string;
  Departure?: string;
  TicketTypeName?: string;
}



