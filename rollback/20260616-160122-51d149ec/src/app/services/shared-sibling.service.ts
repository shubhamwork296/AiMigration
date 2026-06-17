import { Injectable, EventEmitter, Output } from '@angular/core';
import { CojEvaluateTravelRequest, EvaluateTravelRequest } from '../models/journey-extras/evaluate-request.model';
import { DeliveryMode } from '../models/delivery-modes/delivery-modes.model';
import { COJSearchRequestModel, SearchRequestModel } from '../models/mixing-deck/search-request.model';
import { CojReviewBuyResponse, RailCardPriceList, ReservationSeat, ReviewBuyResponse } from '../models/review-buy/review-buy-model';
import { FareBreakdownModel, JourneyModel } from '../models/mixing-deck/fare-breakdown.model';
import { PaymentResponse } from '../models/payment-details/payment-response.model';
import { ValidatePaymentResponse } from '../models/payment-details/validate-payment-response.model';
import { LocationMasterData } from '../models/master/location-master.model';
import { AppConstantsService, AppRouteEnum } from '../utility/app-constants.service';
import { JourneyExtrasResponse } from '../models/journey-extras/journey-extras-response.model';
import { SharedServiceCache } from './SharedServiceCache.service';
import { CustomerLoginResponse, CustomerDetail, CustomerAddress } from '../models/customer/customer-login-response.model';
import { CreateReservationRequest } from '../models/journey-extras/reservation.model';
import { ChangeSeatRequestDto, EvaluateRequestDto, JourneyDetails, ReserveSeatRequestDto, SearchSimilarForDateResponseDto } from '../models/account/my-bookings.model';
import { JourneySummaryModel } from '../models/mixing-deck/travel-solution.model';
import { RailcardStationMasterData } from '../models/master/railcard-station.model';
import { SeatPickerResponseDto } from '../models/review-buy/seat-picker-model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { EnhancedReviewBuyAndDeliveryResponse } from '../models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model';
import { EnhancedGetDeliveryAndBasketJourneyRequest } from '../models/enhanced-review-buy-and-delivery/enhanced-get-delivery-and-basket-journey-request';


@Injectable()
export class SharedService {
  ticketTypeCode: string;
  addReturnTabIndex: any;
  evaluateRequest: EvaluateTravelRequest;
  fare: any;
  fareReturn: any;
  totalFare: number;
  isReturnCase: boolean;
  isSingleReturnCase: boolean;
  deliveryModes: DeliveryMode;
  searchRequest: SearchRequestModel;
  CojSearchRequest: COJSearchRequestModel;
  upgradeSearchRequest: COJSearchRequestModel;
  CojReviewBuyRequest: CojEvaluateTravelRequest;
  upgradeReviewBuyRequest: CojEvaluateTravelRequest;
  amendSearchRequest: SearchRequestModel;
  isLogin: boolean = false;
  mixingDeckUrl: string;
  isAmendSearchOpen: boolean = false;
  isAmendFresh: boolean;
  customerFirstName: string;
  customerLastName: string;
  reviewBuyCache: string;
  previousCache: string;
  totalPriceToPayReviewBuy: string;
  basketCount: number = 0;
  reviewBuyResponse: ReviewBuyResponse;
  CojReviewBuyResponseDto: CojReviewBuyResponse;
  validatePaymentResponse: ValidatePaymentResponse;
  fareBreakdownModelData: FareBreakdownModel[];
  fareBreakDownTotalFare: number = 0;
  ReservationCache: string;
  paymentResponse: PaymentResponse;
  isReturnLoaderCase: boolean = false;
  locationMasterData: LocationMasterData[];
  railcardStationMasterData: RailcardStationMasterData;
  fareBreakDownTotalDiscount: number = 0.0;
  journeyExtrasResponseShared: JourneyExtrasResponse;
  loaderMessage: string;
  customerLoginResponse: CustomerLoginResponse;
  createReservationRequest: CreateReservationRequest;
  IsJEForwardClick: boolean = false;
  IsViewMoreClick: boolean = false;
  IsViewMoreClickReturn: boolean = false;
  IsViewMoreClickSingleReturn: boolean = false;
  journey: JourneyDetails;
  registrationCustomerEmail: string;
  registrationCustomerPassword: string;
  registrationIsLoginFromJE: boolean;
  registrationIsLoginFromSeason: boolean;
  registrationReturnUrl: string;
  isNreBasket: boolean;
  firstTravelSolDepartureTime: string;
  firstTravelSolDepartureTimeAmend: string;
  secondTravelSolDepartureTime: string;
  secondTravelSolDepartureTimeAmend: string;
  isFilterClicked: boolean = false;
  isTrainOperator: boolean = false;


