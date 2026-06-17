import { JourneyExtrasDetail, ReservationSeat, DeliveryDetail } from '../review-buy/review-buy-model';
import { CustomerAddress } from '../payment-details/billing-address-response.model';
import { TravelSolutionModel } from '../mixing-deck/travel-solution.model';
import { SearchRequestModel } from '../mixing-deck/search-request.model';
import { FareModel } from '../mixing-deck/fare.model';
import { JourneyExtras } from '../journey-extras/reservation.model';
import { JourneyExtraDetail } from '../journey-extras/journey-extras-response.model';

// --- Customer booking list --//
export class CustomerBookingRequest{
    CustomerKey: string;
    BookingType: string;
    StatusFilter: string;
    PageNo: number;
}

export class CustomerBookings{
    JourneyList: JourneyDetails[];
    IsMoreJourneyExists : boolean;
    TotalJourney : number;
    IsVatReceiptEnabled : boolean;
    IsUserVerified : boolean;
}

export class JourneyDetails{
    OutwardTicketInfo: TicketInfo;
    ReturnTicketInfo: TicketInfo;
    BookingDate: string;
    BookingId: string;
    JourneyType: string;
    Status: string;
    TravelId: number;
    TravelSolutionId: number;
    EntitlementId: string[];
    IsEticket: boolean;
    IsRenewAvailable: boolean;
    IsRefundable: boolean;
    ShowMoreOptions: boolean;
    ShowDownloadOptions: boolean;
    BookingPrice: number;
    OpenReturnMassage:string;
    IsInternalRefundable: boolean;
    DeliveryModeName: string;
    VatReceiptDetails: VatReceiptDetails;
    ReferenceNumber?: string;
}

// --- Buy Again --//
export class BuyAgainRequestDto{
    TravelId: number;
    TravelSolutionId: number;
}

export class BuyAgainResponseDto
{
   DepartLocationId: number;
   ArriveLocationId: number;
   DepartLocationName:string;
   ArriveLocationName: string;
   travellerDetails :TravellerDetails;
   Traveltype: string;
   TravelSolDirection: string;
   RailCardList: RailCardDto[];
}

export class TravellerDetails
{
  Adult: number;
  Children: number;
}

export class RailCardDto
{
   Name: string;
   Adult: number;
   Children: number;
}

// --- View Booking --//
export class BookingDetailsRequestDto{
    TravelId: number;
    TravelSolutionId: number;
    CustomerKey:string;
    IsRefunded: boolean;
    Status: string;
    BookingDate: string;
}

export class BookingDetailsResponseDto
{
    TicketDetail:TicketDetails
    RetTicketDetail:RetTicketDetail
    SeasonDetails: SeasonDetails;
    OutwardDetails:ReservationDetails;
    ReturnDetails:ReservationDetails;
    OutwardRouteDetails:RouteDetails;
    ReturnRouteDetails:RouteDetails;
    OutwardJourneyExtras:JourneyExtrasDetail[];
    ReturnJourneyExtras:JourneyExtrasDetail[];
    OutwardSeat:ReservationSeat[];
    ReturnSeat:ReservationSeat[];
    DeliveryDetail:DeliveryDetail[];
    PaymentSummaryList:PaymentSummary[];
    PaymentDetails:PaymentDetails;
    RefundSummary: RefundDetails;
    RefundJourneyDetails: RefundJourneyDetails;
    IsPromo: boolean;
    IsChangeDateTime: boolean;
    OutwardDeparture: string;
    ReturnDeparture: string;
    DepartureId: number;
    ArrivalId: number;
    IsPostSalesUpgrade: boolean;
    DepartureLocationName:string;
    ArrivalLocationName:string;
    IsAmendChangeSeat: boolean;
    IsAmendChangeDate: boolean;
    IsReturnTypeTicket: boolean;
    IsOutReservationAvailable: boolean;
    IsRetReservationAvailable: boolean;
    OutIsChangeDateTime: boolean;
    RetIsChangeDateTime: boolean;
    OutIsAmendChangeSeat: boolean;
    RetIsAmendChangeSeat: boolean;
    OutIsAmendChangeDate: boolean;
    RetIsAmendChangeDate: boolean;
    IsEticket: boolean;
    TravelSolutionCache : string;
    EntitlementId:string[];
    TravelSolutionId: number;
    TravelId: number;
    IsRefundable: boolean;
    JourneyStatus: string;
    IsBikeReservationPresent: boolean;
    IsTravelExtrasRefundable: boolean;
    IsPostSaleBikeOnlyReservationPresent: boolean; //PICO-2171 Add messaging when customers uses COJ with post adding bike reservation
    PreviousJourneyTodRefNumber: string;
    IsPlusBusOrLondonTravelCardPresent: boolean;
    GACouponCode: string;
    PaymentMode:string;
    IsComplimentaryDiscountApplied: boolean;
    IsUserVerified: boolean = true;
    IsInternalRefundable: boolean;
    OutIsCojNotAvailable: boolean;
    RetIsCojNotAvailable: boolean;
    DiscountPercentage: string;
    IsDiscountCodeAvailable: boolean;
    IsDiscountCodeAvailableOnOriginalJourney: boolean;
    VatReceiptDetails: VatReceiptDetails;
    IsVatReceiptEnabled: boolean;
}
export class RefundDetails
{
    TotalPrice: number;
    eTicket: number;
    AdminFee: number;
    RefundAmount: number;
}

