import { RailCardModel } from "../account/my-bookings.model";
import { EnhancedPriceBreakDownJourneyExtra } from "../enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { CustomerAddress } from "../payment-details/payment-details-response.model";

export class ReviewBuyResponse {
  ReviewBuyCache:string;
  BasketCount:number;
  IsCurrentJourneyValid:boolean;
  TotalPrice:number;
  Journey: JourneyDetail[];
  IsNreBasket: boolean;
  IsBasketJourneyValid: boolean;
  BasketJourneyMessage: string;
  IsRenewSmartcard:boolean;
  PromotionCode: string;
  COJData: COJData;
  IsDoubleDiscountEnabled: boolean;
  IsNoDeliveryForCurrentJourney?: boolean;
  LatestJourneyCache?: string;
  IsDeliveryAddedForJourney?: boolean;
  OrderSmartCardInfo?: OrderSmartCardInfoDetail;
}

export class CojReviewBuyResponse {
  ReviewBuyCache:string;
  BasketCount:number;
  IsCurrentJourneyValid:boolean;
  TotalPrice:number;
  Journey: JourneyDetail[];
  IsNreBasket: boolean;
  IsBasketJourneyValid: boolean;
  BasketJourneyMessage: string;
  IsRenewSmartcard:boolean;
  PromotionCode: string;
  COJData: COJData;
  IsSuccess: boolean;
  ErrorMessage: string;
  IsDoubleDiscountEnabled: boolean;
  IsDiscountCodeAvailable: boolean;
  DiscountCodeStatus: string;
  IsDiscountCodeAvailableOnOriginalJourney: boolean;
}
export class COJData {
  COJEvaluateCache: string;
  AdminFee: number;
  UpgradeMissingAmount: number;
  TotalRefundAmount: number;
  TotalDifference: number;
  TotalToPay: number;
}

export class DiscountResponse {
  ReviewBuyCache:string;
  IsInvalid:boolean;
  DiscountMessage: string;
  DiscountPrice:number;
  TotalDiscountPrice:number;
  DiscountCode: string;
}


export class JourneyDetail{
  Journey:string;
  JourneyType:string;
  Departure:string;
  Arrival:string;
  CreationDate:Date;
  OutwardDetail:ReservationDetail;
  ReturnDetail:ReservationDetail;
  OutwardSeat: ReservationSeat[];
  ReturnSeat: ReservationSeat[];
  OutwardJourneyExtras: JourneyExtrasDetail[];
  ReturnJourneyExtras: JourneyExtrasDetail[];
  DeliveryDetail:DeliveryDetail[];
  DiscountedPrice: number;
  DiscountCode:string;
  DiscountPercent:string;
  IsDiscountVisible:boolean;
  SeasonDeatil: SeasonDetail;
  ArrivalDate: Date;
  DepartureDate: Date;
  BookingDate: Date;
  Adult: number;
  Child: number;
  GACouponCode: string;
  GAJourneyType: string;
  Brand: string;
  CallingPointName: string;
  IsPromo: boolean;
  ReturnArrivalDate: Date;
  ReturnDepartureDate: Date;
  IsRailCardApplied: boolean;
  JourneyTotalPrice: number;
  DiscountType: string;
  PaymentSummaryList:PaymentSummary[];
  AnnualGoldCardDetail: AnnualGoldCardDetail;
  SelectedDeliveryAddress: SelectedDeliveryAddress;
  ReservationExpirationDateTime: Date;
  ExtendedReservationExpirationTime: number;
  RailCards:string;
  RailCardList: RailCardModel[];
  XmlId: string;
  PaymentSummaryDetails?: PaymentSummaryDetails;
  ShowDownloadOptions?: boolean;
  IsPureReturnJourney? : boolean;
  OutwardJourneyExtrasPerPassenger?: EnhancedPriceBreakDownJourneyExtra[];
  ReturnJourneyExtrasPerPassenger?: EnhancedPriceBreakDownJourneyExtra[];
}

export class ReservationDetail{
  TravelType:string;
  TravelDate:string;
  Changes:string;
  Duration:string;
  TicketType:string;
  Price:number;
  Currency:string;
  Fares: FareDetails[];
  TicketClass: string;
  GADuration: string;
  Brand: string;
  CallingPointName: string;
  DepartureTime: string;
  ArrivalTime: string;
  CojPrice: number;
  Operator: number;
  SaleCompany: string;
  OperatorChange: number;
  TicketDescription: string;
  TicketRestriction: string;
  DepartureTimeStart: string;
  ArrivalTimeStart: string;
  NoOfAdult: number;
  NoOfChild: number;
  PriceWithExtras: number;
  OpenReturnExpiryDate?: string;
}

export class ReservationSeat{
  Departure:string;
  Arrival:string;
  IsSeatPicker:boolean;
  DepartureLocation:number;
  ArrivalLocation:number;
  Seat:ReservationSegmentSeat[];
  IsUpdatePreferences: boolean;
  TrainNumber: string;
}

export class ReservationSegmentSeat{
  TravelType:string;
  CoachNumber:string;
  Seat:string;
  SeatFacing:string;
  SeatPosition:string;
  SeatType:string;
  CoachType:string;
  ReservationType:string;
  IsRefunded:boolean;
  NrsReferenceNumber: string;
  TrainNumber: string;
}