  journeySummaryModel: JourneySummaryModel;
  COJjourneySummaryModel: JourneySummaryModel;
  isSearchResultPage: boolean = false;
  isSearchApiError: boolean = false;
  isSearchErrorSoldOut: boolean = false;
  isTrainDepartedOrCancelled: boolean = false;
  isReturnSearchErrorSoldOut: boolean = false;
  isEarlierLaterSearchApiError: boolean = false;
  timeoutErrorMessage: string = "";
  showSmartcardMessage: boolean = false;
  isNewLoaderForNewFlow: boolean = false;
  isStationListAPILoaderRequired: boolean = false;

  activeTabValue: number = -1;
  returnFare: any = null;
  returnTravelSolution: any = null;
  singleSolutionFare: any = null;
  singleSolutionTravelSolution: any = null;
  selectedReturnTimeId: any = null;
  showEdit: boolean = false;
  upgradeOutwardPrice: number;
  upgradeReturnPrice: number;
  isFromAmendReservation: boolean = false;
  seatPickerResponseAmend: SeatPickerResponseDto;
  reserveSeatRequest: ReserveSeatRequestDto;
  changeSeatRequest: ChangeSeatRequestDto;
  searchSimilarResponse: SearchSimilarForDateResponseDto;
  selectedAmendLeg: ReservationSeat;
  reserveSeatRequestDate: Date;
  IsReturnTypeTicket: boolean;
  IsRetReservationAvailable: boolean;
  IsOutReservationAvailable: boolean;
  amendReviewBuyData: CojReviewBuyResponse;
  amendReviewBuyEvaluateRequest: EvaluateRequestDto;
  reviewBuyJourneyTimeStampArr: any[];
  noOfAdultAmend: number;
  noOfChildAmend: number;
  IsPartialReturnTypeTicket: boolean;
  isDisabledContinue = new Subject<boolean>();
  IsReturnFromPaymentOrBasket: boolean = false;
  @Output() getLoggedInName: EventEmitter<any> = new EventEmitter();
  @Output() getBasketCount: EventEmitter<any> = new EventEmitter();
  @Output() getJourneyExtraCompleteStatus: EventEmitter<any> = new EventEmitter();
  IsNOResultsForOutwardEarlierLater: boolean = false;
  IsNOResultsForReturnEarlierLater: boolean = false;
  timeCounter: Subject<string> = new Subject<string>();
  isExtendMySessionBtnClickedOrNot = new Subject<boolean>();
  @Output() isReturnTicketTypeForCoj: EventEmitter<any> = new EventEmitter();
  isDownloadVatReceiptBtnClicked = new Subject();
  hideVerifyEmailSection = new Subject<boolean>();
  IsReviewMergedFlowEnabled: boolean = false;

