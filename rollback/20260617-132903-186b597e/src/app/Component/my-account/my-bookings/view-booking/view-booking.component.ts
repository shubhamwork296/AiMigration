import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ResponseData } from 'src/app/models/common/response.model';
import { BookingDetailsRequestDto, BookingDetailsResponseDto, JourneyDetails, ReservationDetails, RouteDetails, SeasonDetails, TicketDetails, PaymentDetails, PaymentCardDetails, BuyAgainRequestDto, BuyAgainResponseDto, CustomerBookingRequest, ChangeSeatRequestDto, ReserveSeatRequestDto, NewSearchEarlierLaterRequestDto, SearchSimilarForDateResponseDto, PrepareOrderRequestDto, PrepareOrderAmendResponse, EticketRequestDto, EticketResponseList, RefundDetails, EticketResponse, PostSaleBikesResponseDto, EvaluateAndReservePostSaleBikeRequest, PostSaleBikesRequestDto, TicketInfo, StartVerifyEmailResponseDto, StartVerifyEmailRequestDto } from 'src/app/models/account/my-bookings.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { BookingTypeEnum, AppRouteEnum, BookPassangerAssistEnum, NotificationErrorMsg, CommonIconImg, JourneyTypeEnum, TicketTypeEnum, Ga4ItemListEnum, LocalStorageKeyEnum, Ga4DatalayeEventNameEnum, TravelSolutionDirectionEnum, DeliveryModeEnum, TravelSolutionJourneyTypeEnum, AppConstantsService } from 'src/app/utility/app-constants.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { Router, ActivatedRoute,  NavigationEnd } from '@angular/router';
import { TravelChange } from 'src/app/models/mixing-deck/route-details-response.model';
import { browserRefresh } from 'src/app/app-component/app.component'
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CustomerAddress } from 'src/app/models/payment-details/billing-address-response.model';
import { CommonServices } from 'src/app/services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { COJSearchRequestModel, GA4SearchEventParam, SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import * as moment from 'moment';
import { Overlay } from '@angular/cdk/overlay';
import { CojDatePickerPopupComponent } from '../coj-date-picker-popup/coj-date-picker-popup';
import { FormGroup,FormBuilder, FormControl } from '@angular/forms';
import { JourneyExtrasDetail, ReservationSeat } from 'src/app/models/review-buy/review-buy-model';
import { SeatpickerPopupComponent } from 'src/app/Component/review-and-buy/seatpicker-popup/seatpicker-popup.component';
import { SeatPickerResponseDto } from 'src/app/models/review-buy/seat-picker-model';
import { PrioritySeatPopupComponent } from '../priority-seat-popup/priority-seat-popup.component';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { downloadFile } from 'src/app/utility/download-file';

import { InfoPopupComponent } from 'src/app/Component/mixing-deck/info-popup/info-popup.component';
import { DisruptionServiceComponent } from 'src/app/Component/mixing-deck/disruption-service/disruption-service.component';
import { TicketInfoComponent } from 'src/app/Component/mixing-deck/ticket-info/ticket-info.component';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { PassengerJourneyDetails, PassengerReservationDetails, PassengerAssistRequest, PassengerAssistResponse, PassengerDetail } from 'src/app/models/payment-details/validate-payment-response.model';
import { DatePipe } from '@angular/common';
import { JourneyExtraDetail } from 'src/app/models/journey-extras/journey-extras-response.model';
import { JourneyExtras } from 'src/app/models/journey-extras/reservation.model';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { Subscription } from 'rxjs';


@Component({
    selector: 'app-view-booking',
    templateUrl: './view-booking.component.html',
    styleUrls: ['./view-booking.component.css'],
    standalone: false
})
export class ViewBookingComponent implements OnInit {
  responseData: ResponseData;
  bookingDetailsRequest: BookingDetailsRequestDto;
  bookingDetailsResponse: BookingDetailsResponseDto;
  journey: JourneyDetails;
  myBookingType: string = "Back to my trips";
  isSeason: boolean = false;
  browserRefresh: boolean;
  deliveryMode: string;
  isOutwardSeatExist: boolean = false;
  isReturnSeatExist: boolean = false;
  buyAgainResponseDto: BuyAgainResponseDto;
  customerBookingRequest: CustomerBookingRequest;
  displayTrainLegs: boolean = false;
  isshowTimeDateBtn: boolean = false;
  journeyDatesForm: FormGroup;
  isAnyTrainDateSelected: boolean = false;
  isOutwardJourney = true;
  isPastOutward: boolean = false;
  isPastReturn: boolean = false;
  Traveltype: string = '';
  TraveltypeReturn: string = '';
  DepartureTimesStart: string = '';
  ReturnTimesStart: string = '';
  isStartExceededReturnTime: boolean = false;
  isReturnBeforeStartTime: boolean = false;
  changeDateRequest: COJSearchRequestModel;
  eticketRequestDto: EticketRequestDto;
  eticketResponse: EticketResponseList;
  locations = [];
  isComingFromCOJChange: boolean =  false;
  isCOJ: string;
  isCojMessage: boolean;
  isshowUpgradeBtn: boolean = false;
  isUpgrade: string;
  isUpgradeMessage: boolean;
  isComingFromUpgradeChange = false;
  isShowTrainLegsOnReserveSeatOnDiffTrain = false;
  isShowTrainLegsOnChangeSeat = false;
  isAmendTrainLegSelected: boolean = false;
  selectedAmendLeg: ReservationSeat;
  isOutWardAmendLeg: boolean;
  currentAmendLegIndex: number;
  changeSeatRequest: ChangeSeatRequestDto;
  seatPickerResponse: SeatPickerResponseDto;
  reserveSeatRequest: ReserveSeatRequestDto;
  searchSimilarResponse: SearchSimilarForDateResponseDto;
  isAmend: string;
  prepareOrderAmendResponse: PrepareOrderAmendResponse;
  returnTicketNoteDescription = 'PLEASE NOTE - It is required that you change reservation for both outbound and return legs of your journey with this ticket type';
  isMultiLegOutward: boolean;
  isMultiLegReturn: boolean;
  hideHeaderFlag : boolean = true;
  step=0;

  isOutwardSelected: boolean = false;
  isReturnSelected: boolean = false;
  paymentCardNumber: string;
  maskedPaymentCardNumber: string;
  deductedPrice: string;
  refundSummary: RefundDetails;
  Status: string;
  inReturnPastJourney: boolean = false;
  inOutwardPastJourney: boolean = false;
  isRefunded: string;
  isRefundedMessage: boolean = false;
  shoMultipleDownloadBtn: boolean = false;
  isEditTravelExtras: boolean = false;
  sharedService: SharedService;
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  notificationService: NotificationService;
  myAccountService: MyAccountService;
  router: Router;
  route: ActivatedRoute;
  bookingTypeEnum: BookingTypeEnum;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  datalayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;
  passengerAssistRequest: PassengerAssistRequest;
  passengerDetail: PassengerDetail;
  journeyDetails: PassengerJourneyDetails;
  reservationDetails: PassengerReservationDetails;
  passengerAssistResponse: PassengerAssistResponse;
  datePipe: DatePipe;
  bookPassangerAssistEnum: BookPassangerAssistEnum;
  isBikeReservationExist: boolean;
  bicycleReservation: JourneyExtraDetail[];
  outwardBicycleReservation: boolean = false;
  returnBicycleReservation: boolean = false;
  selectedBicycle = '1';
  selectedBicycleReturn = '1';
  bikeOffers: Array<JourneyExtras> = [];
  postSaleBikesResponseDto: PostSaleBikesResponseDto;
  postBikeBooked: boolean = false;
  postBikeData: any;
  panelOpenState: boolean = false;
  confirmReservationBtn: boolean = false;
  notificationErrorMsg: NotificationErrorMsg;
  commonIconImg: CommonIconImg;
  journeyTypeEnum: JourneyTypeEnum;
  ticketTypeEnum: TicketTypeEnum;
  ga4DatalayeEventNameEnum: Ga4DatalayeEventNameEnum;
  
  ga4ItemListEnum: Ga4ItemListEnum;
  localStorageKeyEnum: LocalStorageKeyEnum;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  completeOrderService: CompleteOrderService;
  isDisplayVerifyEmail: boolean = false;
  startVerifyEmailRequestDto: StartVerifyEmailRequestDto;
  startVerifyEmailResponseDto: StartVerifyEmailResponseDto;
  outRailcardsListWithoutGroupSave: any = [];
  retRailcardsListWithoutGroupSave: any = [];
  outGroupSaveRailCard : boolean = false;
  retGroupSaveRailCard : boolean = false;
  subscription: Subscription;
  discountPaymentSummaryListArrayObject: any = [];
  travelExtrasPaymentSummaryListArrayObject: any = [];
  deliveryPaymentSummaryListArrayObject: any = [];
  deliveryModeEnum: DeliveryModeEnum;
  travelSolutionJourneyTypeEnum : TravelSolutionJourneyTypeEnum;
  appConstantService: AppConstantsService;
  showTicketOutsideArea : boolean = false;
  hideTicketOutsideArea : boolean = false;
  outRailcardsListWithGroupSave: any = [];
  retRailcardsListWithGroupSave: any = [];
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;

  constructor(private readonly formBuilder: FormBuilder, private readonly injector: Injector, private readonly cd: ChangeDetectorRef, public dialog: MatDialog, public overlay: Overlay) {

    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.notificationService = this.injector.get(NotificationService);
    this.myAccountService = this.injector.get(MyAccountService);
    this.router = this.injector.get(Router);
    this.route = this.injector.get(ActivatedRoute);
    this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.datalayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.datePipe = this.injector.get(DatePipe);
    this.bookPassangerAssistEnum = this.injector.get(BookPassangerAssistEnum);
    this.journey = this.sharedService.journey;
    this.bookingDetailsRequest = new BookingDetailsRequestDto();
    this.bookingDetailsResponse = new BookingDetailsResponseDto();
    this.bookingDetailsResponse.OutwardDetails = new ReservationDetails();
    this.bookingDetailsResponse.ReturnDetails = new ReservationDetails();
    this.bookingDetailsResponse.OutwardRouteDetails = new RouteDetails();
    this.bookingDetailsResponse.OutwardRouteDetails.TravelChanges = new Array<TravelChange>();
    this.bookingDetailsResponse.ReturnRouteDetails = new RouteDetails();
    this.bookingDetailsResponse.ReturnRouteDetails.TravelChanges = new Array<TravelChange>();
    this.bookingDetailsResponse.SeasonDetails = new SeasonDetails();
    this.bookingDetailsResponse.TicketDetail = new TicketDetails();
    this.bookingDetailsResponse.PaymentDetails = new PaymentDetails();
    this.bookingDetailsResponse.PaymentDetails.Addresses = new CustomerAddress();
    this.bookingDetailsResponse.PaymentDetails.PaymentCardDetail = new PaymentCardDetails();
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.journeyTypeEnum = this.injector.get(JourneyTypeEnum);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.ga4DatalayeEventNameEnum = this.injector.get(Ga4DatalayeEventNameEnum);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.completeOrderService = this.injector.get(CompleteOrderService);
    this.deliveryModeEnum = this.injector.get(DeliveryModeEnum);
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.appConstantService = this.injector.get(AppConstantsService);
    this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.subscription = this.commonService.passnegerAssistUrl$.subscribe(bookPassengerAssistUrl => {
      if (bookPassengerAssistUrl) {
        this.ga4dataLayerService.loadGALayerForBookPassangerAssist(bookPassengerAssistUrl, this.router.url);
      }
    });
  }


