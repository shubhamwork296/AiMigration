import { EnhancedRailCardModel } from "./enhanced-railcard.model";

export class EnhancedSearchRequestModel {
  DepartureTimesStart: string;
  DepartureTimesStartShow: Date;
  ReturnTimesStart: string;
  ReturnTimesStartShow: Date;
  TravelSolutionDirection: string;
  DepartureLocation: number;
  ArrivalLocation: number;
  DepartureLocationName: string;
  ArrivalLocationName: string;
  PathConstraintLocation: number;
  PathConstraintType: string;
  Adult: number;
  Child: number;
  Traveltype: string;
  TraveltypeReturn: string;
  Searchtype: string;
  SearchCache:string;
  SearchIndex:number;
  IsReturnRequest:boolean;
  TravelSolCount:number;
  RailCardList: EnhancedRailCardModel[];
  // Season-Flexi start
  TravelEndDate: string;
  IsWeekly: boolean;
  IsMonthly: boolean;
  IsAnnual: boolean;
  IsCustom: boolean;
  IsYearly:boolean;
  IsSeason: boolean;
  IsFlexi: boolean;
  IsFlexiTicketSelected: boolean;
  // Season-Flexi end
  SearchtypeReturn: string;
  SearchCacheReturn:string;
  SearchIndexReturn:number;
  TravelSolCountReturn:number;
  TravellerId:string;
  PromotionCode: string;
  TicketClassFilter: string;
  ChangesFilter: number;
  OperaterFilter: number;
  ChoosedTrainleg: string;

  //COJ Earlier/Later
  IsCOJLater:boolean;
  IsCOJEarlier:boolean;
  JourneySearchType: string;
  // earlierLater Changes
  JourneySearchTypeReturn: string;

  FirstTrainDepartureTimesStart: any;
  LastTrainDepartureTimesStart: any;
  FirstTrainArrivalTimesStart: any;
  LastTrainArrivalTimesStart: any;

  // earlierLater Changes
  FirstTrainDepartureTimesStartReturn: any;
  LastTrainDepartureTimesStartReturn: any;
  FirstTrainArrivalTimesStartReturn: any;
  LastTrainArrivalTimesStartReturn: any;

  retainedSingleDepartureTimeStart:any;
  IsDiscountCodeAvailable: boolean;
  IsDiscountCodeAvailableOnOriginalJourney: boolean;
  OutwordDiscountCodeStatus: string;
  ReturnDiscountCodeStatus: string;
  IsComplimentaryDiscountApplied: boolean;
}

export class EnhancedTicketInfoModel {
  ticketTypeCode: string;
}

export class EnhancedTicketInformation {
  discounts: string;
  child: string;
  railCard: string;
  breakOfJourney: string;
  bookingDeadline: string;
  refundableTicket: string;
  nonRefundableTicket: string;
  nonRefundableTicketForFamily: string;

  forSeasonTicketTypeDescription: string;
  trainOperator: string;
  seasonTicketTypeRefunds: string;
  changeTravelPlan: string;
  conditions: string;
  isAvailability: string;
  isValidity: string;
  seasonBookingDeadline: string;
  seasonBreakOfJourney: string;
  forSeasonChild: string;
  breakOfJourneyOutward: string;
  breakOfJourneyReturn: string;
  validityDayOutward: string;
  validityDayReturn: string;
  validityTimeOutward: string;
  validityTimeReturn: string;
}