  //Added a property so on earlier/later editQtt input dates do not change
  editQttDepartureTimeStart : string;
  editQttReturnTimeStart : string;
  // added to hide returnJourneySummary when for selected outward fare when no returnFare is valid 
  isReturnFareListAvailableForSingleSelectedTraveSoln: boolean = true;
  private userLoggedIn = new Subject<boolean>();
  isShowBuyTicketBtn = new Subject<boolean>();
  isHideLoginToolTip =  new Subject<boolean>();
  activeValidatorOnLogin = new Subject<boolean>();
  @Output() capsLockOn: EventEmitter<any> = new EventEmitter();
  railCardPriceList: Array<RailCardPriceList> = [];
  LatestJourneyCache: string;
  postSaleReviewBuyCache: string;
  scrollToMyProfile = new Subject<boolean>();
  scrollToCommunicationPreference = new Subject<boolean>();
  @Output() isSingleTicketTypeForCoj: EventEmitter<any> = new EventEmitter();
  selectedJourneyDataForQuickBuyOrContiue: any[];
  enhancedReviewBuyResponse: EnhancedReviewBuyAndDeliveryResponse;
  enhancedGetDeliveryAndBasketJourneyRequest: EnhancedGetDeliveryAndBasketJourneyRequest;
  journeyModeSourceText = new BehaviorSubject<boolean>(false);
  journeyModeTxt$: Observable<boolean> = this.journeyModeSourceText.asObservable();
  journeyRemovedSource = new BehaviorSubject<boolean>(false);
  isJourneyRemoved$: Observable<boolean> = this.journeyRemovedSource.asObservable();
  enhancedValidatePaymentResponse: ValidatePaymentResponse;
  isUserClickedOnReviewBtn: boolean = false;

  constructor(public appConstantsService: AppConstantsService
    , public sharedServiceCache: SharedServiceCache, private readonly appRouteEnum: AppRouteEnum, private readonly sanitizer: DomSanitizer) {
    this.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.locationMasterData = new Array<LocationMasterData>();
    this.journeyExtrasResponseShared = new JourneyExtrasResponse();
    this.customerLoginResponse = new CustomerLoginResponse();
    this.customerLoginResponse.CustomerDetail = new CustomerDetail();
    this.customerLoginResponse.CustomerDetail.Addresses = Array<CustomerAddress>();
    this.journey = new JourneyDetails();

    this.userLoggedIn.next(false);
  }

  resetFareBreakDownData() {
    if (this.fareBreakdownModelData == undefined || this.fareBreakdownModelData.length == 0) {
      this.fareBreakdownModelData = new Array<FareBreakdownModel>();
      let fareBreakdownModel = new FareBreakdownModel;
      fareBreakdownModel.OutWardJourney = new Array<JourneyModel>();
      fareBreakdownModel.ReturnJourney = new Array<JourneyModel>();
      fareBreakdownModel.OutwardJourneyExtras = new Array<JourneyModel>();
      fareBreakdownModel.ReturnJourneyExtras = new Array<JourneyModel>();
      fareBreakdownModel.DeliveryDetails = new Array<JourneyModel>();
      fareBreakdownModel.SeasonJourney = new JourneyModel();
      this.fareBreakdownModelData[0] = fareBreakdownModel;
    }
  }

  sendEvaluateRequest(request) {
    this.evaluateRequest = request;
  }

  sendFareData(fareValue: any) {
    this.fare = fareValue;
  }

  sendReturnFareData(fareValue: any, fareReturnValue: any, totalFare: number, isReturnCase: boolean,
    isSingleReturnCase: boolean) {
    this.fare = fareValue;
    this.fareReturn = fareReturnValue;
    this.totalFare = totalFare;
    this.isReturnCase = isReturnCase;
    this.isSingleReturnCase = !isSingleReturnCase;
  }
  sendDeliveryModes(deliveryModes: any) {
    this.deliveryModes = deliveryModes;
  }

  sendSearchRequest(request) {
    this.searchRequest = request;
  }

  sendCustomerData(firstName: any, lastName: any): void {
    this.customerFirstName = firstName;
    this.customerLastName = lastName;
    this.getLoggedInName.emit(firstName);
    this.userLoggedIn.next(true);
  }

  currencySymbol(_currency) {
    return this.appConstantsService.currencySymbol;
  }