  ngOnInit() {
    this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
    this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false);
    localStorage.removeItem(this.localStorageKeyEnum.bookingRefrenceNumber);
    localStorage.setItem(this.localStorageKeyEnum.upgradeAboveFold, "false");
    this.datalayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    
    this.router.events.subscribe((event) =>{
      if (!(event instanceof NavigationEnd)){
        return;
      }
      window.scrollTo(0,0);
    });

    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.journey = sharedSiblingRefresh.journey;
        this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
      }
    }
    this.getMyBookingList(); 
    this.hideVerifyEmailSectionAfterSuccess();
  }

  hideVerifyEmailSectionAfterSuccess() {
    this.sharedService.getIsVerifyEmailSection().subscribe(res => {
      if (res) {
        this.isDisplayVerifyEmail = res;
      }
    });
  }
  
  // for check route calling points length
  checkRouteCallingPoints(route) {
    if (route?.CallingPoints) {
      if (route.CallingPoints.length > 0) {
        return route.CallingPoints.length - 1;
      } else {
        return route.CallingPoints.length + 1;
      }
    }
    return 1;
  }

  hidewarning(){
    this.isComingFromCOJChange = false;
    this.isComingFromUpgradeChange = false;
    this.isAmend = null;
  }
  getMyBookingList() {
    if (this.journey) {
      this.bookingDetailsRequest.TravelId = this.journey.TravelId;
      this.bookingDetailsRequest.TravelSolutionId = this.journey.TravelSolutionId;
      this.bookingDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
      this.bookingDetailsRequest.Status = this.journey.Status;
      this.bookingDetailsRequest.BookingDate = this.journey.BookingDate;
      
    }
    this.checkIfJourneyInUpgradeAmendCojOrRefundedProcess();
    this.updateJourneyAndBookingDetailsRequest();
    this.shoMultipleDownloadBtn = false;
    this.displayTrainLegs =  false;
    this.getBookingDetailsAPICall();
  }

  callGa4InCaseOfCOJUpgradeAndPostSale() {
    if (this.isCOJ) {
      this.ga4dataLayerService.loadGTMDataLayerPurchaseOnCojConfirmationTicket(this.bookingDetailsResponse);
    }
    if (this.isUpgrade) {
      this.ga4dataLayerService.loadGTMDataLayerPurchaseOnConfirmationForUpgrade(this.bookingDetailsResponse);
    }
    if (this.postBikeBooked) {
      this.ga4dataLayerService.loadGALayerForStandaloneBikeReservation(this.ga4DatalayeEventNameEnum.confirmationForBikeReservation, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.bookingDetailsResponse.TicketDetail.TODReferenceNumber);
    }
  }

  checkIfJourneyInUpgradeAmendCojOrRefundedProcess(){
    this.route.queryParamMap.subscribe((params) => {
      this.isRefunded = params.get('isRefunded');
    });

    this.route.queryParamMap.subscribe((params) => {
      this.isCOJ = params.get('isCoj');
    });
    this.route.queryParamMap.subscribe((params) => {
      this.isUpgrade = params.get('isUpgrade');
    });

    if(!this.isAmend) {
      this.route.queryParamMap.subscribe((params) => {
        this.isAmend = params.get('isAmend');
      });
    }
  }

  updateJourneyAndBookingDetailsRequest(){
    if(this.isCOJ || this.isUpgrade || this.isAmend) {
      let data = null;
      if(this.isAmend) {
        data = this.prepareOrderAmendResponse ? this.prepareOrderAmendResponse : JSON.parse(sessionStorage.getItem('AmendReserveResponse'));
        this.isComingFromCOJChange = false;
        this.isComingFromUpgradeChange = false;
        this.isRefundedMessage = false;
      }
      else if(this.isUpgrade) {
        data = this.storageDataService.getSessionStorageData('validatePaymentResponse', true);
        this.isComingFromUpgradeChange = true;
        this.isUpgradeMessage = data.IsSuccess;
        sessionStorage.removeItem("isUpgradeChange");
      }
      else if(this.isCOJ) {
        data = JSON.parse(localStorage.getItem('validatePaymentResponse'));
        this.isComingFromCOJChange = true;
        this.isCojMessage = data.IsSuccess;
        localStorage.removeItem("isCOJChange");
      } 
      this.sharedService.validatePaymentResponse = data;
      this.bookingDetailsRequest.TravelId = data.TravelId;
      this.bookingDetailsRequest.TravelSolutionId = data.TravelSolutionId;
      this.bookingDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
      this.bookingDetailsRequest.Status = data.Status;

      this.journey = new JourneyDetails();
      this.journey.OutwardTicketInfo = new TicketInfo();
      this.journey.Status = data.Status;
      this.journey.TravelId = data.TravelId;
      this.journey.TravelSolutionId = data.TravelSolutionId;
      this.journey.OutwardTicketInfo.TravelDate = data.TravelDate;
      this.commonService.loaderRequired = true;

      this.sharedService.journey = this.journey;
      this.setSharedCacheData();
    }
    else {
      this.isComingFromCOJChange = false;
      this.isComingFromUpgradeChange = false;
      this.isAmend = null;
      this.isRefundedMessage = false;
    }
    this.checkForIsRefunded();
    if(this.journey.Status === this.journeyTypeEnum.refundedJourney || this.Status === this.journeyTypeEnum.refundedJourney){
      this.bookingDetailsRequest.IsRefunded = true;
    }
    else{
      this.bookingDetailsRequest.IsRefunded = false;
    }
    if(this.postBikeBooked){
      this.setPostBikeReservationData();
    }
  }

  setPostBikeReservationData() {
    this.bookingDetailsRequest.TravelId = this.postBikeData.TravelId;
    this.bookingDetailsRequest.TravelSolutionId = this.postBikeData.TravelSolutionId;
    this.bookingDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.bookingDetailsRequest.Status = this.postBikeData.Status;
    if(!this.journey) {
      this.journey = new JourneyDetails();
    }    
    this.journey.Status = this.postBikeData.Status;
    this.journey.TravelId = this.postBikeData.TravelId;
    this.journey.TravelSolutionId = this.postBikeData.TravelSolutionId;
    this.sharedService.journey = this.journey;
    this.setSharedCacheData();
  }

  checkForIsRefunded(){
    if(this.isRefunded){
      this.bookingDetailsRequest.TravelId = +localStorage.getItem('RefundedTravelId');
      this.bookingDetailsRequest.TravelSolutionId = +localStorage.getItem('RefundedTravelSolutionId');
      this.bookingDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
      this.bookingDetailsRequest.Status = localStorage.getItem('RefundedTicketStatus');
      this.isRefundedMessage = true;
      this.journey = new JourneyDetails();
      this.journey.Status = this.bookingDetailsRequest.Status;
      this.journey.TravelId = this.bookingDetailsRequest.TravelId;
      this.journey.TravelSolutionId = this.bookingDetailsRequest.TravelSolutionId;
      this.commonService.loaderRequired = true;
    }
    else {
      this.isRefundedMessage = false;
    }
  }

  setSharedCacheData() {
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
  }

  disableJourneyTrackerButtonForPastAndRefundedJourney() {
    if (this.bookingDetailsResponse.TicketDetail.TicketStatus === this.journeyTypeEnum.pastJourneyType || this.bookingDetailsResponse.TicketDetail.TicketStatus === this.journeyTypeEnum.refundedJourney ||
      this.bookingDetailsResponse.TicketDetail.TicketStatus === this.journeyTypeEnum.outwardRefunded) {
      this.inOutwardPastJourney = true;
    } else {
      this.inOutwardPastJourney = false;
    }
    if (this.bookingDetailsResponse.RetTicketDetail != null) {
      if (this.bookingDetailsResponse.RetTicketDetail.TicketStatus === this.journeyTypeEnum.pastJourneyType || this.bookingDetailsResponse.RetTicketDetail.TicketStatus === this.journeyTypeEnum.refundedJourney ||
        this.bookingDetailsResponse.RetTicketDetail.TicketStatus === this.journeyTypeEnum.returnRefunded) {
        this.inReturnPastJourney = true;
      } else {
        this.inReturnPastJourney = false;
      }
    }
  }

  bindPaymentRelatedDetails() {
    if (this.bookingDetailsResponse.PaymentDetails != null) {
      if (this.bookingDetailsResponse.PaymentDetails.PaymentCardDetail)
        this.paymentCardNumber = this.bookingDetailsResponse.PaymentDetails.PaymentCardDetail.CardNumber;
      this.bookingDetailsResponse.PaymentDetails.PaymentDetailsWithModeList.forEach(paymentDetailWithMOdeLIst => {
        if (paymentDetailWithMOdeLIst.includes('CREDIT') || paymentDetailWithMOdeLIst.includes('PayPal')) {
          this.deductedPrice = paymentDetailWithMOdeLIst.split(' ')[0];
        }
      })
      if (this.paymentCardNumber)
        this.maskedPaymentCardNumber = this.paymentCardNumber.slice(0, 4) + this.paymentCardNumber.slice(4, this.paymentCardNumber.length - 4).replace(/\d/g, '*') + this.paymentCardNumber.slice(this.paymentCardNumber.length - 4);
    }
  }

  bindBookingDetails() {
    this.deliveryMode = this.bookingDetailsResponse.DeliveryDetail[0].DeliveryModeName;
    if (this.bookingDetailsResponse.TicketDetail.BookingType.toUpperCase() == this.bookingTypeEnum.NonSeason.toUpperCase()) {
      this.myBookingType = "My Trip";
      this.isSeason = false;
    }
    else if (this.bookingDetailsResponse.TicketDetail.BookingType.toUpperCase() == this.bookingTypeEnum.Season.toUpperCase()) {
      this.myBookingType = "My Season";
      this.isSeason = true;
    }
    else if (this.bookingDetailsResponse.TicketDetail.BookingType.toUpperCase() == this.bookingTypeEnum.FlexiSeason.toUpperCase()) {
      this.myBookingType = "My Flexi-Season";
      this.isSeason = true;
    }
    if (this.bookingDetailsResponse.OutwardSeat != null) {
      this.bookingDetailsResponse.OutwardSeat.forEach(outwardSeat => {
        if (outwardSeat.Seat != null && outwardSeat.Seat.length > 0) {
          this.isOutwardSeatExist = true;
        }
      })
    }

    if (this.bookingDetailsResponse.ReturnSeat != null) {
      this.bookingDetailsResponse.ReturnSeat.forEach(returnSeat => {
        if (returnSeat.Seat != null && returnSeat.Seat.length > 0) {
          this.isReturnSeatExist = true;
        }
      })
    }
  }

  redirectToMyBooking() {
    this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
  }

  buyAgain() {
    let buyAgainRequestDto = new BuyAgainRequestDto();
    buyAgainRequestDto.TravelId = +localStorage.getItem('TravelId');
    buyAgainRequestDto.TravelSolutionId = +localStorage.getItem('TravelSolutionId');
    this.commonService.loaderRequired = true;
    this.myAccountService.buyAgain(buyAgainRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.buyAgainResponseDto = this.responseData.Data;
            this.setSearchRequest();
          }
          else {
            this.spinnerService.hide();
          }
        }
      });
  }

  setSearchRequest() {
    let searchRequestModel = new SearchRequestModel();
    searchRequestModel.RailCardList = new Array<RailCardModel>();
    if (this.buyAgainResponseDto != null) {
      searchRequestModel.DepartureLocation = this.buyAgainResponseDto.DepartLocationId;
      searchRequestModel.DepartureLocationName = this.buyAgainResponseDto.DepartLocationName;
      searchRequestModel.ArrivalLocation = this.buyAgainResponseDto.ArriveLocationId;
      searchRequestModel.ArrivalLocationName = this.buyAgainResponseDto.ArriveLocationName;
      searchRequestModel.Traveltype = "DEPARTAFTER";
      searchRequestModel.TraveltypeReturn = "DEPARTAFTER";
      searchRequestModel.TravelSolutionDirection = this.buyAgainResponseDto.TravelSolDirection;
      searchRequestModel.Adult = this.buyAgainResponseDto.travellerDetails.Adult;
      searchRequestModel.Child = this.buyAgainResponseDto.travellerDetails.Children;
      searchRequestModel.JourneySearchType = 'NEW';
      if (this.buyAgainResponseDto.RailCardList != null && this.buyAgainResponseDto.RailCardList.length > 0) {
        this.buyAgainResponseDto.RailCardList.forEach(railcard => {
          let sRailcards = new RailCardModel();
          sRailcards.RailCard = railcard.Name;
          sRailcards.Adult = railcard.Adult;
          sRailcards.Child = railcard.Children;
          sRailcards.RailCardCount = 1;
          searchRequestModel.RailCardList.push(sRailcards);
        })
      }

      if (!this.isSeason) {
        const departureDate = moment.utc(new Date()).add(3, 'hours');
        const remainder = 30 - (departureDate.minute() % 30);
        searchRequestModel.DepartureTimesStart = moment(departureDate).add(remainder, "minutes").format('YYYY-MM-DDTHH:mm');


        const returnDate = moment.utc(new Date()).add(5, 'hours');
        const remainderReturn = 30 - (returnDate.minute() % 30);
        searchRequestModel.ReturnTimesStart = moment(returnDate).add(remainderReturn, "minutes").format('YYYY-MM-DDTHH:mm');
        searchRequestModel.IsSeason = false;
        searchRequestModel.IsFlexi = false;
        this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
    }
    else if (this.isSeason) {
        searchRequestModel.IsSeason = true;
        searchRequestModel.IsFlexi = false;
        searchRequestModel.DepartureTimesStart = moment.utc(new Date()).add(1, "days").format('YYYY-MM-DDTHH:mm');

        searchRequestModel.IsWeekly = true;
        searchRequestModel.IsMonthly = true;
        searchRequestModel.IsYearly = true;
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
    }
      searchRequestModel.TicketClassFilter = "";
      searchRequestModel.ChangesFilter = -1;
      searchRequestModel.OperaterFilter = 2;
      this.sharedService.isAmendSearchOpen = false;
      this.sharedService.searchRequest = searchRequestModel;
    }
  }

  createForms() {
    this.journeyDatesForm = this.formBuilder.group({
      outwardDate: new FormControl(''),
      returnDate: new FormControl(''),
    });
    this.setDisableFlagOnFormControls();
  }

  setDisableFlagOnFormControls() {
    if(!this.bookingDetailsResponse?.OutIsChangeDateTime) {
      this.journeyDatesForm.controls['outwardDate'].disable();
    }
    if (!this.bookingDetailsResponse?.RetIsChangeDateTime) {
      this.journeyDatesForm.controls['returnDate'].disable();
    }
  }

  initializejourneyDatesForm(){
    this.journeyDatesForm.get('outwardDate').setValue('');
    this.journeyDatesForm.get('returnDate').setValue('');
  }

  onChangeTimeDateBtnClick(userEmailVerified) {
    if (userEmailVerified) {
      this.displayTrainLegs = true;
      this.isShowTrainLegsOnChangeSeat = false;
      this.isShowTrainLegsOnReserveSeatOnDiffTrain = false;
      this.isAmendTrainLegSelected = false;
      this.isOutwardJourney = this.isJourneyOutwardOrReturnType();
      if (this.displayTrainLegs) {
        this.createForms();
      }
      this.cd.detectChanges();
      document.querySelector('#trainLegDiv').scrollIntoView();
    } else {
      let verifyEmailAddressMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
        notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
    }
  }

  isJourneyOutwardOrReturnType() {
    if(this.bookingDetailsResponse.OutwardDetails && this.bookingDetailsResponse.ReturnDetails) {
         return false;
       }
       else {
         return true;
       }
  }

  onSelectingLeg(isOutwardLeg:boolean) {
    let dialogRef = this.dialog.open(CojDatePickerPopupComponent, {
      width: '600px',
      panelClass: ['datepicker-info', 'coj-datepicker-popup'],
      data: {
        DepartureTimesStart: this.bookingDetailsResponse.OutwardDeparture,
        ReturnTimesStart: this.bookingDetailsResponse.ReturnDeparture,
        TraveltypeReturn: ``,
        Traveltype: `DEPARTAFTER`,
        isOutwardJourney: this.isOutwardJourney, //shows outbound(true) or return(false) journey
        IsOpenReturn: false,
        isOutwardLeg: isOutwardLeg,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        this.setOutwardAndReturnDateTime(result,isOutwardLeg);
        this.checkDatefields();
      }

    });
  }

  checkDatefields() {
      if((this.journeyDatesForm.controls[`outwardDate`].value || this.journeyDatesForm.controls[`returnDate`].value)
         && (!this.isPastOutward && !this.isPastReturn && !this.isReturnBeforeStartTime && !this.isStartExceededReturnTime)) {
        this.isAnyTrainDateSelected =  true;
      }
      else {
        this.isAnyTrainDateSelected =  false;
      }
  }

  onDateclear(isOutwardLeg: boolean) {
    if(isOutwardLeg) {
      this.journeyDatesForm.controls[`outwardDate`].setValue('');
      this.isPastOutward = false;
      this.isStartExceededReturnTime = false;
      this.isReturnBeforeStartTime = false;
      this.isPastReturn = false;
    }
    else {
      this.journeyDatesForm.controls[`returnDate`].setValue('');
      this.isPastReturn = false;
      this.isReturnBeforeStartTime = false;
      this.isStartExceededReturnTime = false;
      this.isPastOutward = false;
    }
    this.checkDatefields();
  }

  onClosingTrainLegs() {
    this.initializejourneyDatesForm();
    this.displayTrainLegs = false;
  }

  onClosingAmendLegs() {
    this.isShowTrainLegsOnChangeSeat = false;
    this.isShowTrainLegsOnReserveSeatOnDiffTrain = false;
    this.isAmendTrainLegSelected = false;
  }

  setOutwardAndReturnDateTime(result,isOutwardLeg){
    if(this.isOutwardJourney) {
      this.isPastOutward = false;
      if (this.checkPastTime(result.travelDate, result.travelTime)) {
          this.isPastOutward = true;
      }
      this.DepartureTimesStart = this.convertDateTime(result.travelDate, result.travelTime);
      this.Traveltype = result.travelType;
      this.journeyDatesForm.get('outwardDate').setValue(moment(result.travelDate).format('DD/MM/YYYY') + ', ' + result.travelTime);
    }
    else {
      if (isOutwardLeg) {
        this.setOutwardDateTime(result);
      }
      else {
          this.setReturnDateTime(result);
      }
    }

}