export class JourneyExtrasDetail
{
  JourneyExtraName:string;
  Price:number;
  Currency:string;
  Count: number;
  FarePerson:string;
  MaxPrice :number;
  MinPrice :number;
  Departure: string;
  IsRefunded :boolean;
  NoOfAdult :number;
  NoOfChild :number;
  OfferId? : number;
  ServiceId? : number;
  SolutionNodeRef? : string;
  IsSelected: boolean;
  IsBikeAvailabilityLimited: boolean;
}

export class DeliveryDetail
{
  DeliveryModeName:string;
  Price:number;
  Currency:string;
  FarePerson:string;
  IsOrderSmartCard:boolean;
  SmartCardNumber:string;
  SmartCardList:string[];
}

export class RemoveJourneyRequest
{
  ReviewBuyCache:string;
  JourneyCreationDate:Date;
  IsNreBasket: boolean;
}

export class DiscountRequest
{
  ReviewBuyCache:string;
  JourneyCreationDate:Date;
  DiscountCode:string;
  IsAddDiscountCode: boolean;
}

export class FareDetails {
  Price: number;
  BasePrice: number;
  Currency: string;
  Railcard: string;
  IsCheck: boolean;
  FarePerson: string;
}

export class SeasonDetail{
  ValidFrom:string;
  ValidTill:string;
  Price:number;
  BasePrice: number;
  RailCard: string;
  Currency:string;
  Duration:string;
  TicketType:string;
  TicketClass:string;
  TicketCount:string;
  IsFlexi:boolean;
  JourneyDescription:string;
  TotalPrice:number;
  IsCheck: boolean;
  JourneyTicketDescription: string;
  GADuration: string;
  PriceWithExtras: number;
}


export class BasketJourneyRequestDto {
  ReviewBuyCache:string;
  IsSeason:boolean;
  IsNreBasket: boolean;
  IsAmendChangeDate: boolean;
  IsChangeDate: boolean;
  RailCardPriceList: RailCardPriceList[];
  IsPostSale: boolean;
  EvaluateCache: string;
  IsDiscountCodeAvailableOnOriginalJourney: boolean;
  IsDiscountCodeAvailable: boolean;
}

export class DataLayerBasketItemType {
  // Product information - ecommerce variables
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
  // Product information - custom variables
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
  delivery_method : string | undefined;
  feature : string | undefined;
  booking_reference : string | undefined;
  travel_extras : string | undefined;
  quick_buy : string | undefined;
  available_classes: string | undefined;
  coach: string | undefined;
  seat_number: string | undefined;
  seat_position: string | undefined;
  seat_direction: string | undefined;
  seat_preferences: string | undefined;
  status: string | undefined;
  delivery_option: string | undefined;
  shipping: number | undefined;
  column_index: number | undefined;
}

export class DataLayerAddPaymentInfoType extends DataLayerBasketItemType {
  payment_type: string | undefined = undefined;
  discount: number = 0;
  travel_extras: string | undefined = undefined;
  delivery_option: string | undefined = undefined;
}

export class DataLayerAddDeliveryOptionType extends DataLayerBasketItemType {
  travel_extras: string | undefined = undefined;
  delivery_option: string | undefined = undefined;
  upsell_taken : string | undefined = undefined;
  upsell_item : string | undefined = undefined;
}

export class DataLayerRemoveFromCartType extends DataLayerBasketItemType {
  upsell_taken : string | undefined = undefined;
  upsell_item : any | undefined = undefined;
}

export class DataLayerBasketItemTypeForConfirmOrder extends DataLayerBasketItemType {
  travel_extras: string | undefined = undefined;
  delivery_method: string | undefined = undefined;
  upsell_taken : string | undefined = undefined;
  upsell_item : string | undefined = undefined;
  discount : number = 0;
}
export class DataLayerViewCartType extends DataLayerBasketItemType {
  upsell_taken : string | undefined = undefined;
  upsell_item : string | undefined = undefined;
  delivery_method : string | undefined;
}

export class PaymentSummary {
  Price:string;
  Currency:string;
  Name:string;
  PaymentType:string;
}
export class RailCardPriceList {
  CreationDate: Date;
  Outward: PriceAfterRailCard[];
  Return: PriceAfterRailCard[];
}

export class PriceAfterRailCard {
  BasePrice: number;
  FarePerson: string;
  Price: number;
  Railcard: string;
}

export class OrderSmartCardInfoDetail {
  Address: Address;
  CollectStationId: 0;
  GeneralInformation: GeneralInformation;
  Name: string;
  Surname: string;
  Title: string;
}

export class Address {
  Address1: string;
  Address2: string;
  Address3: string;
  City: string;
  Country: string;
  CountryCode: string;
  FullAddress: string;
  PostCode: string;
}

export class GeneralInformation {
  DateOfBirth: string;
  LoadStation: string;
  Name: string;
  SmartcardNickName: string;
  Surname: string;
  Title: string;
}
export class AnnualGoldCardDetail{
  AnnualGoldCardDeliveryAddress: CustomerAddress;
  IsGoldCardAvailable: boolean;
}

export class SelectedDeliveryAddress {
  Address1: string;
  Address2: string;
  Address3: string;
  City: string;
  Country: string;
  CountryCode: string;
  FullAddress: string;
  PostCode: string;
}

export class PaymentSummaryDetails {
  PaidByCard: number;
  PaidByEVoucher: number;
  PaidByPaypal: number;
  PaidByGooglePay: number;
  PaidByApplePay: number;
  PaidIsPaidByMultipleEVoucherByCard: boolean;
}