  formatPrice(num) {
    if (num != undefined && num != null && num != 0) {
      num = num.toString();
      num = num.replace(/,/g, "");
      num = parseFloat(num);
      num = num.toFixed(2);
      let [number, decimal] = num.split('.');
      number = parseFloat(number).toLocaleString("en-US");
      num = [number, decimal].join('.')
    }
    else if (num == 0) {
      num = parseFloat(num);
      num = num.toFixed(2);
    }
    return num;
  }
  formatSmartCardNumberDetail(num) {
    if (num != undefined && num != null && num != 0) {
      num = num.split("-").join(""); 
      if (num.length > 0) {
        num = num.match(new RegExp('.{1,4}', 'g')).join("-");
      }
    }
    return num;
  }
  getFormattedDate(passedDate: string) {
    let dateArr = new Date(passedDate).toDateString().split(' ');
    let day = dateArr[0];
    let month = dateArr[1];
    let dateOfMonth = dateArr[2];
    let year = dateArr[3];
    return `${day}, ${dateOfMonth} ${month} ${year}`;
  }

  combineOfferIdAndServiceId(offerId, serviceId) {
    if (offerId != undefined && offerId != null && offerId != 0 && serviceId != undefined && serviceId != null && serviceId != 0) {
      offerId = offerId.toString();
      serviceId = serviceId.toString();
    }
    return offerId + '-' + serviceId;
  }

  calculateTotalAmount(): string {

    this.fareBreakDownTotalFare = 0;
    this.fareBreakDownTotalDiscount = 0.0;
    this.fareBreakdownModelData.forEach(journey => {
      if (journey.OutWardJourney != null) {
        journey.OutWardJourney.forEach(obj => {
          this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + obj.TotalPrice;
        });
      }

      if (journey.ReturnJourney != null) {
        journey.ReturnJourney.forEach(obj => {
          this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + obj.TotalPrice;
        });
      }
      if (journey.OutwardJourneyExtras != null) {
        journey.OutwardJourneyExtras.forEach(obj => {
          this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + obj.TotalPrice;
        });
      }

      if (journey.ReturnJourneyExtras != null) {
        journey.ReturnJourneyExtras.forEach(obj => {
          this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + obj.TotalPrice;
        });
      }
      if (journey.DeliveryDetails != null) {
        journey.DeliveryDetails.forEach(obj => {
          this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + (isNaN(obj.TotalPrice) ? 0 : obj.TotalPrice);
        });
      }

      if (journey.SeasonJourney != null && JSON.stringify(journey.SeasonJourney) != '{}') {
        this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + journey.SeasonJourney.TotalPrice;
      }

      if (journey.FlexiJourney != null && JSON.stringify(journey.FlexiJourney) != '{}') {
        this.fareBreakDownTotalFare = this.fareBreakDownTotalFare + journey.FlexiJourney.TotalPrice;
      }

      this.fareBreakDownTotalDiscount = this.fareBreakDownTotalDiscount + (journey.DiscountPrice != undefined && journey.DiscountPrice != null ? journey.DiscountPrice : 0.0);
    });
    return this.fareBreakDownTotalFare.toString();
  }

