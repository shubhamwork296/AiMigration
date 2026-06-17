import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { EvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { JourneyExtrasResponse, JourneyExtraDetail } from 'src/app/models/journey-extras/journey-extras-response.model';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { AppConstantsService, AppRouteEnum, LocalStorageKeyEnum, TicketTypeEnum, TravelSolutionDirectionEnum } from 'src/app/utility/app-constants.service';
import { CreateReservationResponse, CreateReservationRequest, JourneyExtras, Traveller } from 'src/app/models/journey-extras/reservation.model';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { FareBreakdownModel, JourneyModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { FareBreakdownComponent } from '../mixing-deck/fare-breakdown/fare-breakdown.component';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { InfoPopupComponent } from '../mixing-deck/info-popup/info-popup.component';
import { browserRefresh, navigationTrigger, eventUrl } from '../../app-component/app.component';
import { NreJourneyExtrasResponse, HandOffDataReqDto } from 'src/app/models/journey-extras/nre-response.model';
import { CommonServices } from '../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { TicketInfoComponent } from '../mixing-deck/ticket-info/ticket-info.component';
import { JourneySummaryModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { Validators } from '@angular/forms';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { DisruptionServiceComponent } from '../mixing-deck/disruption-service/disruption-service.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
  selector: 'app-journey-extras',
  templateUrl: './journey-extras.component.html',
  styleUrls: ['./journey-extras.component.css']
})
export class JourneyExtrasComponent implements OnInit {
  selectedBicycle = '1';
  selectedBicycleReturn = '1';
  evaluateTravelRequest: EvaluateTravelRequest;
  responseData: ResponseData;
  journeyExtrasResponse: JourneyExtrasResponse;
  createReservationRequest: CreateReservationRequest;
  createReservationResponse: CreateReservationResponse;
  searchRequest: SearchRequestModel;
  plusBus: JourneyExtraDetail[];
  plusBusReturn: JourneyExtraDetail[];
  bicycleReservation: JourneyExtraDetail[];
  londonTravelcard: JourneyExtraDetail[];
  londonTravelcardReturn: JourneyExtraDetail[];
  facing: string;
  position: string;
  preferredCoach: string;
  journeyExtras: Array<JourneyExtras> = [];
  selectedTravelCard: any = "0";
  selectedTravelCardReturn: any = "0";
  totalPrice: string;
  plusbusPrice = 0;
  outTravelCardPrice = 0;
  retTravelCardPrice = 0;
  londonTravelCardPrice = 0;
  seasonUserDetails: Traveller;
  browserRefresh: boolean;
  outwardPlusBus0: boolean = false;
  returnPlusBus0: boolean = false;
  outwardPlusBus1: boolean = false;
  returnPlusBus1: boolean = false;
  outwardBicycleReservation: boolean = false;
  returnBicycleReservation: boolean = false;
  outwardLondonTravelcard: boolean = false;
  returnLondonTravelcard: boolean = false;
  navigationTrigger: string;
  eventUrl: string;
  requestId: string;
  fareBreakDownData: FareBreakdownModel[];
  fareBreakDownDataNreBasket: FareBreakdownModel[] = [];
  nreJourneyExtrasResponse: NreJourneyExtrasResponse;
  handOffDataReqDto: HandOffDataReqDto;
  selectedTravelCardGA: any[];
  oldBicycleCounts = 0;
  oldBicycleCountsReturn = 0;
  sticky: boolean;

  @ViewChild("chkTravelCard", { static: false }) private readonly chkTravelCard: MatCheckbox;
  @ViewChild("chkTravelCardReturn", { static: false }) private readonly chkTravelCardReturn: MatCheckbox;
  outSelected: any = -1;
  retSelected: any = -1;
  directionRadioVal: any;
  positionRadioVal: any;
  
  sharedSibling: SharedService;
  journeyExtraService: JourneyExtraService;
  appConstantsService: AppConstantsService;
  appRouteEnum: AppRouteEnum;
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  router: Router;
  _notificationservice: NotificationService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  route: ActivatedRoute;
  dataLayerService: DataLayerService;
  ga4datalayerService: GA4DatalayerService;
  ticketTypeEnum:TicketTypeEnum
  travelSolutionDirectionEnum :TravelSolutionDirectionEnum;
  localStorageKeyEnum: LocalStorageKeyEnum;
  createUrl:any;
  iframeSrc: any;

  constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.sharedSibling = this.injector.get(SharedService);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.router = this.injector.get(Router);
    this._notificationservice = this.injector.get(NotificationService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.route = this.injector.get(ActivatedRoute);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    


    this.evaluateTravelRequest = this.sharedSibling.evaluateRequest;
    this.searchRequest = this.sharedSibling.searchRequest;
    this.journeyExtrasResponse = new JourneyExtrasResponse;
    this.createReservationRequest = new CreateReservationRequest;
    this.seasonUserDetails = new Traveller();
    if (this.sharedSibling.fareBreakdownModelData != null && this.sharedSibling.fareBreakdownModelData.length > 0) {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = new Array<JourneyModel>();
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = new Array<JourneyModel>();
      this.sharedSibling.fareBreakdownModelData[0].DeliveryDetails = new Array<JourneyModel>();
    }

    this.handOffDataReqDto = new HandOffDataReqDto();
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }
  step = 0;
  step1 = 0;
  step2 = 0;
  step3 = 0;
  isShow = true;
  isShow2 = true;
  isShow3 = true;
  seatingPreferences = [];
  tableSeat: boolean = false;
  quietCoach: boolean = false;
  nearLuggageRack: boolean = false;
  nearToilet: boolean = false;
  airlineStyle: boolean = false;
  powerSocket: boolean = false;
  showclasstoggle: boolean = false;

  showclickEvent() {
    this.showclasstoggle = !this.showclasstoggle;
  }

  reserveseatToggle() {
    this.facing = "0";
    this.position = "0";
    this.preferredCoach = "0";
    this.seatingPreferences = [];
    this.tableSeat = false;
    this.quietCoach = false;
    this.nearLuggageRack = false;
    this.nearToilet = false;
    this.airlineStyle = false;
    this.powerSocket = false;
    this.isShow = !this.isShow;
    this.isShow2 = !this.isShow2;
  }
  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.DeliveryMode)) {
      this.sharedSibling.IsJEForwardClick = true;
      this.customerAuhentication();
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && (this.router.url.includes(this.appRouteEnum.MixingDeck)
      || this.router.url.includes(this.appRouteEnum.Register) || this.router.url.includes(this.appRouteEnum.RegistrationSuccess)
      || this.router.url.includes(this.appRouteEnum.SeasonSolutions))) {
      if (this.searchRequest.IsSeason) {
        this.router.navigateByUrl('/' + this.appRouteEnum.SeasonSolutions);
      }
      else {
        this.router.navigateByUrl('/' + this.appRouteEnum.MixingDeck);
      }
    }
    this.storageDataService.clearSessionStorageData("pageReloaded");
  }
  ngOnInit() {
    // for showing basket icon when go back from review-buy to search-results
    if (this.sharedSibling?.reviewBuyResponse) {
      this.sharedSibling.getBasketCount.emit(this.sharedSibling.reviewBuyResponse.BasketCount);
    }

    window.scrollTo(0, 0);
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
    
    this.sharedSibling.IsJEForwardClick = false;
    this.browserRefresh = browserRefresh;
    this.navigationTrigger = navigationTrigger;
    this.eventUrl = eventUrl;
    this.commonService.loaderRequired = false;
    
    this.getQueryString();
    this.totalPrice = this.sharedSibling.calculateTotalAmount();

  }
  initialBinding() {
    //Get shared cache data
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedSibling.searchRequest = this.searchRequest;
        this.sharedSibling.journeyExtrasResponseShared = sharedSiblingRefresh.journeyExtrasResponseShared;
        this.sharedSibling.fareBreakdownModelData[0] = sharedSiblingRefresh.fareBreakdownModelData[0];
        this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = new Array<JourneyModel>();
        this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = new Array<JourneyModel>();
        this.sharedSibling.fareBreakdownModelData[0].DeliveryDetails = new Array<JourneyModel>();
        this.sharedSibling.evaluateRequest = sharedSiblingRefresh.evaluateRequest;
        this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        if (this.sharedSibling.reviewBuyResponse != null && this.sharedSibling.reviewBuyResponse != undefined) {
          this.sharedSibling.getBasketCount.emit(this.sharedSibling.reviewBuyResponse.BasketCount);
        }
        this.sharedSibling.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedSibling.locationMasterData = sharedSiblingRefresh.locationMasterData;
        this.sharedSibling.isSingleReturnCase = sharedSiblingRefresh.isSingleReturnCase;
        this.sharedSibling.isReturnCase = sharedSiblingRefresh.isReturnCase;
        this.sharedSibling.editQttDepartureTimeStart = sharedSiblingRefresh.editQttDepartureTimeStart;
        this.sharedSibling.editQttReturnTimeStart = sharedSiblingRefresh.editQttReturnTimeStart;
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        this.getEvaluateData(sharedSiblingRefresh);
      }
    }
    else {
      this.getEvaluateData(this.sharedSibling);
    }
    this.dataLayerService.loadGALayerForProductImpressionUpsells(this.searchRequest, true, null, this.sharedSibling.journeyExtrasResponseShared, this.sharedSibling.journeySummaryModel);

  }
 //PICO-2014 in case familyplus ticket type is selected seatPrefrence will be hidden on journeyExtras
  isFamilyPlusTicketType() {
    let journeySummaryModel = this.sharedSibling.journeySummaryModel;
    if (journeySummaryModel && ((journeySummaryModel?.SingleSelectedFare?.TicketTypeName?.toLowerCase() === this.ticketTypeEnum.familyPlus.toLowerCase()) || (journeySummaryModel?.ReturnSelectedFare?.TicketTypeName?.toLowerCase() === this.ticketTypeEnum.familyPlus.toLowerCase()))) {
      return true;
    }
    return false;
  }

  getEvaluateData(sharedSiblingPara: any) {
    if (this.isSharedSiblingParaNullOrNot(sharedSiblingPara)) {
      this.journeyExtrasResponse = sharedSiblingPara.journeyExtrasResponseShared;
      localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.journeyExtrasResponse.IsReviewMergedFlowEnabled));
      if (this.journeyExtrasResponse != null) {
        if (this.isJourneyExtraResponseDetailNullOrNot()) {
          this.setDataWhenJourneyExtraResponseDetailIsNotNull();
        }
      }
      let createReservationRequest = sharedSiblingPara.createReservationRequest;
      if (this.isCreateReservationRequestNullOrNot(createReservationRequest)) {
        this.checkForNonReservedRequest(createReservationRequest);
        if (this.isCreateReservationHavingJourneyExtrasOrNot(createReservationRequest)) {
          this.journeyExtras = createReservationRequest.JourneyExtras;
          createReservationRequest.JourneyExtras.forEach(obj => {
           this.checkForReturnAndOutwardJourneyInCreateReservationRequest(obj);
          });
        }
      }
      let journeySummaryModel = sharedSiblingPara.journeySummaryModel;
      if (this.isJourneySummaryModelNullOrNot(journeySummaryModel)) {
        this.sharedSibling.journeySummaryModel = journeySummaryModel;
      }
    }
    this.totalPrice = this.sharedSibling.calculateTotalAmount();
    let customerLoginResponse = this.storageDataService.getLocalStorageData("customerLoginResponse", true);
    if (customerLoginResponse != null) {
      this.setJourneyExtraDetailWhenCustomerLoginResponseIsNotNull(customerLoginResponse);
    }
  }

  // get journey extras for begin_checkout event
  jourenyExtraForCheckout() {
    let journeyExtraForCheckout = [];
    this.journeyExtras.forEach(journeyExtraObj => {
      this.sharedSibling.journeyExtrasResponseShared.Detail.forEach(obj => {
        if (journeyExtraObj.OfferId == obj.OfferId && journeyExtraObj.IsReturn == obj.IsReturn) {
          journeyExtraForCheckout.push(obj);
        }
      })
    });
    return journeyExtraForCheckout;
  }
  customerAuhentication() {
    if ((this.journeyExtrasResponse.OutwardReservation == null || this.journeyExtrasResponse.OutwardReservation == "") && (this.journeyExtrasResponse.ReturnReservation == null || this.journeyExtrasResponse.ReturnReservation == "")) {
      this.journeyExtraService.seasonUserForm.markAllAsTouched();

      const otherTitleControl = this.journeyExtraService.seasonUserForm.controls['OtherTitle'];
      if (otherTitleControl.value == '' && this.journeyExtraService.seasonUserForm.value.Title == "Other") {
        otherTitleControl.setErrors({ other: true });
        return false;
      } else {
        otherTitleControl.setErrors(null);
      }
      
      if (!this.searchRequest.IsFlexiTicketSelected) {
        this.journeyExtraService.seasonUserForm.get('PhotoCardId').setValidators([Validators.required,Validators.pattern('^[A-Z]{3}[0-9]{4}$')]);
        this.journeyExtraService.seasonUserForm.get('PhotoCardId').updateValueAndValidity();
      }
      else {
        this.journeyExtraService.seasonUserForm.get('PhotoCardId').setValidators([Validators.pattern('^[A-Z]{3}[0-9]{4}$')]);
        this.journeyExtraService.seasonUserForm.get('PhotoCardId').updateValueAndValidity();
      }
      if (this.journeyExtraService.seasonUserForm.valid) {
        this.createReservationRequest.IsSeason = true;
        const traveller = this.journeyExtraService.seasonUserForm.value;
        this.createReservationRequest.Traveller = traveller;
      }
      else {
        return;
      }
    }
    this.setSeatingPrefrences();
    this.createRequestAndCallAPI();
    let extraForCheckout = this.jourenyExtraForCheckout();
    if (this.commonService.doesDeliveryPageSkipped()) {
      this.ga4datalayerService.loadGALayerForAddToCartInfo(this.sharedSibling.searchRequest, this.sharedSibling.journeySummaryModel, this.commonService.jourenyExtraForCheckout(), false);
    }
    this.ga4datalayerService.loadGALayerForBeginCheckout(this.searchRequest, this.sharedSibling.journeySummaryModel, extraForCheckout, this.createReservationRequest.Preferences, false);
  }

  setSeatingPrefrences() {
    if (this.facing != undefined) {
      this.seatingPreferences.push(this.facing);
    }
    if (this.position != undefined) {
      this.seatingPreferences.push(this.position);
    }
    if (this.preferredCoach != undefined) {
      this.seatingPreferences.push(this.preferredCoach);
    }
    this.seatingPreferences = this.seatingPreferences.filter(x => x != "0");
  }

  createRequestAndCallAPI() {
    this.createReservationRequest.Preferences = this.seatingPreferences;
    this.createReservationRequest.JourneyExtras = this.journeyExtras;
    this.createReservationRequest.IsReserved = (this.isShow && this.isShow2) ? false : true;
    if (this.requestId != "" && this.requestId != null && this.requestId != undefined
      && this.nreJourneyExtrasResponse.IsBasket && this.nreJourneyExtrasResponse.JourneyCount > this.nreJourneyExtrasResponse.Journey) {
      this.createReservationRequest.EvaluateTravelCache = this.nreJourneyExtrasResponse.JourneyExtras.EvaluateTravelCache;
      this.createReservationRequest.OutwardReservation = this.nreJourneyExtrasResponse.JourneyExtras.OutwardReservation;
      this.createReservationRequest.ReturnReservation = this.nreJourneyExtrasResponse.JourneyExtras.ReturnReservation;
      this.handOffDataReqDto = new HandOffDataReqDto();
      this.handOffDataReqDto.requestId = this.requestId;
      this.handOffDataReqDto.Journey = (this.nreJourneyExtrasResponse.Journey + 1);
      this.handOffDataReqDto.BasketCache = this.nreJourneyExtrasResponse.BasketCache;
      this.handOffDataReqDto.ReservationRequest = this.createReservationRequest;
      this.handOffDataReqDto.ReservationCache = this.nreJourneyExtrasResponse.ReservationCache;
      this.nreHandoffData(this.handOffDataReqDto);
    }
    else {
      if (this.requestId != "" && this.requestId != null && this.requestId != undefined && this.nreJourneyExtrasResponse.IsBasket) {
        this.createReservationRequest.EvaluateTravelCache = this.nreJourneyExtrasResponse.JourneyExtras.EvaluateTravelCache;
        this.createReservationRequest.OutwardReservation = this.nreJourneyExtrasResponse.JourneyExtras.OutwardReservation;
        this.createReservationRequest.ReturnReservation = this.nreJourneyExtrasResponse.JourneyExtras.ReturnReservation;
        this.createReservationRequest.IsNreBasket = true;
        this.createReservationRequest.NreBasket = this.nreJourneyExtrasResponse.ReservationCache;
      }
      else {
        this.createReservationRequest.EvaluateTravelCache = this.journeyExtrasResponse.EvaluateTravelCache;
        this.createReservationRequest.OutwardReservation = this.journeyExtrasResponse.OutwardReservation;
        this.createReservationRequest.ReturnReservation = this.journeyExtrasResponse.ReturnReservation;
      }
      this.commonService.postReservationData(this.createReservationRequest, this.fareBreakDownDataNreBasket, this.nreJourneyExtrasResponse);
    }
  }

  createRange(number) {
    let items: number[] = [];
    for (let i = 1; i <= number; i++) {
      items.push(i);
    }
    return items;
  }
  setStep(val: number) {
    this.step = val;
  }
  onSeatTypeChange(event, value) {
    if (event.checked) {
      if (value == "TABL") {
        this.seatingPreferences = this.seatingPreferences.filter(x => x != "AIRL");
        this.airlineStyle = false;
      }
      else if (value == "AIRL") {
        this.seatingPreferences = this.seatingPreferences.filter(x => x != "TABL");
        this.tableSeat = false;
      }
      this.seatingPreferences.push(value);
    }
    if (!event.checked) {
      let index = this.seatingPreferences.indexOf(value);
      if (index > -1) {
        this.seatingPreferences.splice(index, 1);
      }
    }
  }

  // all function execute incase of checked true which used below function in onJourneyExtrasChange
  isCheckedForIsReturnInCaseLondonTravel(isReturn) {
    if (isReturn) {
      this.sharedSibling.journeySummaryModel.ReturnLondonTravelcard = true;
    }
    else {
      this.sharedSibling.journeySummaryModel.OutwardLondonTravelcard = true;
    }
  }
  isCheckedForReturnPlusBus() {
    if (this.returnPlusBus0 && this.returnPlusBus1) {
      this.sharedSibling.journeySummaryModel.ReturnPlusbus = true;
      this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = true;
    }
    else if ((this.returnPlusBus0 && !this.returnPlusBus1) || (!this.returnPlusBus0 && this.returnPlusBus1)) {
      this.sharedSibling.journeySummaryModel.ReturnPlusbus = true;
      this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = false;
    }
  }
  isCheckedForIsReturnInCasePlusBus(isReturn) {
    if (isReturn) {
      this.isCheckedForReturnPlusBus();
    }
    else {
      if (this.outwardPlusBus0 && this.outwardPlusBus1) {
        this.sharedSibling.journeySummaryModel.OutwardPlusbus = true;
        this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = true;
      }
      else if ((this.outwardPlusBus0 && !this.outwardPlusBus1) || (!this.outwardPlusBus0 && this.outwardPlusBus1)) {
        this.sharedSibling.journeySummaryModel.OutwardPlusbus = true;
        this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = false;
      }
    }
  }
  isCheckedJourneyExtraChange(selectedJourneyExtras, isReturn) {
    if (this.sharedSibling.journeySummaryModel != null) {
      if (selectedJourneyExtras[0].Description == this.appConstantsService.londonTravelcard) {
        this.isCheckedForIsReturnInCaseLondonTravel(isReturn);
      }
      else if (selectedJourneyExtras[0].Description == this.appConstantsService.plusBus) {
        this.isCheckedForIsReturnInCasePlusBus(isReturn);

        this.plusbusPrice = this.plusbusPrice + selectedJourneyExtras[0].Price;
      }
      else if (selectedJourneyExtras[0].Description == this.appConstantsService.bicycleReservation) {
        if (isReturn) {
          this.sharedSibling.journeySummaryModel.ReturnBicycleReservation = true;
        }
        else {
          this.sharedSibling.journeySummaryModel.OutwardBicycleReservation = true;
          this.outwardBicycleReservation = true;

        }
      }
    }
  }
  isCheckedJourneyExtraChangeInReturn(fareBreakDownJourneyExtras, isReturn) {
    if (isReturn) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.push(fareBreakDownJourneyExtras);
    }
    else {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.push(fareBreakDownJourneyExtras);
    }
  }

  // all function execute incase of checked false which used below function in onJourneyExtrasChange
  isNotCheckedJourneyExtraChangeInCaseOfReturn(selectedJourneyExtras, isReturn, journey) {
    if (isReturn) {
      if (selectedJourneyExtras[0].Description == this.appConstantsService.plusBus) {
        this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.filter(i => i.SolutionNodeRef != journey.SolutionNodeRef);
      }
      else {
        this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.filter(i => i.OfferId != journey.OfferId && i.ServiceId != journey.ServiceId);
      }
    }
    else {
      if (selectedJourneyExtras[0].Description == this.appConstantsService.plusBus) {
        this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.filter(i => i.SolutionNodeRef != journey.SolutionNodeRef);
      }
      else {
        this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.filter(i => i.OfferId != journey.OfferId && i.ServiceId != journey.ServiceId);
      }
    }
  }
  isNotCheckedForReturnInCaseLondonTravel(isReturn) {
    if (isReturn) {
      this.sharedSibling.journeySummaryModel.ReturnLondonTravelcard = false;
    }
    else {
      this.sharedSibling.journeySummaryModel.OutwardLondonTravelcard = false;
    }
  }
  isNotCheckedForReturnPlusBus() {
    if (this.returnPlusBus0 && this.returnPlusBus1) {
      this.sharedSibling.journeySummaryModel.ReturnPlusbus = true;
      this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = true;
    }
    else if ((this.returnPlusBus0 && !this.returnPlusBus1) || (!this.returnPlusBus0 && this.returnPlusBus1)) {
      this.sharedSibling.journeySummaryModel.ReturnPlusbus = true;
      this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = false;
    }
    else {
      this.sharedSibling.journeySummaryModel.ReturnPlusbus = false;
      this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = false;
    }
  }
  isNotCheckedForReturnInCasePlusBus(isReturn) {
    if (isReturn) {
      this.isNotCheckedForReturnPlusBus();

    }
    else {
      if (this.outwardPlusBus0 && this.outwardPlusBus1) {
        this.sharedSibling.journeySummaryModel.OutwardPlusbus = true;
        this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = true;
      }
      else if ((this.outwardPlusBus0 && !this.outwardPlusBus1) || (!this.outwardPlusBus0 && this.outwardPlusBus1)) {
        this.sharedSibling.journeySummaryModel.OutwardPlusbus = true;
        this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = false;
      }
      else {
        this.sharedSibling.journeySummaryModel.OutwardPlusbus = false;
        this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = false;
      }
    }
  }
  isNotCheckedJourneyExtraChange(selectedJourneyExtras, isReturn) {
    if (this.sharedSibling.journeySummaryModel != null) {
      if (selectedJourneyExtras[0].Description == this.appConstantsService.londonTravelcard) {
        this.isNotCheckedForReturnInCaseLondonTravel(isReturn);

      }
      else if (selectedJourneyExtras[0].Description == this.appConstantsService.plusBus) {
        this.isNotCheckedForReturnInCasePlusBus(isReturn);

        if (this.plusbusPrice != 0) {
          this.plusbusPrice = this.plusbusPrice - selectedJourneyExtras[0].Price;
          this.plusbusPrice = parseFloat((Math.round(this.plusbusPrice * 100) / 100).toFixed(2));
        }
      }
      else if (selectedJourneyExtras[0].Description == this.appConstantsService.bicycleReservation) {
        if (isReturn) {
          this.sharedSibling.journeySummaryModel.ReturnBicycleReservation = false;
        }
        else {
          this.sharedSibling.journeySummaryModel.OutwardBicycleReservation = false;
          this.outwardBicycleReservation = false;

        }
      }
    }
  }

  getPassangerOfFareBreakDownJourneyExtrasInCaseBike(fareBreakDownJourneyExtras, journey) {
    if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger = journey.SelectCount + ' * Adult, Child';
    }
    else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger = journey.SelectCount + ' * Child';
    }
    else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
      fareBreakDownJourneyExtras.Passenger = journey.SelectCount + ' * Adult';
    }
  }
  // call function for get passanger of farebreakdown which is used below function in onjourneyExtraChange
  getPassangerOfFareBreakDownJourneyExtras(fareBreakDownJourneyExtras, selectedJourneyExtras, journey) {
    if (selectedJourneyExtras[0].ServiceName == 'BIKE_RESERVATION') {
      this.getPassangerOfFareBreakDownJourneyExtrasInCaseBike(fareBreakDownJourneyExtras, journey);
    }
    else {
      if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
      }
      else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
      }
      else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
      }
    }
  }

  getValueOfSelectCount(journey, selectedJourneyExtras, isReturn) {
    if (selectedJourneyExtras[0].Description != this.appConstantsService.bicycleReservation) {
      journey.SelectCount = selectedJourneyExtras[0].AvailableAmount;
    }
    else {
      journey.SelectCount = isReturn ? Number(this.selectedBicycleReturn) : Number(this.selectedBicycle);
    }
  }
  // call method for checked value on journey extra which is used below function in onJourneyExtraChange
  getArrayOfJourneyExtraOnCheckedValue(checked, selectedJourneyExtras, isReturn, fareBreakDownJourneyExtras, journey) {
    if (checked) {
      this.isCheckedJourneyExtraChange(selectedJourneyExtras, isReturn);
      this.isCheckedJourneyExtraChangeInReturn(fareBreakDownJourneyExtras, isReturn);
      this.journeyExtras.push(journey);
    }
    if (!checked) {
      this.isNotCheckedJourneyExtraChange(selectedJourneyExtras, isReturn);
      this.isNotCheckedJourneyExtraChangeInCaseOfReturn(selectedJourneyExtras, isReturn, journey);

      this.journeyExtras = this.journeyExtras.filter(i => i.SolutionNodeRef != journey.SolutionNodeRef);
    }
  }
  
  // call GADataLayer on journeyExtra event if checked is true or false
  isCheckedValueForLoadGALayerOnJourneyExtraChange(checked, selectedJourneyExtras, journey) {
    if (checked) {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, selectedJourneyExtras, this.sharedSibling.journeySummaryModel, journey.SelectCount, false);
    } else if (!checked) {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, selectedJourneyExtras, this.sharedSibling.journeySummaryModel, journey.SelectCount, true);
      // Remove from cart
      this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, selectedJourneyExtras, this.sharedSibling.journeySummaryModel);
    }
  }
  onJourneyExtrasChange(checked, value, isReturn, solutionNodeRef) {
    let selectedJourneyExtras = this.journeyExtrasResponse.Detail.filter(i => i.Description === value && i.IsReturn == isReturn);
    if (selectedJourneyExtras[0].Description == this.appConstantsService.londonTravelcard) {
      if (this.selectedTravelCard != "0" && !isReturn) {
        selectedJourneyExtras = selectedJourneyExtras.filter(i => i.OfferId == this.selectedTravelCard.OfferId && i.ServiceId == this.selectedTravelCard.ServiceId && i.IsReturn == isReturn);
      }
      else if (this.selectedTravelCardReturn != "0" && isReturn) {
        selectedJourneyExtras = selectedJourneyExtras.filter(i => i.OfferId == this.selectedTravelCardReturn.OfferId && i.ServiceId == this.selectedTravelCardReturn.ServiceId && i.IsReturn == isReturn);
      }
      else {
        selectedJourneyExtras = [];
      }
    }
    if (selectedJourneyExtras != null && selectedJourneyExtras.length > 0 && selectedJourneyExtras[0].Description == this.appConstantsService.plusBus) {
      selectedJourneyExtras = selectedJourneyExtras.filter(i => i.SolutionNodeRef == solutionNodeRef);
    }
    if (selectedJourneyExtras != null && selectedJourneyExtras.length > 0) {
      let journey = new JourneyExtras();
      journey.OfferId = selectedJourneyExtras[0].OfferId;
      journey.ServiceId = selectedJourneyExtras[0].ServiceId;
      journey.IsReturn = selectedJourneyExtras[0].IsReturn;
      journey.SolutionNodeRef = selectedJourneyExtras[0].SolutionNodeRef;

      this.getValueOfSelectCount(journey, selectedJourneyExtras, isReturn);

      let fareBreakDownJourneyExtras = new JourneyModel;

      this.getPassangerOfFareBreakDownJourneyExtras(fareBreakDownJourneyExtras, selectedJourneyExtras, journey);

      fareBreakDownJourneyExtras.PricePerPerson = selectedJourneyExtras[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = selectedJourneyExtras[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = selectedJourneyExtras[0].Description;
      fareBreakDownJourneyExtras.OfferId = selectedJourneyExtras[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = selectedJourneyExtras[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = selectedJourneyExtras[0].SolutionNodeRef;

      this.getArrayOfJourneyExtraOnCheckedValue(checked, selectedJourneyExtras, isReturn, fareBreakDownJourneyExtras, journey);

      this.totalPrice = this.sharedSibling.calculateTotalAmount();

      this.isCheckedValueForLoadGALayerOnJourneyExtraChange(checked, selectedJourneyExtras, journey);

    }
  }
  onTravelcardChange(value, checked, index) {
    this.londonTravelCardPrice = 0;
    this.setOutAndRetSelectedIndex(value, index, checked);

    let journey = new JourneyExtras();
    journey.OfferId = value.OfferId;
    journey.ServiceId = value.ServiceId;
    journey.SelectCount = value.AvailableAmount;
    journey.IsReturn = value.IsReturn;
    journey.SolutionNodeRef = value.SolutionNodeRef;
    if (checked) {
      let travelList = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.londonTravelcard && i.IsReturn === value.IsReturn);
      // check condition for call remove_from_cart event on uncheck LondonTravelCard
      this.callRemoveFromCartOnUncheckLondonTravelCard(travelList);
      this.filterTravelExtraList(travelList);
      
      if (value.IsReturn) {
        this.getReturnLondonTravelcard();
        
        this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras =
          this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.filter(function (o1) {
            return !travelList.some(function (o2) {
              return (o1.OfferId === o2.OfferId && o1.ServiceId === o2.ServiceId);
            });
          });
        this.getRetTravelCardPrice(value);
      }
      else {
        if (this.sharedSibling.journeySummaryModel != null) {
          this.sharedSibling.journeySummaryModel.OutwardLondonTravelcard = true;
        }
        this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras =
          this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.filter(function (outwardJourneyExtra) {
            return !travelList.some(function (o2) {
              return (outwardJourneyExtra.OfferId === o2.OfferId && outwardJourneyExtra.ServiceId === o2.ServiceId);
            });
          });
        this.getOutTravelCardPrice(value);
      }

      this.journeyExtras.push(journey);
      this.getFareBreakDownJourneyExtrasObj(value);
      
    }
    else {
      let travelList = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.londonTravelcard && i.IsReturn === value.IsReturn);
      this.filterTravelExtra(travelList);
      this.getOutAndRetJourneyExtraForTravelCardPrice(value);
    }
    this.londonTravelCardPrice = this.outTravelCardPrice + this.retTravelCardPrice;
    this.totalPrice = this.sharedSibling.calculateTotalAmount();
    this.isCheckedForLoadGa4LayerEvent(checked, value, journey.SelectCount);
    
  }
  filterTravelExtraList(travelList) {
    this.journeyExtras = this.journeyExtras.filter(function (o1) {
      return !travelList.some(function (o2) {
        return (o1.OfferId === o2.OfferId && o1.ServiceId === o2.ServiceId && o1.IsReturn === o2.IsReturn);
      });
    });
  }
  getReturnLondonTravelcard() {
    if (this.sharedSibling.journeySummaryModel != null) {
      this.sharedSibling.journeySummaryModel.ReturnLondonTravelcard = true;
    }
  }
  getOutAndRetJourneyExtraForTravelCardPrice(value) {
    if (value.IsReturn) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.filter(i => i.OfferId != value.OfferId && i.ServiceId != value.ServiceId && i.JourneyExtrasTitle != value.Description);
      if (this.sharedSibling.journeySummaryModel != null) {
        this.sharedSibling.journeySummaryModel.ReturnLondonTravelcard = false;
      }
      if (this.retTravelCardPrice > 0) {
        this.retTravelCardPrice = this.retTravelCardPrice - value.Price
      }
    }
    else {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.filter(i => i.OfferId != value.OfferId && i.ServiceId != value.ServiceId && i.JourneyExtrasTitle != value.Description);
      if (this.sharedSibling.journeySummaryModel != null) {
        this.sharedSibling.journeySummaryModel.OutwardLondonTravelcard = false;
      }
      if (this.outTravelCardPrice > 0) {
        this.outTravelCardPrice = this.outTravelCardPrice - value.Price
      }
    }
  }
  // for get return travelcard price
  getRetTravelCardPrice(value) {
    if (this.retTravelCardPrice == 0) {
      this.retTravelCardPrice = this.retTravelCardPrice + value.Price;
    } else {
      this.retTravelCardPrice = 0;
      this.retTravelCardPrice = this.retTravelCardPrice + value.Price;
    }
  }
  // for get outward travelcard price
  getOutTravelCardPrice(value) {
    if (this.outTravelCardPrice == 0) {
      this.outTravelCardPrice = this.outTravelCardPrice + value.Price;
    } else {
      this.outTravelCardPrice = 0;
      this.outTravelCardPrice = this.outTravelCardPrice + value.Price;
    }
  }
  // created method for set Out & Return selected index on select travelCard
  setOutAndRetSelectedIndex(value, index, checked) {
    if (value.IsReturn) {
      if (checked) {
        this.retSelected = index;
        this.storageDataService.setStorageData("retSelected", this.retSelected, true);
      } else {
        this.retSelected = -1;
        this.storageDataService.setStorageData("retSelected", this.retSelected, true);
      }
    } else {
      if (checked) {
        this.outSelected = index;
        this.storageDataService.setStorageData("outSelected", this.outSelected, true);
      } else {
        this.outSelected = -1;
        this.storageDataService.setStorageData("outSelected", this.outSelected, true);
      }
    }
  }
  // for call addtocart & removefromcart ga4 event on checked
  isCheckedForLoadGa4LayerEvent(checked, value, journeyCount) {
    if (checked) {
      this.selectedTravelCardGA = [value];
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [value], this.sharedSibling.journeySummaryModel, journeyCount, false);
    }
    else {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [value], this.sharedSibling.journeySummaryModel, journeyCount, true);
      // Remove from cart
      this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, [value], this.sharedSibling.journeySummaryModel);
    }
  }
  callRemoveFromCartOnUncheckLondonTravelCard(travelList) {
    let uncheckJourneyExtraForLondonTravelCard = [];
    if (travelList) {
      travelList.forEach(travelExtras => {
        this.journeyExtras.forEach(removeExtras => {
          if (travelExtras.OfferId === removeExtras.OfferId && travelExtras.ServiceId === removeExtras.ServiceId && travelExtras.IsReturn === removeExtras.IsReturn) {
            uncheckJourneyExtraForLondonTravelCard.push(travelExtras);
            this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, uncheckJourneyExtraForLondonTravelCard, this.sharedSibling.journeySummaryModel);
          }
        });
      });
    }
  }
  getFareBreakDownJourneyExtrasObj(value) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
    }
    else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
      fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
    }
    else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
      fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
    }
    fareBreakDownJourneyExtras.PricePerPerson = value.Price;
    fareBreakDownJourneyExtras.TotalPrice = value.Price;
    fareBreakDownJourneyExtras.RailCard = '';
    fareBreakDownJourneyExtras.JourneyExtrasTitle = value.Description;
    fareBreakDownJourneyExtras.OfferId = value.OfferId;
    fareBreakDownJourneyExtras.ServiceId = value.ServiceId;
    fareBreakDownJourneyExtras.SolutionNodeRef = value.SolutionNodeRef;
    if (value.IsReturn) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.push(fareBreakDownJourneyExtras);
    }
    else {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.push(fareBreakDownJourneyExtras);
    }
  }
  onTravelcardNoneChange(isReturn) {
    let travelList = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.londonTravelcard && i.IsReturn === isReturn);
    this.filterTravelExtra(travelList);
    if (isReturn) {
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.filter(i => i.JourneyExtrasTitle != this.appConstantsService.londonTravelcard);
    }
    else {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.filter(i => i.JourneyExtrasTitle != this.appConstantsService.londonTravelcard);
    }
    this.totalPrice = this.sharedSibling.calculateTotalAmount();
    if (this.selectedTravelCardGA?.[0]) {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, this.selectedTravelCardGA, this.sharedSibling.journeySummaryModel, this.selectedTravelCardGA[0].AvailableAmount, true);
       // Remove from cart
       this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, this.selectedTravelCardGA, this.sharedSibling.journeySummaryModel);
    }
  }
  onBicycleChange(bicycle, flag) {
    this.getBicycleExistsDataObj(bicycle);

    if (!bicycle.IsReturn) {
      this.getPassangerDetailForOutJourneyExtras(bicycle, flag);

      try {
        this.getBicycleDetailForOut(bicycle);

      } catch (error) {
        console.log(error);
      }
    }
    else {
      this.getPassangerDetailForRetJourneyExtras(bicycle, flag);
      
      try {
        let isBicycleChoosed = this.sharedSibling.journeySummaryModel.ReturnBicycleReservation;
        if (isBicycleChoosed && this.oldBicycleCountsReturn - Number(this.selectedBicycleReturn) > 0) {
          this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel, Number(this.selectedBicycleReturn), true);

          // Remove from cart
          this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel);
        } else if (isBicycleChoosed && this.oldBicycleCountsReturn - Number(this.selectedBicycleReturn) < 0) {
          this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel, Number(this.selectedBicycleReturn), false);
        }
        this.oldBicycleCountsReturn = Number(this.selectedBicycleReturn);
      } catch (error) {
        console.log(error);
      }
    }
  }

  getBicycleDetailForOut(bicycle) {
    let isBicycleChoosed = this.sharedSibling.journeySummaryModel.OutwardBicycleReservation;
    if (isBicycleChoosed && this.oldBicycleCounts - Number(this.selectedBicycle) > 0) {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel, Number(this.selectedBicycle), true);
      // Remove from cart
      this.ga4datalayerService.loadGALayerForReviewBuyRemoveCart(this.sharedSibling.reviewBuyResponse, true, this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel);
    } else if (isBicycleChoosed && this.oldBicycleCounts - Number(this.selectedBicycle) < 0) {
      this.dataLayerService.loadGALayerForAddToCartUpsells(this.searchRequest, [bicycle], this.sharedSibling.journeySummaryModel, Number(this.selectedBicycle), false);
    }
    this.oldBicycleCounts = Number(this.selectedBicycle);
  }

  getBicycleExistsDataObj(bicycle) {
    let isBicycleExists = this.journeyExtras.filter(i => i.OfferId === bicycle.OfferId && i.ServiceId === bicycle.ServiceId && i.SolutionNodeRef === bicycle.SolutionNodeRef);
    if (isBicycleExists.length > 0) {
      this.journeyExtras = this.journeyExtras.filter(i => (i.OfferId != bicycle.OfferId && i.ServiceId != bicycle.ServiceId) || (i.SolutionNodeRef != bicycle.SolutionNodeRef));
      let journey = new JourneyExtras();
      journey.OfferId = bicycle.OfferId;
      journey.ServiceId = bicycle.ServiceId;
      journey.IsReturn = bicycle.IsReturn;
      journey.SelectCount = bicycle.IsReturn ? (Number(this.selectedBicycleReturn) + 1) : (Number(this.selectedBicycle) + 1);
      journey.SolutionNodeRef = bicycle.SolutionNodeRef;
      this.journeyExtras.push(journey);
    }
  }
  // created method for get passangerdetail for outward on select bicycle
  getPassangerDetailForOutJourneyExtras(bicycle, flag) {
    if (flag) {
      this.selectedBicycle = (Number(this.selectedBicycle) + 1).toString();
    } else {
      this.selectedBicycle = (Number(this.selectedBicycle) - 1).toString();
    }
    this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.forEach(outJourney => {
      if (outJourney.OfferId == bicycle.OfferId && outJourney.ServiceId == bicycle.ServiceId) {
        if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
          outJourney.Passenger = Number(this.selectedBicycle) + ' * Adult, Child';
        }
        else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
          outJourney.Passenger = Number(this.selectedBicycle) + ' * Child';
        }
        else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
          outJourney.Passenger = Number(this.selectedBicycle) + ' * Adult';
        }
      }
    });
  }
  // created method for get passangerdetail for return on select bicycle
  getPassangerDetailForRetJourneyExtras(bicycle, flag) {
    if (flag) {
      this.selectedBicycleReturn = (Number(this.selectedBicycleReturn) + 1).toString();
    } else {
      this.selectedBicycleReturn = (Number(this.selectedBicycleReturn) - 1).toString();
    }
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.forEach(retJourney => {
      if (retJourney.OfferId == bicycle.OfferId && retJourney.ServiceId == bicycle.ServiceId) {
        if (this.searchRequest.Adult != 0 && this.searchRequest.Child != 0) {
          retJourney.Passenger = Number(this.selectedBicycleReturn) + ' * Adult, Child';
        }
        else if (this.searchRequest.Adult == 0 && this.searchRequest.Child != 0) {
          retJourney.Passenger = Number(this.selectedBicycleReturn) + ' * Child';
        }
        else if (this.searchRequest.Adult != 0 && this.searchRequest.Child == 0) {
          retJourney.Passenger = Number(this.selectedBicycleReturn) + ' * Adult';
        }
      }
    });
  }

  getQueryString() {
    this.route.queryParamMap.subscribe(params => {
      this.requestId = params.get("requestId");
    });
    if (this.requestId != "" && this.requestId != null) {
      this.handOffDataReqDto.requestId = this.requestId;
      this.nreHandoffData(this.handOffDataReqDto);
    }
    else {
      this.initialBinding();
    }
  }

  setFarebreakdownNRE() {
    this.fareBreakDownData = [];
    let fareBreakdownModel = new FareBreakdownModel;
    fareBreakdownModel.OutWardJourney = [];
    fareBreakdownModel.ReturnJourney = [];
    this.nreJourneyExtrasResponse.OutwardFares.forEach(obj => {
      let outJourney = new JourneyModel;
      outJourney.Passenger = obj.FarePerson;//'1 * Adult';
      outJourney.PricePerPerson = obj.BasePrice;
      outJourney.TotalPrice = obj.Price;
      outJourney.RailCard = obj.Railcard;
      outJourney.IsCheck = obj.IsCheck;
      fareBreakdownModel.OutWardJourney.push(outJourney);
    });
    this.nreJourneyExtrasResponse.ReturnFares.forEach(obj => {
      let retJourney = new JourneyModel;
      retJourney.Passenger = obj.FarePerson;//'1 * Adult';
      retJourney.PricePerPerson = obj.BasePrice;
      retJourney.TotalPrice = obj.Price;
      retJourney.RailCard = obj.Railcard;
      retJourney.IsCheck = obj.IsCheck;
      fareBreakdownModel.ReturnJourney.push(retJourney);
    });
    this.fareBreakDownData.push(fareBreakdownModel);
    if (this.nreJourneyExtrasResponse.IsBasket) {
      this.fareBreakDownDataNreBasket.push(fareBreakdownModel);
    }
    this.sharedSibling.fareBreakdownModelData = this.fareBreakDownData;
    if (this.sharedSibling.fareBreakdownModelData != null && this.sharedSibling.fareBreakdownModelData.length > 0) {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras = new Array<JourneyModel>();
      this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras = new Array<JourneyModel>();
    }
  }


  getRailcardStationData() {

    this.commonService.getRailcardStations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.sharedSibling.railcardStationMasterData = this.responseData.Data;
            let disabledDates = [];
            for (let date of this.sharedSibling.railcardStationMasterData.DisabledDates) {
              const dt = new Date(date).getTime();
              disabledDates.push(dt);
            }
            this.sharedSibling.railcardStationMasterData.DisabledDatesinString = disabledDates;
            // PICO 566
            localStorage.setItem('railcardStationList', JSON.stringify(this.responseData.Data));
            //Set shared cache data
            this.sharedSibling.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data

          }
          else {
            this._notificationservice.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

   setJourneySummary() {
    let journeySummary = new JourneySummaryModel();
    if (this.checkForSearchRequestRailCardListNullOrNot()) {
      if (journeySummary != null) {
        journeySummary.RailCards = this.setRailCardData();
      }
    }
    if (this.checkForTravelSolutionsNullOrNot()) {
      let singleSum = 0;
      let tempFarelistSingle;
      let returnSum = 0;
      this.nreJourneyExtrasResponse.ReturnFares.forEach(m => returnSum = returnSum + m.Price);
      this.nreJourneyExtrasResponse.OutwardFares.forEach(m => singleSum = singleSum + m.Price);
      if(this.nreJourneyExtrasResponse.SearchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return || this.travelSolutionDirectionEnum.openReturn && returnSum == 0){
        tempFarelistSingle = this.nreJourneyExtrasResponse.TravelSolutions.ReturnFareList.filter(m => m.Price == this.sharedSibling.formatPrice(singleSum));
      } else{
        tempFarelistSingle = this.nreJourneyExtrasResponse.TravelSolutions.FareList.filter(m => m.Price == this.sharedSibling.formatPrice(singleSum));
      }
      journeySummary = this.setJourneySummaryIfTempFareListIsAvailable(tempFarelistSingle, journeySummary);
      journeySummary = this.setJourneySummaryIfOutwardFaresAreAvailable(tempFarelistSingle, singleSum, journeySummary);
      journeySummary.SingleSearchCache = this.nreJourneyExtrasResponse.SearchRequest.SearchCache;
    }
    if (this.checkForReturnTravelSolutionsNullOrNot()) {
      let returnSum = 0;
      let tempFarelistReturn;
      this.nreJourneyExtrasResponse.ReturnFares.forEach(m => returnSum = returnSum + m.Price);
      if(this.nreJourneyExtrasResponse.SearchRequest.TravelSolutionDirection == this.travelSolutionDirectionEnum.return && returnSum == 0){
        tempFarelistReturn = this.nreJourneyExtrasResponse.ReturnTravelSolutions.ReturnFareList.filter(m => m.Price == this.sharedSibling.formatPrice(returnSum) && journeySummary.SingleSelectedFare.TicketTypeCode == m.TicketTypeCode);
        journeySummary.IsSingleFareSelected = false;
      }else {
        tempFarelistReturn = this.nreJourneyExtrasResponse.ReturnTravelSolutions.FareList.filter(m => m.Price == this.sharedSibling.formatPrice(returnSum));
        journeySummary.IsSingleFareSelected = true;
      }
      journeySummary = this.setJourneySummaryIfTempFareReturnListAvailable(tempFarelistReturn, journeySummary);
      journeySummary = this.setJourneySummaryIfReturnFaresAvailable(tempFarelistReturn, returnSum, journeySummary);
      journeySummary.ReturnSearchCache = this.nreJourneyExtrasResponse.SearchRequest.SearchCacheReturn;
    }
    this.sharedSibling.journeySummaryModel = journeySummary;
  }

  setSharedServiceNRE(nreJourneyExtrasResponse) {
    this.sharedSibling.searchRequest = this.nreJourneyExtrasResponse.SearchRequest;
    this.setJourneySummary();
    this.searchRequest = this.nreJourneyExtrasResponse.SearchRequest;
    this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
    if (this.searchRequest.ReturnTimesStart) {
      this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
    }
    this.sharedSibling.journeyExtrasResponseShared = this.nreJourneyExtrasResponse.JourneyExtras;
    this.journeyExtrasResponse = this.nreJourneyExtrasResponse.JourneyExtras;
    this.setFarebreakdownNRE();
    if (!sessionStorage.getItem('pageReloaded')) {
      this.iframeSrc = this.commonService.trackNreHandOffUrl(nreJourneyExtrasResponse, true);
      localStorage.setItem(this.localStorageKeyEnum.nreDataResponse, JSON.stringify(nreJourneyExtrasResponse));
    }
  }
  nreHandoffData(handOffDataRequest) {
    this.journeyExtraService.nreHandoffData(handOffDataRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.nreJourneyExtrasResponse = this.responseData.Data;
              localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.nreJourneyExtrasResponse.IsReviewMergedFlowEnabled));
              this.setSharedServiceNRE(this.nreJourneyExtrasResponse);
              this.setNREHandOffData();
              this.getEvaluateData(this.sharedSibling);
            }
            else {
              this._notificationservice.error(this.responseData.ResponseMessage);
            }
          }
          else {
            this._notificationservice.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  setNREHandOffData() {
    if (this.nreJourneyExtrasResponse.IsBasket) {
      if (this.nreJourneyExtrasResponse.ReservationMessage != null) {
        this.dialog.open(InfoPopupComponent, {
          width: '500px',
          disableClose: false,
          data: {
            Message: this.nreJourneyExtrasResponse.ReservationMessage
          }
        });
      }
      this.sharedSibling.createReservationRequest = null;
      this.journeyExtras = [];
      this.facing = "0";
      this.position = "0";
      this.preferredCoach = "0";
      this.step = 0;
      this.setStep(0);
      this.isShow3 = true;
      this.isShow = true;
      this.isShow2 = true;
      this.seatingPreferences = [];
      this.tableSeat = false;
      this.quietCoach = false;
      this.nearLuggageRack = false;
      this.nearToilet = false;
      this.airlineStyle = false;
      this.powerSocket = false;
      this.outwardPlusBus0 = false;
      this.returnPlusBus0 = false;
      this.outwardPlusBus1 = false;
      this.returnPlusBus1 = false;
      this.outwardBicycleReservation = false;
      this.returnBicycleReservation = false;
      this.outwardLondonTravelcard = false;
      this.returnLondonTravelcard = false;
      this.selectedTravelCard = "0";
      this.selectedTravelCardReturn = "0";
      this.selectedBicycle = '1';
      this.selectedBicycleReturn = '1';
      
    }
    else {
      if (this.browserRefresh) {
        let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
        if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
          this.sharedSibling.createReservationRequest = sharedSiblingRefresh.createReservationRequest;
        }
      }
    }
  }

  farebreakdownJE() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],

    });
  }

  toJSON() {
    return Object.getOwnPropertyNames(this).reduce((a, b) => {
      a[b] = this[b];
      return a;
    }, {})
  }

  ticketInfo(ticketType: string, fare: FareModel) {
    if (fare == undefined)
      fare = this.sharedSibling.journeySummaryModel.SingleSelectedFare;
    let ticketTypeCode = fare.TicketTypeCode;
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim(),
        fare: fare,
        ticketTypeCode: ticketTypeCode
      }
    });
  }
  

  showRouteDetails(row, isReturnCase) {
    this.dialog.open(DisruptionServiceComponent, {
      width: '1086px',
      disableClose: false,
      id: "serviceDisruptionPopUpSingle",
      panelClass: 'your-journey-popup',
      data: {
        TravelSolutionCache: row.TravelSolutionCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration,
        IsDisruption: row.IsDelayed,
        SearchCustomCache: isReturnCase ? this.sharedSibling.journeySummaryModel.ReturnSearchCache : this.sharedSibling.journeySummaryModel.SingleSearchCache,
      }
    });

  }
  setStep1(val: number) {
    this.step1 = val;
  }
  setStep2(step2) {
    this.step2 = step2;
  }
  setStep3(step3) {
    this.step3 = step3;
  }

  removeTravelExtras(value) {
    if (value == "PLUSBUS") {
      const [first, second] = this.plusBus;
      if (first && this.outwardPlusBus0) {
        this.outwardPlusBus0 = false;
        this.onJourneyExtrasChange(false, first.Description, first.IsReturn, first.SolutionNodeRef)
      }
      if (second && this.outwardPlusBus1) {
        this.outwardPlusBus1 = false;
        this.onJourneyExtrasChange(false, second.Description, second.IsReturn, second.SolutionNodeRef)
      }

      const [firstRet, secondRet] = this.plusBusReturn;
      if (firstRet && this.returnPlusBus0) {
        this.returnPlusBus0 = false;
        this.onJourneyExtrasChange(false, firstRet.Description, firstRet.IsReturn, firstRet.SolutionNodeRef)
      }
      if (secondRet && this.returnPlusBus1) {
        this.returnPlusBus1 = false;
        this.onJourneyExtrasChange(false, secondRet.Description, secondRet.IsReturn, secondRet.SolutionNodeRef)
      }
    }
    this.removeBikeTravelExtra(value);
    this.removeLTCTravelExtra(value);
    this.totalPrice = this.sharedSibling.calculateTotalAmount();
  }

  removeBikeTravelExtra(value) {
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
        this.onJourneyExtrasChange(false, outBicycle.Description, outBicycle.IsReturn, outBicycle.SolutionNodeRef)
      }
      if (retBicycle && this.returnBicycleReservation) {
        this.returnBicycleReservation = false;
        this.onJourneyExtrasChange(false, retBicycle.Description, retBicycle.IsReturn, retBicycle.SolutionNodeRef)
      }
    }
  }

  removeLTCTravelExtra(value) {
    if (value == "LONDONTRAVELCARD") {
      if (this.outSelected > -1) {
        this.onTravelcardChange(this.londonTravelcard[this.outSelected], false, this.outSelected);
        this.outSelected = -1;
      }
      if (this.retSelected > -1) {
        this.onTravelcardChange(this.londonTravelcard[this.retSelected], false, this.retSelected);
        this.retSelected = -1;
      }
    }
  }

  clickDirectionRadio(event, value) {
    event.preventDefault();

    if (!this.directionRadioVal || this.directionRadioVal !== value) {
      this.directionRadioVal = value;
      this.facing = this.directionRadioVal;
      return;
    }

    if (this.directionRadioVal === value) {
      this.directionRadioVal = undefined;
      this.facing = '0';
    }
  }

  public isDirectionRadioSelected(value: any) {
    return (this.directionRadioVal === value);
  }

  clickPositionRadio(event, value) {
    event.preventDefault();

    if (!this.positionRadioVal || this.positionRadioVal !== value) {
      this.positionRadioVal = value;
      this.position = this.positionRadioVal;
      return;
    }

    if (this.positionRadioVal === value) {
      this.positionRadioVal = undefined;
      this.position = '0';
    }
  }

  public isPositionRadioSelected(value: any) {
    return (this.positionRadioVal === value);
  }

  filterTravelExtra(travelList) {
    this.journeyExtras = this.journeyExtras.filter(function (journeyExtra) {
      return !travelList.some(function (o2) {
        return (journeyExtra.OfferId === o2.OfferId && journeyExtra.ServiceId === o2.ServiceId && journeyExtra.IsReturn === o2.IsReturn);
      });
    });
  }

  setFareBreakDownJourneyExtraIfPlusBusReturnNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let plusB = this.plusBusReturn.filter(x => x.SolutionNodeRef == createReservationRequestObject.SolutionNodeRef && x.IsReturn);
      this.plusbusPrice = this.plusbusPrice + plusB[0].Price;
      if (this.plusBusReturn.length > 1) {
        let i = this.plusBusReturn.findIndex(x => x.SolutionNodeRef == createReservationRequestObject.SolutionNodeRef);
        if (i == 0)
          this.returnPlusBus0 = true;
        else
          this.returnPlusBus1 = true;
      }
      else {
        this.returnPlusBus0 = true;
      }
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = plusB[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = plusB[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = plusB[0].Description;
      fareBreakDownJourneyExtras.OfferId = plusB[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = plusB[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = plusB[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  setFareBreakDownJourneyExtraIfPlusBusNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let plusB = this.plusBus.filter(x => x.SolutionNodeRef == createReservationRequestObject.SolutionNodeRef && !x.IsReturn);
      this.plusbusPrice = this.plusbusPrice + plusB[0].Price;
      if (this.plusBus.length > 1) {
        let i = this.plusBus.findIndex(x => x.SolutionNodeRef == createReservationRequestObject.SolutionNodeRef);
        if (i == 0)
          this.outwardPlusBus0 = true;
        else
          this.outwardPlusBus1 = true;
      }
      else {
        this.outwardPlusBus0 = true;
      }
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = plusB[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = plusB[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = plusB[0].Description;
      fareBreakDownJourneyExtras.OfferId = plusB[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = plusB[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = plusB[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  setFareBreakDownJourneyExtraIfBicycleReservationReturnNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let bicycleRes = this.bicycleReservation.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && x.IsReturn);
      this.returnBicycleReservation = true;
      this.selectedBicycleReturn = createReservationRequestObject.SelectCount.toString();
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Adult, Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = bicycleRes[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = bicycleRes[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = bicycleRes[0].Description;
      fareBreakDownJourneyExtras.OfferId = bicycleRes[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = bicycleRes[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = bicycleRes[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  setFareBreakDownJourneyExtraIfBicycleReservationNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let bicycleRes = this.bicycleReservation.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && !x.IsReturn);
      this.outwardBicycleReservation = true;
      this.selectedBicycle = createReservationRequestObject.SelectCount.toString();
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Adult, Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero) {
        fareBreakDownJourneyExtras.Passenger = createReservationRequestObject.SelectCount.toString() + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = bicycleRes[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = bicycleRes[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = bicycleRes[0].Description;
      fareBreakDownJourneyExtras.OfferId = bicycleRes[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = bicycleRes[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = bicycleRes[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  setFareBreakDownJourneyExtraIfLondonTravelCardReturnNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let londonTra = this.londonTravelcardReturn.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && x.IsReturn);
      this.returnLondonTravelcard = true;
      this.retSelected = this.storageDataService.getStorageData("retSelected", true);
      this.londonTravelCardPrice = this.londonTravelCardPrice + londonTra[0].Price;

      this.selectedTravelCardReturn = londonTra[0];
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = londonTra[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = londonTra[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = londonTra[0].Description;
      fareBreakDownJourneyExtras.OfferId = londonTra[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = londonTra[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = londonTra[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  setFareBreakDownJourneyExtraIfLondonTravelcardNotNull (createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    let londonTra = this.londonTravelcard.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && !x.IsReturn);
      this.outwardLondonTravelcard = true;
      this.outSelected = this.storageDataService.getStorageData("outSelected", true);
      this.londonTravelCardPrice = this.londonTravelCardPrice + londonTra[0].Price;

      this.selectedTravelCard = londonTra[0];
      if (this.checkForAdultAndChildCountInSearchRequestNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult' + ', ' + this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsZeroAndChildCountIsNotEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Child + ' * Child';
      }
      else if (this.checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero()) {
        fareBreakDownJourneyExtras.Passenger = this.searchRequest.Adult + ' * Adult';
      }
      fareBreakDownJourneyExtras.PricePerPerson = londonTra[0].Price;
      fareBreakDownJourneyExtras.TotalPrice = londonTra[0].Price;
      fareBreakDownJourneyExtras.RailCard = '';
      fareBreakDownJourneyExtras.JourneyExtrasTitle = londonTra[0].Description;
      fareBreakDownJourneyExtras.OfferId = londonTra[0].OfferId;
      fareBreakDownJourneyExtras.ServiceId = londonTra[0].ServiceId;
      fareBreakDownJourneyExtras.SolutionNodeRef = londonTra[0].SolutionNodeRef;
    return fareBreakDownJourneyExtras;
  }

  isJourneyExtraResponseDetailNullOrNot () {
    return this.journeyExtrasResponse.Detail != null && this.journeyExtrasResponse.Detail.length > 0;
  }

  isSharedSiblingParaNullOrNot (sharedSiblingPara) {
    return sharedSiblingPara != null && sharedSiblingPara != undefined
  }

  isJourneySummaryModelNullOrNot (journeySummaryModel) {
    return journeySummaryModel != null && journeySummaryModel != undefined;
  }

  isCreateReservationRequestNullOrNot (createReservationRequest) {
    return createReservationRequest != null && createReservationRequest != undefined
  }

  isCreateReservationHavingPreferencesOrNot (createReservationRequest) {
    return createReservationRequest.Preferences != null && createReservationRequest.Preferences.length > 0
  }

  isCreateReservationHavingJourneyExtrasOrNot (createReservationRequest) {
    return createReservationRequest.JourneyExtras != null && createReservationRequest.JourneyExtras.length > 0
  }

  setJourneyExtraDetailWhenCustomerLoginResponseIsNotNull (customerLoginResponse) {
    this.journeyExtraService.initializeFormGroup();
      this.seasonUserDetails.Title = customerLoginResponse.CustomerDetail.Title;
      this.seasonUserDetails.FirstName = customerLoginResponse.CustomerDetail.FirstName;
      this.seasonUserDetails.LastName = customerLoginResponse.CustomerDetail.LastName;
      let defaultAddress = customerLoginResponse.CustomerDetail.Addresses.filter(x => x.IsDefault);
      if (defaultAddress != null && defaultAddress.length > 0)
        this.seasonUserDetails.PostCode = defaultAddress[0].Address.PostCode;
      this.seasonUserDetails.PhotoCardId = customerLoginResponse.CustomerDetail.PhotoCardId;
      this.populateForm(this.seasonUserDetails);
  }

  setDataWhenCreateReservationRequestHavingPreferences (createReservationRequest) {
    let fac = createReservationRequest.Preferences.filter(x => (x == "BACK" || x == "FACE"));
    if (fac != null) {
      this.facing = fac[0];
    }
    let pos = createReservationRequest.Preferences.filter(x => (x == "AISL" || x == "WIND"));
    if (pos != null) {
      this.position = pos[0];
    }
    let pre = createReservationRequest.Preferences.filter(x => x == "QUIE");
    if (pre != null) {
      this.preferredCoach = pre[0];
    }
    this.tableSeat = createReservationRequest.Preferences.filter(x => x == "TABL").length > 0 ? true : false;
    this.quietCoach = createReservationRequest.Preferences.filter(x => x == "QUIE").length > 0 ? true : false;
    this.nearLuggageRack = createReservationRequest.Preferences.filter(x => x == "LUGG").length > 0 ? true : false;
    this.nearToilet = createReservationRequest.Preferences.filter(x => x == "NRWC").length > 0 ? true : false;
    this.airlineStyle = createReservationRequest.Preferences.filter(x => x == "AIRL").length > 0 ? true : false;
    this.powerSocket = createReservationRequest.Preferences.filter(x => x == "POWE").length > 0 ? true : false;
    this.seatingPreferences = createReservationRequest.Preferences.filter(x => (x == "POWE" || x == "AIRL" || x == "NRWC" || x == "LUGG" || x == "TABL"));
  }

  setDataWhenJourneyExtraResponseDetailIsNotNull () {
    this.plusBus = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.plusBus && !i.IsReturn);
    this.plusBusReturn = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.plusBus && i.IsReturn);
    this.bicycleReservation = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.bicycleReservation);
    this.londonTravelcard = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.londonTravelcard && !i.IsReturn);
    this.londonTravelcardReturn = this.journeyExtrasResponse.Detail.filter(i => i.Description === this.appConstantsService.londonTravelcard && i.IsReturn);
  }

  checkForNonReservedRequest (createReservationRequest) {
    if (!createReservationRequest.IsReserved) {
      this.isShow2 = true;
      this.isShow = true;
      if (this.isCreateReservationHavingPreferencesOrNot(createReservationRequest)) {
        this.setDataWhenCreateReservationRequestHavingPreferences(createReservationRequest);
      }
      else {
        this.facing = "0";
        this.position = "0";
        this.preferredCoach = "0";
      }
    }
  }

  setJourneySummaryIfTempFareReturnListAvailable (tempFarelistReturn, journeySummaryModel: JourneySummaryModel) {
    let journeySummary = journeySummaryModel;
    if (tempFarelistReturn.length > 0) {
      journeySummary.ReturnTime = this.nreJourneyExtrasResponse.ReturnTravelSolutions.DarwinDepartureTime + ' → ' + this.nreJourneyExtrasResponse.ReturnTravelSolutions.DarwinArrivalTime;
      journeySummary.ReturnDuration = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Duration;
      journeySummary.ReturnChanges = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Changes;
      journeySummary.ReturnTicketType = tempFarelistReturn[0].TicketType;
      journeySummary.ReturnCurrency = tempFarelistReturn[0].Currency;
      journeySummary.ReturnPrice = tempFarelistReturn[0].Price;
      journeySummary.ReturnTicketDescription = tempFarelistReturn[0].TicketDescription;
      journeySummary.ReturnOperator = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Operator;
      journeySummary.ReturnOperatorChange = this.nreJourneyExtrasResponse.ReturnTravelSolutions.OperatorChange;
      journeySummary.ReturnSaleCompany = this.nreJourneyExtrasResponse.ReturnTravelSolutions.SaleCompany;
      journeySummary.ReturnSelectedFare = tempFarelistReturn[0];
      journeySummary.ReturnRouteModel = this.nreJourneyExtrasResponse.ReturnTravelSolutions;
    }
    return journeySummary;
  }

  setJourneySummaryIfReturnFaresAvailable (tempFarelistReturn, returnSum, journeySummaryModel: JourneySummaryModel) {
    let journeySummary = journeySummaryModel;
    if (tempFarelistReturn.length == 0 && this.nreJourneyExtrasResponse.ReturnFares.length != 0) {
      journeySummary.ReturnTime = this.nreJourneyExtrasResponse.ReturnTravelSolutions.DarwinDepartureTime + ' → ' + this.nreJourneyExtrasResponse.ReturnTravelSolutions.DarwinArrivalTime;
      journeySummary.ReturnDuration = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Duration;
      journeySummary.ReturnChanges = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Changes;
      journeySummary.ReturnTicketType = this.nreJourneyExtrasResponse.ReturnFares[0].TicketType;
      journeySummary.ReturnCurrency = this.nreJourneyExtrasResponse.ReturnFares[0].Currency;
      journeySummary.ReturnPrice = returnSum;
      journeySummary.ReturnTicketDescription = this.nreJourneyExtrasResponse.ReturnFares[0].TicketDescription;
      journeySummary.ReturnOperator = this.nreJourneyExtrasResponse.ReturnTravelSolutions.Operator;
      journeySummary.ReturnOperatorChange = this.nreJourneyExtrasResponse.ReturnTravelSolutions.OperatorChange;
      journeySummary.ReturnSaleCompany = this.nreJourneyExtrasResponse.ReturnTravelSolutions.SaleCompany;
      journeySummary.ReturnSelectedFare = tempFarelistReturn[0];
      journeySummary.ReturnRouteModel = this.nreJourneyExtrasResponse.ReturnTravelSolutions;
    }
    return journeySummary;
  }

  setJourneySummaryIfTempFareListIsAvailable (tempFarelistSingle, journeySummaryModel: JourneySummaryModel) {
    let journeySummary = journeySummaryModel
    if (tempFarelistSingle.length > 0) {
      journeySummary.SingleTime = this.nreJourneyExtrasResponse.TravelSolutions.DarwinDepartureTime + ' → ' + this.nreJourneyExtrasResponse.TravelSolutions.DarwinArrivalTime;
      journeySummary.SingleDuration = this.nreJourneyExtrasResponse.TravelSolutions.Duration;
      journeySummary.SingleChanges = this.nreJourneyExtrasResponse.TravelSolutions.Changes;
      journeySummary.SingleTicketType = tempFarelistSingle[0].TicketType;
      journeySummary.SingleCurrency = tempFarelistSingle[0].Currency;
      journeySummary.SinglePrice = tempFarelistSingle[0].Price;
      journeySummary.SingleTicketDescription = tempFarelistSingle[0].TicketDescription;
      journeySummary.SingleOperator = this.nreJourneyExtrasResponse.TravelSolutions.Operator;
      journeySummary.SingleOperatorChange = this.nreJourneyExtrasResponse.TravelSolutions.OperatorChange;
      journeySummary.SingleSaleCompany = this.nreJourneyExtrasResponse.TravelSolutions.SaleCompany;
      journeySummary.SingleSelectedFare = tempFarelistSingle[0];
      journeySummary.SingleRouteModel = this.nreJourneyExtrasResponse.TravelSolutions;
    }
    return journeySummary;
  }

  setJourneySummaryIfOutwardFaresAreAvailable (tempFarelistSingle, singleSum, journeySummaryModel: JourneySummaryModel) {
    let journeySummary = journeySummaryModel;
    if (tempFarelistSingle.length == 0 && this.nreJourneyExtrasResponse.OutwardFares.length != 0) {
      journeySummary.SingleTime = this.nreJourneyExtrasResponse.TravelSolutions.DarwinDepartureTime + ' → ' + this.nreJourneyExtrasResponse.TravelSolutions.DarwinArrivalTime;
      journeySummary.SingleDuration = this.nreJourneyExtrasResponse.TravelSolutions.Duration;
      journeySummary.SingleChanges = this.nreJourneyExtrasResponse.TravelSolutions.Changes;
      journeySummary.SingleTicketType = this.nreJourneyExtrasResponse.OutwardFares[0].TicketType;
      journeySummary.SingleCurrency = this.nreJourneyExtrasResponse.OutwardFares[0].Currency;
      journeySummary.SinglePrice = singleSum;
      journeySummary.SingleTicketDescription = this.nreJourneyExtrasResponse.OutwardFares[0].TicketDescription;
      journeySummary.SingleOperator = this.nreJourneyExtrasResponse.TravelSolutions.Operator;
      journeySummary.SingleOperatorChange = this.nreJourneyExtrasResponse.TravelSolutions.OperatorChange;
      journeySummary.SingleSaleCompany = this.nreJourneyExtrasResponse.TravelSolutions.SaleCompany;
      journeySummary.SingleSelectedFare = tempFarelistSingle[0];
      journeySummary.SingleRouteModel = this.nreJourneyExtrasResponse.TravelSolutions;
    }
    return journeySummary;
  }

  checkForSearchRequestRailCardListNullOrNot () {
    return this.sharedSibling.searchRequest.RailCardList != null && this.sharedSibling.searchRequest.RailCardList.length > 0;
  }

  checkForTravelSolutionsNullOrNot () {
    return this.nreJourneyExtrasResponse.TravelSolutions != null && this.nreJourneyExtrasResponse.TravelSolutions != undefined;
  }

  checkForReturnTravelSolutionsNullOrNot () {
    return this.nreJourneyExtrasResponse.ReturnTravelSolutions != null && this.nreJourneyExtrasResponse.ReturnTravelSolutions != undefined;
  }

  setRailCardData () {
    let railCard = '';
      if (this.sharedSibling.searchRequest.RailCardList.length == 1) {
        if (localStorage.getItem('railcardStationList') === null || localStorage.getItem('railcardStationList') === "null" || localStorage.getItem('railcardStationList') === "" || localStorage.getItem('railcardStationList') === undefined) {
           this.getRailcardStationData();
        }

        this.sharedSibling.railcardStationMasterData = JSON.parse(localStorage.getItem('railcardStationList'));
        if (this.sharedSibling?.railcardStationMasterData) {
          this.commonService.railCardsList = this.sharedSibling.railcardStationMasterData.Railcard;
        }
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        railCard = this.commonService.railCardsList.filter(x => x.Code == this.sharedSibling.searchRequest.RailCardList[0].RailCard)[0].Name.toString();
      }
      else {
        railCard = "Multiple Railcards"
      }
      return railCard;
  }

  checkForAdultAndChildCountInSearchRequestNotEqualToZero() {
    return this.searchRequest.Adult != 0 && this.searchRequest.Child != 0;
  }

  checkForAdultCountIsZeroAndChildCountIsNotEqualToZero() {
    return this.searchRequest.Adult == 0 && this.searchRequest.Child != 0;
  }

  checkForAdultCountIsNotEqualToZeroAndChildCountEqualToZero() {
    return this.searchRequest.Adult != 0 && this.searchRequest.Child == 0;
  }

  checkForPlusBus(createReservationRequestObject) {
    return this.plusBus != null && this.plusBus.length > 0 && this.plusBus.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && !x.IsReturn).length > 0;
  }

  checkForBicycleReservation(createReservationRequestObject) {
    return  this.bicycleReservation != null && this.bicycleReservation.length > 0 && this.bicycleReservation.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && !x.IsReturn).length > 0;
  }

  checkForLondonTravelCard(createReservationRequestObject) {
    return this.londonTravelcard != null && this.londonTravelcard.length > 0 && this.londonTravelcard.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && !x.IsReturn).length > 0;
  }

  checkForPlusBusReturn(createReservationRequestObject) {
    return this.plusBusReturn != null && this.plusBusReturn.length > 0 && this.plusBusReturn.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && x.IsReturn).length > 0;
  }

  checkForBicycleReservationInReturnJourney(createReservationRequestObject) {
    return this.bicycleReservation != null && this.bicycleReservation.length > 0 && this.bicycleReservation.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && x.IsReturn).length > 0;
  }

  checkForLondonTravelCardInReturnJourney(createReservationRequestObject) {
    return this.londonTravelcard != null && this.londonTravelcard.length > 0 && this.londonTravelcard.filter(x => x.OfferId == createReservationRequestObject.OfferId && x.ServiceId == createReservationRequestObject.ServiceId && x.IsReturn).length > 0;
  }

  setDataInFareBreakDownJourneyExtraForOutWardJourney(createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    if (this.checkForPlusBus(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfPlusBusNotNull(createReservationRequestObject);
    }
    if (this.checkForBicycleReservation(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfBicycleReservationNotNull(createReservationRequestObject);
    }
    if (this.checkForLondonTravelCard(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfLondonTravelcardNotNull(createReservationRequestObject);
    }
    if (fareBreakDownJourneyExtras.hasOwnProperty('TotalPrice')) {
      this.sharedSibling.fareBreakdownModelData[0].OutwardJourneyExtras.push(fareBreakDownJourneyExtras);
    }
  }

  setDataInFareBreakDownJourneyExtraForReturnJourney(createReservationRequestObject) {
    let fareBreakDownJourneyExtras = new JourneyModel;
    if (this.checkForPlusBusReturn(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfPlusBusReturnNotNull(createReservationRequestObject);
    }
    if (this.checkForBicycleReservationInReturnJourney(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfBicycleReservationReturnNotNull(createReservationRequestObject);
    }
    if (this.checkForLondonTravelCardInReturnJourney(createReservationRequestObject)) {
      fareBreakDownJourneyExtras = this.setFareBreakDownJourneyExtraIfLondonTravelCardReturnNotNull(createReservationRequestObject);
    }
    this.sharedSibling.fareBreakdownModelData[0].ReturnJourneyExtras.push(fareBreakDownJourneyExtras);
  }

  checkForReturnAndOutwardJourneyInCreateReservationRequest(createReservationRequestObject) {
    if (!createReservationRequestObject.IsReturn) {
      this.setDataInFareBreakDownJourneyExtraForOutWardJourney(createReservationRequestObject);
    }
    else {
      this.setDataInFareBreakDownJourneyExtraForReturnJourney(createReservationRequestObject);
    }
  }

  populateForm(user: Traveller) {
    if (this.commonService.titleListArrayWithOutOther.indexOf(user.Title) < 0 && user.Title != "") {
      this.journeyExtraService.seasonUserForm.setValue({
        Title: 'Other',
        FirstName: user.FirstName,
        LastName: user.LastName,
        PostCode: user.PostCode,
        PhotoCardId: user.PhotoCardId,
        OtherTitle: user.Title
      });
    } else {
      this.journeyExtraService.seasonUserForm.setValue({
        Title: user.Title,
        FirstName: user.FirstName,
        LastName: user.LastName,
        PostCode: user.PostCode,
        PhotoCardId: user.PhotoCardId,
        OtherTitle: ''
      });
    }
  }

  setOutwardOrReturnBicycleReservation(bicycleReservation){
    return !bicycleReservation.IsReturn ? this.outwardBicycleReservation : this.returnBicycleReservation
  }
}
