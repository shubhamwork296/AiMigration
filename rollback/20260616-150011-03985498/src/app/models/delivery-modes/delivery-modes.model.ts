import { GeneralInformation, SmartCardDetails } from '../account/my-payment-vouchers.model';
import { LocationMasterData } from '../master/location-master.model';
import { Address, CustomerAddress } from '../payment-details/billing-address-response.model';

export class DeliveryModeRequest {
  DeliveryCache :string;
  reviewBuyCache : string;
  DeliveryMode: string;
  DeliveryType: string;
  CollectStationId: number;
  ReservationCache:string;
  UserEmail:string;
  PreviousCache:string;
  isSeason:boolean;
  Address: Address;
  Name: string;
  Surname: string;
  Title: string;
  CustomerKey:string;
  IsNreBasket: boolean;
  SmartCardDelivery: SmartCardInfo[];
  GeneralInformation: GeneralInformation;
  IsFlexi: boolean;
  journeyCreationDate : Date;
  IsAdult: boolean; //PICO-2150 added a property for check passanger added to smart card adult or child
  LatestJourneyCache: string;
}


export class SmartCardInfo
{
  SmartCardNumber:string;
  SmartCardNumberText:string;
  SmartCardNumberSelectedOption:string;
  LocationId:string;
  LocationName:string;
  IsAdult:boolean;
  IsAddedSmartcard:boolean;
  IsLoadStationAvailable:boolean;
  xmlId?: string;
  newSmartCardAdded?: boolean;
  isEnterSmartVisible?: boolean;
}

export class CancelOrderSmartCard {
  ReviewBuyCache: string;
  JourneyCreationDate: string;
}

export class DeliveryMode {
  TotalPrice:string;
  Currency:string;
  DeliveryCache :string;
  DeliveryMode: DeliveryOption[];
  CollectFromStation: LocationMasterData[];
  Addresses :CustomerAddress[];
  IsNreBasket: boolean;
  SmartCardLocation: LocationMasterData[];
  SmartCardDetails :SmartCardDetails[];
  IsOrderSmartCard:boolean;
  IsTvmAvailableForTod: boolean; //PICO-1741 added a property for TOD to display available TVM on delivery page
  IsSmartCardAvailable: boolean;
  IsDeliveryModesAvailable: boolean;
  IsGoldCardAvailable: boolean;
}

export class DeliveryOption {
  DeliveryMode: string;
  Price: number;
  Currency:string;
  IsHide: boolean;
}

export class SmartCardValidationRequest{
  SmartCardNumber:string;
  IsAdult: boolean; //PICO-2150 added a property for check passanger added to smart card adult or child
}
export class SmartCardValidationResponse{
  IsValidate:boolean;
  SmartCardMessage:string
}

export class DataLayerAddToCartItemType {
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
  upsell_taken: string | undefined;
  upsell_item: any | undefined;
  feature: string | undefined;
  booking_reference: string | undefined;
  travel_extras: string | undefined;
  discount_type: string | undefined;
  delivery_method: string | undefined;
  quick_buy: string | undefined;
  item_category4: string | undefined;
  available_classes: string | undefined;
  coach: string | undefined;
  name: string | undefined;
  seat_position: string | undefined;
  seat_direction: string | undefined;
  seat_preferences: string | undefined;
  status: string | undefined;
  delivery_option: string | undefined;
  shipping: number | undefined;
  column_index: number | undefined;
}
