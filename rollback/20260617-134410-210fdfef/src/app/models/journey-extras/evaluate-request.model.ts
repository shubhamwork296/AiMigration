import { JourneyExtrasResponse } from "./journey-extras-response.model";
import { JourneyExtras } from "./reservation.model";

export class EvaluateTravelRequest {
  IsSeasonTicket: boolean;
  OutwardTravelSolId: number;
  OutwardTravelSolutionCache: string;
  OutwardOfferId: number;
  OutwardCatlogServiceId: number;
  ReturnTravelSolId: number;
  ReturnTravelSolutionCache: string;
  ReturnOfferId: number;
  ReturnCatlogServiceId: number;
  PreviousCache: string;
  OutwardSearchCustomCache: string;
  ReturnSearchCustomCache : string;
}

export class CojEvaluateTravelRequest {
  IsSeasonTicket: boolean ;
  OutwardTravelSolId: number;
  OutwardTravelSolutionCache: string;
  OutwardOfferId: number;
  OutwardCatlogServiceId: number;
  ReturnTravelSolId: number;
  ReturnTravelSolutionCache: string;
  ReturnOfferId: number;
  ReturnCatlogServiceId: number;
  CustomerKey: string;
  TravelId: number;
  TravelSolutionId: number;
  DeliveryMode: string;
  ReopenCache: string;
  JourneyExtras: JourneyExtras[];
  ChoosedTrainleg: string;
  IsPostSaleUpgrade: boolean;
  IsCOJWithTravelExtra: boolean;
  JourneyExtrasResponseDto: JourneyExtrasResponse;
  OutwardSearchCustomCache: string;
  ReturnSearchCustomCache: string;
  IsDiscountCodeAvailable: boolean;
  IsDiscountCodeAvailableOnOriginalJourney: boolean;
  DiscountCodeStatus: string;
}

export class DataLayerCheckoutItemType {
  value: number | undefined;
  item_name: string | undefined;
  item_id: string | undefined;
  price: number | undefined;
  quantity: number | undefined;
  item_brand: string | undefined;
  item_category: string | undefined;
  item_category2: string | undefined;
  item_category3: string | undefined;
  item_category5: string | undefined;
  item_variant: string | undefined;
  item_list_name: string | undefined;
  item_list_id: number | undefined;
  index: number | undefined;
  origin: string | undefined;
  destination: string | undefined;
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
  travel_extras: string | undefined;
  delivery_method: string | undefined;
  upsell_taken : string | undefined;
  upsell_item : string | undefined;
  quick_buy : string | undefined;
}