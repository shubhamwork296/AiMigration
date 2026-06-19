import { RailCardModel } from './railcard.model';

export class SearchRequestModel {
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
  RailCardList: RailCardModel[];
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

export class COJSearchRequestModel {
  SearchRequestDto: SearchRequestModel
  CustomerKey: string;
  TravelId: number;
  TravelSolutionId: number;
  ReopenCache: string;
  PreviousJourneyTodRefNumber: string;
}

export class TicketInfoModel {
  ticketTypeCode: string;
}
// PICO-1870 created view_item event for GA4 data layer
export class DataLayerViewItemType {
  item_name: string | undefined;
  item_id: string | undefined;
  price: number | undefined;
  item_brand: string | undefined;
  item_category: string | undefined;
  item_category2: string | undefined;
  item_category3: string | undefined;
  item_category5: string | undefined;
  item_variant: string | undefined;
  item_list_name: string | undefined;
  item_list_id: number | undefined;
  index: number | undefined;
  start_date: string | undefined;
  end_date: string | undefined;
  duration: string | undefined;
  ticket_class: string | undefined;
  ticket_type: string | undefined;
  ticket_route_code: string | undefined;
  ticket_type_code: string | undefined;
  type: string | undefined;
  single_or_return: string | undefined;
  number_of_changes: number | undefined;
  additional_information: string | undefined;
  days_in_advance: number | undefined;
  railcard_code: string | undefined;
  railcard_used: boolean | undefined;
  adult_pax: number | undefined;
  child_pax: number | undefined;
  total_pax: number | undefined;
  start_time: string | undefined;
  end_time: string | undefined;
  operator: string | undefined;
  feature: string | undefined;
  booking_reference: string | undefined;
  quick_buy: string | undefined;
  column_index: number | undefined;
  origin: string | undefined;
  destination: string | undefined;
  available_classes: string | undefined;
  login_status: string | undefined;
  search_source: string | undefined;
  item_category4: string | undefined;
  price_from: number | undefined;
}

// added a search event model to pass as a param for GA4
export class GA4SearchEventParam {
  searchSource : string;
  searchSuccess : boolean;
  searchError : string;
}

export class COJDataLayerSelectItemType {
  item_name: string | undefined;
  item_id: string | undefined;
  price: number | undefined;
  item_brand: string | undefined;
  item_category: string | undefined;
  item_category2: string | undefined;
  item_category3: string | undefined;
  item_category5: string | undefined;
  item_variant: string | undefined;
  item_list_name: string | undefined;
  item_list_id: number | undefined;
  index: number | undefined;
  start_date: string | undefined;
  end_date: string | undefined;
  duration: string | undefined;
  ticket_class: string | undefined;
  ticket_type: string | undefined;
  ticket_route_code: string | undefined;
  ticket_type_code: string | undefined;
  type: string | undefined;
  single_or_return: string | undefined;
  number_of_changes: number | undefined;
  additional_information: string | undefined;
  days_in_advance: number | undefined;
  railcard_code: string | undefined;
  railcard_used: boolean | undefined;
  adult_pax: number | undefined;
  child_pax: number | undefined;
  total_pax: number | undefined;
  start_time: string | undefined;
  end_time: string | undefined;
  operator: string | undefined;
  feature: string | undefined;
  booking_reference: string | undefined;
}



