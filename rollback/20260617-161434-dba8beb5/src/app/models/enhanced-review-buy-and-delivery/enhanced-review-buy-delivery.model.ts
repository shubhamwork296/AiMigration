import { EnhancedDeliveryMode } from "../enhanced-delivery-modes/enhanced-delivery-mode-request.model";
import { RailCardModel } from "../mixing-deck/railcard.model";
import { AnnualGoldCardDetail, COJData, DeliveryDetail, JourneyDetail, JourneyExtrasDetail, OrderSmartCardInfoDetail, PaymentSummary, ReservationDetail, ReservationSeat, SeasonDetail, SelectedDeliveryAddress } from "../review-buy/review-buy-model";

export class EnhancedReviewBuyAndDeliveryResponse {
    ReviewBuyCache:string;
    BasketCount:number;
    IsCurrentJourneyValid:boolean;
    TotalPrice:number;
    Journey: EnhancedJourneyDetail[];
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
}

export class EnhancedRemoveJourneyRequest
{
  ReviewBuyCache:string;
  JourneyCreationDate:Date;
  IsNreBasket: boolean;
  Title: string;
  Name: string;
  Surname: string;
  IsAdult: boolean;
}

export class EnhancedDiscountResponse {
  ReviewBuyCache:string;
  IsInvalid:boolean;
  DiscountMessage: string;
  DiscountPrice:number;
  TotalDiscountPrice:number;
  DiscountCode: string;
}

export class EnhancedReviewBuyResponse {
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

export class EnhancedJourneyDetail{
  Journey:string;
  JourneyType:string;
  Departure:string;
  Arrival:string;
  CreationDate:string;
  OutwardDetail:ReservationDetail;
  ReturnDetail:ReservationDetail;
  OutwardSeat: ReservationSeat[];
  ReturnSeat: ReservationSeat[];
  OutwardJourneyExtras: JourneyExtrasDetail[];
  ReturnJourneyExtras: JourneyExtrasDetail[];
  DeliveryDetail:EnhancedDeliveryDetail[];
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
  DeliveryModesDto: EnhancedDeliveryMode;
  DiscountMessage: string;
  IsDiscountCodeInvalid: boolean;
  OrderSmartCardInfo?: OrderSmartCardInfoDetail;
  OutwardJourneyExtrasPerPassenger: EnhancedPriceBreakDownJourneyExtra[];
  ReturnJourneyExtrasPerPassenger: EnhancedPriceBreakDownJourneyExtra[];
}

export class EnhancedAddDiscountRequest {
  ReviewBuyCache: string;
  JourneyCreationDate: string;
  DiscountCode: string;
  IsAddDiscountCode: boolean;
  Title: string;
  Name: string;
  Surname: string;
  IsAdult: boolean;
}
export class EnhancedDeliveryDetail
{
  DeliveryModeName:string;
  DeliveryModeType: string;
  Price:number;
  Currency:string;
  FarePerson:string;
  IsOrderSmartCard:boolean;
  SmartCardNumber:string;
  SmartCardList:string[];
  Title: string;
  Name: string;
  Surname: string;
}

export class EnhancedPriceBreakDownJourneyExtra {
  JourneyExtraName:string;
  Price:number;
  BasePrice: number;
  NoOfAdult: number;
  NoOfChild: number;
  FarePerson:string;
  Departure: string;
}