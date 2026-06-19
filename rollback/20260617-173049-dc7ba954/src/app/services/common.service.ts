import { Injectable, Injector, Renderer2, RendererFactory2 } from '@angular/core';
import { LocationMasterData } from '../models/master/location-master.model';
import { ResponseData } from '../models/common/response.model';
import { environment } from 'src/environments/environment';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';
import { AppConstantsService, AppRouteEnum, BookingTypeEnum, CommonIconImg, LocalStorageKeyEnum, NotificationErrorMsg, NreOjpNationalRaiURLEnum, QuickBuyEnum, SeatPrefrenceType, TicketTypeEnum, TitleListEnum, TravelSolutionJourneyTypeEnum, TravelSolutionOperatorEnum,DiscountCodeStatusEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedDynamicClassesNameEnum, EnhancedAppRouteEnum, EnhancedMixingDeckPopupHeadingEnum, DeliveryModeEnum, NativePaymentMethodEnum, ErrorMessageEnum, Ga4DatalayerConstantEnum } from '../utility/app-constants.service';
import { Title } from '@angular/platform-browser';
import { StorageDataService } from './storage-data.service';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { SharedService } from './shared-sibling.service';
import { RailcardModel } from '../models/master/railcard-station.model';
import { TravelSolutionModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { FareModel } from '../models/mixing-deck/fare.model';
import { RefundDetailsResponseDto } from 'src/app/models/account/refund-booking';
import { SearchRequestModel } from '../models/mixing-deck/search-request.model';
import { JourneyDetail, JourneyExtrasDetail, ReservationSeat } from '../models/review-buy/review-buy-model';
import sha256 from 'crypto-js/sha256';
import * as CryptoJS from 'crypto-js';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { PassengerAssistResponse, PassengerDetail } from '../models/payment-details/validate-payment-response.model';
import { NotificationService } from '../utility/toastr-notification/toastr-notification.service';
import { Guid } from 'guid-typescript';
import { CustomerAddress } from '../models/payment-details/billing-address-response.model';
import { CustomerLoginResponse } from '../models/customer/customer-login-response.model';
import { HttpParams } from '@angular/common/http';
import { SharedServiceCache } from './SharedServiceCache.service';
import { CreateReservationRequest, CreateReservationResponse } from '../models/journey-extras/reservation.model';
import { JourneyExtraService } from './journey-extras.service';
import { InfoPopupComponent } from '../Component/mixing-deck/info-popup/info-popup.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginPageComponent } from '../Component/login-page/login-page.component';
import { FareBreakdownModel, JourneyModel } from '../models/mixing-deck/fare-breakdown.model';
import { NreJourneyExtrasResponse } from '../models/journey-extras/nre-response.model';
import { CommonNotificationComponent } from '../Component/common-notification/common-notification.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MyProfileForgotPasswordComponent } from '../Component/my-account/my-profile/my-profile-forgot-password/my-profile-forgot-password.component';
import { DiscountCodeNotificationPopupComponent } from '../Component/coj-mixing-deck/discount-code-notification-popup/discount-code-notification-popup.component';
import { downloadFile } from '../utility/download-file';
import { EnhancedCommonNotificationDialogsComponent } from '../Enhanced-Component/enhanced-dialogs/enhanced-common-notification-dialogs/enhanced-common-notification-dialogs.component';
import { EnhancedCommonErrorPopupComponent } from '../Enhanced-Component/enhanced-dialogs/enhanced-common-error-popup/enhanced-common-error-popup.component';
import { EnhancedCompleteOrderService } from './enhanced-complete-order.service';
import { EnhancedGetDeliveryAndBasketJourneyRequest } from '../models/enhanced-review-buy-and-delivery/enhanced-get-delivery-and-basket-journey-request';
import { SearchStateService } from './search-state.service';
@Injectable({
  providedIn: 'root'
})
export class CommonServices {
  isRailCardPresent: boolean = false;
  private _renderer2: Renderer2;

  httpClientService: HttpClientService;
  apiPath: ApiRouteService;
  appRouteEnum: AppRouteEnum;
  title: Title;
  storageDataService: StorageDataService;
  datePipe: DatePipe;
  sharedService: SharedService;
  completeOrderService: CompleteOrderService;
  passengerAssistResponse: PassengerAssistResponse;
  passengerDetail: PassengerDetail;
  responseData: ResponseData;
  notificationService: NotificationService;
  customerLoginResponse: CustomerLoginResponse;
  localStorageKeyEnum: LocalStorageKeyEnum;
  quickBuyEnum: QuickBuyEnum;
  sharedServiceCache: SharedServiceCache;
  appConstantsService: AppConstantsService;
  ticketTypeEnum: TicketTypeEnum;
  travelSolutionOperatorEnum: TravelSolutionOperatorEnum;
  seatPrefrenceType: SeatPrefrenceType;
  journeyExtraService: JourneyExtraService;
  createReservationResponse: CreateReservationResponse;
  spinnerService: NgxSpinnerService;
  router: Router;
  titleListEnum: TitleListEnum;
  titleListArray: Array<string> = [];
  titleListArrayWithOutOther: Array<string> = [];
  passnegerAssistUrl = new Subject<string>();
  passnegerAssistUrl$: Observable<string> = this.passnegerAssistUrl.asObservable();
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  notificationErrorMsg: NotificationErrorMsg;
  commonIconImg: CommonIconImg;
  technicalErrorObject = {
    isThisClubAvantiTechnicalError: false,
    errorMessage: ''
  }
  clubAvantiTechnicalError = new BehaviorSubject<any>(this.technicalErrorObject);
  clubAvantiTechnicalError$ : Observable<any> = this.clubAvantiTechnicalError.asObservable();
  bookingTypeEnum: BookingTypeEnum;
  outwardGroupSaveRailCardArray = [];
  outwardNonGroupSaveRailCardArray = [];
  returnGroupSaveRailCardArray = [];
  returnNonGroupSaveRailCardArray = [];
  nreOjpNationalRaiURLEnum: NreOjpNationalRaiURLEnum;
  route: ActivatedRoute;
  purchaseTicketRequestID: string;
  callToggleOnChangeForNoFaresAndExpiredDiscountCode = new Subject<any>();
  callToggleOnChangeForNoFaresAndExpiredDiscountCode$ : Observable<any> = this.callToggleOnChangeForNoFaresAndExpiredDiscountCode.asObservable();
  discountCodeStatusEnum: DiscountCodeStatusEnum;
  enhancedLocalOrSessionStorageKeysEnum: EnhancedLocalOrSessionStorageKeysEnum;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;
  enhancedDynamicClassNameEnum: EnhancedDynamicClassesNameEnum;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  enhancedMixingDeckPopupHeadingEnum: EnhancedMixingDeckPopupHeadingEnum;
  deliveryModeEnum: DeliveryModeEnum;
  nativePaymentMethod: NativePaymentMethodEnum;
  errorMessageEnum: ErrorMessageEnum;
  enhancedCompleteOrderService: EnhancedCompleteOrderService;
  ga4DatalayerConstantEnum: Ga4DatalayerConstantEnum;
  localStorageEnum: LocalStorageKeyEnum;
  enhancedGetDeliveryAndBasketJourneyRequest: EnhancedGetDeliveryAndBasketJourneyRequest;
  searchStateService: SearchStateService;
  
  constructor(private readonly rendererFactory: RendererFactory2, private readonly injector: Injector, private readonly dialog: MatDialog) {
    // Dependency Injection without using constructor's param
    this.httpClientService = this.injector.get(HttpClientService);
    this.apiPath = this.injector.get(ApiRouteService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.title = this.injector.get(Title);
    this.storageDataService = this.injector.get(StorageDataService);
    this.datePipe = this.injector.get(DatePipe);
    this.sharedService = this.injector.get(SharedService);
    this.completeOrderService = this.injector.get(CompleteOrderService);
    this._renderer2 = this.rendererFactory.createRenderer(null, null);
    this.notificationService = this.injector.get(NotificationService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
    this.travelSolutionOperatorEnum = this.injector.get(TravelSolutionOperatorEnum);
    this.seatPrefrenceType = this.injector.get(SeatPrefrenceType);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.router = this.injector.get(Router);
    this.titleListEnum = this.injector.get(TitleListEnum);
    this.titleListArray = [this.titleListEnum.Mr, this.titleListEnum.Ms, this.titleListEnum.Mrs, this.titleListEnum.Miss, this.titleListEnum.Dr, this.titleListEnum.Rev, this.titleListEnum.Lady, this.titleListEnum.Lord, this.titleListEnum.Sir, this.titleListEnum.Mx, this.titleListEnum.Dame, this.titleListEnum.Other];
    this.titleListArrayWithOutOther = [this.titleListEnum.Mr, this.titleListEnum.Ms, this.titleListEnum.Mrs, this.titleListEnum.Miss, this.titleListEnum.Dr, this.titleListEnum.Rev, this.titleListEnum.Lady, this.titleListEnum.Lord, this.titleListEnum.Sir, this.titleListEnum.Mx, this.titleListEnum.Dame];
    this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.notificationErrorMsg =  this.injector.get(NotificationErrorMsg);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.bookingTypeEnum = this.injector.get(BookingTypeEnum);
    this.nreOjpNationalRaiURLEnum = this.injector.get(NreOjpNationalRaiURLEnum);
    this.route = this.injector.get(ActivatedRoute);
    this.discountCodeStatusEnum = this.injector.get(DiscountCodeStatusEnum);
    this.enhancedLocalOrSessionStorageKeysEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
    this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.enhancedDynamicClassNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedMixingDeckPopupHeadingEnum = this.injector.get(EnhancedMixingDeckPopupHeadingEnum);
    this.deliveryModeEnum= this.injector.get(DeliveryModeEnum);
    this.nativePaymentMethod = this.injector.get(NativePaymentMethodEnum);
    this.errorMessageEnum = this.injector.get(ErrorMessageEnum);
    this.enhancedCompleteOrderService = this.injector.get(EnhancedCompleteOrderService);
    this.ga4DatalayerConstantEnum = this.injector.get(Ga4DatalayerConstantEnum);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
    this.searchStateService = this.injector.get(SearchStateService);
  }
  public locations: LocationMasterData[];
  responsedata: ResponseData;
  loaderRequired: boolean = false;
  railCardsList: RailcardModel[];
  Services = [];
  DefaultService = {};
  SelectedService = [];
  isReturnJourney = false;
  Price = [];
  SelectedServicePrices = [];
  DefaultServicePrices = [];
  productImpressionPrices = [];
  TicketStdclass = null;
  TicketStdPremiumclass = null;
  TicketFirstclass = null;
  cheapestArr = null;
  SessionId = '';
  outwardTravelSolIds = [];
  inwardTravelSolIds = [];
  railCardsSeasonList = [
    { Code: 'TSU', Name: '16-17 Saver' },
    { Code: 'JCP', Name: 'Jobcentre Plus Travel Discount Card' }
  ];

  getLocations() {
    return this.httpClientService.HttpGetRequest(this.apiPath.locationList);
  }

  getRailcardStations() {
    return this.httpClientService.HttpGetRequest(this.apiPath.railcardStationList);
  }

  collectFromStation() {
    return this.httpClientService.HttpGetRequest(this.apiPath.todDeliveryLocations);
  }
  getSessionId() {
    try {
      let Id = sessionStorage.getItem('SessionId');
      if (Id) {
        this.SessionId = Id;
      }
      else {
        this.storageDataService.setSessionStorageData('SessionId', Guid.create(), false);
        this.SessionId = sessionStorage.getItem('SessionId');
      }
    }
    catch (err) {
      console.log(err);
    }
  }

  filterByStandard(fareList: any) {
    let standardFound = false;
    return fareList.filter(x => {
      if (!standardFound && x.TicketClass == 'Standard') {
        standardFound = true;
        return true;
      }
    });
  }

  filterByStdPremium(fareList: any) {
    if (fareList && fareList.length > 0) {
      let firstPremiumFound = false;
      return fareList.filter(fare => {
        if (!firstPremiumFound && fare.TicketClass === 'Standard Premium') {
          firstPremiumFound = true;
          return true;
        }
        return false;
      });
    }
  }

  filterByFirst(fareList: any) {
    let firstFound = false;
    return fareList.filter(x => {
      if (!firstFound && x.TicketClass == 'First') {
        firstFound = true;
        return true;
      }
    });
  }


  getFareList(FareList: FareModel[]) {
    if (FareList && FareList.length > 0) {
      
      FareList.forEach((obj) => {
        let stdFarePrice = this.filterByStandard(obj.FareList);
        let firstFarePrice = this.filterByFirst(obj.FareList);
        let stdPremiumFarePrice = this.filterByStdPremium(obj.FareList);
       
        stdFarePrice.forEach((stdFare) => {
          this.Price.push({
            price: stdFare.Price,
            ticketType: stdFare.TicketType
          });
        });

        firstFarePrice.forEach((firstFare) => {
          this.Price.push({
            price: firstFare.Price,
            ticketType: firstFare.TicketType
          });
        });

        stdPremiumFarePrice.forEach((stdPremiumFare) => {
          this.Price.push({
            price: stdPremiumFare.Price,
            ticketType: stdPremiumFare.TicketType
          });
        });
      });
      
    }
  }
  getSessions(obj, index, defaultSelectedRow, selectedDurationType, selectedPrice) {
    if (!obj || obj === null || obj === undefined) {
      return;
    }
    this.Services = [{
      ...this.Services,
      IsSeason: 'true',
      DurationType: obj.DurationType,
      Price: obj.Price,
      DestinationStation: obj.DestinationStation,
      SourceStation: obj.SourceStation,
      Expiry: obj.Expiry
    }];

    if (index == defaultSelectedRow && obj.Price == selectedPrice) {
      this.DefaultService = {
        IsSeason: 'true',
        DurationType: obj.DurationType,
        Price: obj.Price,
        DestinationStation: obj.DestinationStation,
        SourceStation: obj.SourceStation,
        Expiry: obj.Expiry
      };

    }

    if (selectedDurationType && obj.DurationType == selectedDurationType) {
      this.SelectedService = [{
        IsSeason: 'true',
        DurationType: obj.DurationType,
        Price: obj.Price,
        DestinationStation: obj.DestinationStation,
        SourceStation: obj.SourceStation,
        Expiry: obj.Expiry
      }];
    }
  }

  calculateDiff(dateSent) {
    let currentDate = new Date();
    dateSent = new Date(dateSent);

    return Math.floor((Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()) - Date.UTC(dateSent.getFullYear(), dateSent.getMonth(), dateSent.getDate())) / (1000 * 60 * 60 * 24));
  }

  isLaterSearch(searchRequest) {
    if (searchRequest.Searchtype === 'LATER' || searchRequest.SearchtypeReturn === 'LATER') {
      return true;
    }
    else {
      return false;
    }
  }
  isEarlierSearch(searchRequest) {
    if (searchRequest.Searchtype === 'EARLIER' || searchRequest.SearchtypeReturn === 'EARLIER') {
      return true;
    }
    else {
      return false;
    }
  }

  isCheapestTravelSolution(currentTravelSolution) {
    if (this.cheapestArr != null && this.cheapestArr != undefined) {
      if ((this.cheapestArr.indexOf(currentTravelSolution.TravelSolId) > -1) && (currentTravelSolution.Operator === 1 || currentTravelSolution.Operator === 2)) {
        return `'Cheapest'`;
      }
      else {
        return undefined;
      }
    }
  }
  getDurationTime(obj) {
    if (obj.Duration.indexOf('h') > -1) {
      return `${+(obj.Duration.split('h')[0]) >= 10 ? obj.Duration.split('h')[0] : '0' + obj.Duration.split('h')[0]}:${+(obj.Duration.split('h')[1].split('m')[0].trim()) >= 10 ? obj.Duration.split('h')[1].split('m')[0].trim() : '0' + obj.Duration.split('h')[1].split('m')[0].trim()}`
    }
    else {
      return `00:${+(obj.Duration.slice(0, -1)) >= 10 ? obj.Duration.slice(0, -1) : '0' + obj.Duration.slice(0, -1)}`;
    }
  }

  getGaDurationTime(gaDuration: string) {
    if (gaDuration && gaDuration.length) {
      let gaTime = gaDuration.split(':');
      if (gaTime.length > 1) {
        return `${gaTime[0]}:${gaTime[1]}`;
      } else {
        return `00:${gaTime[0]}`;
      }
    }
  }

  checkOutwardInwardType(travelSolution, outwardTravelSolIds, inwardTravelSolIds) {
    if (outwardTravelSolIds.indexOf(travelSolution.TravelSolId) > -1) {
      return `Outward`
    } else if (inwardTravelSolIds.indexOf(travelSolution.TravelSolId) > -1) {
      return `Inward`;
    }
  }

  getIdForEvents(journey: TravelSolutionModel, searchRequest: SearchRequestModel, activeTab) {
    if (journey && searchRequest) {
      let id = "";
      id += `${journey.DepartureTime.split('(').pop().split(')')[0]}-${journey.ArrivalTime.split('(').pop().split(')')[0]}`; // stn codes

      let depDate = journey.DepartureDate.split("T");
      let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -2)}`;

      id += depDateTimeStamp; // service departure timestamp
      id += `-${searchRequest.Adult}`;
      id += `-${searchRequest.Child}`;
      id += `-${this.getReturnOrSingle(searchRequest,activeTab)}`;     
      return id;
    }
  }

  getReturnOrSingle(searchRequest,activeTab){
    if(searchRequest.TravelSolutionDirection === 'OPEN_RETURN') return 'open_return';
    if(activeTab === 0) return 'single';
    return 'return';
  }

  getIdForTransactionEvent(journey: JourneyDetail, isOutward: boolean) {
    let id = "";
    if (journey) {
      if (isOutward) {
        id += `${journey.Departure.split('(').pop().split(')')[0]}-${journey.Arrival.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.DepartureDate.toString().split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      } else {
        id += `${journey.Arrival.split('(').pop().split(')')[0]}-${journey.Departure.split('(').pop().split(')')[0]}`; // stn codes

        let depDate = journey.ReturnDepartureDate.toString().split("T");
        let depDateTimeStamp = `-${depDate[0].split("-").join("")}${depDate[1].split(":").join("").slice(0, -3)}`;
        id += depDateTimeStamp; // service departure timestamp
      }

      id += `-${journey.Adult}`;
      id += `-${journey.Child}`;
      id += `-${(journey.GAJourneyType && journey.GAJourneyType.toLowerCase())}`;
    }
    return (id || undefined);
  }
  getIdForJE_Services(service) {
    let id = "";
    if (service) {
      let direction = service.IsReturn ? '_return' : '_outward';
      if (service.Description === "Bicycle Reservation") {
        id += ("Bike" + direction);
      } else if (service.Description === "London Travelcard") {
        let zone = service.ServiceName ? service.ServiceName.split(" ").slice(2, service.ServiceName.length).join("").toLowerCase() : "";
        id += ("Travelcard" + zone + direction);
      } else if (service.Description === "PLUSBUS") {
        id += ("PlusBus" + direction);
      }
    }
    return id || undefined;
  }
  getVariantForJEService(service) {
    if (service.Description === 'Bicycle Reservation' || service.Description === 'PLUSBUS') {
      return service.IsReturn ? 'Return' : 'Outward';
    } else {
      return service.ServiceName;
    }
  }

  getCompany(obj){
    if(obj.Operator == '1') return 'Avanti only';
    else if(obj.Operator == '4') return 'Multiple operators';
    else if(obj.Operator == '3') return obj.SaleCompany;
    else if(obj.Operator == '2') return 'Avanti Plus';
    return 'All';
  }

  getJourneyType(searchRequest){
    if(searchRequest.TravelSolutionDirection == 'ONE_WAY') return 'Single';
    else if(searchRequest.TravelSolutionDirection == 'RETURN') return 'Return';
    else if(searchRequest.TravelSolutionDirection == 'OPEN_RETURN') return 'Anytime_Return';
    else if(searchRequest.TravelSolutionDirection == 'SEASON') return 'season';
    return '';
  }

  getTicket(TravelSolutions, searchRequest, defaultSelectedRow, choosedTravelSolution, defaultSelectedRowSingleReturn, choosedTravelSolutionReturn, getTicketParamsObj) {
    if (!TravelSolutions || TravelSolutions === null || TravelSolutions === undefined) {
      return;
    }

    TravelSolutions.forEach((obj, index) => {

      if (!obj || obj === null || obj === undefined) {
        return;
      }

      this.Price = [];
      if (searchRequest.TravelSolutionDirection == 'OPEN_RETURN') {
        this.getFareList(obj.NewFareList);
      } else {
        this.getFareList(obj.NewFareList);
        this.getFareList(obj.NewReturnFareList);
      }

      let company = this.getCompany(obj);      
      let diffOfDates = Math.abs(this.calculateDiff(obj.DepartureDate));
      
      let journeyType = this.getJourneyType(searchRequest);  
      this.Price.forEach(element => {
        let prdImpressPrice = { ...element }
        prdImpressPrice.id = index + 1;
        this.productImpressionPrices.push(prdImpressPrice);
      });

      let obj1 = {
        name: obj.DepartureTime.split('(').pop().split(')')[0] + `-` + obj.ArrivalTime.split('(').pop().split(')')[0],
        id: this.getIdForEvents(obj, searchRequest, getTicketParamsObj.activeTab),
        price: this.getPriceForItem(obj, getTicketParamsObj.activeTab),
        brand: obj.Brand,
        category: this.getCategoryName(obj),
        variant: this.getVarientCodeName(obj),
        list: 'Search Results',
        position: (index + 1),
        dimension1: new Date(obj.DepartureDate).toLocaleDateString("en-GB"),
        dimension2: new Date(obj.ArrivalDate).toLocaleDateString("en-GB"),
        dimension3: this.getDurationTime(obj),
        dimension4: undefined,
        dimension5: undefined,
        dimension6: this.getJourneyTypeValue(this.isReturnJourney),
        dimension7: journeyType,
        dimension8: obj.Changes,
        dimension9: this.isCheapestTravelSolution(obj),
        dimension10: diffOfDates,
        dimension12: this.getRailCardCode(searchRequest),
        dimension11: this.isRailCardPresent,
        dimension39: obj.DepartureTime.split('(')[0].trim(),
        dimension40: obj.ArrivalTime.split('(')[0].trim(),
        dimension41: company
      }
      this.Services.push(obj1);

      this.getOutRetDateAndTime(obj, defaultSelectedRow, defaultSelectedRowSingleReturn, diffOfDates);
      
      if (obj.TravelSolId == choosedTravelSolution || obj.TravelSolId == choosedTravelSolutionReturn) {
        this.Price.forEach(element => {
          this.SelectedServicePrices.push(element);
        });
        let obj2 = {
          name: obj.DepartureTime.split('(').pop().split(')')[0] + `-` + obj.ArrivalTime.split('(').pop().split(')')[0],
          id: this.getIdForEvents(obj, searchRequest, getTicketParamsObj.setListOfItemsForNonSeason.activeTabForClickEvent),
          price: this.getFarePrice(getTicketParamsObj.outwardSelectedFare, getTicketParamsObj.setListOfItemsForNonSeason.returnSelectedFare, this.isReturnJourney),
          brand: obj.Brand,
          category: this.getCategoryName(obj),
          variant: this.getVarientCodeName(obj),
          position: (index + 1),
          dimension1: new Date(obj.DepartureDate).toLocaleDateString("en-GB"),
          dimension2: new Date(obj.ArrivalDate).toLocaleDateString("en-GB"),
          dimension3: this.getDurationTime(obj),
          dimension4: this.getTicketClass(getTicketParamsObj.outwardSelectedFare, getTicketParamsObj.setListOfItemsForNonSeason.returnSelectedFare, this.isReturnJourney),
          dimension5: this.getTicketType(getTicketParamsObj.outwardSelectedFare, getTicketParamsObj.setListOfItemsForNonSeason.returnSelectedFare, this.isReturnJourney),
          dimension6: getTicketParamsObj.activeTab === "single" ? "Outward" : "Inward",
          dimension7: journeyType,
          dimension8: obj.Changes,
          dimension9: this.isCheapestTravelSolution(obj),
          dimension10: diffOfDates,
          dimension12: this.getRailCardCode(searchRequest),
          dimension11: this.isRailCardPresent,
          dimension39: obj.DepartureTime.split('(')[0].trim(),
          dimension40: obj.ArrivalTime.split('(')[0].trim(),
          dimension41: company
        };
        this.SelectedService.push(obj2);
      }
    });
  }

  // for get Out & Ret Date Time
  getOutRetDateAndTime(obj, defaultSelectedRow, defaultSelectedRowSingleReturn, diffOfDates) {
    if (obj.TravelSolId == defaultSelectedRow || obj.TravelSolId == defaultSelectedRowSingleReturn) {
      this.Price.forEach(element => {
        this.DefaultServicePrices.push(element);
      })
      if (obj.TravelSolId == defaultSelectedRow) {
        this.DefaultService = {
          outboundDate: this.datePipe.transform(obj.DepartureDate, 'yyyyMMdd'),
          outboundTime: this.datePipe.transform(obj.DepartureDate, 'HHmm'),
          returnDate: undefined,
          returnTime: undefined,
          daysInAdvance: diffOfDates,
        }
      } else {
        this.DefaultService = {
          ...this.DefaultService,
          returnDate: this.isReturnJourney ? this.datePipe.transform(obj.DepartureDate, 'yyyyMMdd') : undefined,
          returnTime: this.isReturnJourney ? this.datePipe.transform(obj.DepartureDate, 'HHmm') : undefined
        }
      }
    }
  }
  getJourneyTypeValue(isReturnJourney) {
    return isReturnJourney ? "Inward" : "Outward";
  }
  // to get the railcard code and check if railcard is present
  getRailCardCode(searchRequest: SearchRequestModel) {
    let railCards = '';
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      this.isRailCardPresent = true;
      searchRequest.RailCardList.forEach(card => {
        railCards += `${card.RailCard}:${card.RailCardCount}|`;
      });
      railCards = railCards.slice(0, -1);
      return railCards;
    }
    return undefined;
  }

  getPriceForItem(obj, activeTab) {
    return (activeTab === 0 ? obj.SingleFare : obj.ReturnFare);
  }

  getVarientCodeName(obj) {
    return ((obj && obj.Changes == '0') ? ('1:' + obj.DepartureTime.split('(').pop().split(')')[0] + '-' + obj.ArrivalTime.split('(').pop().split(')')[0]) : obj.CallingPointName);
  }

  getCategoryName(obj) {
    return ((obj && obj.Changes !== 0 && obj.Changes !== 'Direct') ? 'Connection' : 'Direct');
  }

  getTicketClass(outwardSelectedFare, returnSelectedFare, isReturnJourney: boolean) {
    if (isReturnJourney) {
      return returnSelectedFare ? returnSelectedFare.TicketClass : (outwardSelectedFare && outwardSelectedFare.TicketClass);
    } else {
      return outwardSelectedFare && outwardSelectedFare.TicketClass;
    }
  }

  getTicketType(outwardSelectedFare, returnSelectedFare, isReturnJourney: boolean) {
    if (isReturnJourney) {
      return returnSelectedFare ? returnSelectedFare.TicketType : (outwardSelectedFare && outwardSelectedFare.TicketType);
    } else {
      return outwardSelectedFare && outwardSelectedFare.TicketType;
    }
  }

  getFarePrice(outwardSelectedFare, returnSelectedFare, isReturnJourney: boolean) {
    if (isReturnJourney) {
      return returnSelectedFare ? returnSelectedFare.Price : (outwardSelectedFare && outwardSelectedFare.Price);
    } else {
      return outwardSelectedFare && outwardSelectedFare.Price;
    }
  }

  getAllJourneyDurationForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let duration = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      let depDuration = refundDetailsResponse.OutwardDetails.Duration.split(" ");
      depDuration[0] = ((+depDuration[0].trim()) < 10) ? `0${depDuration[0].trim()}` : depDuration[0].trim();
      depDuration[1] = ((+depDuration[1].trim()) < 10) ? `0${depDuration[1].trim()}` : depDuration[1].trim();
      duration += `${depDuration[0].trim()}:${depDuration[1].trim()}`;
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      let RetDuration = refundDetailsResponse.ReturnDetails.Duration.split(" ");
      RetDuration[0] = ((+RetDuration[0].trim()) < 10) ? `0${RetDuration[0].trim()}` : RetDuration[0].trim();
      RetDuration[1] = ((+RetDuration[1].trim()) < 10) ? `0${RetDuration[1].trim()}` : RetDuration[1].trim();
      duration += '|' + `${RetDuration[0].trim()}:${RetDuration[1].trim()}`;
    }
    return duration || undefined;
  }

  getAllTicketsClassForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let classes = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      classes += refundDetailsResponse.OutwardDetails.TicketClass
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      classes += '|' + refundDetailsResponse.ReturnDetails.TicketClass;
    }
    return classes || undefined;
  }

  getAllTicketsTypeForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let ticketTypes = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      ticketTypes += refundDetailsResponse.OutwardDetails.TicketType;
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      ticketTypes += '|' + refundDetailsResponse.ReturnDetails.TicketType;
    }
    return ticketTypes || undefined;
  }

  isSingleJourneyForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    if (refundDetailsResponse) {
      if (refundDetailsResponse.OutwardDetails && refundDetailsResponse.ReturnDetails) {
        return 'Return';
      }
      else {
        return 'Single'
      }
    }
  }

  getAllTrainChangesForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let changes = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      changes += refundDetailsResponse.OutwardDetails.Changes;
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      changes += '|' + refundDetailsResponse.ReturnDetails.Changes;
    }
    return changes || undefined;
  }

  getAllJourneyDepartureDatesForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let depDates = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      let date = refundDetailsResponse.OutwardDetails.DepartureDateTime.split(" ")[0];
      depDates += moment(date).format("DD/MM/YY");
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      let date = refundDetailsResponse.ReturnDetails.DepartureDateTime.split(" ")[0];
      depDates += '|' + moment(date).format("DD/MM/YY");
    }
    return depDates || undefined;
  }

  getAllJourneyArrivalDatesForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let arrDates = '';
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      let date = refundDetailsResponse.OutwardDetails.ArrivalDateTime.split(" ")[0];
      arrDates += moment(date).format("DD/MM/YY");
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      let date = refundDetailsResponse.ReturnDetails.ArrivalDateTime.split(" ")[0];
      arrDates += '|' + moment(date).format("DD/MM/YY");
    }
    return arrDates || undefined;
  }
  getStationCodesForRefund(refundDetailsResponse: any) {
    let StnCode = "";
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      let depCode = refundDetailsResponse.OutwardDetails.DepartureLocationName.split("(")[1].replaceAll(')','');
      let ArrivalCode = refundDetailsResponse.OutwardDetails.ArrivalLocationName.split("(")[1].replaceAll(')','');
      StnCode += `${depCode}-${ArrivalCode}`;
    }
    return StnCode || undefined;
  }
  getOperatorForRefund(refundDetailsResponse: RefundDetailsResponseDto) {
    let company = "";
    if (refundDetailsResponse && refundDetailsResponse.OutwardDetails) {
      company = this.getCompany(refundDetailsResponse.OutwardDetails);
    }
    if (refundDetailsResponse && refundDetailsResponse.ReturnDetails) {
      company += '|' + this.getCompany(refundDetailsResponse.OutwardDetails);
    }    
    return company || undefined;
  }

  loadGTMDataLayerAllPages() {
    this.getSessionId();
    let fullURL = window.location.href;
    let fullPath = fullURL.split(environment.qttDomain)[1];
    let arr = fullPath.split('/');
    let email = localStorage.getItem('Email');
    let customerKey = localStorage.getItem('CustomerKey');
   
    if (customerKey == null)
      customerKey = '';
    let loggedIn = (customerKey != null && email != null) ? true : false;
    let pageType = this.getPageType(fullURL);
    let firstViewed = this.getFirstViewedValue(fullURL);
    
    let originalEmail = localStorage.getItem('OriginalEmail');
    let [city, country] = this.getCityAndCountry();
    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: 'page_meta_data',
      page: {
        type: pageType,
        country: 'gb',
        environment: environment.gtmEnvironment,
        language: 'en',
        full_url: fullURL,
        full_path: '/' + fullPath,
        path_1: (arr[0] == undefined ? undefined : arr[0]),
        path_2: (arr[1] == undefined ? undefined : arr[1]),
        path_3: (arr[2] == undefined ? undefined : arr[2]),
        path_4: (arr[3] == undefined ? undefined : arr[3]),
        title: this.title.getTitle(),
        created_date: undefined,
        last_updated: undefined,
        author: undefined,
        version: '1',
        experiment_id: undefined,
        experiment_name: undefined,
        variant_id: undefined,
        variant_name: undefined,
        ga_tracking_id: environment.gaTrackingID,
        gtm_tracking_id: environment.gtmCode,
        first_viewed: firstViewed,
      },
      user: {
        pico_id: customerKey,
        has_transacted: '',
        logged_in: loggedIn,
        segments: undefined,
        country: country ? country : undefined,
        city: city ? city : undefined,
        is_onboard_session: '',
        session_id: this.SessionId,
        type: loggedIn ? 'Customer' : 'Guest',
        email_address_hashed: loggedIn ? convertToSha256(originalEmail) : undefined, // Convert to SHA256 Alogorithm
        email_address: (loggedIn && originalEmail) ? originalEmail : undefined,
        customer_type: undefined
      }
    });
  }

  getPageType(fullURL) {
    let pageType = "";
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.ReviewBuy)) {
      pageType = 'search';
    }
    else if (fullURL.includes(this.appRouteEnum.JourneyExtras) || fullURL.includes(this.appRouteEnum.DeliveryMode) || fullURL.includes(this.appRouteEnum.Payment)) {
      pageType = 'checkout';
    }
    else if (fullURL.includes(this.appRouteEnum.Confirmation)) {
      pageType = 'confirmation';
    }
    else if (fullURL.includes(this.appRouteEnum.ValidatePaymentDo)) {
      pageType = 'validatePayment';
    }
    else {
      pageType = 'account';
    }
    return pageType;
  }

  getCityAndCountry() {
    let city = "";
    let country = "";
    let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
    if (customerLoginResponse && customerLoginResponse.CustomerDetail && customerLoginResponse.CustomerDetail.Addresses) {
      let defaultAddress = customerLoginResponse.CustomerDetail.Addresses.filter(x => x.IsDefault);
      if (defaultAddress && defaultAddress.length > 0) {
        city = defaultAddress[0].Address.City;
        country = defaultAddress[0].Address.Country;
      }
    }
    return [city, country];
  }

  getFirstViewedValue(fullURL) {
    let firstViewed = false;
    if (fullURL.includes(this.appRouteEnum.MixingDeck) || fullURL.includes(this.appRouteEnum.SeasonSolutions) || fullURL.includes(this.appRouteEnum.Login)) {
      firstViewed = true;
    }
    return firstViewed;
  }

  checkRailCardName(searchRequest, obj) {
    let railCardName = null;
    if (searchRequest.hasOwnProperty('IsSeason')) {
      let railCardsSeasonList = this.railCardsSeasonList;
      railCardName = railCardsSeasonList.filter(x => x.Code == obj.RailCard).length > 0 ? railCardsSeasonList.filter(x => x.Code == obj.RailCard)[0].Name : obj.RailCard;
    }
    else {
      let railCardFromStorage = JSON.parse(localStorage.getItem('railcardStationList'));
      if (railCardFromStorage)
        this.railCardsList = railCardFromStorage.Railcard;
      railCardName = this.railCardsList.filter(x => x.Code == obj.RailCard).length > 0 ? this.railCardsList.filter(x => x.Code == obj.RailCard)[0].Name : obj.RailCard;
    }
    return railCardName;
  }

  getViaAvoidStation(searchRequest) {
    let viaAvoidStation = '';
    if (searchRequest.PathConstraintLocation && this.sharedService.locationMasterData != null
      && this.sharedService.locationMasterData.length > 0) {
      let location = this.sharedService.locationMasterData.filter(x => x.Id == searchRequest.PathConstraintLocation);
      if (location)
        viaAvoidStation = location[0].Name.split('(').pop().split(')')[0];
    }
    return viaAvoidStation;
  }
  // group season list items for season journey
  groupSeasonListItems(obj, index, selectedDurationType, defaultSelectedRow, selectedPrice) {
    if (obj.CustomOffers) {
      this.getSessions(obj.CustomOffers, index, defaultSelectedRow, selectedDurationType, selectedPrice);
    }
    if (obj.FlexiOffers) {
      this.getSessions(obj.FlexiOffers, index, defaultSelectedRow, selectedDurationType, selectedPrice);
    }
    if (obj.MonthlyOffers) {
      this.getSessions(obj.MonthlyOffers, index, defaultSelectedRow, selectedDurationType, selectedPrice);
    }
    if (obj.WeeklyOffers) {
      this.getSessions(obj.WeeklyOffers, index, defaultSelectedRow, selectedDurationType, selectedPrice);
    }
    if (obj.YearlyOffers) {
      this.getSessions(obj.YearlyOffers, index, defaultSelectedRow, selectedDurationType, selectedPrice);
    }
  }
  // for get return date & return time
  getReturnDateAndTime(searchRequest) {
    let returnDate = '';
    let returnTime = '';
    if (searchRequest.TravelSolutionDirection == 'RETURN') {
      returnDate = this.datePipe.transform(searchRequest.ReturnTimesStart, 'yyyyMMdd');
      returnTime = this.datePipe.transform(searchRequest.ReturnTimesStart, 'HHmm');
    }
    return [returnDate, returnTime];
  }

  getRailCardBookingValue(searchRequest): boolean {
    if (searchRequest && searchRequest.RailCardList && searchRequest.RailCardList.length > 0) {
      return true;
    }
    return false;
  }