setOutwardDateTime(result) {
  this.isPastOutward = false;
  this.isReturnBeforeStartTime = false;
        if (this.checkPastTime(result.travelDate, result.travelTime)) {
           this.isPastOutward = true;
        }
        else {
          this.checkForValidOutWardDate(result);
        }
        this.DepartureTimesStart = this.convertDateTime(result.travelDate, result.travelTime);
        this.Traveltype = result.travelType;
        this.journeyDatesForm.get('outwardDate').setValue(moment(result.travelDate).format('DD/MM/YYYY') + ', ' + result.travelTime);
  }

  checkForValidOutWardDate(result) {
    if (this.journeyDatesForm?.get('returnDate').value) {
      this.isStartExceededReturnTime = false;
      let returnDate = this.journeyDatesForm.get('returnDate').value.split(', ');
      if (this.returntimeValidator(result.travelDate, result.travelTime, returnDate[0], returnDate[1], true)) {
        this.isStartExceededReturnTime = true;
      }
    } else if (this.bookingDetailsResponse.IsReturnTypeTicket) {
      this.isStartExceededReturnTime = false;
      let selectedReturnDate = this.bookingDetailsResponse.ReturnDeparture.split('T');
      if(this.returntimeValidator(result.travelDate, result.travelTime, moment(selectedReturnDate[0]).format('DD/MM/YYYY'), selectedReturnDate[1], true)){
        this.isStartExceededReturnTime = true;
      }
    }
  }

setReturnDateTime(result) {
  this.isPastReturn = false;
  this.isStartExceededReturnTime = false;
  if (this.checkPastTime(result.travelDate, result.travelTime)) {
    this.isPastReturn = true;
  }
  else {
    this.checkForValidReturnDate(result);
  }
  this.ReturnTimesStart = this.convertDateTime(result.travelDate, result.travelTime);
  this.TraveltypeReturn = result.travelType;
  this.journeyDatesForm.get('returnDate').setValue(moment(result.travelDate).format('DD/MM/YYYY') + ', ' + result.travelTime);
}

checkForValidReturnDate(result) {
  if (this.journeyDatesForm?.get('outwardDate').value) {
    this.isReturnBeforeStartTime = false;
    let startDate = this.journeyDatesForm.get('outwardDate').value.split(', ');
    if (this.returntimeValidator(startDate[0], startDate[1], result.travelDate, result.travelTime, false)) {
      this.isReturnBeforeStartTime = true;
    }
  } else if(this.bookingDetailsResponse.IsReturnTypeTicket) {
    this.isReturnBeforeStartTime = false;
    let selectedDepartureDate = this.bookingDetailsResponse.OutwardDeparture.split('T');
    if(this.returntimeValidator(moment(selectedDepartureDate[0]).format('DD/MM/YYYY'), selectedDepartureDate[1] , result.travelDate, result.travelTime, false)){
      this.isReturnBeforeStartTime = true;
    }
  }
}

checkPastTime(selectedDate, timeSelected) {
  let date = moment(new Date()).format('YYYY-MM-DD');
  selectedDate = moment(selectedDate).format('YYYY-MM-DD');
  if (selectedDate <= date) {
    if (timeSelected != "" && timeSelected != undefined) {
      let selectedTime = timeSelected;
      let time = selectedTime.split(':');
      let requestedTime = moment.utc(new Date()).tz('Europe/London').format("HH:mm:ss");
      let tempTime = requestedTime.split(':');
      if ((parseInt(time[0]) < parseInt(tempTime[0]))) {
        return true;
      }
      else if ((parseInt(time[0]) == parseInt(tempTime[0]))) {
        if ((parseInt(time[1]) < parseInt(tempTime[1]))) {
          return true;
        }
      }
    }
  }
  else {
    return false;
  }
}
returntimeValidator(outwardDate, outwardTime, returnDate, returnTime, isOutwardLeg) {
  if (isOutwardLeg) {
    outwardDate = moment(outwardDate).format('YYYY-MM-DD');
    let dateArr = returnDate.split('/');
    let temp = dateArr[0];
    dateArr[0] = dateArr[2];
    dateArr[2] = temp;
    returnDate = dateArr.join('-');
  }
  else {
    returnDate = moment(returnDate).format('YYYY-MM-DD');
    let dateArr = outwardDate.split('/');
    let temp = dateArr[0];
    dateArr[0] = dateArr[2];
    dateArr[2] = temp;
    outwardDate = dateArr.join('-');
  }
  if (returnDate < outwardDate) {
    return true;
  }
  else if (returnDate == outwardDate) {
    if (returnTime != "" && returnTime != undefined) {
      let selectedTime = returnTime;
      let time = selectedTime.split(':');
      let selectedTimeOutward = outwardTime;
      let timeOutward = selectedTimeOutward.split(':');
      if ((parseInt(time[0]) < parseInt(timeOutward[0]))) {
        return true;
      }
      else if ((parseInt(time[0]) == parseInt(timeOutward[0]))) {
        if ((parseInt(time[1]) <= parseInt(timeOutward[1]))) {
          return true;
        }
      }

    }
  }
  return false;
}