  setSharedCache() {
    this.sharedServiceCache.addReturnTabIndex = this.addReturnTabIndex;
    this.sharedServiceCache.mixingDeckUrl = this.mixingDeckUrl;
    this.sharedServiceCache.searchRequest = this.searchRequest;//anmol v8 - bug related to exceed memory
    this.sharedServiceCache.CojSearchRequest = this.CojSearchRequest;
    this.sharedServiceCache.upgradeSearchRequest = this.upgradeSearchRequest;
    this.sharedServiceCache.CojReviewBuyRequest = this.CojReviewBuyRequest;
    this.sharedServiceCache.upgradeReviewBuyRequest = this.upgradeReviewBuyRequest;
    this.sharedServiceCache.isAmendSearchOpen = this.isAmendSearchOpen;
    this.sharedServiceCache.isAmendFresh = this.isAmendFresh;
    this.sharedServiceCache.IsViewMoreClick = this.IsViewMoreClick;
    this.sharedServiceCache.IsViewMoreClickSingleReturn = this.IsViewMoreClickSingleReturn;
    this.sharedServiceCache.isReturnLoaderCase = this.isReturnLoaderCase;
    this.sharedServiceCache.evaluateRequest = this.evaluateRequest;//anmol v8
    this.sharedServiceCache.locationMasterData = this.locationMasterData;//anmol v8
    this.sharedServiceCache.ReservationCache = this.ReservationCache;//anmol v8
    this.sharedServiceCache.createReservationRequest = this.createReservationRequest;
    this.sharedServiceCache.journeyExtrasResponseShared = this.journeyExtrasResponseShared;
    this.sharedServiceCache.fareBreakdownModelData = this.fareBreakdownModelData;
    this.sharedServiceCache.reviewBuyResponse = this.reviewBuyResponse;
    this.sharedServiceCache.CojReviewBuyResponseDto = this.CojReviewBuyResponseDto;
    this.sharedServiceCache.reviewBuyCache = this.reviewBuyCache;
    this.sharedServiceCache.previousCache = this.previousCache;
    this.sharedServiceCache.totalPriceToPayReviewBuy = this.totalPriceToPayReviewBuy;
    this.sharedServiceCache.journey = this.journey;
    this.sharedServiceCache.registrationCustomerEmail = this.registrationCustomerEmail;
    this.sharedServiceCache.registrationCustomerPassword = this.registrationCustomerPassword;
    this.sharedServiceCache.registrationIsLoginFromJE = this.registrationIsLoginFromJE;
    this.sharedServiceCache.registrationIsLoginFromSeason = this.registrationIsLoginFromSeason;
    this.sharedServiceCache.registrationReturnUrl = this.registrationReturnUrl;
    this.sharedServiceCache.isNreBasket = this.isNreBasket;
    this.sharedServiceCache.firstTravelSolDepartureTime = this.firstTravelSolDepartureTime;
    this.sharedServiceCache.firstTravelSolDepartureTimeAmend = this.firstTravelSolDepartureTimeAmend;
    this.sharedServiceCache.secondTravelSolDepartureTime = this.secondTravelSolDepartureTime;
    this.sharedServiceCache.secondTravelSolDepartureTimeAmend = this.secondTravelSolDepartureTimeAmend;
    this.sharedServiceCache.journeySummaryModel = this.journeySummaryModel;
    this.sharedServiceCache.COJjourneySummaryModel = this.COJjourneySummaryModel;
    this.sharedServiceCache.upgradeOutwardPrice = this.upgradeOutwardPrice;
    this.sharedServiceCache.upgradeReturnPrice = this.upgradeReturnPrice;
    this.sharedServiceCache.seatPickerResponseAmend = this.seatPickerResponseAmend;
    this.sharedServiceCache.reserveSeatRequest = this.reserveSeatRequest;
    this.sharedServiceCache.changeSeatRequest = this.changeSeatRequest;
    this.sharedServiceCache.searchSimilarResponse = this.searchSimilarResponse;
    this.sharedServiceCache.selectedAmendLeg = this.selectedAmendLeg;
    this.sharedServiceCache.reserveSeatRequestDate = this.reserveSeatRequestDate;
    this.sharedServiceCache.IsReturnTypeTicket = this.IsReturnTypeTicket;
    this.sharedServiceCache.IsPartialReturnTypeTicket = this.IsPartialReturnTypeTicket;
    this.sharedServiceCache.IsRetReservationAvailable = this.IsRetReservationAvailable;
    this.sharedServiceCache.IsOutReservationAvailable = this.IsOutReservationAvailable;
    this.sharedServiceCache.amendReviewBuyData = this.amendReviewBuyData;
    this.sharedServiceCache.amendReviewBuyEvaluateRequest = this.amendReviewBuyEvaluateRequest;
    this.sharedServiceCache.reviewBuyJourneyTimeStampArr = this.reviewBuyJourneyTimeStampArr;
    this.sharedServiceCache.noOfAdultAmend = this.noOfAdultAmend;
    this.sharedServiceCache.noOfChildAmend = this.noOfChildAmend;
    this.sharedServiceCache.isSingleReturnCase = this.isSingleReturnCase;
    this.sharedServiceCache.isReturnCase = this.isReturnCase;
    this.sharedServiceCache.editQttDepartureTimeStart = this.editQttDepartureTimeStart;
    this.sharedServiceCache.editQttReturnTimeStart = this.editQttReturnTimeStart;
    this.sharedServiceCache.railCardPriceList = this.railCardPriceList;
    this.sharedServiceCache.LatestJourneyCache = this.LatestJourneyCache;
    this.sharedServiceCache.postSaleReviewBuyCache = this.postSaleReviewBuyCache;
    this.sharedServiceCache.selectedJourneyDataForQuickBuyOrContiue = this.selectedJourneyDataForQuickBuyOrContiue;
    this.sharedServiceCache.enhancedReviewBuyResponse = this.enhancedReviewBuyResponse;
    this.sharedServiceCache.enhancedGetDeliveryAndBasketJourneyRequest = this.enhancedGetDeliveryAndBasketJourneyRequest;
  }