// get the via or avoid station 
  getJourneyViaAndAvoid(pathConstraintType, viaAvoidstr, viaAvoidStation) {
    if (pathConstraintType == viaAvoidstr) {
      return viaAvoidStation;
    }
    return '';
  }
  // get list of season offers for season journey
  setListOfItemsForSeasonJourney(searchResponse, selectedRow, defaultSelectedRow, selectedPrice) {
    if (searchResponse && searchResponse.SeasonEligibleOffers && searchResponse.SeasonEligibleOffers.length > 0) {
      this.Services = [];
      let selectedDurationType = selectedRow;
      searchResponse.SeasonEligibleOffers.forEach((obj, index) => {
        this.groupSeasonListItems(obj, index, selectedDurationType, defaultSelectedRow, selectedPrice);
      });

    }
  }
  // get list of travel solution for non season journey
  setListOfItemsForNonSeasonJourney(searchRequest, searchResponse, defaultSelectedRow, selectedRow, activeTab, outwardSelectedFare, setListOfItemsForNonSeason) {
    this.isReturnJourney = false;
    let getTicketParamsObj = {
      setListOfItemsForNonSeason: setListOfItemsForNonSeason,
      outwardSelectedFare: outwardSelectedFare,
      activeTab: activeTab
    }
    if (searchResponse) {
      this.outwardTravelSolIds = searchResponse.TravelSolutions.map(solution => solution.TravelSolId);
      this.getTicket(searchResponse.TravelSolutions, searchRequest, defaultSelectedRow, selectedRow, -1, -1, getTicketParamsObj);

      if (searchResponse.RetTravelSolutions) {
        this.isReturnJourney = true;
        this.inwardTravelSolIds = searchResponse.RetTravelSolutions.map(solution => solution.TravelSolId);
        this.getTicket(searchResponse.RetTravelSolutions, searchRequest, defaultSelectedRow, -1, setListOfItemsForNonSeason.defaultSelectedRowSingleReturn, setListOfItemsForNonSeason.SelectedRowReturn, getTicketParamsObj);
      }

    }
  }

  loadGTMDataLayerOnSearch(selectTravelSolParams, activeTab, forProductClick, cheapestTravelSolutionIds, outwardSelectedFare, returnSelectedFare, activeTabForClickEvent) {
    this.cheapestArr = cheapestTravelSolutionIds;
    if (forProductClick === false) {
      // implement with uuid
      this.storageDataService.setLocalStorageData('SessionId', Guid.create(), false);
    }    
    
    let viaAvoidStation =  this.getViaAvoidStation(selectTravelSolParams.searchRequest);
    let currentdate = moment.utc(new Date()).tz('Europe/London');
    let selectedDate = moment.utc(selectTravelSolParams.searchRequest.DepartureTimesStart).tz('Europe/London');
    let daysInAdvance = Math.abs(currentdate.diff(selectedDate, 'days'));
    let outboundDate = this.datePipe.transform(selectTravelSolParams.searchRequest.DepartureTimesStart, 'yyyyMMdd');
    let outboundTime = this.datePipe.transform(selectTravelSolParams.searchRequest.DepartureTimesStart, 'HHmm');
    let [returnDate, returnTime] = this.getReturnDateAndTime(selectTravelSolParams.searchRequest);
    let journetType = this.getJourneyType(selectTravelSolParams.searchRequest);
    let railCards = {};
    if (selectTravelSolParams.searchRequest && selectTravelSolParams.searchRequest.RailCardList && selectTravelSolParams.searchRequest.RailCardList.length > 0) {
      selectTravelSolParams.searchRequest.RailCardList.forEach((obj, index) => {
        let type = 'type' + (index + 1);
        let quantity = 'quantity' + (index + 1);
        let railCardName = this.checkRailCardName(selectTravelSolParams.searchRequest, obj);
        let obj_string = `{"` + type + `"` + ':' + `"` + railCardName + `"` + ',' + `"` + quantity + `"` + ':' + `"` + obj.RailCardCount + `"}`;
        let object = JSON.parse(obj_string);
        railCards = { ...railCards, ...object };
      });
    }



    if (selectTravelSolParams.searchRequest.IsSeason) {
      this.setListOfItemsForSeasonJourney(selectTravelSolParams.searchResponse, selectTravelSolParams.selectedRow, selectTravelSolParams.defaultSelectedRow, selectTravelSolParams.selectedPrice);

    }
    else {
      this.Services = [];
      this.DefaultService = {};
      this.SelectedService = [];
      this.productImpressionPrices = [];
      this.SelectedServicePrices = [];
      this.DefaultServicePrices = [];
      let setListOfItemsForNonSeason = {
        SelectedRowReturn: selectTravelSolParams.SelectedRowReturn,
        defaultSelectedRowSingleReturn: selectTravelSolParams.defaultSelectedRowSingleReturn,
        activeTabForClickEvent: activeTabForClickEvent,
        returnSelectedFare: returnSelectedFare
      }
      this.setListOfItemsForNonSeasonJourney(selectTravelSolParams.searchRequest, selectTravelSolParams.searchResponse, selectTravelSolParams.defaultSelectedRow, selectTravelSolParams.selectedRow, activeTab, outwardSelectedFare, setListOfItemsForNonSeason);

    }

    if (forProductClick === false) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'journeySearch',
        journey: {
          origin: selectTravelSolParams.searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
          destination: selectTravelSolParams.searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
          journeyType: journetType,
          via: this.getJourneyViaAndAvoid(selectTravelSolParams.searchRequest.PathConstraintType, 'VIA', viaAvoidStation),
          avoid: this.getJourneyViaAndAvoid(selectTravelSolParams.searchRequest.PathConstraintType, 'AVOID', viaAvoidStation),
          outboundDate: outboundDate,
          outboundTime: outboundTime,
          returnDate: returnDate,
          returnTime: returnTime,
          daysInAdvance: daysInAdvance,
          totalPax: (selectTravelSolParams.searchRequest.Adult + selectTravelSolParams.searchRequest.Child),
          adultPax: selectTravelSolParams.searchRequest.Adult,
          childPax: selectTravelSolParams.searchRequest.Child,
          railcardBooking: this.getRailCardBookingValue(selectTravelSolParams.searchRequest),
          railcard: railCards,
          searchSource: selectTravelSolParams.searchSource,
          searchSuccess: selectTravelSolParams.searchSuccess,
          searchError: selectTravelSolParams.searchError,
        }
      });

      window.dataLayer.push({
        event: 'productImpression',
        journeyPrices: this.productImpressionPrices,
        ecommerce: {
          currencyCode: 'GBP',
          impressions: this.Services,
        }
      });
      if (selectTravelSolParams.searchRequest.IsSeason) {
        window.dataLayer.push({
          event: 'productDefault',
          journeyPrices: this.DefaultServicePrices,
          journey: Object.keys(this.DefaultService).length ? this.DefaultService : '',
        });
      } 
      else {
        let obj = {
          event: 'productDefault',
          journeyPrices: this.DefaultServicePrices,
          journey: {
            origin: selectTravelSolParams.searchRequest.DepartureLocationName.split('(').pop().split(')')[0],
            destination: selectTravelSolParams.searchRequest.ArrivalLocationName.split('(').pop().split(')')[0],
            journeyType: journetType,
            via: this.getJourneyViaAndAvoid(selectTravelSolParams.searchRequest.PathConstraintType, 'VIA', viaAvoidStation),
            avoid: this.getJourneyViaAndAvoid(selectTravelSolParams.searchRequest.PathConstraintType, 'AVOID', viaAvoidStation),
            totalPax: (selectTravelSolParams.searchRequest.Adult + selectTravelSolParams.searchRequest.Child),
            adultPax: selectTravelSolParams.searchRequest.Adult,
            childPax: selectTravelSolParams.searchRequest.Child,
            railcardBooking: this.getRailCardBookingValue(selectTravelSolParams.searchRequest),
            railcard: railCards,
            searchSource: selectTravelSolParams.searchSource,
          }
        }

        let objToPush = { ...obj, ...this.DefaultService };
        window.dataLayer.push(objToPush);
      }
    }

    if (forProductClick) {
      window.dataLayer.push({
        event: 'productClick',
        journeyPrices: this.SelectedServicePrices,
        ecommerce: {
          currencyCode: 'GBP',
          click: {
            actionField: { list: 'Search Results' },
            products: this.SelectedService,
          }
        }
      });
    }

  }

  paymentMethodsCombine(paymentRecords) {

    let paymentMethod = '';
    paymentRecords.forEach(e => {
      if (e.PaymentMode) {
        paymentMethod += paymentMethod ? ' ,' + e.PaymentMode : e.PaymentMode;
      }
    });
    return paymentMethod;
  }

  public isSeatPickerNotAvaliable(JourneySeat: ReservationSeat): string {
    try {
      let message: string = '';
      if (JourneySeat.Seat.length === 0 || (JourneySeat.Seat[0].ReservationType === this.appConstantsService.mandatory && JourneySeat.Seat[0].CoachNumber === '*')) {
        message = 'Sorry, seat reservations are currently not available for this service. You may sit in any available seat appropriate to the class of your ticket.';
      } else if ((JourneySeat.Seat[0].ReservationType === this.appConstantsService.optional && JourneySeat.Seat[0].CoachNumber === '') || (JourneySeat.Seat[0].ReservationType === this.appConstantsService.unsupported)) {
        message = 'Sorry, seat reservations are not possible on this train.';
      } else if (JourneySeat.Seat[0].ReservationType === this.appConstantsService.optional && JourneySeat.Seat[0].CoachNumber === '*') {
        message = 'Sorry, seat reservations are not possible on this train. You may sit in any available seat appropriate to the class of your ticket.';
      }
      return message;
    } catch (error) { console.log(error); }
  }

  // Methods for the encryption Using AES
  encryptUsingAES256(encString) {
    try {
      if (encString) {
        let key = CryptoJS.enc.Utf8.parse(environment.aesEncriptionKey);
        let encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(encString), key, {
          keySize: 128 / 8,
          iv: key,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
      } else {
        return undefined;
      }
    } catch (err) {
      console.log("AES encription conversion error : " + err);
      return undefined;
    }
  }

  // Methods for the decryption Using AES
  decryptUsingAES256(decString) {
    try {
      if (decString) {
        let key = CryptoJS.enc.Utf8.parse(environment.aesEncriptionKey);
        let decrypted = CryptoJS.AES.decrypt(decString, key, {
          keySize: 128 / 8,
          iv: key,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
      } else {
        return undefined;
      }
    } catch (err) {
      console.log("AES decription conversion error : " + err);
      return undefined;
    }
  }

  jourenyExtraForCheckout() {
    let journeyExtraForCheckout = [];
    if (this.sharedService && this.sharedService.createReservationRequest && this.sharedService.createReservationRequest.JourneyExtras && this.sharedService.journeyExtrasResponseShared.Detail) {
      this.sharedService.createReservationRequest.JourneyExtras.forEach(journeyExtraObj => {
        this.sharedService.journeyExtrasResponseShared.Detail.forEach(obj => {
          if (journeyExtraObj.OfferId == obj.OfferId && journeyExtraObj.IsReturn == obj.IsReturn) {
            journeyExtraForCheckout.push(obj);
          }
        })
      });
    }
    return journeyExtraForCheckout;
  }
  
   // PICO-1400 get seatTypeValue & coachTypeValue on confirmation & view booking page for passangerassit
  getSeatAndCoachValue(journey) {
    let seatTypeValue = '';
    let coachTypeValue = ''
    if (journey && journey.length > 0) {
      let firstSeatObj = journey[0];
      if (firstSeatObj && firstSeatObj.Seat && firstSeatObj.Seat.length > 0) {
        seatTypeValue = firstSeatObj.Seat[0].CoachNumber;
        coachTypeValue = firstSeatObj.Seat[0].Seat;
      }
      return [seatTypeValue, coachTypeValue];
    }
  }
  getCustomerLoginResForPassangerDetail(customerLoginResponse) {
    this.passengerDetail = new PassengerDetail();
    if (customerLoginResponse.CustomerDetail) {
      this.passengerDetail.Title = customerLoginResponse.CustomerDetail.Title;
      this.passengerDetail.LastName = customerLoginResponse.CustomerDetail.LastName;
      this.passengerDetail.FirstName = customerLoginResponse.CustomerDetail.FirstName;
      this.passengerDetail.Email = customerLoginResponse.CustomerDetail.OriginalEmail;
      this.passengerDetail.ContactNumber = customerLoginResponse.CustomerDetail.MobileNumber;

      if (customerLoginResponse.CustomerDetail.Addresses && customerLoginResponse.CustomerDetail.Addresses.length > 0) {
        let defaultAddress = customerLoginResponse.CustomerDetail.Addresses.filter(x => x.IsDefault);
        if (defaultAddress && defaultAddress.length > 0 && defaultAddress[0].Address) {
          this.passengerDetail.Postcode = defaultAddress[0].Address.PostCode;
          this.passengerDetail.Country = defaultAddress[0].Address.Country;
          this.passengerDetail.City = defaultAddress[0].Address.City;
          this.passengerDetail.AddressLine2 = defaultAddress[0].Address.Address2;
          this.passengerDetail.AddressLine1 = defaultAddress[0].Address.Address1;
        } else if (customerLoginResponse.CustomerDetail.Addresses[0].Address) {
          this.passengerDetail.Postcode = customerLoginResponse.CustomerDetail.Addresses[0].Address.PostCode;
          this.passengerDetail.Country = customerLoginResponse.CustomerDetail.Addresses[0].Address.Country;
          this.passengerDetail.City = customerLoginResponse.CustomerDetail.Addresses[0].Address.City;
          this.passengerDetail.AddressLine2 = customerLoginResponse.CustomerDetail.Addresses[0].Address.Address2;
          this.passengerDetail.AddressLine1 = customerLoginResponse.CustomerDetail.Addresses[0].Address.Address1;
        }
      }
    }
    return this.passengerDetail;
  }
  // PICO-1400 call api for book passanger assist on confirmation & view booking page
  bookPassangerAssistCallMethod(bookPassengerAssistRequest: any) {
    this.completeOrderService.bookPassangerAssist(bookPassengerAssistRequest).subscribe((res: any) => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.passengerAssistResponse = this.responseData.Data;
          if (this.passengerAssistResponse.URL) {
            this.passnegerAssistUrl.next(this.passengerAssistResponse.URL);
            window.open(this.passengerAssistResponse.URL, '_blank');
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        } else {
          this.notificationService.error(this.responseData.ResponseMessage);
        }
      }
    });
  }

  stripTags (original) {
    // (A1) PARSE STRING INTO NEW HTML DOCUMENT
    let parsed = new DOMParser().parseFromString(original, "text/html");
    
    // (A2) STRIP TAGS, RETURN AS TEXT CONTENT
    return parsed.body.textContent;
  }
  
  // update user addresses in localstorage
  updateUserAddressesInLocalStorage(addresses: CustomerAddress[]) {
    this.customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
    if (this.customerLoginResponse && this.customerLoginResponse.CustomerDetail) {
      this.customerLoginResponse.CustomerDetail.Addresses = addresses;
      this.storageDataService.clearLocalStorageData("customerLoginResponse");
      this.storageDataService.setLocalStorageData("customerLoginResponse", this.customerLoginResponse, true);
    }
  }

  // pico-1660 get filtered locatilet
  getFilteredStation(stations, searchText) {
    let filteredStations = [];
    let matchedCRSstationIndex = 0;
    let matchedCRSstationAvailable = false;

    stations.forEach((station, index) => {
      if (station.Name.substring(station.Name.lastIndexOf('(')).replace('(', '').replace(')', '').toUpperCase == searchText.toUpperCase()) {
        // get station for matched station code 
        matchedCRSstationIndex = index;
        matchedCRSstationAvailable = true;
      }
      else if (station.Name.toLowerCase().indexOf(searchText.toLowerCase()) > -1) {
        filteredStations.push(station);
      }
      else {
        return;
      }
    });

    if (matchedCRSstationAvailable) {
      filteredStations.unshift(stations[matchedCRSstationIndex]);
    }
    return filteredStations;
  }

  // pico-1660 get filtered more locations (alphabetical order)
  getMoreFilteredStations(filteredStations, searchText) {
    let moreFilteredStations = [];
    const filterValue = searchText.toLowerCase();

    let filteredStationCode = filteredStations.filter(option => option.Name.toLowerCase().split('(')[1] == filterValue + ')');
    let filteredStationCodeSecond = filteredStations.filter(option => option.Name.toLowerCase().split('(')[2] == filterValue + ')');
    let filteredStationsStartWith = filteredStations.filter(option => option.Name.toLowerCase().startsWith(filterValue) && (option.Name.toLowerCase().split('(')[1] != filterValue + ')') && (option.Name.toLowerCase().split('(')[2] != filterValue + ')'));
    let filteredStationsContains = filteredStations.filter(option => option.Name.toLowerCase().includes(filterValue) && !(option.Name.toLowerCase().startsWith(filterValue)) && (option.Name.toLowerCase().split('(')[1] != filterValue + ')') && (option.Name.toLowerCase().split('(')[2] != filterValue + ')'));

    //Station code match
    if (filteredStationCode.length > 0) {
      moreFilteredStations = filteredStationCode;
    }
    if (filteredStationCodeSecond.length > 0) {
      moreFilteredStations = moreFilteredStations.concat(filteredStationCodeSecond);
    }

    //Stations starting with the entered characters (alphabetical order)
    if (filteredStationsStartWith.length > 0) {
      filteredStationsStartWith = filteredStationsStartWith.sort((a, b) => a.Name.localeCompare(b.Name));
      moreFilteredStations = moreFilteredStations.concat(filteredStationsStartWith);
    }
    //Stations containing the entered characters (alphabetical order)
    if (filteredStationsContains.length > 0) {
      filteredStationsContains = filteredStationsContains.sort((a, b) => a.Name.localeCompare(b.Name));
      moreFilteredStations = moreFilteredStations.concat(filteredStationsContains);
    }

    return moreFilteredStations;
  }

  getDeviceOperatingSystem() {
    let userAgent = window.navigator.userAgent,
      macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
      windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
      iosPlatforms = ['iPhone', 'iPad', 'iPod'],
      os = null;
    if (macosPlatforms.indexOf(userAgent) !== -1) {
      os = 'macos';
    } else if (iosPlatforms.indexOf(userAgent) !== -1) {
      os = 'ios';
    } else if (windowsPlatforms.indexOf(userAgent) !== -1) {
      os = 'windows';
    } else if (/Android/.test(userAgent)) {
      os = 'android';
    } else if (!os && /Linux/.test(userAgent)) {
      os = 'linux';
    }
    return os;
  }
  // PICO-2212, PICO-2213 & PICO-2215 method is called to check which button is click for showing header on review buy & payment page
  isCheckForQuickBuyOrContinue() {
    let isCheckForQuickBuy = localStorage.getItem(this.localStorageKeyEnum.isQuickBuyOrContinue);
    if (isCheckForQuickBuy == this.quickBuyEnum.default) {
      return true; // if isCheckForQuickBuy is 'DEFAULT' means user came from Continue button.
    } else {
      return false; // from quick buy button.
    }
  }

  checkTicketTypeForOffPeak(ticketType, x, saleCompany) {
    if (x.TicketType != null && (x.IsMinPrice || x.TicketType.trim() == ticketType || x.TicketType.trim() == this.ticketTypeEnum.advanceSingle || x.TicketType.trim() == this.ticketTypeEnum.offPeakSingle || x.TicketType.trim() == this.ticketTypeEnum.superOffPeakSingle || x.TicketType.trim() == this.ticketTypeEnum.anytimeReturn || x.TicketType.trim() == this.ticketTypeEnum.advanceReturn || x.TicketType.trim() == this.ticketTypeEnum.offPeakReturn || x.TicketType.trim() == this.ticketTypeEnum.superOffPeakReturn || x.TicketType.trim() == this.ticketTypeEnum.familyPlus || (saleCompany == this.travelSolutionOperatorEnum.lumo && x.TicketType.trim() == this.ticketTypeEnum.anytimeDaySingle) || x.TicketType.trim() == this.ticketTypeEnum.familyRefundable || x.TicketType.trim() == this.ticketTypeEnum.anytimeDaySingle || x.TicketType.trim() == this.ticketTypeEnum.anytimeDayReturn || x.TicketType.includes(this.ticketTypeEnum.partnerOfferPremium))) {
      return true;
    }
  }

  setSearchQueryString (result) {
    let baseurl = this.stringForBaseUrlAccordingToEnvironment();
    let params = new HttpParams()
      .set('oriCode', result.DepartureLocation.toString())
      .set('oriName',result.DepartureLocationName)
      .set('destCode', result.ArrivalLocation.toString())
      .set('destName', result.ArrivalLocationName)
      .set('oadInd', result.Traveltype == 'DEPARTAFTER' ? 'Leave After' : 'Arrive Before')
      .set('outHourField', result.DepartureTimesStart.split("T")[1].split(":")[0])
      .set('outMinuteField','00')
      .set('outDate', this.datePipe.transform(result.DepartureTimesStart.split("T")[0], "dd/MM/yyyy"))
      .set('jt', this.setJourneyTypeStringInQueryString(result))
      .set('noa', result.Adult.toString())
      .set('noc', result.Child.toString())
      params = this.setSearchQueryStringParamsForReturn(result, params);
      params = this.setSearchQueryStringParamsForSelectedRailCard(result, params);
      localStorage.setItem('searchQueryString', decodeURI(baseurl + params.toString()));
  }

  setSearchQueryStringParamsForReturn (result, params) : HttpParams {
    if(result.TravelSolutionDirection == 'RETURN'){
      params = params.append('inHourField',result.ReturnTimesStart.split("T")[1].split(":")[0])
                      .append('inMinuteField','00')
                      .append('inDate',this.datePipe.transform(result.ReturnTimesStart.split("T")[0], "dd/MM/yyyy"))
                      .append('oadIndReturn', result.TraveltypeReturn == 'DEPARTAFTER' ? 'Leave After' : 'Arrive Before')
    }
    return params;
  }

  setSearchQueryStringParamsForSelectedRailCard (result, params) : HttpParams {
    if(result.RailCardList != null && result.RailCardList.length > 0) {
      let array = [];
      let jsonString = '';
      for (let i = 0; i < result.RailCardList.length; i++) {
        if (result.RailCardList[i].RailCardCount) {
          params = params.append(`rcnum${i + 1}`, result.RailCardList[i].RailCardCount.toString())
            .append(`rcCode${i + 1}`, result.RailCardList[i].RailCard)
            .append(`rcNoa${i + 1}`, result.RailCardList[i].Adult.toString())
            .append(`rcNoc${i + 1}`, result.RailCardList[i].Child.toString())
        }
      }
      params = params.append('rJson', `[${jsonString.padEnd(result.RailCardList.length * 2, '{}')}]`)
            .append('rCount', result.RailCardList.length.toString())
    }
    return params;
  }

  stringForBaseUrlAccordingToEnvironment () {
    let baseUrlString = '';
    const currentUrl = window.location.href;
    let preDefinedBaseUrlString = `/train-tickets/${this.appRouteEnum.MixingDeck}?`;
    if (environment.production) {
      baseUrlString = preDefinedBaseUrlString;
    } else if (currentUrl.includes('tickets') || currentUrl.includes('train-tickets')) {
      baseUrlString = preDefinedBaseUrlString;
    } else {
      baseUrlString = `/${this.appRouteEnum.MixingDeck}?`;
    }
    return baseUrlString;
  }

  setJourneyTypeStringInQueryString (result) {
    let journeyType = "";
    if (result.TravelSolutionDirection == "OPEN_RETURN") {
      journeyType = "Open";
    } else if (result.TravelSolutionDirection == "ONE_WAY") {
      journeyType = "Single";
    } else {
      journeyType = result.TravelSolutionDirection.charAt(0).toUpperCase() + result.TravelSolutionDirection.slice(1);
    }
    return journeyType; 
  }

  getLocationMasterData() {
    if (!this.sharedService.isAmendSearchOpen) {
      this.loaderRequired = true;
    }
    this.getLocations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedService.locationMasterData = this.responseData.Data;
            this.sharedService.locationMasterData.sort((a, b) => a.Id - b.Id);
            localStorage.removeItem('stationList');
            localStorage.setItem('stationList', JSON.stringify(this.responseData.Data));
            localStorage.setItem(this.localStorageKeyEnum.version, environment.verison.toString());
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
          }
          else {
            this.logErrorAndRevertVersion(this.responseData.ResponseMessage);
          }
        }
      },
      err => {
        this.logErrorAndRevertVersion(err);
      });
  }

  getRailcardStationMasterData() {
    if (!this.sharedService.isAmendSearchOpen) {
      this.loaderRequired = true;
    }
    this.getRailcardStations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          this.setRailcardStationsData(this.responseData);
        }
      },
      err => {
        this.logErrorAndRevertVersion(err);
      });
  }

  setRailcardStationsData(responseData) {
    if (responseData.ResponseCode == '200') {
      this.sharedService.railcardStationMasterData = responseData.Data;
      let disabledDates = [];
      if (this.sharedService.railcardStationMasterData && this.sharedService.railcardStationMasterData.DisabledDates) {
        for (let date of this.sharedService.railcardStationMasterData.DisabledDates) {
          const dt = new Date(date).getTime();
          disabledDates.push(dt);
        }
      }
      this.sharedService.railcardStationMasterData.DisabledDatesinString = disabledDates;
      localStorage.removeItem('disableDates');
      localStorage.removeItem('railcardStationList');
      localStorage.setItem("disableDates", JSON.stringify(disabledDates));
      localStorage.setItem('railcardStationList', JSON.stringify(responseData.Data));
      if (this.sharedService && this.sharedService.railcardStationMasterData) {
        this.railCardsList = this.sharedService.railcardStationMasterData.Railcard;
      }
      localStorage.setItem(this.localStorageKeyEnum.version, environment.verison.toString());
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
    else {
      this.logErrorAndRevertVersion(this.responseData.ResponseMessage);
    }
  }

  logErrorAndRevertVersion(err) {
    console.log(err);
    localStorage.setItem(this.localStorageKeyEnum.version, (environment.verison - 1).toString());
  }

  getcurrencySymbolBasedOnPaymentDetail(paymentAmountDetail: string) {
    if (paymentAmountDetail) {
      return paymentAmountDetail.toLowerCase().indexOf('discount') > -1 ? '' : this.sharedService.currencySymbol('');
    }
    else {
      return '';
    }
  }

  setTrainNo(journey: any) {
    let trainNo = '';
    journey.forEach(data => {
      if (data.Seat.length > 0) {
        trainNo = trainNo === '' ? data.Seat[0].TrainNumber : (trainNo + ", " + data.Seat[0].TrainNumber); // I have used here index as 0 bcz train no remains same for all seats
      }
    });
    return trainNo;
  }

  setCoachAndSeatForCalendarFile(journey: any) {
    let coach = '';
    let seats = '';
    journey.forEach(data => {
      if (data.Seat.length > 0) {
        data.Seat.forEach(seat => {
          coach = coach === '' ? seat.CoachNumber : (coach + ", " + seat.CoachNumber);
          seats = seats === '' ? seat.Seat : (seats + ", " + seat.Seat);
        });
      }
    });
    return { coach: coach, seats: seats };
  }

  createCalendarDetailObject(departureTime, arrivalTime, summary, description, location) {
    return {
      start: departureTime,
      end: arrivalTime,
      summary: summary,
      description: description,
      location: location
    };
  }

  creatingCalendarSummaryString(journeySummary: any) {
    let summaryWithoutCollectionReference = `Journey ${journeySummary.location}-${journeySummary.arrival}, Train ${journeySummary.train}, Coach ${journeySummary.coach}, Seat(s) ${journeySummary.seats}`;
    let summaryWithCollectionReference = `Journey ${journeySummary.location}-${journeySummary.arrival}, Train ${journeySummary.train}, Coach ${journeySummary.coach}, Seat(s) ${journeySummary.seats}, Collection reference number ${journeySummary.collectionReferenceNumber}`;
    return journeySummary.collectionReferenceNumber ? summaryWithCollectionReference : summaryWithoutCollectionReference;
  }

  getSeatCoachType(seat) {
    if (seat && seat.CoachType !== "-" && seat.CoachType !== "") {
      if (seat.CoachType == this.seatPrefrenceType.quiet) {
        return `${seat.CoachType.match(/[A-Z][a-z]+/g).join(" ")} ${this.seatPrefrenceType.coachTxt}`
      }
      return seat.CoachType.match(/[A-Z][a-z]+/g).join(" ");
    }
    return "";
  }

  getCoachType(seat, seatAndCaochInfo) {
    if ((seatAndCaochInfo !== "" || seat.SeatType) && seat.CoachType) {
      return `${seatAndCaochInfo}, ${seat.CoachType}`;
    } else if (seat.CoachType) {
      return seat.CoachType;
    }
  }

  getSeatAndCoachInfoValues(seatAndCaochInfo) {
    if (seatAndCaochInfo && seatAndCaochInfo.includes('|')) {
      return seatAndCaochInfo.replace('|', ',');
    }
    return seatAndCaochInfo;
  }

  getSeatInfoAndCoachType(seat) {
    let seatAndCaochInfo = "";
    if (seat) {

      if (seat.SeatFacing) {
        seatAndCaochInfo = seat.SeatFacing;
      }

      if (seat.SeatFacing && seat.SeatPosition) {
        seatAndCaochInfo = `${seatAndCaochInfo}, ${seat.SeatPosition}`;
      } else if (seat.SeatPosition) {
        seatAndCaochInfo = seat.SeatPosition;
      }

      if ((seatAndCaochInfo !== "" || seat.SeatPosition) && seat.SeatType && seat.SeatType !== "-") {
        seatAndCaochInfo = `${seatAndCaochInfo}, ${seat.SeatType}`;
      } else if (seat.SeatType && seat.SeatType !== "-") {
        seatAndCaochInfo = seat.SeatType;
      }

      seatAndCaochInfo = this.getCoachType(seat, seatAndCaochInfo);
      return this.getSeatAndCoachInfoValues(seatAndCaochInfo);
    }
    return seatAndCaochInfo;
  }

  getSeatType(bookingSeat) {
    if (bookingSeat) {

      if (bookingSeat.SeatType !== "-" && bookingSeat.SeatType !== "") {
        let seatTypeString = "";
        bookingSeat.SeatType.split(",").forEach(seat => {
          seatTypeString += (seat.match(/[A-Z][a-z]+/g).join(" ") + ", ");
        });
        let seatTypeStringLength = seatTypeString.length;
        seatTypeString = seatTypeString.slice(0, seatTypeStringLength - 2);
        bookingSeat.SeatType = seatTypeString;
      }
      else {
        bookingSeat.SeatType = "";
      }
      return bookingSeat.SeatType;
    }
    return '';
  }

  getOrganisedOutwardAndReturnSeatInfo(outOrReturnSeat) {
    if (outOrReturnSeat) {
      outOrReturnSeat?.forEach(outwardSeat => {
        if (outwardSeat?.Seat?.length > 0) {
          outwardSeat?.Seat?.forEach(bookingSeat => {
            bookingSeat.CoachType = this.getSeatCoachType(bookingSeat);
            bookingSeat.SeatFacing = this.getSeatFacing(bookingSeat);
            bookingSeat.SeatPosition = this.getSeatPosition(bookingSeat);
            bookingSeat.SeatType = this.getSeatType(bookingSeat);
          });
        }
      });
    }
  }

  getSeatFacing(bookingSeat) {
    try {
      if (bookingSeat.SeatFacing && bookingSeat.SeatFacing !== "-") {
        if (bookingSeat.SeatFacing == this.seatPrefrenceType.noPreference) return '';
        return `${bookingSeat.SeatFacing.match(/[A-Z][a-z]+/g).join(" ")} ${this.seatPrefrenceType.facingSeatTxt}`
      }
      return "";
    } catch (error) {
      console.log(error);
      return "";
    }
  }

  getSeatPosition(bookingSeat) {
    try {
      if (bookingSeat.SeatPosition && bookingSeat.SeatPosition !== "-") {
        if (bookingSeat.SeatPosition == this.seatPrefrenceType.noPreference) return '';
        return `${bookingSeat.SeatPosition.match(/[A-Z][a-z]+/g).join(" ")} ${this.seatPrefrenceType.seatTxt}`
      }
      return "";
    } catch (error) {
      console.log(error);
      return "";
    }
  }

  postReservationData(createReservationRequest: CreateReservationRequest, fareBreakDownDataNreBasket: FareBreakdownModel[], nreJourneyExtrasResponse: NreJourneyExtrasResponse) {
    this.loaderRequired = true;
    this.journeyExtraService.postReservationData(createReservationRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.createReservationResponse = this.responseData.Data;
            if (this.createReservationResponse) {
              //Set shared cache data
              this.sharedService.ReservationCache = this.createReservationResponse.ReservationCache;
              this.sharedService.isNreBasket = this.createReservationResponse.IsNreBasket;
              this.sharedService.createReservationRequest = createReservationRequest;
              localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.createReservationResponse.IsReviewMergedFlowEnabled));
              this.setReservationData(fareBreakDownDataNreBasket, nreJourneyExtrasResponse);
            }
            else {
              this.notificationService.error(this.responseData.ResponseMessage);
            }
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  setReservationData(fareBreakDownDataNreBasket: FareBreakdownModel[], nreJourneyExtrasResponse: NreJourneyExtrasResponse) {
    if (nreJourneyExtrasResponse && nreJourneyExtrasResponse.IsBasket) {
      this.sharedService.fareBreakdownModelData = fareBreakDownDataNreBasket;
    }
    if (this.createReservationResponse.OutwardBike || this.createReservationResponse.ReturnBike) {
      if (this.sharedService && this.sharedService.fareBreakdownModelData != null && this.sharedService.fareBreakdownModelData.length > 0) {
        this.setBikeDataForFarebreakup();
      }
    }
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    if (this.createReservationResponse.ReservationCache) {
      this.setCreateReservationResponse();
    }
    else {
      this.notificationService.error(this.createReservationResponse.ReservationMessage);
    }
  }

  setBikeDataForFarebreakup() {
    this.sharedService.fareBreakdownModelData.forEach((obj, _index) => {
      if (this.createReservationResponse.OutwardBike) {
        obj.OutwardJourneyExtras.forEach(x => {
          if (x.OfferId == this.createReservationResponse.OutwardBike.OfferId && x.ServiceId == this.createReservationResponse.OutwardBike.ServiceId && x.JourneyExtrasTitle == this.appConstantsService.bicycleReservation) {
            x.Passenger = this.setPassengerBikeCount(false);
          }
        });
      }
      if (this.createReservationResponse.ReturnBike) {
        obj.ReturnJourneyExtras.forEach(x => {
          if (x.OfferId == this.createReservationResponse.ReturnBike.OfferId && x.ServiceId == this.createReservationResponse.ReturnBike.ServiceId && x.JourneyExtrasTitle == this.appConstantsService.bicycleReservation) {
            x.Passenger = this.setPassengerBikeCount(true);
          }
        });
      }
    });
  }

  setPassengerBikeCount(isReturn) {
    let bikeCount = isReturn ? this.createReservationResponse.ReturnBike.BicycleCount : this.createReservationResponse.OutwardBike.BicycleCount;
    if (this.sharedService.searchRequest.Adult != 0 && this.sharedService.searchRequest.Child != 0) {
      return bikeCount + ' * Adult, Child';
    }
    else if (this.sharedService.searchRequest.Adult == 0 && this.sharedService.searchRequest.Child != 0) {
      return bikeCount + ' * Child';
    }
    else if (this.sharedService.searchRequest.Adult != 0 && this.sharedService.searchRequest.Child == 0) {
      return bikeCount + ' * Adult';
    }
  }

  setCreateReservationResponse() {
    this.sharedService.ReservationCache = this.createReservationResponse.ReservationCache;
    if (this.createReservationResponse.ReservationMessage != null) {
      let respMsg = this.createReservationResponse.ReservationMessage;
      let newMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service.`;
      let oldMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service. You can buy this ticket without reservations or you can change your service or ticket selection and try again.`;
      let modifiedMsg = respMsg.replace(oldMsg, newMsg);

      this.spinnerService.hide();
      let dialogRef = this.dialog.open(InfoPopupComponent, {
        width: '500px',
        disableClose: false,
        data: {
          Message: modifiedMsg
        }
      });
      dialogRef.afterClosed().subscribe(() => {
        this.checkLogin();
      });
    }
    else {
      this.checkLogin();
    }
    if (this.sharedService.IsJEForwardClick) {
      this.sharedService.getJourneyExtraCompleteStatus.emit(true);
    }
  }

  checkLogin() {
    if (!this.createReservationResponse.IsBlock) {
      let customerKey = localStorage.getItem('CustomerKey');
      let customerEmail = localStorage.getItem('Email');
      if (customerKey != null && customerEmail != null) {
        if (this.doesDeliveryPageSkipped()) {
          localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'true');
          localStorage.setItem(this.localStorageKeyEnum.isQuickBuyOrContinue, this.quickBuyEnum.default);
          this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
        } else {
          this.router.navigate([`./` + this.appRouteEnum.DeliveryMode]);
        }
      }
      else {
        this.spinnerService.hide();
        this.loaderRequired = true;
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = false;
        dialogConfig.autoFocus = true;
        dialogConfig.width = "60%";
        dialogConfig.panelClass = ['class-dialog1', 'extras-login-popup'];
        dialogConfig.data = { isLoginFromJE: true };
        this.dialog.open(LoginPageComponent, dialogConfig);
      }
    }
  }
  // check for Delivery & ReviewMergedFlow or not
  doesDeliveryPageSkipped() {
    if (localStorage.getItem(this.localStorageKeyEnum.reviewMergedFlow) == "true" && localStorage.getItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting) == "true") {
      return true;
    }
    else {
      return false;
    }
  }

  doesTravelExtraPageSkipped() {
    return this.sharedService && this.sharedService.createReservationRequest && this.sharedService.createReservationRequest.SkipTravelExtraPage ? true : false;
  }

  setDeliveryPageStepNo() {
    return this.doesTravelExtraPageSkipped() ? '2' : '3';
  }

  setReviewBuyPageStepNo(isShowHeader) {
    if (isShowHeader) {
      return this.doesTravelExtraPageSkipped() || this.doesDeliveryPageSkipped() ? '3' : '4';
    }
    return '2';
  }

  setPaymentDetailPageStepNo(isShowHeader) {
    if (isShowHeader) {
      return this.doesTravelExtraPageSkipped() || this.doesDeliveryPageSkipped() ? '4' : '5';
    }
    return '3';
  }

  updateRefreshTokenAuthData(res) {
    if (res && res.Data) {
      localStorage.setItem('SokenId', res.Data.SokenId);

      let loginResStr = localStorage.getItem('customerLoginResponse');
      if (loginResStr) {
        let loginResObj = JSON.parse(loginResStr);
        loginResObj.Expiration = res.Data.Expiration;
        loginResObj.Refresh = res.Data.Refresh;
        localStorage.setItem('customerLoginResponse', JSON.stringify(loginResObj));
      }
    }
  }

  commonNotificationDialog(id, notificationMsgs, displayedIconImage, isReviewBuy, isVerifyEmail, isDeliveryModesAvailable?, IsDeliveryAddedForJourney?) {
    return this.dialog.open(CommonNotificationComponent, {
      id: id,
      width: '600px',
      disableClose: isVerifyEmail || !isDeliveryModesAvailable ? false : true,
      panelClass: 'common-popup-theme',
      autoFocus: false,
      restoreFocus: false,
      data: {
        message: notificationMsgs.notificationErrorMsg,
        headerTitle: notificationMsgs.notificationTitle,
        displayedIconImage: displayedIconImage,
        isReviewBuy: isReviewBuy,
        isVerifyEmail: isVerifyEmail,
        isDeliveryModesAvailable: isDeliveryModesAvailable,
        isDeliveryAddedForJourney: IsDeliveryAddedForJourney, // when user does not select any delivery modes for select journey
        isViewBooking: notificationMsgs.isViewBooking
      }
    });
  }

  callRefreshTokenApi() {
    let key = localStorage.getItem('CustomerKey');
    return this.httpClientService.HttpGetRequest(this.apiPath.CustomerRefresh + "?customerKey=" + key);
  }

  goToSignUp() {
    this.router.navigate([]).then(() => {  window.open('./' + this.appRouteEnum.Register, '_blank'); });
  }

  removeSessionStorage() {
    sessionStorage.removeItem('CustomerKey');
    sessionStorage.removeItem('Email');
  }

  callRefreshTokenApiForExtendSession() {
    this.callRefreshTokenApi().subscribe(res => {
      let refreshResponse = res;
      this.updateRefreshTokenAuthData(refreshResponse);
    });
  }

  commonFilterFunction(location1, location2){
    let res = [];
    res = location1.filter((loc1)=>{
      return !location2.find((loc2)=>{ return (loc1.Name === loc2.Name)})
    })
    return res;
  }

  // PICO-2918 added journeyTotalPrice for farebreak down popup in case of review buy and payment details
  calculateJourneyTotalAmount(sharedService) {
    let totalPrice = 0;
    if (sharedService && sharedService.reviewBuyResponse && sharedService.reviewBuyResponse.Journey) {
      sharedService.reviewBuyResponse.Journey.forEach(journey => {
        totalPrice += journey.JourneyTotalPrice;
      });
      return totalPrice.toString();
    }
  }

  checkPaymentType(paymentType) {
    try {
      if (paymentType && paymentType == this.travelSolutionJourneyTypeEnum.outward) {
        return this.travelSolutionJourneyTypeEnum.outward;
      } else if (paymentType && paymentType == this.travelSolutionJourneyTypeEnum.return) {
        return this.travelSolutionJourneyTypeEnum.return;
      }
      return '';
    } catch (error) {
      console.log(error);
    }
  }

  successEmailVerificationLinkPopup(message, title, displayedSuccessIcon, displayedErrorIcon) {

    let dialogRef = this.dialog.open(MyProfileForgotPasswordComponent, {
      width: '600px',
      disableClose: false,
      panelClass: 'common-popup-theme',
      autoFocus: false,
      restoreFocus: false,
      data: {
        infoMsg: message,
        headerTitle: title,
        IsVerificationEmailSentFromBooking: true,
        displayedSuccessIcon: displayedSuccessIcon,
        displayedErrorIcon: displayedErrorIcon,
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if (displayedSuccessIcon) {
        this.sharedService.hideVerifyEmailSection.next(true);
      }
    });

  }

  railcardPassengerMessageText(person){
    return person > 1 ? `for ${person} passengers` : `for ${person} passenger`;
  }
 
  IsDeliveryModesAddedForSelectedJourneyOrNot() {
    let noSelectedDeliveryMsgObj = {
      notificationErrorMsg: this.notificationErrorMsg.noDeliveryModeSelected,
      notificationTitle: this.notificationErrorMsg.noDeliveryModeSelectedTitle,
    }
    this.commonNotificationDialog('review-noselecteddelivery-common-notification-dialog', noSelectedDeliveryMsgObj, '', true, false, false, false);
  }

  diff_minutes(dt2, dt1){
    let diff =(dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.round(diff);
  }

  checkIfJourneyHsExpiredOrNot(reviewBuyResponse){
    let isJourneyExpired =  false;
    let reservationDateTime;
    let travelDateTime;
    let reservationDateTimeDiff;
    let currentDateTime;
    let travelDateDiff;
    let removeJourneyArrayObject = [];
    let journeyDetailObject;
    reviewBuyResponse.Journey.forEach(m => {
      currentDateTime = new Date(new Date().setMinutes(new Date().getMinutes() + m.ExtendedReservationExpirationTime));
      currentDateTime = new Date((currentDateTime).toLocaleString('en-US', { timeZone: 'Europe/London' }));
      reservationDateTime = new Date(m.ReservationExpirationDateTime);
      travelDateTime = new Date(m.OutwardDetail?.DepartureTime);
      reservationDateTimeDiff = this.diff_minutes(currentDateTime, reservationDateTime);
      travelDateDiff = this.diff_minutes(travelDateTime, currentDateTime);
      if((m.ReservationExpirationDateTime != null && reservationDateTimeDiff > 0) || travelDateDiff < 0){
        let expiredjourneyObject = {journeyCreationDate : m.CreationDate};
        removeJourneyArrayObject.push(expiredjourneyObject);
        isJourneyExpired = true;
      }
    });
    journeyDetailObject = {isJourneyExpired: isJourneyExpired, removeJourneyArrayObject: removeJourneyArrayObject};
    return journeyDetailObject;
  }
  
  showOnlineRefundPopupForInternalRefundableJourney(journey) {
    if (journey.DeliveryModeName == this.appRouteEnum.DeliveryMode_TOD) {
      let todInternalRefundableMsgObj = {
        notificationErrorMsg: this.notificationErrorMsg.onlineRefundForTODNotificationErrorMsg,
        notificationTitle: this.notificationErrorMsg.onlineRefundErrorTitle,
      }
      this.commonNotificationDialog('internal-refundable-common-notification-dialog', todInternalRefundableMsgObj, this.commonIconImg.exclamationWarningIconImg, false, false);
    } else if (journey.DeliveryModeName == this.appRouteEnum.DeliveryMode_FIRSTCLASSPOST || journey.DeliveryModeName == this.appRouteEnum.DeliveryMode_NEXTDAYDELIVERY) {
      let postInternalRefundableMsgObj = {
        notificationErrorMsg: this.notificationErrorMsg.onlineRefundForPostNotificationErrorMsg,
        notificationTitle: this.notificationErrorMsg.onlineRefundErrorTitle,
      }
      this.commonNotificationDialog('internal-refundable-common-notification-dialog', postInternalRefundableMsgObj, this.commonIconImg.exclamationWarningIconImg, false, false);
    } else if (journey.DeliveryModeName == this.appRouteEnum.DeliveryMode_Smart_Card) {
      let smartCardInternalRefundableMsgObj = {
        notificationErrorMsg: this.notificationErrorMsg.onlineRefundForSmartCardNotificationErrorMsg,
        notificationTitle: this.notificationErrorMsg.onlineRefundErrorTitle,
      }
      this.commonNotificationDialog('internal-refundable-common-notification-dialog', smartCardInternalRefundableMsgObj, this.commonIconImg.exclamationWarningIconImg, false, false);
    }
  }

  // Method to check if ticket type is advance or not
  isTicketTypeAdvance(ticketType: string) {
    if (ticketType != undefined && ticketType != "") {
      ticketType = ticketType.toLowerCase();
      // if tickettype contains 'advance' or 'family' or 'partner offer' return true
      if ((ticketType.indexOf(this.ticketTypeEnum.advanceTicket) !== -1 || ticketType.indexOf(this.ticketTypeEnum.familyTicket) !== -1 || ticketType.indexOf(this.ticketTypeEnum.partnerOffer) !== -1)) {
        return true;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  isExistJourneyValidForPaymentKey() {
    return localStorage.getItem('JourneyValidforPayemnt') !== null && localStorage.getItem('JourneyValidforPayemnt') == 'true';
  }

  isExistRenewSmartcard(sharedSiblingRefresh) {
    return sharedSiblingRefresh && sharedSiblingRefresh.reviewBuyResponse && sharedSiblingRefresh.reviewBuyResponse.hasOwnProperty('IsRenewSmartcard') && sharedSiblingRefresh.reviewBuyResponse.IsRenewSmartcard != undefined && sharedSiblingRefresh.reviewBuyResponse.IsRenewSmartcard;
  }
    getCurrentUkDate() {
    return moment(new Date((new Date()).toLocaleString('en-US', { timeZone: this.appConstantsService.timeZone }))).format('YYYY-MM-DD');
  }

  callApiForGetLocationMasterData() {
    if (!this.sharedService.isAmendSearchOpen) {
      this.loaderRequired = true;
    }
    this.getLocations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedService.locationMasterData = this.responseData.Data;
            this.sharedService.locationMasterData.sort((a, b) => a.Id - b.Id);
            localStorage.setItem('stationList', JSON.stringify(this.responseData.Data));
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
          }
          else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
  }
  
  isOutAndRetFaresAvailableOrNot(outOrRetJourneyDetail) {
    return outOrRetJourneyDetail != null && outOrRetJourneyDetail.Fares != null;
  }

  getOutwardFaresBreakData(journey, fareBreakdownModel) {
    if (this.isOutAndRetFaresAvailableOrNot(journey.OutwardDetail)) {
      let railCardListFromLocalStorage = JSON.parse(localStorage.getItem(this.travelSolutionJourneyTypeEnum.railcardStationListText));
      journey.OutwardDetail.Fares.forEach(obj => {
        let outJourney = new JourneyModel;
        outJourney.Passenger = obj.FarePerson;
        outJourney.PricePerPerson = obj.BasePrice;
        outJourney.TotalPrice = obj.Price;
        outJourney.RailCard = obj.Railcard;
        outJourney.IsCheck = obj.IsCheck;
        outJourney.TicketTypeName = journey?.OutwardDetail?.TicketType;
        fareBreakdownModel.OutWardJourney.push(outJourney);
      });

      journey['Outward_Railcard_Array'] = [];
      let railCard_Data = {
        railCard: '',
        count: 0,
        Person: 0
      }

      journey.OutwardDetail.Fares.forEach((item) => {
        const checkIn = journey['Outward_Railcard_Array'].findIndex((el) => {
          return el['railCard'] === item['Railcard']
        })
        if (checkIn == -1) {
          journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count'] = 1;
          railCard_Data.railCard = item['Railcard'];
          railCard_Data.count = 1;
          journey['Outward_Railcard_Array'].push({
            railCard: item['Railcard'],
            count: 1,
            Person: 1
          });
        } else {
          journey['Outward_Railcard_Array'].forEach(element => {
            if (element.railCard == item['Railcard']) {
              if (element.railCard == this.appRouteEnum.groupSave) {
                element.Person += 1;
                element.count += 1;
              } else {
                railCardListFromLocalStorage.Railcard.forEach(rail => {
                  element = this.increaseCountOfPersonAccToRailcardForOutAndRet(element, rail);
                });
              }
            }
          });
          journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count'] = ++journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count']
        }
      })
    }
  }

  getReturnFaresBreakData(journey, fareBreakdownModel) {
    if (this.isOutAndRetFaresAvailableOrNot(journey.ReturnDetail)) {
      let railCardListFromLocalStorage = JSON.parse(localStorage.getItem(this.travelSolutionJourneyTypeEnum.railcardStationListText));
      journey.ReturnDetail.Fares.forEach(obj => {
        let retJourney = new JourneyModel;
        retJourney.Passenger = obj.FarePerson;
        retJourney.PricePerPerson = obj.BasePrice;
        retJourney.TotalPrice = obj.Price;
        retJourney.RailCard = obj.Railcard;
        retJourney.IsCheck = obj.IsCheck;
        retJourney.TicketTypeName = journey?.ReturnDetail?.TicketType;
        fareBreakdownModel.ReturnJourney.push(retJourney);
      });

      journey['Return_Railcard_Array'] = [];
      let railCard_Data = {
        railCard: '',
        count: 0,
        Person: 0
      }
      journey.ReturnDetail.Fares.forEach((item) => {
        const checkIn = journey['Return_Railcard_Array'].findIndex((el) => {
          return el['railCard'] === item['Railcard']
        })
        if (checkIn == -1) {
          journey['Return_' + item['Railcard'].replace(' ', '_') + '_count'] = 1;
          railCard_Data.railCard = item['Railcard'];
          railCard_Data.count = 1;
          journey['Return_Railcard_Array'].push({
            railCard: item['Railcard'],
            count: 1,
            Person: 1
          });
        } else {
          journey['Return_Railcard_Array'].forEach(returnRailcard => {
            if (returnRailcard.railCard == item['Railcard']) {
              if (returnRailcard.railCard == this.appRouteEnum.groupSave) {
                returnRailcard.Person += 1;
                returnRailcard.count += 1;
              } else {
                railCardListFromLocalStorage.Railcard.forEach(rail => {
                  returnRailcard = this.increaseCountOfPersonAccToRailcardForOutAndRet(returnRailcard, rail);
                });
              }
            }
          });
          journey['Return_' + item['Railcard'].replace(' ', '_') + '_count'] = ++journey['Return_' + item['Railcard'].replace(' ', '_') + '_count']
        }
      })
    }
  }

  increaseCountOfPersonAccToRailcardForOutAndRet(outAndRetRailcard, rail) {
    if (this.checkMaxPersonOfSelectedRailcard(outAndRetRailcard, rail)) {
      outAndRetRailcard.Person += 1;
    } else if (outAndRetRailcard.railCard == rail.Name) {
      outAndRetRailcard.Person += 1;
      outAndRetRailcard.count += 1;
    }
    return outAndRetRailcard;
  }

  checkMaxPersonOfSelectedRailcard(outAndRetRailcard, rail) {
    return (outAndRetRailcard.railCard == rail.Name && outAndRetRailcard.Person < ((rail.MaxAdult + rail.MaxChild) * outAndRetRailcard.count));
  }

  removedJourneyOnReservationTimeExpired(index, expiredJounreyDetailObject) {
    return expiredJounreyDetailObject?.removeJourneyArrayObject.length > 1 && index != expiredJounreyDetailObject?.removeJourneyArrayObject.length - 1;
  }

  doesClubAvantiPortalDisplay() {
    let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
    if (localStorage.getItem(this.localStorageKeyEnum.loyaltyPortalShow) == "true" && customerLoginResponse?.IsClubAvantiEnabled) {
      return true;
    }
    return false;
  }

  isRailCardDiscountOrVoucherCodeInPaymentSummary(paymentSummaryList) {
    try {
      if (paymentSummaryList && paymentSummaryList.length > 0) {
        let index = paymentSummaryList.findIndex(element => element.PaymentType == this.bookingTypeEnum.voucherCodePaymentType || element.PaymentType == this.bookingTypeEnum.railCardDiscountPaymentType || element.PaymentType == this.bookingTypeEnum.promotionDiscountPaymentType || element.PaymentType == this.bookingTypeEnum.groupSaveDiscountPaymentType)
        if (index > -1) {
          return true;
        }
        return false;
      }
      return false;
    } catch (error) {
      console.log(error);
    }
  }

  calculatePaymentSummaryListPrice(paymentSummary) {
    let railCardDiscountAndVoucher = 0;
    if (paymentSummary && paymentSummary.length > 0) {
      paymentSummary.forEach(paymentSummaryList => {
        railCardDiscountAndVoucher += paymentSummaryList.Price;
      });
    }
    return railCardDiscountAndVoucher;
  }

  getTrainTicketPrice(paymentSummary) {
    try {
      let getTrainTicketPrice = 0;
      if (paymentSummary && paymentSummary.length > 0) {
        paymentSummary.forEach(paymentSummaryList => {
          if (paymentSummaryList.PaymentType == this.bookingTypeEnum.voucherCodePaymentType || paymentSummaryList.PaymentType == this.bookingTypeEnum.railCardDiscountPaymentType || paymentSummaryList.PaymentType == this.bookingTypeEnum.promotionDiscountPaymentType || paymentSummaryList.PaymentType == this.bookingTypeEnum.groupSaveDiscountPaymentType || paymentSummaryList.PaymentType == this.bookingTypeEnum.trainTicketPaymentType) {
            getTrainTicketPrice += paymentSummaryList.Price;
          }
        });
      }
      return getTrainTicketPrice;
    } catch (error) {
      console.log(error);
    }
  }

  //PICO-2947 call method for calculate strike price with railcard discount & voucher code
  paymentSummaryListTotalPriceForRailCard(OutwardDetails, PaymentSummaryList, SeasonDetails, isSeason) {
    let totalPriceWithExtrasAndRailCard = 0;
    if (OutwardDetails) {
      totalPriceWithExtrasAndRailCard += this.calculatePaymentSummaryListPrice(PaymentSummaryList);
    }
    if (SeasonDetails && isSeason) {
      totalPriceWithExtrasAndRailCard += this.calculatePaymentSummaryListPrice(PaymentSummaryList);
    }
    return totalPriceWithExtrasAndRailCard;
  }

  capitalizePBInPlusBusTavelExtraWord(input: string): string {
    return input.replace(/p|b/g, (match) => match.toUpperCase());
  }

  bindDynamicCssClassOnDeliveryModeNameInPaymentSummary(delivery){
    return delivery?.Name?.toLowerCase() == this.bookingTypeEnum?.trainTicketText?.toLowerCase() ? 'font-700' : '';
  }

  bindDynamicCssClassOnDeliveryModePriceInPaymentSummary(delivery){
    return delivery?.Name?.toLowerCase() == this.bookingTypeEnum?.trainTicketText?.toLowerCase() ? 'font-600' : 'font-400 price-14';
  }

  openDiscountCodeNotificationPopup(OutwordDiscountCodeStatus,ReturnDiscountCodeStatus) {
    this.dialog.open(DiscountCodeNotificationPopupComponent, {
      width: '536px',
      disableClose: true,
      panelClass: 'common-popup-theme',
      autoFocus: false,
      restoreFocus: false,
      data: {
        displayedIconImage: this.commonIconImg.exclamationIConImg,
        OutwordDiscountCodeStatus: OutwordDiscountCodeStatus,
        ReturnDiscountCodeStatus: ReturnDiscountCodeStatus,
      }
    });
  }

  convertRailCardArrayIntoString(journey) {
    return journey
      .map(railcard => `${railcard.railCard} ${this.railcardPassengerMessageText(railcard.Person)}`)
      .join(', ');
  }

  separateOutwardGroupSaveAndNormalRailcard(outwardRailcard, journey) {
    journey['outwardGroupSaveRailCardArray'] = [];
    journey['outwardNonGroupSaveRailCardArray'] = [];
    let outwardGroupRailCard = outwardRailcard?.filter(railcard => railcard.railCard === this.appRouteEnum?.groupSave && railcard.railCard !== 'No Railcard');
    let outwardNonGroupRailCard = outwardRailcard?.filter(railcard => railcard.railCard !== this.appRouteEnum?.groupSave && railcard.railCard !== 'No Railcard');
    if (outwardGroupRailCard.length > 0) {
      journey['outwardGroupSaveRailCardArray'] = [...outwardGroupRailCard];
    }
    if (outwardNonGroupRailCard.length > 0) {
      journey['outwardNonGroupSaveRailCardArray'] = [...outwardNonGroupRailCard];
    }
  }

  separateReturnGroupSaveAndNormalRailcard(returnRailCard, journey) {
    journey['returnGroupSaveRailCardArray'] = [];
    journey['returnNonGroupSaveRailCardArray'] = [];
    let returnGroupRailCard = returnRailCard?.filter(railcard => railcard.railCard === this.appRouteEnum?.groupSave && railcard.railCard !== 'No Railcard');
    let returnNonGrouoRailCard = returnRailCard?.filter(railcard => railcard.railCard !== this.appRouteEnum?.groupSave && railcard.railCard !== 'No Railcard');
    if (returnGroupRailCard.length > 0) {
      journey['returnGroupSaveRailCardArray'] = [...returnGroupRailCard];
    }
    if (returnNonGrouoRailCard.length > 0) {
      journey['returnNonGroupSaveRailCardArray'] = [...returnNonGrouoRailCard];
    }
  }

  showOrHideRailCardDivOutward(journey) {
    if (journey) {
      let hasGroupSaveRailcard = journey['outwardGroupSaveRailCardArray'].length > 0 && journey['outwardGroupSaveRailCardArray'].some(railcard => railcard.journey === journey?.Journey);
      let hasNonGroupSaveRailcard = journey['outwardNonGroupSaveRailCardArray'].length > 0 && journey['outwardNonGroupSaveRailCardArray'].some(railcard => railcard.journey === journey?.Journey);

      return hasGroupSaveRailcard || hasNonGroupSaveRailcard;
    }
    return journey['outwardGroupSaveRailCardArray'].length > 0 || journey['outwardNonGroupSaveRailCardArray'].length > 0;
  }

  showOrHideRailCardDivReturn(journey) {
    if (journey) {
      let hasGroupSaveRailcard = journey['returnGroupSaveRailCardArray'].length > 0 && journey['returnGroupSaveRailCardArray'].some(railcard => railcard.journey === journey?.Journey);
      let hasNonGroupSaveRailcard = journey['returnNonGroupSaveRailCardArray'].length > 0 && journey['returnNonGroupSaveRailCardArray'].some(railcard => railcard.journey === journey?.Journey);

      return hasGroupSaveRailcard || hasNonGroupSaveRailcard;
    }
    return journey['returnGroupSaveRailCardArray'].length > 0 || journey['returnNonGroupSaveRailCardArray'].length > 0;
  }

  getDepartureLocationFromNRE(isJourneyFoundFromNRE, nreJourneyExtrasResponse) {
    if (isJourneyFoundFromNRE) {
      return nreJourneyExtrasResponse?.SearchRequest?.DepartureLocationName?.split('(').pop().split(')')[0];
    }
    return nreJourneyExtrasResponse?.Request?.DepartureLocationName?.split('(').pop().split(')')[0];
  }

  getArrivalLocationNameFromNRe(isJourneyFoundFromNRE, nreJourneyExtrasResponse) {
    if (isJourneyFoundFromNRE) {
      return nreJourneyExtrasResponse?.SearchRequest?.ArrivalLocationName?.split('(').pop().split(')')[0];
    }
    return nreJourneyExtrasResponse?.Request?.ArrivalLocationName?.split('(').pop().split(')')[0];
  }

  downloadVatReceipt(vatReceiptDetails, bookingRefNum, userEmailVerified) {
    if (userEmailVerified) {
      if (vatReceiptDetails && vatReceiptDetails?.PDFBytes && bookingRefNum) {
        const byteArray = new Uint8Array(atob(vatReceiptDetails?.PDFBytes).split('').map(char => char.charCodeAt(0)));
        downloadFile(byteArray, `${bookingRefNum} ${this.bookingTypeEnum.receipt}`, 'application/pdf');
      }
    } else {
      let verifyEmailAddressMsgsObj = {
          notificationErrorMsg: this.notificationErrorMsg.verifyEmailNotificationMsgFromBooking,
          notificationTitle: this.notificationErrorMsg.verifyEmailAddressTitle,
      }
      this.commonNotificationDialog('verify-email-common-notification-dialog', verifyEmailAddressMsgsObj, this.commonIconImg.exclamationIConImg, false, true);
  }
    
  }

  // this method is used to create url for nre ojp 
  createUrlNREOJP(nreJourneyExtrasResponse: any, isJourneyFoundFromNRE) {
    try {
      let departureCRS = this.getDepartureLocationFromNRE(isJourneyFoundFromNRE, nreJourneyExtrasResponse);
      let arrivalCRS = this.getArrivalLocationNameFromNRe(isJourneyFoundFromNRE, nreJourneyExtrasResponse);
      this.route.queryParamMap.subscribe(params => {
        this.purchaseTicketRequestID = params.get("requestId");
      });
      const errormes = isJourneyFoundFromNRE ? encodeURI("N/A") : encodeURI(nreJourneyExtrasResponse?.Message + '-' + departureCRS + '|' + arrivalCRS);
      const pagemes = isJourneyFoundFromNRE ? encodeURI("N/A") : encodeURI('Requested fare not found');
      const baseUrl = this.nreOjpNationalRaiURLEnum?.TocBaseUrl;

      const errorUrl = environment.NreOjpNationalRail_URL + 'service/iframe/error?origin=';
      let totalFare = isJourneyFoundFromNRE ? Number(nreJourneyExtrasResponse?.TotalPrice).toFixed(2) : nreJourneyExtrasResponse?.NRETotalPrice.toFixed(2);
      const valueString = '&value=' + totalFare;
      let url = errorUrl + departureCRS + '&destination=' + arrivalCRS
        + '&errormsg=' + errormes + '&pagenotif=' + pagemes + '&handoffid=' + this.purchaseTicketRequestID
        + '&hostname=' + baseUrl + '&referrer=' + nreJourneyExtrasResponse?.RequestMetaData?.OJPChannel.toLowerCase() + valueString;

      let handoffUrlObj = {
        errorURL: url,
        successURL: environment.NreOjpNationalRail_URL + 'service/iframe/success',
        origin: '?origin=' + departureCRS,
        destination: '&destination=' + arrivalCRS,
        errormsg: '&errormsg=' + errormes,
        pagenotif: '&pagenotif=' + pagemes,
        handoffid: '&handoffid=' + this.purchaseTicketRequestID,
        hostname: '&hostname=' + baseUrl,
        referrer: '&referrer=' + nreJourneyExtrasResponse?.RequestMetaData?.OJPChannel.toLowerCase(),
        value: '&value=' + totalFare,
        orderid: '&orderid=',
        isJourneyfound: isJourneyFoundFromNRE,
        totalFare: nreJourneyExtrasResponse?.TotalPrice
      };
      return handoffUrlObj;
    } catch (error) { console.log(error); }
  }

  trackNreHandOffUrl(nreJourneyExtrasResponse, isJourneyFoundFromNRE, validatePaymentResponse?, orderId?, handOffIdFromNre?) {
    try {
      let iframeSrc;
      let createUrl = this.createUrlNREOJP(nreJourneyExtrasResponse, isJourneyFoundFromNRE);
      localStorage.setItem(this.localStorageKeyEnum?.handOffRequestId, createUrl?.handoffid);
      if (validatePaymentResponse) {
        let orderString = '&orderid=' + orderId;
        let url = createUrl?.successURL + createUrl?.origin + createUrl?.destination + createUrl?.value + handOffIdFromNre + orderString +
          createUrl?.hostname + createUrl?.referrer;
        iframeSrc = this.sharedService.sanitizerUrl(url);
      } else {
        iframeSrc = this.sharedService.sanitizerUrl(createUrl?.errorURL);
      }
      return iframeSrc;
    } catch (error) { console.log(error); }
  }    

  checkDiscountCodeActive(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return ((outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase())
      || (outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase() && (returnDiscountCodeStatus === null || returnDiscountCodeStatus?.trim() === ""))
      || (returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase() && (outwordDiscountCodeStatus === null || outwordDiscountCodeStatus?.trim() === "")))

  }
  checkDiscountCodeExpired(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return ((outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase())
      || (outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase() && (returnDiscountCodeStatus === null || returnDiscountCodeStatus?.trim() === ""))
      || (returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase()  && (outwordDiscountCodeStatus === null || outwordDiscountCodeStatus?.trim() === "")))
  }
  checkDiscountCodeNoFares(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return ((outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase())
      || (outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase() && (returnDiscountCodeStatus === null || returnDiscountCodeStatus?.trim() === ""))
      || (returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase()  && (outwordDiscountCodeStatus === null || outwordDiscountCodeStatus?.trim() === "")))
  }
  checkOutwordDiscountCodeExpiredReturnActive(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase();
  }
  checkReturndDiscountCodeExpiredOutwordActive(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase(outwordDiscountCodeStatus,returnDiscountCodeStatus) == this.discountCodeStatusEnum?.active?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase();
  }
  checkNoFareOutwordDiscountCodeAndReturnActive(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase();
  }
  checkNoFareReturnDiscountCodeAndOutwordActive(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.active?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase();
  }
  checkNoFareOutwordDiscountCodeAndReturnExpired(outwordDiscountCodeStatus,returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase();
  }
  checkExpiredOutwordDiscountCodeAndReturnNoFare(outwordDiscountCodeStatus, returnDiscountCodeStatus) {
    return outwordDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.expired?.toUpperCase() && returnDiscountCodeStatus?.toUpperCase() == this.discountCodeStatusEnum?.noFares?.toUpperCase();
  }

  deletedRemovedJourneyForQuickBuyOrContinue(deletedJourneyData) {
    this.sharedService?.selectedJourneyDataForQuickBuyOrContiue?.forEach((deletedJourney, index) => {
      if (deletedJourneyData && deletedJourneyData[0]?.XmlId == deletedJourney?.XmlId) {
        this.sharedService?.selectedJourneyDataForQuickBuyOrContiue?.splice(index, 1);
      }
    });
  }

  getCityNameOnly(value: string): string {
    return value?.replace(/\s*\([^)]*\)$/, "");
  }
  
  checkMultipleRailcardCountForOutward(journey) {
    try {
      let railCardListFromLocalStorage = JSON.parse(localStorage.getItem('railcardStationList'));
      journey['Outward_Railcard_Array'] = [];
      let railCard_Data = {
        railCard: '',
        count: 0,
        Person: 0,
        journey: journey.Journey
      }

      for (let item of journey.OutwardDetail.Fares) {
        if (!item.Railcard) {
          continue;
        }
        const checkIn = journey['Outward_Railcard_Array'].findIndex((el) => {
          return el['railCard'] === item['Railcard']
        })
        if (checkIn == -1) {
          journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count'] = 1;
          railCard_Data.railCard = item['Railcard'];
          railCard_Data.count = 1;
          journey['Outward_Railcard_Array'].push({
            railCard: item['Railcard'],
            count: 1,
            Person: 1,
            journey: journey.Journey
          });
        } else {
          journey['Outward_Railcard_Array'].forEach(outwardRailcard => {
            if (outwardRailcard.railCard == item['Railcard']) {
              if (outwardRailcard.railCard == this.appRouteEnum.groupSave) {
                outwardRailcard.Person += 1;
                outwardRailcard.count += 1;
              } else {
                railCardListFromLocalStorage.Railcard.forEach(rail => {
                  outwardRailcard = this.increaseCountOfPersonAccToRailcardForOutAndRet(outwardRailcard, rail);
                });
              }
            }
          });
          journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count'] = ++journey['Outward_' + item['Railcard'].replace(' ', '_') + '_count']
        }
      }
      this.separateOutwardGroupSaveAndNormalRailcard(journey['Outward_Railcard_Array'], journey);
    } catch (error) { console.log(error); }
  }

  checkMultipleRailcardCountForReturn(journey) {
    try {
      let railCardListFromLocalStorage = JSON.parse(localStorage.getItem('railcardStationList'));
      journey['Return_Railcard_Array'] = [];
      let railCard_Data = {
        railCard: '',
        count: 0,
        Person: 0,
        journey: journey.Journey
      }
      for (let item of journey.ReturnDetail.Fares) {
        if (!item.Railcard) {
          continue;
        }
        const checkIn = journey['Return_Railcard_Array'].findIndex((el) => {
          return el['railCard'] === item['Railcard']
        })
        if (checkIn == -1) {
          journey['Return_' + item['Railcard'].replace(' ', '_') + '_count'] = 1;
          railCard_Data.railCard = item['Railcard'];
          railCard_Data.count = 1;
          journey['Return_Railcard_Array'].push({
            railCard: item['Railcard'],
            count: 1,
            Person: 1,
            journey: journey.Journey
          });
        } else {
          journey['Return_Railcard_Array'].forEach(element => {
            if (element.railCard == item['Railcard']) {
              if (element.railCard == this.appRouteEnum.groupSave) {
                element.Person += 1;
                element.count += 1;
              } else {
                railCardListFromLocalStorage.Railcard.forEach(rail => {
                  element = this.increaseCountOfPersonAccToRailcardForOutAndRet(element, rail);
                });
              }
            }
          });
          journey['Return_' + item['Railcard'].replace(' ', '_') + '_count'] = ++journey['Return_' + item['Railcard'].replace(' ', '_') + '_count']
        }
      }
      this.separateReturnGroupSaveAndNormalRailcard(journey['Return_Railcard_Array'], journey);
    } catch (error) { console.log(error); }
  }

  formatdurationTime(timeString: string): string {
    let parts = timeString.split(/h\s*|m/);
    let hours = parseInt(parts[0], 10);
    let minutes = parseInt(parts[1], 10);
    return `${hours} hours ${minutes} minutes`;
  }

  getTotalRailCardCount(searchRequest): number {
    try {
      return searchRequest?.RailCardList?.reduce((total, railcard) => {
        return total + (railcard?.RailCardCount || 0);
      }, 0) || 0;

    } catch (error) { console.log(error); }
  }

  cacheSharedData(): void {
    try{
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeysEnum?.sharedSibling);
      this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeysEnum?.sharedSibling, this.sharedServiceCache, true);
    } catch(error){
      console.log(error);
    }
  }
  removeStandPreFromTicketTypeForOutAndReturn(journey) {
      if (journey.OutwardDetail) {
        if (journey.OutwardDetail.TicketType.includes('Standard Premium')) {
          journey.OutwardDetail.TicketType = journey.OutwardDetail.TicketType.split('Standard Premium')[0];
        }
      }
  
      // Remove Standard Premium from TicketType from ReturnDetail
      if (journey.ReturnDetail) {
        if (journey.ReturnDetail.TicketType.includes('Standard Premium')) {
          journey.ReturnDetail.TicketType = journey.ReturnDetail.TicketType.split('Standard Premium')[0];
        }
      }
    }

  getTotalJourneyAmount(sharedService) {
    let totalPrice = 0;
    if (sharedService?.enhancedReviewBuyResponse?.Journey?.length > 0) {
      sharedService.enhancedReviewBuyResponse.Journey.forEach(journey => {
        totalPrice += journey.JourneyTotalPrice;
      });
      return totalPrice.toString();
    }
  }

  getDuration(startTime: string, endTime: string, isCheck): string {
    try {
      let toMinutes = (t: string) => {
        let [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      let durationMinutes = toMinutes(endTime) - toMinutes(startTime);
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
      }
      let hours = Math.floor(durationMinutes / 60);
      let minutes = durationMinutes % 60;

      let hourLabel = isCheck ? ' h' : ' hours';
      let minuteLabel;
      if (isCheck) {
        if (minutes > 1) {
          minuteLabel = ' mins';
        } else {
          minuteLabel = ' min';
        }
      } else {
        minuteLabel = ' minutes';
      }

      return `${hours > 0 ? hours + hourLabel : ''} ${minutes}${minuteLabel}`;
    } catch (error) { console.log(error); }
  }

  enhancedCommonNotificationDialog(id, notificationMsgs, displayedIconImage, isReviewBuy, isVerifyEmail, isDeliveryModesAvailable?, IsDeliveryAddedForJourney?) {
    return this.dialog.open(EnhancedCommonNotificationDialogsComponent, {
      id: id,
      width: '45rem',
      disableClose: isVerifyEmail || !isDeliveryModesAvailable ? false : true,
      panelClass: ['enhanced-common-info-theme', 'enhanced-common-notification'],
      autoFocus: false,
      restoreFocus: false,
      data: {
        message: notificationMsgs.notificationErrorMsg,
        headerTitle: notificationMsgs.notificationTitle,
        displayedIconImage: displayedIconImage,
        isReviewBuy: isReviewBuy,
        isVerifyEmail: isVerifyEmail,
        isDeliveryModesAvailable: isDeliveryModesAvailable,
        isDeliveryAddedForJourney: IsDeliveryAddedForJourney, // when user does not select any delivery modes for select journey
        isViewBooking: notificationMsgs.isViewBooking
      }
    });
  }

  setSessionKeyInLocalStorageIfSeasonJourneyIsAvailable(){
    if (this.sharedService?.enhancedReviewBuyResponse?.BasketCount != 0 || this.sharedService?.reviewBuyResponse?.BasketCount != 0) {
      let reviewBuyDetail = this.checkIsSeasonJourneyAvailable();
      if (reviewBuyDetail != null || reviewBuyDetail != undefined) {
        localStorage.setItem(this.localStorageKeyEnum.isReturnFromPaymentOrBasket, 'true');
        localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'false');
        this.setIsSeasonkeyInLocalStorage('true');
      } else {
        this.setIsSeasonkeyInLocalStorage('false');
      }
    }
  }

  setIsSeasonkeyInLocalStorage(value){
    this.storageDataService.setStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), value, false);
  }

  checkIsSeasonJourneyAvailable(){
    return this.sharedService?.reviewBuyResponse?.Journey?.find(x => x.SeasonDeatil != null);
  }

  showEnhancedCommonErrorPopup(isCompleteOrder = false, isRestrictedReturnFare = false) {
    this.dialog.open(EnhancedCommonErrorPopupComponent, {
      disableClose: true,
      panelClass: [this.enhancedDynamicClassNameEnum?.enhancedFooterAlertCommonPanelClass, this.enhancedDynamicClassNameEnum?.enhancedRailcardNotAppliedPanelClass],
      width: "45rem",
      autoFocus: false,
      data: {
        Message: isCompleteOrder ? `${this.errorMessageEnum.isCompleteOrderAPIFail}` : isRestrictedReturnFare ? `${this.errorMessageEnum.restrictedReturnFareMessage}` : `${this.errorMessageEnum.commonErrorMessage}`,
        headerTitle: `${this.enhancedMixingDeckPopupHeadingEnum?.somethingWentWronhErrorHeading}`
      },
    });
  }

  redirectToReviewBuyPage() {
    this.cacheSharedData();
    if ((this.sharedService.reviewBuyResponse?.BasketCount ?? 0) > 0 || (this.sharedService.enhancedReviewBuyResponse?.BasketCount ?? 0) > 0) {
      this.setSessionKeyInLocalStorageIfSeasonJourneyIsAvailable();
      this.router.navigate([`./` + this.enhancedAppRouteEnum.deliveryAndReviewBy],{
        state: {isBasketJourney: true}
      });
    }
  }

  checkIsSeasonInLocalStorage() {
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), false) === 'false';
  }

  setDeliveryModeLabel(deliveryMode: string){
    if(deliveryMode?.toLowerCase() == this.appRouteEnum?.DeliveryModeETicket?.toLowerCase()) {
      return `${this.appRouteEnum?.DeliveryMode_ETicket}`;
    } else if (deliveryMode?.toLowerCase() == this.appRouteEnum?.DeliveryMode_TOD?.toLowerCase()) {
      return `${this.appRouteEnum?.collect_at_any_stationText}`;
    } else if(deliveryMode == this.appRouteEnum?.DeliveryMode_Smart_Card) {
      return `${this.deliveryModeEnum?.SmartCard}`;
    } else if(deliveryMode == this.appRouteEnum?.DeliveryMode_FRTFIRSTCLASS){
      return `${this.deliveryModeEnum?.firstClassPostMsg}`;
    } else if (deliveryMode == this.appRouteEnum?.DeliveryMode_FRTNEXTDAY) {
      return `${this.deliveryModeEnum?.nextDayDeliveryPostMsg}`;
    } else if (deliveryMode == 'FRT'){
      return `${this.deliveryModeEnum?.postMsg}`;
    }
  }

  getUpsellItemObject(journeyExtras) {
    if (!journeyExtras || journeyExtras.length === 0) return undefined;

    let upsellName = '';
    let prices: number[] = [];

    for (let journeyExtra of journeyExtras) {
      if(journeyExtra?.IsSelected){
        prices.push(journeyExtra.Price);
        switch (journeyExtra.JourneyExtraName) {
          case this.appConstantsService.plusBus:
            upsellName += this.setPlusBusUpsellItemName(upsellName);
            break;
          case this.appConstantsService.bicycleReservation:
            upsellName += this.setBikeReservationUpsellItemName(upsellName);
            break;
          case this.appConstantsService.londonTravelcard:
            upsellName += this.setLondonTravelcardUpSellItemName(upsellName);
            break;
        }
      }
    }

    return {
      name: upsellName || undefined,
      price: prices.join(' | '), // pipe-separated prices
      category: upsellName || undefined
    };
  }
  
  groupSaveTextChange(groupSaveText){
    if (groupSaveText) {
      groupSaveText = groupSaveText.replace(/^./, (match) => match.toUpperCase());
    }
    return groupSaveText;
  }

  paymentMethodType(paymemtType){
    if(paymemtType == this.nativePaymentMethod?.netsGooglePay){
      return this.nativePaymentMethod?.googlePayText;
    } else if (paymemtType == this.nativePaymentMethod?.netsPaypal){
      return this.nativePaymentMethod?.payPal;
    } else if (paymemtType == this.nativePaymentMethod?.netsApplePay) {
      return this.nativePaymentMethod?.applePayeText;
    } else {
      return this.nativePaymentMethod?.cardText;
    }
  }

  
  backToHomePage(){
    window.location.href = environment.qttUrl;
  }

  getFormattedSeatInfo(seats: any[]): string {
    if (!seats || seats.length === 0) {
      return "";
    }
    const formattedSeats = seats.map(
      (seat) => `${seat.CoachNumber}${seat.Seat}`
    );
    return `Seat ${formattedSeats.join(", ")}`;
  }

  filterSeatInfo(seatInfo: string): string {
    if (!seatInfo) return "";
    return seatInfo
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "No Preference")
      .join(", ");
  }

  coachTextDisplay(seats) {
    let uniqueCoaches = [...new Set(seats.map((seat) => seat.CoachNumber))];
    uniqueCoaches.sort();
    if (uniqueCoaches?.length === 1) {
      return `${uniqueCoaches[0]}`;
    } else {
      return `${uniqueCoaches.slice(0, -1).join(", ")} & ${
        uniqueCoaches[uniqueCoaches.length - 1]
      }`;
    }
  }
  
  checkIsiPad(userAgent){
    if(userAgent){
      return /iPad/.test(userAgent) || (navigator.maxTouchPoints >= 1 && /Macintosh/.test(userAgent));
    }
    return false;

  }

  enhancedBookPassangerAssistCallMethod(bookPassengerAssistRequest: any) {
    this.enhancedCompleteOrderService.enhancedBookPassangerAssist(bookPassengerAssistRequest).subscribe((res: any) => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.passengerAssistResponse = this.responseData.Data;
          if (this.passengerAssistResponse.URL) {
            this.passnegerAssistUrl.next(this.passengerAssistResponse.URL);
            window.open(this.passengerAssistResponse.URL, '_blank');
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        } else {
          this.notificationService.error(this.responseData.ResponseMessage);
        }
      }
    });
  }

  getNRESelectedFare(travelSolution: any) {
    if (!travelSolution) return null;

    let lists = [
        travelSolution.NewFareList,
        travelSolution.NewReturnFareList
    ];

    for (const list of lists) {
        const selected = list?.flatMap(x => x.FareList || []).find(f => f.IsNRESelectedFare);
        if (selected) return selected;
    }

    return null;
  }
  checkNewBookingFlowKeyInLocalStorage(){
    return this.storageDataService.getSessionStorageData(this.localStorageKeyEnum.newDesignJourneyBookingFlow, false) === 'true';
  }

  isNonEmpty(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
  
  getUpsellTakenObject(journeyExtras: JourneyExtrasDetail[] | null | undefined): string {
    if (!journeyExtras || journeyExtras.length === 0) {
      return this.ga4DatalayerConstantEnum.No;
    }
    let hasSelected = journeyExtras.some(extra => extra?.IsSelected === true);
    return hasSelected ? this.ga4DatalayerConstantEnum.Yes : this.ga4DatalayerConstantEnum.No;
  }

  checkNullOrUndefined(value){
    return value != null && value != undefined;
  }

  setPlusBusUpsellItemName(upsellName){
    return upsellName ? ` | ${this.appConstantsService?.plusBusText}` : this.appConstantsService?.plusBusText;
  }

  setBikeReservationUpsellItemName(upsellName){
    return upsellName ? ` | ${this.appConstantsService?.bikeReservationText}` : this.appConstantsService?.bikeReservationText;
  }

  setLondonTravelcardUpSellItemName(upsellName){
    return upsellName ? ` | ${this.appConstantsService?.londonTravelcard}` : this.appConstantsService?.londonTravelcard;
  }
  
  getChangeLabel(changes: number): string {
    if (changes === 0) return 'Direct';
    if (changes === 1) return '1 change';
    return `${changes} changes`;
  }

  setIsUpgradeInLocalStorage(){
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isUpgrade, false) == "true";
  }

  setIsCOJInLocalStorage(){
    return this.storageDataService.getStorageData(this.travelSolutionEnum.isCOJ, false) == "true";
  }

  getAriaLabelOnTicketDetails(searchRequest, ticketTypeName, isOutward: boolean) {
      try {
        let journeyType = isOutward ? `${this.travelSolutionJourneyTypeEnum.outward}` : `${this.travelSolutionJourneyTypeEnum.return}`;
        let date = isOutward ? this.datePipe.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');
        return `Ticket details for your journey ${ticketTypeName} ${journeyType}, ${date}`;
      } catch (error) { console.log(error); }
  }

  checkNRE_StorageData(journey){
    let nreStorageDataObj = JSON.parse(localStorage.getItem(this.localStorageEnum?.nreDataResponse));
    if (nreStorageDataObj?.OutwardFares && journey?.OutwardDetail) {

      let nreOutwardFaresTotalPrice =
        nreStorageDataObj.OutwardFares.reduce(
          (total, fare) => total + (fare?.Price ?? 0),
          0
        );
      let cleanedDate = journey?.OutwardDetail?.DepartureTime.endsWith('Z') ? journey?.OutwardDetail?.DepartureTime.slice(0, -1) : journey?.OutwardDetail?.DepartureTime;
      if (
        cleanedDate === nreStorageDataObj?.SearchRequest?.DepartureDate &&
        journey?.OutwardDetail?.Price === nreOutwardFaresTotalPrice
      ) {
        return true;
      }
    }

    return false;
  }

  createRequestForGetDeliveryAndBasketJourneyAPI(nreJourneyExtrasResponse, travelSolution, cameFromFlexibleReturn, searchResponse) {
    this.enhancedGetDeliveryAndBasketJourneyRequest = new EnhancedGetDeliveryAndBasketJourneyRequest();
    let selectedData = this.searchStateService.get();

    if (nreJourneyExtrasResponse) {
      // OUTWARD (from NRE response) //
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardTravelSolutionCache = nreJourneyExtrasResponse?.TravelSolutions?.TravelSolutionCache;

      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardSearchCustomCache = nreJourneyExtrasResponse?.SearchRequest?.SearchCache;

      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardTravelSolId = nreJourneyExtrasResponse?.TravelSolutions?.TravelSolId;

      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardOfferId = travelSolution?.selectedOutwardFare?.OfferId;

      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardCatlogServiceId =
        travelSolution?.selectedOutwardFare?.ServiceId;

      // RETURN (if available) //
      if (
        nreJourneyExtrasResponse?.ReturnTravelSolutions ||
        nreJourneyExtrasResponse?.ReturnFares?.length > 0
      ) {
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnTravelSolutionCache =
          nreJourneyExtrasResponse?.ReturnTravelSolutions?.TravelSolutionCache;

        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnSearchCustomCache =
          nreJourneyExtrasResponse?.SearchRequest?.SearchCacheReturn;

        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnTravelSolId =
          nreJourneyExtrasResponse?.ReturnTravelSolutions?.TravelSolId;

        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnOfferId = cameFromFlexibleReturn
          ? travelSolution?.selectedOutwardFare?.OfferId
          : travelSolution?.selectedReturnFare?.OfferId;

        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnCatlogServiceId =
          cameFromFlexibleReturn
            ? travelSolution?.selectedOutwardFare?.ServiceId
            : travelSolution?.selectedReturnFare?.ServiceId;

        if (cameFromFlexibleReturn) {
          this.enhancedGetDeliveryAndBasketJourneyRequest.IsRestrictedReturnFare =
            !nreJourneyExtrasResponse?.ReturnTravelSolutions?.ReturnFareList?.some(
              (m) =>
                m.ServiceId ==
                  this.enhancedGetDeliveryAndBasketJourneyRequest
                    .ReturnCatlogServiceId &&
                m.OfferId ==
                  this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnOfferId,
            );
        }
      }
    } else {
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardTravelSolutionCache =
        selectedData?.outAndRetTravelSolData?.selectedOutwardTravelSolution?.TravelSolutionCache;
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardSearchCustomCache =
        searchResponse?.Request?.SearchCache;
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardTravelSolId =
        selectedData?.outAndRetTravelSolData?.selectedOutwardTravelSolution?.TravelSolId;
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardOfferId =
        travelSolution?.selectedOutwardFare?.OfferId;
      this.enhancedGetDeliveryAndBasketJourneyRequest.OutwardCatlogServiceId =
        travelSolution?.selectedOutwardFare?.ServiceId;
      if (
        travelSolution?.selectedReturnFare ||
        selectedData?.outAndRetTravelSolData?.isReturnSelected
      ) {
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnTravelSolutionCache =
          selectedData?.outAndRetTravelSolData?.selectedReturnTravelSolution?.TravelSolutionCache;
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnSearchCustomCache =
          searchResponse?.Request?.SearchCache;
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnTravelSolId =
          selectedData?.outAndRetTravelSolData?.selectedReturnTravelSolution?.TravelSolId;
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnOfferId = travelSolution?.selectedReturnFare?.OfferId
          ? travelSolution?.selectedReturnFare?.OfferId
          : travelSolution?.selectedOutwardFare?.OfferId;
        this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnCatlogServiceId =
          travelSolution?.selectedReturnFare?.ServiceId
            ? travelSolution?.selectedReturnFare?.ServiceId
            : travelSolution?.selectedOutwardFare?.ServiceId;

        if (travelSolution?.selectedReturnFare == null) {
          this.enhancedGetDeliveryAndBasketJourneyRequest.IsRestrictedReturnFare =
            !selectedData?.outAndRetTravelSolData?.selectedReturnTravelSolution?.ReturnFareList?.some(
              (m) =>
                m.ServiceId ==
                  this.enhancedGetDeliveryAndBasketJourneyRequest
                    .ReturnCatlogServiceId &&
                m.OfferId ==
                  this.enhancedGetDeliveryAndBasketJourneyRequest.ReturnOfferId,
            );
        }
      }
    }

    this.enhancedGetDeliveryAndBasketJourneyRequest.Title =
      this.storageDataService.getStorageData(
        this.localStorageEnum?.titleText,
        false,
      );
    this.enhancedGetDeliveryAndBasketJourneyRequest.Name =
      this.storageDataService.getStorageData(
        this.localStorageEnum?.firstName,
        false,
      );
    this.enhancedGetDeliveryAndBasketJourneyRequest.Surname =
      this.storageDataService.getStorageData(
        this.localStorageEnum?.lastNameText,
        false,
      );
    this.enhancedGetDeliveryAndBasketJourneyRequest.IsAdult =
      (this.sharedService?.searchRequest?.Adult ?? 0) > 0;

    this.sharedService.enhancedGetDeliveryAndBasketJourneyRequest = this.enhancedGetDeliveryAndBasketJourneyRequest;
  }
}

export function convertToSha256(text) {
  try {
    if (text !== null && text !== undefined && text !== '') {
      const bufferText = sha256(text);
      return (bufferText as Buffer).toString();
    } else {
      return undefined;
    }
  } catch (err) {
    console.log("SHA256 conversion error : " + err);
    return undefined;
  }

}