convertDateTime(queryDate: any, queryTime: any) {
  let actualTime = queryTime.split(':');
  let dateString;
  dateString = moment(queryDate).add(actualTime[0], 'hours').add(actualTime[1], 'minutes').format('YYYY-MM-DDTHH:mm');
  return dateString;
}

  onChangeBooking() {
    this.createChangeDateRequest();
    this.sharedService.CojSearchRequest = this.changeDateRequest;
    this.sharedService.journey = this.journey;
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    this.router.navigate([`./` + this.appRouteEnum.CojMixingDeck]);

  }

  createChangeDateRequest() {
    this.changeDateRequest = new COJSearchRequestModel();
    this.changeDateRequest.SearchRequestDto = new SearchRequestModel();
    this.changeDateRequest.SearchRequestDto.Adult = this.bookingDetailsResponse.TicketDetail.NoOfAdult;
    this.changeDateRequest.SearchRequestDto.Child = this.bookingDetailsResponse.TicketDetail.NoOfChild;
    this.changeDateRequest.SearchRequestDto.ChangesFilter = -1;
    this.changeDateRequest.SearchRequestDto.OperaterFilter = 2;
    this.changeDateRequest.SearchRequestDto.RailCardList = [];
    this.changeDateRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.changeDateRequest.TravelId = this.bookingDetailsRequest.TravelId;
    this.changeDateRequest.TravelSolutionId = this.bookingDetailsRequest.TravelSolutionId;
    this.changeDateRequest.ReopenCache = "";
    
    if(this.journeyDatesForm.get('outwardDate').value && this.journeyDatesForm.get('returnDate').value) {
      //both side selected
      this.changeDateRequest.SearchRequestDto.DepartureTimesStart = this.DepartureTimesStart;
      this.changeDateRequest.SearchRequestDto.ReturnTimesStart = this.ReturnTimesStart;
      this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.forward;
      this.changeDateRequest.SearchRequestDto.IsReturnRequest = true;
      this.changeDateRequest.SearchRequestDto.Traveltype = this.Traveltype;
      this.changeDateRequest.SearchRequestDto.TraveltypeReturn = this.TraveltypeReturn;
      this.changeDateRequest.SearchRequestDto.DepartureLocationName = this.bookingDetailsResponse.DepartureLocationName;
      this.changeDateRequest.SearchRequestDto.ArrivalLocationName = this.bookingDetailsResponse.ArrivalLocationName;
      this.changeDateRequest.SearchRequestDto.DepartureLocation = this.bookingDetailsResponse.DepartureId;
      this.changeDateRequest.SearchRequestDto.ArrivalLocation =   this.bookingDetailsResponse.ArrivalId;
      this.changeDateRequest.SearchRequestDto.ChoosedTrainleg = this.travelSolutionDirectionEnum.both;
    }
    else if(this.journeyDatesForm.get('outwardDate').value) {
      //only 1 side is selected (outward journey)
      this.changeDateRequest.SearchRequestDto.DepartureTimesStart = this.DepartureTimesStart;
      this.changeDateRequest.SearchRequestDto.ReturnTimesStart = null;
      if (this.bookingDetailsResponse.IsReturnTypeTicket) { // incase of outward leg For pure return
        this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.forward;
      } else if (!this.bookingDetailsResponse.IsReturnTypeTicket && this.bookingDetailsResponse.OutwardDetails.TravelType == this.bookPassangerAssistEnum.openReturn) {  // in case of outward leg for open return journey
        this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.openReturn;
      } else {
        this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.oneWay; // incase of outward leg For advance single only
      }
      this.changeDateRequest.SearchRequestDto.IsReturnRequest = false;
      this.changeDateRequest.SearchRequestDto.Traveltype = this.Traveltype;
      this.changeDateRequest.SearchRequestDto.DepartureLocationName = this.bookingDetailsResponse.DepartureLocationName;
      this.changeDateRequest.SearchRequestDto.ArrivalLocationName = this.bookingDetailsResponse.ArrivalLocationName;
      this.changeDateRequest.SearchRequestDto.DepartureLocation = this.bookingDetailsResponse.DepartureId;
      this.changeDateRequest.SearchRequestDto.ArrivalLocation =   this.bookingDetailsResponse.ArrivalId;
      this.changeDateRequest.SearchRequestDto.ChoosedTrainleg = this.travelSolutionDirectionEnum.outward_Leg;
    }
    else if(this.journeyDatesForm.get('returnDate').value) {
      //only 1 side is selected (return journey)
      this.changeDateRequest.SearchRequestDto.DepartureTimesStart = this.ReturnTimesStart;
      this.changeDateRequest.SearchRequestDto.ReturnTimesStart = null;
      if (this.bookingDetailsResponse.IsReturnTypeTicket) { // incase of return leg For pure return
        this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.forward;
      } else {
        this.changeDateRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.oneWay; // incase of return leg For advance single only
      }
      this.changeDateRequest.SearchRequestDto.IsReturnRequest = false;
      this.changeDateRequest.SearchRequestDto.Traveltype = this.TraveltypeReturn;
      if (this.bookingDetailsResponse.IsReturnTypeTicket) { // added for only return leg in case of pure return journey
        this.changeDateRequest.SearchRequestDto.TraveltypeReturn = this.TraveltypeReturn;
      } 
      this.changeDateRequest.SearchRequestDto.DepartureLocationName = this.bookingDetailsResponse.ArrivalLocationName;
      this.changeDateRequest.SearchRequestDto.ArrivalLocationName = this.bookingDetailsResponse.DepartureLocationName;
      this.changeDateRequest.SearchRequestDto.DepartureLocation = this.bookingDetailsResponse.ArrivalId;
      this.changeDateRequest.SearchRequestDto.ArrivalLocation =   this.bookingDetailsResponse.DepartureId;
      this.changeDateRequest.SearchRequestDto.ChoosedTrainleg = this.travelSolutionDirectionEnum.return_Leg;
    }
    this.changeDateRequest.SearchRequestDto.SearchCache = '';// empty on 1st search
    this.changeDateRequest.SearchRequestDto.SearchCacheReturn = '';// empty on 1st search
    this.changeDateRequest.SearchRequestDto.TicketClassFilter = '';// empty on 1st search
    this.changeDateRequest.SearchRequestDto.IsSeason= false;
    this.changeDateRequest.SearchRequestDto.IsFlexi = false;
    this.changeDateRequest.SearchRequestDto.IsDiscountCodeAvailable = this.bookingDetailsResponse?.IsDiscountCodeAvailable;
    this.changeDateRequest.SearchRequestDto.IsDiscountCodeAvailableOnOriginalJourney =  this.bookingDetailsResponse?.IsDiscountCodeAvailableOnOriginalJourney;
    this.changeDateRequest.SearchRequestDto.IsComplimentaryDiscountApplied =  this.bookingDetailsResponse?.IsComplimentaryDiscountApplied;
  }

  onUpgradeClick(userEmailVerified) {
    if (userEmailVerified) {
      if (this.isshowUpgradeBtn && (this.journey.Status != this.journeyTypeEnum.refundedJourney)) {

        this.isOutwardJourney = this.isJourneyOutwardOrReturnType();
        let upgradeRequest = this.createUpgradeRequest();
        this.sharedService.upgradeSearchRequest = upgradeRequest;
        this.sharedService.journey = this.journey;
        this.storageDataService.setSessionStorageData("isUpgradeChange", true, true);
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearSessionStorageData("sharedSibling");
        this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
        // ga4-datalayer search and view_list_item event
        let ga4SearchEventParam = new GA4SearchEventParam();
        ga4SearchEventParam.searchSource = this.ga4DatalayeEventNameEnum.upgradeFeatureText.charAt(0).toUpperCase() + this.ga4DatalayeEventNameEnum.upgradeFeatureText.slice(1);
        ga4SearchEventParam.searchSuccess = true;
        ga4SearchEventParam.searchError = '';
        this.ga4dataLayerService.loadGA4DataLayerOnUpgrade(this.sharedService.upgradeSearchRequest.SearchRequestDto, this.bookingDetailsResponse, ga4SearchEventParam);
        //Set shared cache data
        this.router.navigate([`./` + this.appRouteEnum.upgradeSelect]);
      } else {
        let upgradeMsgObj = {
          notificationErrorMsg: this.notificationErrorMsg.upgradeUnavailableMsg,
          notificationTitle: this.notificationErrorMsg.upgradeUnavailableTitle,
        }
        this.commonService.commonNotificationDialog('upgrade-unavailable-common-notification-dialog', upgradeMsgObj, this.commonIconImg.exclamationIConImg, false, false);
      }
    } else {
      let verifyEmailAddressMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
        notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
    }
  }

  createUpgradeRequest() {
    let upgradeRequest = new COJSearchRequestModel();
    upgradeRequest.SearchRequestDto = new SearchRequestModel();
    upgradeRequest.SearchRequestDto.Adult = this.bookingDetailsResponse.TicketDetail.NoOfAdult;
    upgradeRequest.SearchRequestDto.Child = this.bookingDetailsResponse.TicketDetail.NoOfChild;
    upgradeRequest.SearchRequestDto.ChangesFilter = -1;
    upgradeRequest.SearchRequestDto.OperaterFilter = 2;
    upgradeRequest.SearchRequestDto.RailCardList = [];
    upgradeRequest.CustomerKey = localStorage.getItem('CustomerKey');
    upgradeRequest.TravelId = this.bookingDetailsRequest.TravelId;
    upgradeRequest.TravelSolutionId = this.bookingDetailsRequest.TravelSolutionId;
    upgradeRequest.ReopenCache = "";
    upgradeRequest.SearchRequestDto.SearchCache = '';// empty on 1st search
    upgradeRequest.SearchRequestDto.SearchCacheReturn = '';// empty on 1st search
    upgradeRequest.SearchRequestDto.TicketClassFilter = '';// empty on 1st search
    upgradeRequest.SearchRequestDto.IsSeason= false;
    upgradeRequest.SearchRequestDto.IsFlexi = false;

    if(this.bookingDetailsResponse.IsPlusBusOrLondonTravelCardPresent) {
      upgradeRequest.PreviousJourneyTodRefNumber = this.bookingDetailsResponse.TicketDetail.TODReferenceNumber;
    }

    if(this.isOutwardJourney) {
      upgradeRequest.SearchRequestDto.DepartureTimesStart = this.DepartureTimesStart;
      upgradeRequest.SearchRequestDto.ReturnTimesStart = null;
      upgradeRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.oneWay;
      upgradeRequest.SearchRequestDto.IsReturnRequest = false;
      upgradeRequest.SearchRequestDto.Traveltype = this.Traveltype;
      upgradeRequest.SearchRequestDto.DepartureLocationName = this.bookingDetailsResponse.DepartureLocationName;
      upgradeRequest.SearchRequestDto.ArrivalLocationName = this.bookingDetailsResponse.ArrivalLocationName;
      upgradeRequest.SearchRequestDto.DepartureLocation = this.bookingDetailsResponse.DepartureId;
      upgradeRequest.SearchRequestDto.ArrivalLocation =   this.bookingDetailsResponse.ArrivalId;
      upgradeRequest.SearchRequestDto.ChoosedTrainleg = this.travelSolutionDirectionEnum.outward_Leg;
    }
    else {
      upgradeRequest.SearchRequestDto.DepartureTimesStart = this.DepartureTimesStart;
      upgradeRequest.SearchRequestDto.ReturnTimesStart = this.ReturnTimesStart;
      upgradeRequest.SearchRequestDto.TravelSolutionDirection = this.travelSolutionDirectionEnum.forward;
      upgradeRequest.SearchRequestDto.IsReturnRequest = true;
      upgradeRequest.SearchRequestDto.Traveltype = this.Traveltype;
      upgradeRequest.SearchRequestDto.TraveltypeReturn = this.TraveltypeReturn;
      upgradeRequest.SearchRequestDto.DepartureLocationName = this.bookingDetailsResponse.DepartureLocationName;
      upgradeRequest.SearchRequestDto.ArrivalLocationName = this.bookingDetailsResponse.ArrivalLocationName;
      upgradeRequest.SearchRequestDto.DepartureLocation = this.bookingDetailsResponse.DepartureId;
      upgradeRequest.SearchRequestDto.ArrivalLocation =   this.bookingDetailsResponse.ArrivalId;
      upgradeRequest.SearchRequestDto.ChoosedTrainleg = this.travelSolutionDirectionEnum.both;
    }
    return upgradeRequest;
  }

  onChangeSeatClick(userEmailVerified) {
    if (userEmailVerified) {
      this.displayTrainLegs = false;
      this.isShowTrainLegsOnReserveSeatOnDiffTrain = false;
      this.isShowTrainLegsOnChangeSeat = true;

      this.isAmendTrainLegSelected = false;
      this.selectedAmendLeg = null;
      this.isOutWardAmendLeg = null;
      this.currentAmendLegIndex = null;
      this.cd.detectChanges();
      if (window.screen.width <= 767) {
        document.querySelector('#selectTrainLegsDiv').scrollIntoView();
      }
    } else {
      let verifyEmailAddressMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
        notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
    }
  }

  onReserveOnDifferentTrainClick() {
    this.displayTrainLegs =  false;
    this.isShowTrainLegsOnChangeSeat = false;
    this.isShowTrainLegsOnReserveSeatOnDiffTrain = true;
    this.isAmendTrainLegSelected = false;
    this.selectedAmendLeg = null;
    this.isOutWardAmendLeg = this.bookingDetailsResponse.IsReturnTypeTicket ? true : null;
    this.currentAmendLegIndex = null;
    this.cd.detectChanges();
    document.querySelector('#selectTrainLegsDiv').scrollIntoView();
  }

  onSelectLeg(reservationSeat: ReservationSeat, isOutwardLeg: any, index: any) {
    let isCurrentLegValid = this.checkIfChoosedTrainLegValidOrNot(isOutwardLeg);
    if(reservationSeat.IsSeatPicker && isCurrentLegValid) {
      this.isAmendTrainLegSelected = true;
      this.selectedAmendLeg = reservationSeat;
      if(!this.bookingDetailsResponse.IsReturnTypeTicket && this.isShowTrainLegsOnReserveSeatOnDiffTrain)
      {
        this.isMultiLegOutward = false;
        this.isMultiLegReturn = false;
        if(isOutwardLeg)
        {
          this.setOutwardLegData();
        }
        else {
          this.setReturnLegData();
        }
      }
      this.isOutWardAmendLeg = isOutwardLeg;
      this.currentAmendLegIndex = index;
    }
  }

  setOutwardLegData() {
    if (this.bookingDetailsResponse.OutwardSeat.length > 1) {
      let counter = 0;
      this.bookingDetailsResponse.OutwardSeat.forEach((item, _index) => {
        if (item.IsSeatPicker) {
          counter += 1;
        }
      });
      this.selectedAmendLeg = this.bookingDetailsResponse.OutwardSeat[0];
      if (this.bookingDetailsResponse.OutwardSeat.length > 1) {
        this.selectedAmendLeg.Arrival = this.bookingDetailsResponse.OutwardSeat[this.bookingDetailsResponse.OutwardSeat.length - 1].Arrival;
        this.selectedAmendLeg.ArrivalLocation = this.bookingDetailsResponse.OutwardSeat[this.bookingDetailsResponse.OutwardSeat.length - 1].ArrivalLocation;
      }
      this.isMultiLegOutward = true;
      this.isMultiLegReturn = false;
    }
  }

  setReturnLegData() {
    if (this.bookingDetailsResponse.ReturnSeat.length > 1) {
      let counter = 0;
      this.bookingDetailsResponse.ReturnSeat.forEach((returnSeatItem, _index) => {
        if (returnSeatItem.IsSeatPicker) {
          counter += 1;
        }
      });
      this.selectedAmendLeg = this.bookingDetailsResponse.ReturnSeat[0];
      if (this.bookingDetailsResponse.ReturnSeat.length > 1) {
        this.selectedAmendLeg.Arrival = this.bookingDetailsResponse.ReturnSeat[this.bookingDetailsResponse.ReturnSeat.length - 1].Arrival;
        this.selectedAmendLeg.ArrivalLocation = this.bookingDetailsResponse.ReturnSeat[this.bookingDetailsResponse.ReturnSeat.length - 1].ArrivalLocation;
      }
      this.isMultiLegOutward = false;
      this.isMultiLegReturn = true;
    }
  }

  checkIfChoosedTrainLegValidOrNot(isOutwardLeg: boolean) {
    if (isOutwardLeg) {
      if ((this.isShowTrainLegsOnChangeSeat && !this.bookingDetailsResponse.OutIsAmendChangeSeat) || (this.isShowTrainLegsOnReserveSeatOnDiffTrain && !this.bookingDetailsResponse.OutIsAmendChangeDate)) {
        return false;
      }
    } else {
      if ((this.isShowTrainLegsOnChangeSeat && !this.bookingDetailsResponse.RetIsAmendChangeSeat) || (this.isShowTrainLegsOnReserveSeatOnDiffTrain && !this.bookingDetailsResponse.RetIsAmendChangeDate)) {
        return false;
      }
    }
    return true;
  }

  onSelectTrainClick(isChangeSeatAmend: boolean) {
    if(isChangeSeatAmend) {
      this.router.navigate(['./' + this.appRouteEnum.ViewBooking], { replaceUrl: true });
      this.changeSeatRequest = this.createChangeSeatRequest();

      let isReservationAvailable = null;
      if(this.isOutWardAmendLeg) {
        isReservationAvailable = this.bookingDetailsResponse.IsOutReservationAvailable;
      } else {
        isReservationAvailable = this.bookingDetailsResponse.IsRetReservationAvailable;
      }
      this.callChangeSeat(isReservationAvailable);
    } else {
      this.reserveSeatRequest = this.createReserveSeatRequest();
      this.setChangeDateCondition();
    }
  }

  setChangeDateCondition() {
    let isReturnTypeTicket = this.bookingDetailsResponse.IsReturnTypeTicket;
    const isOnlyOutwardSelected = this.isOutwardSelected && !this.isReturnSelected ? true : false;
    const isOutwardAndReturnSelected = this.isOutwardSelected && this.isReturnSelected ? true : isOnlyOutwardSelected;
    this.reserveSeatRequest.IsOutWard = isReturnTypeTicket ? isOutwardAndReturnSelected : this.reserveSeatRequest.IsOutWard;
    // new change of diff train functionality
    this.reserveSeatRequest.IsReturnTypeTicket = isReturnTypeTicket;
    const isOutwardAndReturnNotSelected = (this.isOutwardSelected && this.isReturnSelected) ? false : true;
    this.reserveSeatRequest.IsPartialReturnTypeTicket = isReturnTypeTicket ? isOutwardAndReturnNotSelected : false;
    isReturnTypeTicket = isReturnTypeTicket && this.isOutwardSelected && this.isReturnSelected;
    this.callChangeDate(isReturnTypeTicket);
  }

  callChangeSeat(isReservationAvailable) {
    this.myAccountService.fetchChangeSeat(this.changeSeatRequest, isReservationAvailable).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.seatPickerResponse = this.responseData.Data;
            if (this.seatPickerResponse.IsPrioritySeat) {
              let dialogRef = this.dialog.open(PrioritySeatPopupComponent, {
                disableClose: true,
                panelClass: 'seat-picker',
                data: {
                }
              });
              dialogRef.afterClosed().subscribe((isContinue) => {
                if (isContinue) {
                  this.redirectChangeSeat();
                }
              });
            }
            else {
              this.redirectChangeSeat();
            }
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
            this.ga4dataLayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromChangeSeat, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.ga4ItemListEnum.saveSelectionFailedAction, this.responseData.ResponseMessage);
          }
        }
      }, err => {
        console.log(err);
        this.notificationService.error("Something went wrong. Please try again later.");
        this.ga4dataLayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromChangeSeat, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.ga4ItemListEnum.saveSeatPickerOpenFailedAction, err);
      });
  }

  callChangeDate(isReturnTypeTicket) {
    this.myAccountService.fetchChangeDate(this.reserveSeatRequest, isReturnTypeTicket).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.searchSimilarResponse = this.responseData.Data;
            if (this.searchSimilarResponse?.Message?.length > 0) {
              this.dialog.open(InfoPopupComponent, {
                width: '500px',
                disableClose: false,
                data: {
                  Message: this.searchSimilarResponse.Message
                }
              });
            }
            else {
              this.errorChangeDate();
            }
          }
          else {
            this.notificationService.warn(this.responseData.ResponseMessage);
          }
        }
      }, err => {
        console.log(err);
        this.notificationService.error("Something went wrong. Please try again later.");
      });
  }

  errorChangeDate() {
    try {
      if (this.searchSimilarResponse.IsPrioritySeat) {
        let dialogRef = this.dialog.open(PrioritySeatPopupComponent, {
          disableClose: true,
          panelClass: 'seat-picker',
          data: {
  
          }
        });
        dialogRef.afterClosed().subscribe((isContinue) => {
          if (isContinue) {
            this.redirectToAmendPage();
          }
        });
      }
      else {
        this.redirectToAmendPage();
      }
    } catch (error) {
      console.log(error);
    }
  }

  setReturnParams() {
    try {
      const isOutwardAndReturnNotSelected = (this.isOutwardSelected && this.isReturnSelected) ? false : true;
      this.sharedService.IsReturnTypeTicket = this.bookingDetailsResponse.IsReturnTypeTicket;
      this.sharedService.IsRetReservationAvailable = this.bookingDetailsResponse.IsRetReservationAvailable;
      this.sharedService.IsOutReservationAvailable = this.bookingDetailsResponse.IsOutReservationAvailable;
      this.sharedService.IsPartialReturnTypeTicket = this.bookingDetailsResponse.IsReturnTypeTicket ? isOutwardAndReturnNotSelected : false;
    } catch (error) {
      console.log(error);
    }
  }

  createChangeSeatRequest() {
    try {
      let changeSeatRequest: ChangeSeatRequestDto = new ChangeSeatRequestDto;
      changeSeatRequest.TravelId = this.journey.TravelId;
      changeSeatRequest.TravelSolutionId = this.journey.TravelSolutionId;
      changeSeatRequest.Departure = this.selectedAmendLeg.Departure;
      changeSeatRequest.Arrival = this.selectedAmendLeg.Arrival;
      changeSeatRequest.DepartureLocation = this.selectedAmendLeg.DepartureLocation;
      changeSeatRequest.ArrivalLocation = this.selectedAmendLeg.ArrivalLocation;
      changeSeatRequest.IsOutward = this.isOutWardAmendLeg;
      changeSeatRequest.IsReturnTypeTicket = this.bookingDetailsResponse.IsReturnTypeTicket;
      return changeSeatRequest;
    } catch (error) {
      console.log(error);
    }
  }

  createReserveSeatRequest() {
    try {
      let reserveSeatRequest = new ReserveSeatRequestDto();
      reserveSeatRequest.NewSearchEarlierLaterRequestDto = new NewSearchEarlierLaterRequestDto();
      reserveSeatRequest.NewSearchEarlierLaterRequestDto = null;
      reserveSeatRequest.TravelId = this.journey.TravelId;
      reserveSeatRequest.TravelSolutionId = this.journey.TravelSolutionId;
      reserveSeatRequest.IsDateChange = true;
      reserveSeatRequest.ChangeDate = moment.utc(this.bookingDetailsResponse.OutwardDeparture).tz('Europe/London').toDate();
      reserveSeatRequest.retChangeDate = moment.utc(this.bookingDetailsResponse.ReturnDeparture).tz('Europe/London').toDate();
      reserveSeatRequest.IsOutWard = this.isOutWardAmendLeg;
      reserveSeatRequest.DepartureLocation = this.isOutWardAmendLeg ? this.bookingDetailsResponse.DepartureId : this.bookingDetailsResponse.ArrivalId;
      reserveSeatRequest.ArrivalLocation = this.isOutWardAmendLeg ? this.bookingDetailsResponse.ArrivalId : this.bookingDetailsResponse.DepartureId;
      return reserveSeatRequest;
    } catch (error) {
      console.log(error);
    }
  }

  redirectChangeSeat(){
    try {
      this.journey.OutwardTicketInfo = new TicketInfo();
      this.journey.ReturnTicketInfo = new TicketInfo();
      this.sharedService.isFromAmendReservation = true;
      this.sharedService.seatPickerResponseAmend = this.seatPickerResponse;
      this.sharedService.changeSeatRequest = this.changeSeatRequest;
      //in case of outward & return passing travel date
      if (this.isOutWardAmendLeg) {
        this.journey.OutwardTicketInfo.TravelDate = this.bookingDetailsResponse.OutwardDeparture;
      } else {
        this.journey.ReturnTicketInfo.TravelDate = this.bookingDetailsResponse.ReturnDeparture;
      }
      this.openSeatpicker(this.selectedAmendLeg, this.journey, this.isOutWardAmendLeg);
    } catch (error) {
      console.log(error);
      this.ga4dataLayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromChangeSeat, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.ga4ItemListEnum.saveSeatPickerOpenFailedAction, error);
    }
  }

  redirectToAmendPage() {
    try {
      this.setReturnParams();
      this.sharedService.reserveSeatRequest = this.reserveSeatRequest;
      this.sharedService.searchSimilarResponse = this.searchSimilarResponse;
      this.sharedService.journey = this.journey;
      this.sharedService.selectedAmendLeg = this.selectedAmendLeg;
      this.sharedService.reserveSeatRequestDate = this.reserveSeatRequest.ChangeDate;
      this.sharedService.noOfAdultAmend = this.bookingDetailsResponse?.TicketDetail?.NoOfAdult;
      this.sharedService.noOfChildAmend = this.bookingDetailsResponse?.TicketDetail?.NoOfChild;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate(['./' + this.appRouteEnum.amendSearchPage]);
    } catch (error) {
      console.log(error);
    }
  }

  openSeatpicker(selectedAmendLeg, Journey, isOutWardLeg) {
    let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
      disableClose: true,
      panelClass: 'seat-picker',
      data: {
        seatInfo: selectedAmendLeg,
        journey: Journey,
        isOutWardJourney: isOutWardLeg,
        IsReturnTypeTicket: this.bookingDetailsResponse.IsReturnTypeTicket,
        noOfAdult: this.bookingDetailsResponse?.TicketDetail?.NoOfAdult,
        noOfChild: this.bookingDetailsResponse?.TicketDetail?.NoOfChild,
        openedFeature: this.ga4ItemListEnum.openedSeatPickerFromChangeSeat,
        bookingReferenceNumber: this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber,
        bookingDetailsResponse: this.bookingDetailsResponse,
        isPostSale: false
      }
    });
    this.ga4dataLayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromChangeSeat, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.ga4ItemListEnum.openAction);

     // To prevent page refresh on seat picker popup open added this class on html and body tag
     document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
     document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
    this.onClosingAmendLegs();

    dialogRef.afterClosed().subscribe(() => {
      this.sharedService.isFromAmendReservation = false;
       // on seat picker popup close removed this class from html and body tag
       document.getElementsByTagName('html')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
       document.getElementsByTagName('body')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      if(this.sharedService.reviewBuyCache) {
        let prepareOrderRequest = this.getPrepareOrderRequest();

        // changes needed for preventing extra calls to fetchDataPostSeatpickerAmend - start
        this.sharedService.reviewBuyCache = null;
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        // changes needed for preventing extra calls to fetchDataPostSeatpickerAmend - end
        this.commonService.loaderRequired = true;
        this.myAccountService.fetchDataPostSeatpickerAmend(prepareOrderRequest).subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                this.prepareOrderAmendResponse = this.responseData.Data;
                if(this.prepareOrderAmendResponse.IsSuccess) {
                  this.isAmend = "true";
                  this.getMyBookingList();
                }
              }
              else {
                this.notificationService.error(this.responseData.ResponseMessage);
              }
            }
          }, err => {
            console.log(err);
            this.notificationService.error("Something went wrong. Please try again later.");
          });
      }
      this.ga4dataLayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromChangeSeat, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber, this.ga4ItemListEnum.exitAction);
    });
  }
   getPrepareOrderRequest() {
    let request:PrepareOrderRequestDto = new PrepareOrderRequestDto();  
    request.Email = localStorage.getItem('Email');
    request.EvaluateCache = this.sharedService.seatPickerResponseAmend.AmendEvaluateCache;
    request.UpdateReservationResponseCache = this.sharedService.reviewBuyCache;
    request.IsOutward = this.isOutWardAmendLeg;
    return request;
  }

  onClickOutSideToCloseDropdownList() {
    this.showTicketOutsideArea = false;
    this.hideTicketOutsideArea = true;
    this.clickToCloseMoreOption();
    this.clickToCloseDownloadOption();
}