  setSharedService() {
    this.addReturnTabIndex = this.sharedServiceCache.addReturnTabIndex;
    this.mixingDeckUrl = this.sharedServiceCache.mixingDeckUrl;
    this.searchRequest = this.sharedServiceCache.searchRequest;
    this.CojSearchRequest = this.sharedServiceCache.CojSearchRequest;
    this.upgradeSearchRequest = this.sharedServiceCache.upgradeSearchRequest;
    this.CojReviewBuyRequest = this.sharedServiceCache.CojReviewBuyRequest;
    this.upgradeReviewBuyRequest = this.sharedServiceCache.upgradeReviewBuyRequest;
    this.isAmendSearchOpen = this.sharedServiceCache.isAmendSearchOpen;
    this.isAmendFresh = this.sharedServiceCache.isAmendFresh;
    this.IsViewMoreClick = this.sharedServiceCache.IsViewMoreClick;
    this.IsViewMoreClickSingleReturn = this.sharedServiceCache.IsViewMoreClickSingleReturn;
    this.isReturnLoaderCase = this.sharedServiceCache.isReturnLoaderCase;
    this.evaluateRequest = this.sharedServiceCache.evaluateRequest;
    this.locationMasterData = this.sharedServiceCache.locationMasterData;
    this.ReservationCache = this.sharedServiceCache.ReservationCache;
    this.createReservationRequest = this.sharedServiceCache.createReservationRequest;
    this.journeyExtrasResponseShared = this.sharedServiceCache.journeyExtrasResponseShared;
    this.fareBreakdownModelData = this.sharedServiceCache.fareBreakdownModelData;
    this.reviewBuyCache = this.sharedServiceCache.reviewBuyCache;
    this.previousCache = this.sharedServiceCache.previousCache;
    this.totalPriceToPayReviewBuy = this.sharedServiceCache.totalPriceToPayReviewBuy;
    this.reviewBuyResponse = this.sharedServiceCache.reviewBuyResponse;
    this.CojReviewBuyResponseDto = this.sharedServiceCache.CojReviewBuyResponseDto;
    this.journey = this.sharedServiceCache.journey;
    this.registrationCustomerEmail = this.sharedServiceCache.registrationCustomerEmail;
    this.registrationCustomerPassword = this.sharedServiceCache.registrationCustomerPassword;
    this.registrationIsLoginFromJE = this.sharedServiceCache.registrationIsLoginFromJE;
    this.registrationIsLoginFromSeason = this.sharedServiceCache.registrationIsLoginFromSeason;
    this.registrationReturnUrl = this.sharedServiceCache.registrationReturnUrl;
    this.isNreBasket = this.sharedServiceCache.isNreBasket;
    this.journeySummaryModel = this.sharedServiceCache.journeySummaryModel;
    this.COJjourneySummaryModel = this.sharedServiceCache.COJjourneySummaryModel;
    this.upgradeReturnPrice = this.sharedServiceCache.upgradeReturnPrice;
    this.upgradeOutwardPrice = this.sharedServiceCache.upgradeOutwardPrice;
    this.railCardPriceList = this.sharedServiceCache.railCardPriceList;
    this.LatestJourneyCache = this.sharedServiceCache.LatestJourneyCache;
    this.postSaleReviewBuyCache = this.sharedServiceCache.postSaleReviewBuyCache;
    this.selectedJourneyDataForQuickBuyOrContiue = this.sharedServiceCache?.selectedJourneyDataForQuickBuyOrContiue;
    this.enhancedReviewBuyResponse = this.sharedServiceCache.enhancedReviewBuyResponse;
    this.enhancedGetDeliveryAndBasketJourneyRequest = this.sharedServiceCache.enhancedGetDeliveryAndBasketJourneyRequest;
  }