export class RefundJourneyDetails
{
    OutJourneyString: string;
    OutStationString: string;
    OutPassengerString: string;
    RetJourneyString: string;
    RetStationString: string;
    RetPassengerString: string;
}

export class TicketDetails
{
    BookingReferenceNumber:string;
    TODReferenceNumber: string;
    TicketStatus:string;
    TicketClass:string;
    TravelType:string;
    TicketType:string;
    BookingDate:string;
    NoOfAdult:number;
    NoOfChild:number;
    RailCards:string;
    TrainTickets:number;
    PaymentMode:string;
    Currency:string;
    PaymentDetail:string;
    TotalAmount:number;
    DiscountPrice:number;
    DiscountCode:string;
    BookingType:string;
    TicketTypeCode:string;
    TicketDescription: string;
    TicketInformation: string;
    TicketRestriction: string;
    Operator : number;
    OperatorChange : number;
    SaleCompany : number;
    TotalAmountOut:number;
    RailCardList: RailCardModel[];
}

export class RetTicketDetail
{
    BookingReferenceNumber:string;
    TODReferenceNumber: string;
    TicketStatus:string;
    TicketClass:string;
    TravelType:string;
    TicketType:string;
    BookingDate:string;
    NoOfAdult:number;
    NoOfChild:number;
    RailCards:string;
    TrainTickets:number;
    PaymentMode:string;
    Currency:string;
    PaymentDetail:string;
    TotalAmount:number;
    DiscountPrice:number;
    DiscountCode:string;
    BookingType:string;
    TicketTypeCode:string;
    TicketDescription: string;
    TicketInformation: string;
    TicketRestriction: string;
    Operator : number;
    OperatorChange : number;
    SaleCompany : number;
    TotalAmountOut:number;
    RailCardList: RailCardModel[];
}

export class ReservationDetails
{
    TravelType:string;
    TravelDate:string;
    Changes:number;
    Duration:string;
    Price:number;
    Currency:string;
    DepartureDateTime: string;
    ArrivalDateTime: string;
    TicketClass: string;
    TicketType: string;
    Operator: number;
    SaleCompany: string;
    IsRefundable: boolean;
    IsRefunded: boolean;
    IsPartiallyRefunded: boolean;
    RefundDetails: OptimizedRefundDetails[];
    Brand: string;
    ServiceId: number;
}
export class SeasonDetails
{
    ValidFrom:string;
    ValidTill:string;
    ArrivalName:string;
    DepartureName:string;
    Currency:string;
    Duration:string;
    JourneyDescription:string;
    Price:number;
    IsFlexi:boolean;
    TicketCount:string;
}

export class RouteDetails
{
    TravelChanges: TravelChange[];
}

export class TravelChange
{
    TravelSolutionName:string;
    Arrival:string;
    ArrivalTime:string;
    Departure:string;
    DepartureTime:string;
    SaleCompanyId : string;
    IsDelayed : string;
}

export class PaymentSummary
{
    Price:string;
    Currency:string;
    Name:string;
    PaymentType:string;
    IsHundredPercentDiscountApplied: boolean;
}

// --- e-Ticket Download --//
export class EticketRequestDto{
    TravelId: number;
    OrderId: number;
    EntitlementId:string[];
    TravelSolutionId: number;
    IsPartialCoj: boolean;
}

export class EticketResponseList{
    Eticket: EticketResponse[];
}

export class EticketResponse{
    Content: string;
    Name: string;
    Text: string;
    DownloadedList: boolean;
}

export class PaymentDetails {
    Addresses: CustomerAddress;
    PaymentCardDetail: PaymentCardDetails;
    PaymentDetailsWithModeList: string[];
    Currency: string;
}

export class PaymentCardDetails {
    CardType: string;
    FirstName: string;
    LastName: string;
    CardNumber: string;
}

export class RenewSmartcardReqDto{
     TravelId:number;
 TravelSolutionId:number;
}