clickToCloseMoreOption() {
  this.journey.ShowMoreOptions = false;
}

clickToCloseDownloadOption() {
  this.journey.ShowDownloadOptions = false;
}

  downloadTicket(journey: JourneyDetails) {
    try {
      this.clickToCloseMoreOption();
    if (journey.ShowDownloadOptions) {
        this.showTicketOutsideArea = false;
        this.hideTicketOutsideArea = true;
        this.clickToCloseDownloadOption();
    } else {
      this.clickToCloseDownloadOption();
      this.showTicketOutsideArea = true;
      this.hideTicketOutsideArea = false;
      this.eticketRequestDto = this.eticketRequestDto || new EticketRequestDto();
      this.eticketRequestDto.EntitlementId = this.bookingDetailsResponse.EntitlementId;
      this.eticketRequestDto.TravelId = journey.TravelId;
      this.eticketRequestDto.OrderId = parseInt(this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber);
      this.eticketRequestDto.TravelSolutionId = journey.TravelSolutionId;
      this.eticketRequestDto.IsPartialCoj = (journey.Status == this.journeyTypeEnum.outwardRefunded || journey.Status == this.journeyTypeEnum.returnRefunded) ? true : false;
  
      this.myAccountService.downloadTicket(this.eticketRequestDto).subscribe(
          res => {
              if (res != null) {
                  this.responseData = res as ResponseData;
                  if (this.responseData.ResponseCode == '200') {
                      this.eticketResponse = this.responseData.Data;
                      this.setDownloadTicketResponse(journey);
                  }
                  else {
                      console.log(this.responseData.ResponseMessage);
                  }
              }
          }, err => {
            console.log(err);
            this.notificationService.error("Something went wrong. Please try again later.");
        });
      }
    } catch (error) {
      console.log(error);
    }
}

  setDownloadTicketResponse(journey: JourneyDetails) {
    try {
      if (this.eticketResponse?.Eticket?.length > 0) {
        if (this.eticketResponse.Eticket.length === 1) {
          this.downloadPassengerTicket(this.eticketResponse.Eticket[0]);
        } else {
          journey.ShowDownloadOptions = true;
          this.shoMultipleDownloadBtn = true;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  downloadPassengerTicket(eticket: EticketResponse) {
    try {
      const byteArray = new Uint8Array(atob(eticket.Content).split('').map(char => char.charCodeAt(0)));
      downloadFile(byteArray, eticket.Name, 'application/pdf');
    } catch (error) {
      console.log(error);
    }
  }

buyTicketsAgain(journey: JourneyDetails) {
  try {
    let buyAgainRequestDto = new BuyAgainRequestDto();
    buyAgainRequestDto.TravelId = journey.TravelId;
    buyAgainRequestDto.TravelSolutionId = journey.TravelSolutionId;
    this.commonService.loaderRequired = true;
    this.myAccountService.buyAgain(buyAgainRequestDto).subscribe(
        accountServiceRes => {
            if (accountServiceRes != null) {
                this.responseData = accountServiceRes as ResponseData;
                if (this.responseData.ResponseCode == '200') {
                    this.buyAgainResponseDto = this.responseData.Data;
                    this.setSearchRequest();
                }
                else {
                    this.spinnerService.hide();
                }
            }
        }, (error) => {
          console.log(error);
        });
  } catch (error) {
      console.log(error);
  }
}

  onRefund(journey: JourneyDetails, bookingReferenceNumber: string, travelExtraOfferId: number, userEmailVerified?: boolean) {
    if (userEmailVerified) {
      if (journey.IsInternalRefundable) {
        this.commonService.showOnlineRefundPopupForInternalRefundableJourney(journey);
      } else {
        localStorage.setItem("TravelId", journey.TravelId.toString());
        localStorage.setItem("TravelSolutionId", journey.TravelSolutionId.toString());
        localStorage.setItem("IsViewBooking", "true");
        localStorage.setItem("BookingReferenceNumber", bookingReferenceNumber);
        localStorage.setItem("TravelExtraOfferId", travelExtraOfferId.toString());
        this.router.navigate([`./` + this.appRouteEnum.RefundBooking]);
      }
    } else {
      let verifyEmailAddressMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
        notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
    }
  }
  onLegSelect(event, reservationSeat: ReservationSeat, isOutwardLeg: boolean, index: any) {
    if (isOutwardLeg) {
      this.isOutwardSelected = event.checked ? true : false;
    } else {
      this.isReturnSelected = event.checked ? true : false;
    }
    this.onSelectLeg(reservationSeat, isOutwardLeg, index);
    if(!this.isOutwardSelected && !this.isReturnSelected)
      this.isAmendTrainLegSelected = false;
  }

  showRouteDetails(isReturnCase) {
    this.dialog.open(DisruptionServiceComponent, {
      width: '1086px',
      disableClose: false,
      id: "serviceDisruptionPopUpSingle",
      panelClass: 'your-journey-popup',
      data: {
        TravelSolutionCache: this.bookingDetailsResponse.TravelSolutionCache,
        TravelSolutionId: this.bookingDetailsRequest.TravelSolutionId,
        SaleCompanyId: isReturnCase ? this.bookingDetailsResponse.OutwardRouteDetails.TravelChanges[0].SaleCompanyId : this.bookingDetailsResponse.ReturnRouteDetails.TravelChanges[0].SaleCompanyId,
        Changes: isReturnCase ? this.bookingDetailsResponse.OutwardDetails.Changes :this.bookingDetailsResponse.ReturnDetails.Changes,
        Duration: isReturnCase ? this.bookingDetailsResponse.OutwardDetails.Duration :this.bookingDetailsResponse.ReturnDetails.Duration,
        IsDisruption: isReturnCase ? this.bookingDetailsResponse.OutwardRouteDetails.TravelChanges[0].IsDelayed : this.bookingDetailsResponse.ReturnRouteDetails.TravelChanges[0].IsDelayed,
        IsViewBooking : true,
        IsOutward : isReturnCase
      }
    });
  }
  handleKeyup($event, value: boolean) {
    if($event.keyCode === 13) { // spacebar
       this.onSelectingLeg(value);
    }
 }

  ticketInfo(ticketType: string, isOutward: boolean) {
    let ticketTypeCode;
    let TicketDescription;
    let TicketInformation;
    let TicketRestriction;
    if (ticketType != 'season') {
      if (isOutward) {
        ticketTypeCode = this.bookingDetailsResponse.TicketDetail.TicketTypeCode;
        TicketDescription = this.bookingDetailsResponse.TicketDetail.TicketDescription;
        TicketInformation = this.bookingDetailsResponse.TicketDetail.TicketInformation;
        TicketRestriction = this.bookingDetailsResponse.TicketDetail.TicketRestriction;
      } else {
        ticketTypeCode = this.bookingDetailsResponse.RetTicketDetail.TicketTypeCode;
        TicketDescription = this.bookingDetailsResponse.RetTicketDetail.TicketDescription;
        TicketInformation = this.bookingDetailsResponse.RetTicketDetail.TicketInformation;
        TicketRestriction = this.bookingDetailsResponse.RetTicketDetail.TicketRestriction;
      }
    }
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim(),
        TicketDescription: TicketDescription,
        TicketInformation: TicketInformation,
        TicketRestriction: TicketRestriction,
        ticketTypeCode: ticketTypeCode,
        IsViewBooking: true
      }
    });
  }

  getOutAndReturnJourneyTransformDate(isOutward, journeyDetail) {
    try {
      if (isOutward) {
        return this.datePipe.transform(journeyDetail.OutwardDeparture, 'dd/MM/yyyy');
      } else if (!isOutward) {
        return this.datePipe.transform(journeyDetail.ReturnDeparture, 'dd/MM/yyyy');
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }

  getOutAndReturnJourneyTransformTime(isOutward, journeyDetail) {
    try {
      if (isOutward) {
        return journeyDetail.OutwardDeparture ? this.datePipe.transform(journeyDetail.OutwardDeparture, 'HH:mm') : '';
      }
      return journeyDetail.ReturnDeparture ? this.datePipe.transform(journeyDetail.ReturnDeparture, 'HH:mm') : '';
    } catch (error) {
      console.log(error);
    }
  }
// PICO-1400 create to send out & ret journey data to the passengerAssistRequest below in bookPassengerAssistDetails
  getJourneyDetailBasedOnDirection(journeyDetail, isOutward) {
    try {
      this.journeyDetails = new PassengerJourneyDetails();
      this.reservationDetails = new PassengerReservationDetails();
      let [seatTypeValue, coachTypeValue] = isOutward ? this.commonService.getSeatAndCoachValue(journeyDetail.OutwardSeat) : this.commonService.getSeatAndCoachValue(journeyDetail.ReturnSeat);
      this.journeyDetails.Origin = isOutward ? journeyDetail.DepartureLocationName.split('(').pop().split(')')[0] : journeyDetail.ArrivalLocationName.split('(').pop().split(')')[0];
      this.journeyDetails.Destination = isOutward ? journeyDetail.ArrivalLocationName.split('(').pop().split(')')[0] : journeyDetail.DepartureLocationName.split('(').pop().split(')')[0];
      this.journeyDetails.DepartureDate = this.getOutAndReturnJourneyTransformDate(isOutward, journeyDetail);
      this.journeyDetails.DepartureTime = this.getOutAndReturnJourneyTransformTime(isOutward, journeyDetail);
      this.journeyDetails.Via = journeyDetail.ViaStation ? journeyDetail.ViaStation.split('(').pop().split(')')[0] : '';
      this.reservationDetails.CoachNumber = seatTypeValue ? seatTypeValue : '';
      this.reservationDetails.SeatNumber = coachTypeValue ? coachTypeValue : '';
      this.journeyDetails.ReservationDetails = this.reservationDetails;
      return this.journeyDetails;
    } catch (error) {
      console.log(error);
    }
  }
// PICO-1400 call method on click book passanger assist on confirmation & view booking page
  bookPassengerAssistDetails(journeyDetail) {
    try {
      let journeyList;
      this.passengerAssistRequest = new PassengerAssistRequest();
      this.passengerDetail = new PassengerDetail();
      this.passengerAssistRequest.BookingReference = journeyDetail.TicketDetail.BookingReferenceNumber;
      this.passengerAssistRequest.Companion = (journeyDetail.TicketDetail.NoOfAdult + journeyDetail.TicketDetail.NoOfChild) > 1 ? '1' : '0';
      this.passengerAssistRequest.ReturnJourney = (journeyDetail.OutwardDetails.TravelType == this.bookPassangerAssistEnum.single || journeyDetail.OutwardDetails.TravelType == this.bookPassangerAssistEnum.openReturn) ? '0' : '1';
      let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
      if (customerLoginResponse) {
        let getPassangerDetail = this.commonService.getCustomerLoginResForPassangerDetail(customerLoginResponse);
        this.passengerAssistRequest.PassengerDetail = getPassangerDetail;
      }
      if (journeyDetail?.OutwardDetails) {
        journeyList = this.getJourneyDetailBasedOnDirection(journeyDetail, true);
        this.passengerAssistRequest.OutwardJourneyDetails = journeyList;
      }
      if (this.passengerAssistRequest.ReturnJourney == '1' && journeyDetail?.ReturnDetails) {
        journeyList = this.getJourneyDetailBasedOnDirection(journeyDetail, false);
        this.passengerAssistRequest.ReturnJourneyDetails = journeyList;
      }
      this.commonService.bookPassangerAssistCallMethod(this.passengerAssistRequest);
    } catch (error) {
      console.log(error);
    }
  }

  getPostSaleBikes(journey: JourneyDetails){
    this.ga4dataLayerService.loadGALayerForStandaloneBikeReservation(this.ga4DatalayeEventNameEnum.addBikeReservation, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber);
    let postSaleBikesRequestDto = new PostSaleBikesRequestDto();
    postSaleBikesRequestDto.TravelId = journey.TravelId;
    postSaleBikesRequestDto.TravelSolutionId = journey.TravelSolutionId;
    postSaleBikesRequestDto.CustomerKey = localStorage.getItem('CustomerKey');
    this.commonService.loaderRequired = true;
    this.myAccountService.getPostSaleBikes(postSaleBikesRequestDto).subscribe(
      (postSaleBikeRes) =>{
        if(postSaleBikeRes != null){
          this.responseData = postSaleBikeRes as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                  this.postSaleBikesResponseDto = this.responseData.Data;
                  this.bicycleReservation = this.postSaleBikesResponseDto.BikeDetails; 
                  this.confirmReservationBtn = true;   
                            
              }
        } else {
          this.notificationService.error("Something went wrong. Please try again later.");
        }
    }, (error) => {
      console.log(error);
    })
  }

  onPostSaleBikesChange(checked, value, isReturn) {
    let selectedBike = this.bicycleReservation.filter(i => i.Description === value && i.IsReturn == isReturn);
    if (selectedBike && selectedBike.length > 0) {
      let journey = new JourneyExtras();
      journey.OfferId = selectedBike[0].OfferId;
      journey.ServiceId = selectedBike[0].ServiceId;
      journey.IsReturn = selectedBike[0].IsReturn;
      journey.SolutionNodeRef = selectedBike[0].SolutionNodeRef;
      journey.SelectCount = isReturn ? Number(this.selectedBicycleReturn) : Number(this.selectedBicycle);
      this.settingReturnAndOutwardBicycleReservation(checked, isReturn, journey);
    }
  }

  settingReturnAndOutwardBicycleReservation (checked, isReturn, journey) {
    if (checked) {
      if (isReturn) {
        this.returnBicycleReservation = true;
        this.ga4dataLayerService.loadGALayerForStandaloneBikeReservation(this.ga4DatalayeEventNameEnum.returnBikeReservation, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber);
      }
      else {
        this.outwardBicycleReservation = true;
        this.ga4dataLayerService.loadGALayerForStandaloneBikeReservation(this.ga4DatalayeEventNameEnum.outwardBikeReservation, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber);
      }
      this.bikeOffers.push(journey);
    } else {
      if (isReturn) {
        this.returnBicycleReservation = false;
      }
      else {
        this.outwardBicycleReservation = false;
      }
      this.bikeOffers = this.bikeOffers.filter(i => i.SolutionNodeRef != journey.SolutionNodeRef);
    }
  }

  onBicycleCountChange(bicycle, flag) {
    let isBicycleExists = this.bikeOffers.filter(i => i.OfferId === bicycle.OfferId && i.ServiceId === bicycle.ServiceId && i.SolutionNodeRef === bicycle.SolutionNodeRef);
    if (isBicycleExists && isBicycleExists.length > 0) {
       this.bikeOffers = this.bikeOffers.filter(i => (i.OfferId != bicycle.OfferId && i.ServiceId != bicycle.ServiceId) || (i.SolutionNodeRef != bicycle.SolutionNodeRef));
      let journey = new JourneyExtras();
      journey.OfferId = bicycle.OfferId;
      journey.ServiceId = bicycle.ServiceId;
      journey.IsReturn = bicycle.IsReturn;
      journey.SolutionNodeRef = bicycle.SolutionNodeRef;
      this.checkForIsBicycleReturn(bicycle, flag);
     
      journey.SelectCount = bicycle.IsReturn ? (Number(this.selectedBicycleReturn)) : (Number(this.selectedBicycle));
      this.bikeOffers.push(journey);
    }
  }

  checkForIsBicycleReturn (bicycle, flag) {
    try {
      if (!bicycle.IsReturn) {
        if (flag) {
          this.selectedBicycle = (Number(this.selectedBicycle) + 1).toString();
        } else {
          this.selectedBicycle = (Number(this.selectedBicycle) - 1).toString();
        }
      } else {
        if (flag) {
          this.selectedBicycleReturn = (Number(this.selectedBicycleReturn) + 1).toString();
        } else {
          this.selectedBicycleReturn = (Number(this.selectedBicycleReturn) - 1).toString();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  // for get evaluateAndResrvePostSaleBike response after click on confirm reservation btn
  getEvaluateAndReservePostSaleBikeResData(responseData) {
    if (responseData.Data) {
      if (responseData.Data.InitiatePaymentResponse && !responseData.Data.ErrorMessage) {
        this.postBikeBooked = true;
        this.postBikeData = responseData.Data.InitiatePaymentResponse;
        let postBikeReservationSuccessMsgsObj = {
          notificationTitle: this.notificationErrorMsg.bikeReservationSuccessTitle,
          isViewBooking: true
        }
        let dialogRef = this.commonService.commonNotificationDialog('post-bike-reservation-common-notification-dialog', postBikeReservationSuccessMsgsObj, this.commonIconImg.successWhiteCheckIconImg, false, false, true);
        dialogRef.afterClosed().subscribe(() => {
          this.getMyBookingList();
        });
      } else {
        let postBikeReservationErrorMsgsObj = {
          notificationErrorMsg: this.notificationErrorMsg.bikeReservationFailureInfoMsg,
          notificationTitle: this.notificationErrorMsg.bikeReservationFailureTitle,
          isViewBooking: false
        }
        this.commonService.commonNotificationDialog('post-bike-reservation-common-notification-dialog', postBikeReservationErrorMsgsObj, this.commonIconImg.exclamationWarningIconImg, false, false, true);
      }
    } else {
      this.notificationService.error("Something went wrong. Please try again later.");
    }
  }

  evaluateAndReservePostSaleBikes(journey: JourneyDetails) {
    let evaluateAndReservePostSaleBikeRequest = new EvaluateAndReservePostSaleBikeRequest();
    evaluateAndReservePostSaleBikeRequest.travelSolutionId = journey.TravelSolutionId;
    evaluateAndReservePostSaleBikeRequest.reopenCache = this.postSaleBikesResponseDto.ReopenCache;
    evaluateAndReservePostSaleBikeRequest.outwardSearchBaseRequestCache = this.postSaleBikesResponseDto.OutwardSearchBaseRequestCache;
    evaluateAndReservePostSaleBikeRequest.returnSearchBaseRequestCache = this.postSaleBikesResponseDto.ReturnSearchBaseRequestCache;
    evaluateAndReservePostSaleBikeRequest.bikeOffers = this.bikeOffers;
    evaluateAndReservePostSaleBikeRequest.ChoosedTrainLeg = this.getChoosedTrainLeg();

    this.myAccountService.evaluateAndReservePostSaleBikes(evaluateAndReservePostSaleBikeRequest).subscribe(
      (evaluateAndReservePostSaleBikeres) => {
        if (evaluateAndReservePostSaleBikeres != null) {
          this.responseData = evaluateAndReservePostSaleBikeres as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.getEvaluateAndReservePostSaleBikeResData(this.responseData);
          }
        } else {
          this.notificationService.error("Something went wrong. Please try again later.");
        }
      }, (error) => {
        console.log(error);
      });
  }

  getChoosedTrainLeg(){
    try {
      if(this.outwardBicycleReservation && this.returnBicycleReservation){
        return this.travelSolutionDirectionEnum.both;
      }else{
        if(this.outwardBicycleReservation){
          return this.travelSolutionDirectionEnum.outward_Leg;
        }
        if(this.returnBicycleReservation){
          return this.travelSolutionDirectionEnum.return_Leg;
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  removeBikeTravelExtra(value) {
    try {
      if (value == "BYCYCLERESERVATION") {
        this.selectedBicycle = '1';
        this.selectedBicycleReturn = '1';
        let outBicycle = null, retBicycle = null;
        if (this.bicycleReservation.length == 1 && this.bicycleReservation[0].IsReturn) {
          [retBicycle, outBicycle] = this.bicycleReservation;
        }
        else {
          [outBicycle, retBicycle] = this.bicycleReservation;
        }
        if (outBicycle && this.outwardBicycleReservation) {
          this.outwardBicycleReservation = false;
          this.onPostSaleBikesChange(false, outBicycle.Description, outBicycle.IsReturn);
        }
        if (retBicycle && this.returnBicycleReservation) {
          this.returnBicycleReservation = false;
          this.onPostSaleBikesChange(false, retBicycle.Description, retBicycle.IsReturn);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  isSelectedBicycleEqualToTotalPassenger(bicycle, selectedBicycle){ 
    return (parseInt(bicycle.NumberOfAdult) + parseInt(bicycle.NumberOfChild)) == selectedBicycle;
  }

  getPlusBusPassengerCount(noOfAdultPlusBus: number, noOfChildPlusBus: number, noOfAdultJourney: number, noOfChildJourney: number) {
    if ((noOfAdultPlusBus + noOfChildPlusBus) < (noOfAdultJourney + noOfChildJourney)) {
      return " - " + this.isAdultAvailable(noOfAdultPlusBus) + this.isAdultOrAdults(noOfAdultPlusBus) + this.isAdultChildAvailable(noOfAdultPlusBus, noOfChildPlusBus) + this.isChildAvailable(noOfChildPlusBus) +
        this.isChildOrChildren(noOfChildPlusBus);
    }
    return "";
  }

  isAdultAvailable(adultCount): string {
    if (adultCount > 0) return adultCount;
    return "";
  }

  isAdultOrAdults(adultCount): string {
    if (adultCount == 0) return "";
    if (adultCount > 1) return " Adults";
    return " Adult";
  }

  isChildAvailable(childCount): string {
    if (childCount > 0) return childCount;
    return "";
  }

  isChildOrChildren(childCount): string {
    if (childCount == 0) return "";
    else if (childCount > 1) return ' Children';
    return ' Child';
  }

  isAdultChildAvailable(adultCount, childCount): string {
    if (adultCount > 0 && childCount > 0) return ", ";
    return "";
  }

  getLondonTravelCardPassengerText(journeyExtra: JourneyExtrasDetail): string {
    if (journeyExtra.NoOfAdult == 0 && journeyExtra.NoOfChild > 0) {
      return '(' + this.getPassengerTextBasedOnAdultChild(journeyExtra.MinPrice, ' x Child ', journeyExtra.NoOfChild) + ')';
    }
    else if (journeyExtra.NoOfChild == 0 && journeyExtra.NoOfAdult > 0) {
      return '(' + this.getPassengerTextBasedOnAdultChild(journeyExtra.MaxPrice, ' x Adult ', journeyExtra.NoOfAdult) + ')';
    }
    else {
      return '(' + this.getPassengerTextBasedOnAdultChild(journeyExtra.MaxPrice, ' x Adult ', journeyExtra.NoOfAdult) + ' , ' + this.getPassengerTextBasedOnAdultChild(journeyExtra.MinPrice, ' x Child ', journeyExtra.NoOfChild) + ')';
    }
  }

  getPassengerTextBasedOnAdultChild(price: number, passengerType: string, noOfPassenger: number) {
    return noOfPassenger + passengerType + this.sharedService.currencySymbol('') + this.sharedService.formatPrice(price);
  }  

  doesAvantiTrainExists(bookingDetailsResponse) {
    if (bookingDetailsResponse && (bookingDetailsResponse.TicketDetail.Operator == 1 || bookingDetailsResponse.TicketDetail.Operator == 2)) {
      return true;
    }
    return false;
  }

  isUpgradeTicketExists(bookingDetailsResponse) {
    if (this.doesAvantiTrainExists(bookingDetailsResponse)) {
      if ((bookingDetailsResponse?.TicketDetail?.TicketType && (bookingDetailsResponse.TicketDetail.TicketType.indexOf(this.ticketTypeEnum.firstClassTicketType) > -1))) {
        return false;
      }
      return true;
    }
    return false;
  }

  //PICO-3141 call method for user verification email
  isUserVerificationEmail() {
    this.startVerifyEmailRequestDto = new StartVerifyEmailRequestDto();
    this.startVerifyEmailRequestDto.UserEmail = localStorage.getItem('OriginalEmail');
    this.myAccountService.sentRequestToVerifyEmail(this.startVerifyEmailRequestDto);
  }

  openEditTravelExtras(userEmailVerified: boolean) {
    if (userEmailVerified) {
      this.isEditTravelExtras = !this.isEditTravelExtras;
    } else {
      let verifyEmailAddressMsgsObj = {
        notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
        notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonService.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
  
  setRailCardDetailFromBookingResponse(){
    if (this.bookingDetailsResponse?.TicketDetail?.RailCards) {
      this.outGroupSaveRailCard = this.bookingDetailsResponse.TicketDetail?.RailCards.split(',').some(item => item === this.appRouteEnum.groupSave);
      if (this.outGroupSaveRailCard) {
        this.outRailcardsListWithoutGroupSave = this.bookingDetailsResponse?.TicketDetail?.RailCardList?.filter(item => item?.RailCard !== this.appRouteEnum.groupSave);
        this.outRailcardsListWithGroupSave = this.bookingDetailsResponse?.TicketDetail?.RailCardList?.filter(item => item?.RailCard == this.appRouteEnum.groupSave);
      } else {
        this.outRailcardsListWithoutGroupSave = this.bookingDetailsResponse.TicketDetail.RailCardList;
      }
    }
    if (this.bookingDetailsResponse?.RetTicketDetail?.RailCards) {
      this.retGroupSaveRailCard = this.bookingDetailsResponse.RetTicketDetail.RailCards.split(',').some(item => item === this.appRouteEnum.groupSave);
      if (this.retGroupSaveRailCard) {
        this.retRailcardsListWithoutGroupSave = this.bookingDetailsResponse.RetTicketDetail.RailCardList.filter(item => item?.RailCard !== this.appRouteEnum.groupSave);
        this.retRailcardsListWithGroupSave = this.bookingDetailsResponse.RetTicketDetail.RailCardList.filter(item => item?.RailCard == this.appRouteEnum.groupSave);
      } else {
        this.retRailcardsListWithoutGroupSave = this.bookingDetailsResponse.RetTicketDetail.RailCardList;
      }
    }
  }

  getBookingDetailsAPICall(){
    this.myAccountService.getBookingDetails(this.bookingDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.bookingDetailsResponse = this.responseData.Data;
            this.isshowTimeDateBtn = this.bookingDetailsResponse.IsChangeDateTime;
            this.isshowUpgradeBtn = this.bookingDetailsResponse.IsPostSalesUpgrade;
            this.isBikeReservationExist = this.bookingDetailsResponse.IsBikeReservationPresent;
            this.setRailCardDetailFromBookingResponse();
            this.bindPaymentRelatedDetails();

            // for word spacing under view booking
            this.commonService.getOrganisedOutwardAndReturnSeatInfo(this.bookingDetailsResponse.OutwardSeat);
            this.commonService.getOrganisedOutwardAndReturnSeatInfo(this.bookingDetailsResponse.ReturnSeat);
            localStorage.setItem(this.localStorageKeyEnum.bookingRefrenceNumber, this.bookingDetailsResponse.TicketDetail.BookingReferenceNumber);
            this.bindBookingDetails();
            this.spinnerService.hide();

            this.callGa4InCaseOfCOJUpgradeAndPostSale();

            localStorage.removeItem(this.localStorageKeyEnum.railCardListForUpgradeDataLayer);
            this.discountPaymentSummaryListArrayObject = this.bookingDetailsResponse?.PaymentSummaryList?.filter(item => item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.voucherCodePaymentType?.toLowerCase() || item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.railCardDiscountPaymentType?.toLowerCase() || item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.promotionDiscountPaymentType?.toLowerCase()|| item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.groupSaveDiscountPaymentType?.toLowerCase());
            this.deliveryPaymentSummaryListArrayObject = this.bookingDetailsResponse?.PaymentSummaryList?.filter(item => item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.trainTicketPaymentType?.toLowerCase() || item.PaymentType?.toLowerCase() == this.bookingTypeEnum?.deliveryPaymentType?.toLowerCase());
            const index = this.deliveryPaymentSummaryListArrayObject.findIndex(obj => obj[this.journeyTypeEnum?.paymentTypeText]?.toLowerCase() === this.bookingTypeEnum?.trainTicketPaymentType?.toLowerCase());
            if (index > -1) {
              const [item] = this.deliveryPaymentSummaryListArrayObject.splice(index, 1);
              this.deliveryPaymentSummaryListArrayObject.unshift(item);
            }
            this.travelExtrasPaymentSummaryListArrayObject =  this.bookingDetailsResponse?.PaymentSummaryList?.filter(item => item?.PaymentType?.toLowerCase() == this.travelSolutionJourneyTypeEnum?.outward?.toLowerCase() || item?.PaymentType?.toLowerCase() == this.travelSolutionJourneyTypeEnum?.return?.toLowerCase());
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
          // Disabled Journey Tracker button for Past Journey and refunded journey
          this.disableJourneyTrackerButtonForPastAndRefundedJourney();
        }
      });
  }

  // checked refundable journey or non refundable journey for PICO-2950, PICO-3358, PICO-3357, PICO-3385
  isRefundableOrNonRefundableJourney(isRefundable, isInternalRefundable) {
    if (!isRefundable && !isInternalRefundable) {
      return false;
    } else if (isRefundable || isInternalRefundable) {
      return true;
    }
  }
  
  doesUpgradeButtonIsAtTheTop(){
    if(localStorage.getItem(this.localStorageKeyEnum.upgradeAboveFold) == "true"){
      return true;
    }else{
      return false;
    }
  }

  isExistCojForOutward(bookingDetailsResponse) {
    if (bookingDetailsResponse) {
      if (this.checkedCOJForOutOnly(bookingDetailsResponse)) {
        return true;
      } else if (this.checkedCOJForOutAndRet(bookingDetailsResponse)) {
        return true;
      }
      return false;
    }
  }

  isExistCojForReturn(bookingDetailsResponse) {
    if (bookingDetailsResponse) {
      if (this.checkedCOJForOutOrRet(bookingDetailsResponse)) {
        return true;
      }
      return false;
    }
  }

  getjourneyTypeTextForOutward(bookingDetailsResponse) {
    if (this.checkedCOJForOutOnly(bookingDetailsResponse)) {
      return `${this.journeyTypeEnum.outboundOnlyText}`;
    } else if (this.checkedCOJForOutAndRet(bookingDetailsResponse)) {
      return `${this.journeyTypeEnum.outboundAndReturnOnlyText}`;
    } else {
      return '';
    }
  }

  getjourneyTypeTextForReturn(bookingDetailsResponse) {
    if (this.checkedCOJForOutOrRet(bookingDetailsResponse)) {
      return bookingDetailsResponse?.OutIsCojNotAvailable ? `${this.journeyTypeEnum.outboundOnlyText}` : (bookingDetailsResponse?.RetIsCojNotAvailable ? `${this.journeyTypeEnum.returnOnlyText}` : '');
    }
    return '';
  }

  checkedCOJForOutOnly(bookingDetailsResponse) {
    return bookingDetailsResponse?.OutwardDetails && !bookingDetailsResponse?.ReturnDetails && bookingDetailsResponse?.OutIsCojNotAvailable;
  }

  checkedCOJForOutAndRet(bookingDetailsResponse) {
    return bookingDetailsResponse?.OutwardDetails && bookingDetailsResponse?.ReturnDetails && bookingDetailsResponse?.OutIsCojNotAvailable && bookingDetailsResponse?.RetIsCojNotAvailable;
  }

  checkedCOJForOutOrRet(bookingDetailsResponse) {
    return bookingDetailsResponse?.OutwardDetails && bookingDetailsResponse?.ReturnDetails && (bookingDetailsResponse?.OutIsCojNotAvailable || bookingDetailsResponse?.RetIsCojNotAvailable);
  }

  setDeliveryModeNameOrTrainTicket(deliveryName){
    if(deliveryName == this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY){
      return this.deliveryModeEnum?.NextDayDelivery;
    } else if(deliveryName == this.appRouteEnum?.DeliveryModeETicket){
      return this.deliveryModeEnum?.ETicket;
    } else if(deliveryName == this.appRouteEnum?.DeliveryMode_TOD){
      return this.appRouteEnum?.DeliveryMode_TOD_Collect_At_Station;
    } else if(deliveryName == this.appRouteEnum?.DeliveryMode_FIRSTCLASSPOST) {
      return this.deliveryModeEnum?.FirstClassPost;
    } else if(deliveryName == this.appRouteEnum?.DeliveryMode_Smart_Card){
      return this.deliveryModeEnum?.SmartCard;
    } else{
      return deliveryName;
    }
  }

  setTravelExtrasPaymentSummaryName(travelExtrasName, travelExtrasTypes){
    if(travelExtrasName?.toLowerCase() == this.appConstantService?.plusBus?.toLowerCase()){
      return `${travelExtrasTypes} ${this.commonService.capitalizePBInPlusBusTavelExtraWord(travelExtrasName?.toLowerCase())}`;
    } else{
      return `${travelExtrasTypes} ${travelExtrasName}`;
    }
  }

  bindPriceForPaymentSummaryListInDeliveryType(paymentSummary){
    return (paymentSummary?.PaymentType ==
      this.bookingTypeEnum.trainTicketPaymentType) ?
      this.sharedService.formatPrice(this.commonService.getTrainTicketPrice(this.bookingDetailsResponse?.PaymentSummaryList)) :
      this.sharedService.formatPrice(paymentSummary.Price)
  }

  bindDeliveryModeNameForPaymentSummaryList(paymentSummary){
    return paymentSummary?.Name == this.appRouteEnum?.DeliveryMode_NEXTDAYDELIVERY ? this.appRouteEnum?.DeliveryMode_NextDayDelivery :
    (paymentSummary?.Name == this.appRouteEnum?.DeliveryModeETicket ? this.appRouteEnum?.DeliveryMode_ETicket :
    paymentSummary?.Name)
  }

  bindPaymentTypeForPaymentSummaryInSeason(paymentSummary){
    return (paymentSummary?.PaymentType == this.bookingTypeEnum.voucherCodePaymentType || paymentSummary?.PaymentType == this.bookingTypeEnum.railCardDiscountPaymentType) ? '-' : '';
  }

  formatRailcardString(railCardList) {
    return railCardList
    ?.map(railcard => `${railcard.RailCard} ${this.commonService?.railcardPassengerMessageText(railcard.RailCardCount)}`)
    .join(', ');
  }

  showOrHideDownloadEticketArrowSpan(){
    return this.bookingDetailsResponse.TicketDetail.NoOfAdult === 1 && this.bookingDetailsResponse.TicketDetail.NoOfChild === 0;
  }
}