  clearSharedCache(url: string) {
    this.sharedServiceCache.addReturnTabIndex = this.addReturnTabIndex;
    this.sharedServiceCache.mixingDeckUrl = this.mixingDeckUrl;
    this.sharedServiceCache.searchRequest = this.searchRequest;
    this.sharedServiceCache.CojSearchRequest = this.CojSearchRequest;
    this.sharedServiceCache.upgradeSearchRequest = this.upgradeSearchRequest;
    this.sharedServiceCache.CojReviewBuyRequest = this.CojReviewBuyRequest;
    this.sharedServiceCache.upgradeReviewBuyRequest = this.upgradeReviewBuyRequest;
    this.sharedServiceCache.isAmendSearchOpen = this.isAmendSearchOpen;
    this.sharedServiceCache.isAmendFresh = this.isAmendFresh;
    this.sharedServiceCache.IsViewMoreClick = this.IsViewMoreClick;
    this.sharedServiceCache.IsViewMoreClickSingleReturn = this.IsViewMoreClickSingleReturn;
    this.sharedServiceCache.isReturnLoaderCase = this.isReturnLoaderCase;
    this.sharedServiceCache.evaluateRequest = this.evaluateRequest;
    this.sharedServiceCache.locationMasterData = this.locationMasterData;

    if (url.includes(this.appRouteEnum.JourneyExtras)) {
      this.sharedServiceCache.journeyExtrasResponseShared = this.journeyExtrasResponseShared;
      this.sharedServiceCache.createReservationRequest = this.createReservationRequest;
      this.sharedServiceCache.isNreBasket = this.isNreBasket;
    }
    else {
      this.sharedServiceCache.journeyExtrasResponseShared = null;
      this.sharedServiceCache.createReservationRequest = null;
      this.sharedServiceCache.isNreBasket = false;
    }
    this.sharedServiceCache.ReservationCache = this.ReservationCache;
    this.sharedServiceCache.fareBreakdownModelData = this.fareBreakdownModelData;
    this.sharedServiceCache.reviewBuyResponse = null;
    this.sharedServiceCache.CojReviewBuyResponseDto = null;
    this.sharedServiceCache.reviewBuyCache = null;
    this.sharedServiceCache.previousCache = null;
    this.sharedServiceCache.totalPriceToPayReviewBuy = null;
    this.sharedServiceCache.journey = null;
    this.sharedServiceCache.registrationCustomerEmail = this.registrationCustomerEmail;
    this.sharedServiceCache.registrationCustomerPassword = this.registrationCustomerPassword;
    this.sharedServiceCache.registrationIsLoginFromJE = this.registrationIsLoginFromJE;
    this.sharedServiceCache.registrationIsLoginFromSeason = this.registrationIsLoginFromSeason;
    this.sharedServiceCache.registrationReturnUrl = this.registrationReturnUrl;
    this.sharedServiceCache.firstTravelSolDepartureTime = this.firstTravelSolDepartureTime;
    this.sharedServiceCache.firstTravelSolDepartureTimeAmend = this.firstTravelSolDepartureTimeAmend;
    this.sharedServiceCache.secondTravelSolDepartureTime = this.secondTravelSolDepartureTime;
    this.sharedServiceCache.secondTravelSolDepartureTimeAmend = this.secondTravelSolDepartureTimeAmend;
    this.sharedServiceCache.journeySummaryModel = this.journeySummaryModel;
    this.sharedServiceCache.COJjourneySummaryModel = this.COJjourneySummaryModel;
    this.sharedServiceCache.upgradeOutwardPrice = this.upgradeOutwardPrice;
    this.sharedServiceCache.upgradeReturnPrice = this.upgradeReturnPrice;
    this.sharedServiceCache.railCardPriceList = null;
    this.sharedServiceCache.enhancedReviewBuyResponse = null;
    this.sharedServiceCache.enhancedGetDeliveryAndBasketJourneyRequest = this.enhancedGetDeliveryAndBasketJourneyRequest;
  }