export class ConfirmRefundRequestDto
{
    TravelId: number;
    TravelSolutionId: number;
    CustomerKey: string;
    Email: string;
}

export class ChangeSeatRequestDto {
    TravelId: number;
    TravelSolutionId: number;
    Departure: string;
    Arrival: string;
    DepartureLocation: number;
    ArrivalLocation: number;
    IsOutward: boolean;
    IsSeatUpdated: boolean;
    ReviewBuyCache: string;
    IsReturnTypeTicket: boolean;
}

export class ReserveSeatRequestDto
{
    TravelId: number;
    TravelSolutionId : number;
    IsDateChange : boolean;
    ChangeDate : Date;
    retChangeDate : Date;
    NewSearchEarlierLaterRequestDto : NewSearchEarlierLaterRequestDto;
    retNewSearchEarlierLaterRequestDto : NewSearchEarlierLaterRequestDto;
    IsOutWard : boolean;
    DepartureLocation: number;
    ArrivalLocation: number;
    IsDatePickerDate: boolean;
    IsReturnTypeTicket: boolean;
    IsPartialReturnTypeTicket : boolean;
    ReopenTravelCache : string;
}

export class NewSearchEarlierLaterRequestDto
{
    TotalRecords: TravelSolutionModel[];
    PageNumber : number;
    PageSize : number;
    TravelSolReturned: number;
    LessRecordPage: number;
    SearchType : string;
    HideEarlier : boolean;
    HideLater : boolean;
    ReopenTravelCache : string;
    SearchchSimilarResponseCache : string;
    IsOutWard : boolean;
    Date: string;
    EarlierPageNumber: number;
    EarlierRecordCount: number;
    PreviousRecordExist: boolean;
    VisitedPastRecords: boolean;
}

export class SearchSimilarForDateResponseDto
{
    ReopenTravelCache : string;
    HideEarlier : boolean;
    HideLater  : boolean;
    SearchIndex : number;
    TravelSolCount  : number;
    IsOutWard  : boolean;
    TotalTravelSolutionList  : TravelSolutionModel[];
    TravelSolutionListToView   : TravelSolutionModel[];
    SearchRequestDto: SearchRequestModel;
    SearchchSimilarResponseCache: string;
    NewSearchEarlierLaterRequestDto : NewSearchEarlierLaterRequestDto;
    DateChangeNotAllowed: boolean;
    Message: string;
    IsPrioritySeat: boolean;
    Date: string;
    FareList: FareModel[];
    StartValidity: string;
    EndValidity: string;
    IsDateChangeEL: boolean;
    retSearchSimilarForDateResponseDto: SearchSimilarForDateResponseDto;
    retSearchchSimilarResponseCache: string;
    RetReopenTravelCache: string;
    ReturnOfferId: number;
    OutwardOfferId: number;
    ReturnCatlogServiceId: number;
    OutwardCatlogServiceId: number;
    RetTravelSolutionId: number;
}

export class EvaluateRequestDto
{
    TravelId: number;
    TravelSolutionId: number;
    ReopenTravelResponseCache: string;
    SearchchSimilarResponseCache: string;
    Departure: string;
    Arrival: string;
    DepartureLocation: number;
    ArrivalLocation: number;
    IsOutward: boolean;
    IsSeatUpdated: boolean;
    ReviewBuyCache: string;
    IsReturnTicketType: boolean;
    isReserveOnDiffTrain: boolean;
    ReturnTravelSolId: number;
    returnCatlogServiceId: number;
    deliveryMode: string;
    reopenTravelResponseCache: string;
    searchchSimilarResponseCache: string;
    ReturnSearchchSimilarResponseCache: string;
    ReturnTravelSolutionCache: string;
    OutwardTravelSolId: number;
    returnOfferId: number;
    outwardOfferId: number;
    outwardCatlogServiceId: number;
    Operator: string;
    IsPartialReturnTypeTicket: boolean;
}

export class PrepareOrderRequestDto {
    EvaluateCache: string;
    UpdateReservationResponseCache: string;
    Email: string; 
    IsOutward: boolean;
}

export class PrepareOrderAmendResponse {
    IsSuccess: boolean;
    TravelId: number;
    TravelSolutionId: number;
    OrderId: number;
    Status: string;
}

export class SeatPickerRequestDto {
        JourneyCreationDate: Date;
        ReviewBuyCache: string;
        Departure: string;
        Arrival: string;
        Traveldate: string;
        DepartureLocation: number;
        ArrivalLocation: number;
        IsOutward: boolean;
        IsFromViewBooking: boolean;
        evaluateCache: string;
}

export class OptimizedRefundDetails {
    OfferId: number;
    TravelId: number;
    IsRefunded: boolean;
    IsAdult: boolean;
    IsRailcardApplied: boolean;
    ReservedSeat: string;
}

