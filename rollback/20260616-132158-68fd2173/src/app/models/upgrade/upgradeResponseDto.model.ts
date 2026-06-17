import { SearchResponseModel } from "../mixing-deck/search-response.model";

export class UpgradeResponseDto {
      SearchResponse : UpgradeSearchResponse;
      DeliveryMode: string;
      TravelId: number;
      TravelSolutionId: number;
      OldOutwardPrice: number;
      OldReturnPrice: number;
      ReopenCache: string;
      PreviousJourneyTodRefNumber: string;
}

export class UpgradeSearchResponse {
    CorrelationId: number;
    SingleTravel: SearchResponseModel;
    ReturnTravel: SearchResponseModel;
    IsNoResultsForChangesFilters: number;
    ChangesFilterMessage: string;
    IsNoResultsForOperartorFilters: number;
    OperartorFilterMessage: string;
    SeatUpgradeMessage: string;
    IsPostSalesUpgrade: boolean;
}

export class DataLayerUpgardeItemType {
    event: string | undefined;
    feature: string | undefined;
    booking_reference: string | undefined;
    search_term: string | undefined;
    start_date: string | undefined;
    end_date: string | undefined;
    journey_avoid: string | undefined;
    return_time: string | undefined;
    return_timing: string | undefined;
    duration: string | undefined;
    origin: string | undefined;
    destination: string | undefined;
    travel_class: string | undefined;
    travel_type: string | undefined;
    travel_route_code: string | undefined;
    travel_type_code: string | undefined;
    journey_type: string | undefined;
    single_or_return: string | undefined;
    number_of_changes: string | undefined;
    additional_information: string | undefined;
    days_in_advance: number | undefined;
    railcard_code: string | undefined;
    railcard_used: string | undefined;
    adult_pax: number | undefined;
    child_pax: number | undefined;
    total_pax: number | undefined;
    original_coach: string | undefined;
    original_seat: string | undefined;
    price: number | undefined;
    message: string | undefined;
    success: string | undefined;
    search_source : string | undefined;
    search_error : string | undefined;
    type: string | undefined;
    railcard_present: any | undefined;
    journey_via: string | undefined;
    outbound_time:string | undefined;
    outbound_timing:string | undefined;
  }