  clearAmendSearch() {
    this.addReturnTabIndex = null;
    this.evaluateRequest = new EvaluateTravelRequest;
    this.fare = null;
    this.fareReturn = null;
    this.totalFare = 0;
    this.isReturnCase = false;
    this.isSingleReturnCase = false;
    this.deliveryModes = new DeliveryMode();
    this.searchRequest = new SearchRequestModel();
    this.CojSearchRequest = new COJSearchRequestModel();
    this.upgradeSearchRequest = new COJSearchRequestModel();
    this.CojReviewBuyRequest = new CojEvaluateTravelRequest();
    this.upgradeReviewBuyRequest = new CojEvaluateTravelRequest();
    
    this.firstTravelSolDepartureTime = "";
    this.firstTravelSolDepartureTimeAmend = "";
    this.secondTravelSolDepartureTime = "";
    this.secondTravelSolDepartureTimeAmend = "";

    this.journeySummaryModel = new JourneySummaryModel();
    this.COJjourneySummaryModel = new JourneySummaryModel();
    this.isSearchResultPage = false;
    this.isSearchApiError = false;
    this.isEarlierLaterSearchApiError = false;
    this.activeTabValue = -1;
    this.returnFare = null;
    this.returnTravelSolution = null;
    this.singleSolutionFare = null;
    this.singleSolutionTravelSolution = null;
    this.upgradeOutwardPrice = null;
    this.upgradeReturnPrice = null;
    this.enhancedGetDeliveryAndBasketJourneyRequest = new EnhancedGetDeliveryAndBasketJourneyRequest;
    this.isNewLoaderForNewFlow = false;
  }

 

  getIsDisabledContinue(): Observable<any> {
    return this.isDisabledContinue.asObservable();
  }

  getTimeCount(): Observable<any> {
    return this.timeCounter.asObservable();
  }

  getExtendValueBtn(): Observable<any> {
    return this.isExtendMySessionBtnClickedOrNot.asObservable();
  }

  titleCaseWord(word) {
    try {
      if (!word)
        return word;
      return word[0].toUpperCase() + word.substr(1).toLowerCase();
    } catch (err) {
      console.log("titleCaseWord function error : " + err);
      return word;
    }
  }

  setUserLoggedIn(userLoggedIn: boolean) {
    this.userLoggedIn.next(userLoggedIn);
  }
  getUserLoggedIn(): Observable<boolean> {
    return this.userLoggedIn.asObservable();
  }

  getIsShowBuyButton(): Observable<any> {
    return this.isShowBuyTicketBtn.asObservable();
  }

  getIsLoginToolTip(): Observable<any> {
    return this.isHideLoginToolTip.asObservable();
  }

  activeValidatorOnOpenLoginToolTip(): Observable<any> {
    return this.activeValidatorOnLogin.asObservable();
  }

  getValueWhenClickOnDownloadVatReceiptBtn(): Observable<any> {
    return this.isDownloadVatReceiptBtnClicked.asObservable();
  }

  getIsVerifyEmailSection(): Observable<any> {
    return this.hideVerifyEmailSection.asObservable();
  }

  scrollToMyProfileSection(): Observable<boolean> {
    return this.scrollToMyProfile.asObservable();
  }

  scrollToCommPreferenceSection(): Observable<boolean> {
    return this.scrollToCommunicationPreference.asObservable();
  }

  // to make url of bypass Security Trust Resource Url 
  sanitizerUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  setJourneyTxtMode(isAdd: boolean): void {
    return this.journeyModeSourceText.next(isAdd);
  }

  isJourneySuccessfullyRemoved(isRemovedJourney: boolean): void {
    return this.journeyRemovedSource.next(isRemovedJourney);
  }

}