export class PostSaleBikesRequestDto{
    TravelId: number;
    TravelSolutionId: number;
    CustomerKey: string;
}

export class PostSaleBikesResponseDto
{
    BikeDetails: JourneyExtraDetail[];
    ReopenCache: string;
    OutwardSearchBaseRequestCache: string;
    ReturnSearchBaseRequestCache: string;
}

export class EvaluateAndReservePostSaleBikeRequest
{
    travelSolutionId: number;
    reopenCache: string;
    outwardSearchBaseRequestCache: string;
    returnSearchBaseRequestCache: string;
    ChoosedTrainLeg: string;
    bikeOffers: JourneyExtras[];
}

export class VatRequestDTO
{
    BookingDate: string;
    Price: number;
    BookingReferenceNumber: string;
}

export class VatResponseDTO
{
    VatNumber: string;
    VatAddress : string;
    BookingDate: string;
    Price: number;
    BookingReferenceNumber: string;
    BookingTime: string;
}

export class TicketInfo {
    TravelDate: string;
    TravelEndDate: string;
    Description: string;
    TicketType: string;
    Passengers: string;
    TicketDescription: string;
    TicketInformation: string;
    TicketRestriction: string;
    TravelType: string;
    TrackMyTrain: TrackMyTrain;
}

export class RailCardModel {
    RailCard: string;
    RailCardCount: number;
}

export class DataLayerStandaloneBikeReservation {
    action: string | undefined;
    feature: string | undefined;
    booking_reference: string | undefined;
    collection_reference: string | undefined;
}

export class TrackMyTrain
{
    LastUpdatedTime: string;
    TrainLiveStatus : TrainLiveStatus;
    TrainLiveInfo : TrainLiveInfo;
    TrackMyJourneyInfoList: TrackMyJourneyInfo[];
}
export class TrainLiveStatus
{
    IsDelayed : boolean;
    IsCancelled : boolean;
    LastUpdated : Date;
    PlateformNo : string;
    RailReplacement : boolean;
    IsPlatformSuppress: boolean;
}
export class TrainLiveInfo
{
    OriginStationName : string;
    DestinationStationName : string;
    SeatReservationLevel : SeatReservationLevel;
    DelayReason : string;
    CancelReason : string;
    IsCancelled : boolean;
    IsPartialCancelled : boolean
    TrainLegList : TrainLegLiveInfo[];
    IsDelayed: boolean;
    IsAvantiTrainAvailable: boolean;
}
export class SeatReservationLevel
{
    TravelDirection : string;
    CoachCount : number;
    CoachInfoList : CoachInfo;
}
export class CoachInfo
{
    CoachName : string;
    IsFirstClass : boolean;
    SeatLevel : string;
}
export class TrainLegLiveInfo
{
    TrainOperatorName : string;
    IsCancelled : boolean;
    CallingPointList : CallingPointLiveInfo[];
    ShowSeatReservationLevel:boolean;
}
export class CallingPointLiveInfo
{
    StationName : string;
    EstimatedTime : string;
    WorkingTime : string;
    PlateFormNo : string;
    TotalDelayInMinutes : number;
    IsTrainDestination : boolean;
    IsTrainOrigin : boolean;
    NextTrainInMinutes : number;
    IsCancelled : boolean;
    IsDelayed : boolean;
    IsLastLocation : boolean;
    IsNextLocation : boolean;
    EstimatedDateTime: string;
    IsJourneyDestinationStation: boolean;
    IsJourneyOriginStation: boolean;
    WorkingDateTime: string;
    IsPlatformSuppress: boolean;
}
export class TrackMyJourneyInfo
 {
     RunDate : string;
     TrainUid : string;
     OriginCrsCode : string;
     DestinationCrsCode : string;
     OriginStationId : number;
     DestinationStationId : number;
     OriginDateTime: string;
     DestinationDateTime : string;
 }
export class RefreshTrackMyTrainRequest
{
    LastUpdatedTime : string;
    TrackMyJourneyInfoList : TrackMyJourneyInfo[];
}

export class StartVerifyEmailRequestDto {
    UserEmail: string;
    VerificationCode: string;
    CustomerKey: string;
}

export class StartVerifyEmailResponseDto {
    IsVerifyEmailSent: boolean;
    ErroMessage: string;
    InfoMessage: string;
    IsEmailVerifySuccess: string;
    MessageHeading: string;
    IsEmailAlreadyVerified: boolean;
}

export class BookingFilterJourneyRequest {
    StartDate: string;
    EndDate: string;
    CustomerKey: string;
    BookingType: string;
}

export class VatReceiptDetails {
    PDFBytes: string;
}
