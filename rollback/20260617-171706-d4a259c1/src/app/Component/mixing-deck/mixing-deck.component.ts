import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import {  FormGroup } from '@angular/forms';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { QuickBuyServiceResponse, UpdateSearchResponseModel } from 'src/app/models/mixing-deck/search-response.model';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AmendSearchComponent } from './amend-search/amend-search.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FareBreakdownComponent } from './fare-breakdown/fare-breakdown.component';
import { ParkingPopupComponent } from './parking-popup/parking-popup.component';
import { EvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { Router, ActivatedRoute } from '@angular/router';
import { MixingDeckModel } from 'src/app/models/mixing-deck/mixing-deck.model';
import { MixingDeckListComponent } from './mixing-deck-list/mixing-deck-list.component';
import * as moment from 'moment';
import { MixingDeckReturnListComponent } from './mixing-deck-return-list/mixing-deck-return-list.component';
import { AppConstantsService, ErrorMessageEnum, AppRouteEnum, QuickBuyEnum, LocalStorageKeyEnum, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { CommonServices } from 'src/app/services/common.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { ConfigurationSettings } from 'src/app/models/common/configuration-settings.model';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh } from '../../app-component/app.component'
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CreateReservationRequest } from 'src/app/models/journey-extras/reservation.model';
import { TicketNotFoundComponent } from './ticket-not-found/ticket-not-found.component';
import { HttpParams } from '@angular/common/http';
import { FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { HandOffDataReqDto, NreJourneyExtrasResponse } from 'src/app/models/journey-extras/nre-response.model';
import { TicketInfoComponent } from './ticket-info/ticket-info.component';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { JourneySummaryModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { DisruptionServiceComponent } from './disruption-service/disruption-service.component';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { environment } from 'src/environments/environment';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { LoginPageComponent } from '../login-page/login-page.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { InfoPopupComponent } from './info-popup/info-popup.component';
import { RailcardStationMasterData } from 'src/app/models/master/railcard-station.model';
@Component({
    selector: 'app-mixing-deck',
    templateUrl: './mixing-deck.component.html',
    styleUrls: ['./mixing-deck.component.css'],
    standalone: false
})

export class MixingDeckComponent implements OnInit {
  step = 0;
  step1 = 0;
  step2 = 0;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  passengerDetailLabel: string;
  responseData: ResponseData;
  stationResponseData: ResponseData;
  searchResponse: UpdateSearchResponseModel;
  mixingDeckModelList: MixingDeckModel[];
  evaluateTravelRequest: EvaluateTravelRequest;
  createReservationRequest: CreateReservationRequest;
  journeyType: string;
  loadDataFromCache: boolean;
  configurationSettings: ConfigurationSettings
  locations: LocationMasterData[];
  sticky: boolean;
  isDisabledContinue : boolean = false;

  displayPromotionalBanner : boolean = false;
  promontionalBannerData : any ;

  @ViewChild("MixingDeckReturnList", { static: false }) mixingDeckReturnList: MixingDeckReturnListComponent;
  @ViewChild("MixingDeckList", { static: false }) mixingDeckList: MixingDeckListComponent;
  @ViewChild('tooltip2', { static: false }) tooltip2: any;

  searchRequest: SearchRequestModel;
  hide: boolean;
  show: boolean = true;
  status: boolean;
  browserRefresh: boolean;
  reviewBuyDetail: any;
  requestId: string;
  handOffDataReqDto: HandOffDataReqDto;
  showclasstoggle: boolean = false;
  showEdit: boolean = false;
  isOperatorFilterChoosed = false;
  isChangeFilterChoosed = false;
  isSubmitViaFilters = false;

  errorMessageEnum: ErrorMessageEnum;
  sharedSibling: SharedService;
  appConstantsService: AppConstantsService;
  searchSolutionService: SearchSolutionService;
  modalService: NgbModal;
  notificationservice: NotificationService;
  router: Router;
  route: ActivatedRoute;
  commonServices: CommonServices;
  journeyExtraService: JourneyExtraService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  dataLayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;
  spinnerService: NgxSpinnerService;
  quickBuyServiceResponse: QuickBuyServiceResponse;
  quickBuyEnum: QuickBuyEnum;
  localStorageKeyEnum: LocalStorageKeyEnum;
  isQuickBuy: boolean = false;
  isShowHeader: boolean = false;
  createUrl:any;
  iframeSrc: any;
  selectedJourneyDataForQuickBuyOrContiue: any[] = [];
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;
  railcardStationData: RailcardStationMasterData;
  constructor(private readonly injector: Injector, public dialog: MatDialog) {
    // Dependency Injection without using constructor's param
    this.errorMessageEnum = this.injector.get(ErrorMessageEnum);
    this.sharedSibling = this.injector.get(SharedService);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.modalService = this.injector.get(NgbModal);
    this.notificationservice = this.injector.get(NotificationService);
    this.router = this.injector.get(Router);
    this.route = this.injector.get(ActivatedRoute);
    this.commonServices = this.injector.get(CommonServices);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.sharedSibling.isReturnLoaderCase = false;
    this.searchRequest = new SearchRequestModel();
    this.searchRequest.RailCardList = new Array<RailCardModel>();
    this.configurationSettings = new ConfigurationSettings();
    this.sharedSibling.isSearchApiError = false;
    this.sharedSibling.isEarlierLaterSearchApiError = false;
    this.handOffDataReqDto = new HandOffDataReqDto();
    this.commonServices.loadGTMDataLayerAllPages();
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
  }
  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.JourneyExtras)) {
      this.openJourneyExtra();
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.DeliveryMode)) {
      this.router.navigateByUrl('/' + this.appRouteEnum.ReviewBuy);
    }
    this.storageDataService.clearSessionStorageData("pageReloaded");
  }

  showclickEvent() {
    this.showclasstoggle = !this.showclasstoggle;
  }

  setPromotionalDataAction(){
    let newData = {
      display : this.displayPromotionalBanner,
      promotionalData :  this.promontionalBannerData,
      action : 'change'
    }
    this.searchSolutionService.setPromotionalDataAction(newData);
  }

  ngOnInit() {
    this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
    this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false); 
    this.storageDataService.setStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), "false", false);
    this.browserRefresh = browserRefresh;
    // get Promotional Banner Data through rxjs
    this.getPromotionalBannerData();

    // for showing basket icon when go back from review-buy to search-results
    if (this.sharedSibling?.reviewBuyResponse) {
      this.sharedSibling.getBasketCount.emit(this.sharedSibling.reviewBuyResponse.BasketCount);
    }
    
    this.sharedSibling.getIsDisabledContinue().subscribe(res =>{
      this.isDisabledContinue = res;
    })
    // PICO-2010 - Page_meta_data Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.route.queryParamMap.subscribe(params => {
      this.requestId = params.get("requestId");
    });
    if (this.requestId != "" && this.requestId != null) {
      this.handOffDataReqDto.requestId = this.requestId;
      this.nreHandoffData(this.handOffDataReqDto);
    }
    else {
      let isRedirectFromHomePage = JSON.parse(localStorage.getItem("isRedirectFromHomePage"));
      if (!environment.production) {
        isRedirectFromHomePage = true;
      }
      if (isRedirectFromHomePage) {
        this.getQueryString();
      }

      //Get shared cache data
      if (this.browserRefresh) {
        this.getSharedCacheData(isRedirectFromHomePage);
      }
      isRedirectFromHomePage = false;
      localStorage.setItem("isRedirectFromHomePage", isRedirectFromHomePage);
      //Get shared cache data
      this.sharedSibling.isAmendFresh = true;
    
      if (this.sharedSibling.isAmendSearchOpen) {
        this.searchRequest = this.sharedSibling.searchRequest;
        this.openEdit();
      }
      else if (this.sharedSibling?.searchRequest?.DepartureLocation != null) {
        this.getJourneyTypeOnLoad();
        
        this.passengerDetailLabel = this.getPassengerDetailLabel();
      }
      this.sharedSibling.journeySummaryModel = null;
      this.commonServices.callApiForGetLocationMasterData();
      this.getRailcardStationData();
    }
    this.removingCojData();
    this.removeUpgradeData();
    this.isShowHeader = this.commonServices.isCheckForQuickBuyOrContinue();
    //Get shared cache data
    this.selectedJourneyDataForQuickBuyOrContiue = this.sharedSibling?.selectedJourneyDataForQuickBuyOrContiue || [];
  }

  getPromotionalBannerData() {
    // get Promotional Banner Data through rxjs
    this.searchSolutionService.getPromotionalBannerData().subscribe(promotionalData => {
      if (promotionalData) {
        this.promontionalBannerData = promotionalData.promotionalData;
        this.displayPromotionalBanner = promotionalData.display;
      }
    });
  }
  
  getJourneyTypeOnLoad() {
    this.searchRequest = this.sharedSibling.searchRequest;
    if (this.searchRequest.TravelSolutionDirection == 'ONE_WAY') {
      this.journeyType = 'Single';
    }
    else if (['RETURN', 'FORWARD'].indexOf(this.searchRequest.TravelSolutionDirection) > -1) {
      this.journeyType = 'Return';
      this.searchRequest.TravelSolutionDirection = 'RETURN'; //Added this because in case of return, value was 'FORWARD', which fails return scenario checks for 'RETURN' resultinfg in no call to getTravelSol (FGPICOET-138)
    }
    else {
      this.journeyType = 'Open-Return';
    }
  }

  //Getting shared cache data on browser refresh
  getSharedCacheData(isRedirectFromHomePage) {
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    if (this.nullOrUndefinedCheckForSharedSiblingRefresh(sharedSiblingRefresh)) {
      this.commonServices.loaderRequired = true;
      this.sharedSibling.reviewBuyCache = sharedSiblingRefresh.reviewBuyCache;
      this.sharedSibling.ReservationCache = sharedSiblingRefresh.ReservationCache;
      if (isRedirectFromHomePage) {
        this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
        this.sharedSibling.searchRequest = this.searchRequest;
        this.sharedSibling.isAmendSearchOpen = false;
      }
      else {
        this.sharedSibling.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedSibling.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedSibling.isAmendSearchOpen = (sharedSiblingRefresh.isAmendSearchOpen != undefined) ? sharedSiblingRefresh.isAmendSearchOpen : false;
        this.sharedSibling.editQttDepartureTimeStart = sharedSiblingRefresh.editQttDepartureTimeStart;
        if (sharedSiblingRefresh.searchRequest.ReturnTimesStart)
          this.sharedSibling.editQttReturnTimeStart = sharedSiblingRefresh.editQttReturnTimeStart;
      }
      this.sharedSibling.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
      this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      if (this.nullorUndefinedCheckForReviewBuyResponseOfSharedSibling()) {
        this.sharedSibling.getBasketCount.emit(this.sharedSibling.reviewBuyResponse.BasketCount);
      }
      if (this.sharedSibling?.reviewBuyResponse?.IsRenewSmartcard) {
        this.sharedSibling.reviewBuyResponse = null;
      }
      this.sharedSibling.locationMasterData = sharedSiblingRefresh.locationMasterData;
      this.sharedSibling.LatestJourneyCache = sharedSiblingRefresh.LatestJourneyCache;
      this.sharedSibling.selectedJourneyDataForQuickBuyOrContiue = sharedSiblingRefresh?.selectedJourneyDataForQuickBuyOrContiue || [];
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }

  ngOnInitCache() {
    if (this.configurationSettings.isAmendSearchOpen) {
      this.searchRequest = this.configurationSettings.searchRequest;
      this.openEdit();
    }
    else {
      this.getQueryString();
    }
    this.commonServices.callApiForGetLocationMasterData();
    this.getRailcardStationData()
  }
  openAmend(): void {
    const dialogRef = this.modalService.open(AmendSearchComponent, {
      windowClass: 'amend-search-popup'
    });
    dialogRef.componentInstance.amendSearchRequest = this.searchRequest;
    dialogRef.result.then((result) => {
      if (result) {
        this.searchRequest = result;
        this.sharedSibling.searchRequest = this.searchRequest;
        this.setUpRailcards();
        
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        this.sharedSibling.isSearchApiError = false;
        this.sharedSibling.isEarlierLaterSearchApiError = false;
        this.passengerDetailLabel = this.getPassengerDetailLabel();
        if (result.TravelSolutionDirection == "ONE_WAY") {
          this.journeyType = "Single";
        }
        else if (result.TravelSolutionDirection == "RETURN") {
          this.journeyType = "Return";
        }
        else {
          this.journeyType = "Open-Return";
        }
      }
    });

  }

  setUpRailcards() {
    if (this.searchRequest.RailCardList && this.searchRequest.RailCardList.length > 0) {
      let railCard = '';
      if (this.searchRequest.RailCardList.length == 1)
        railCard = this.commonServices?.railCardsList.filter(x => x.Code == this.searchRequest.RailCardList[0].RailCard)[0].Name.toString();
      else
        railCard = "Multiple Railcards"
      if (this.sharedSibling.journeySummaryModel) {
        this.sharedSibling.journeySummaryModel.RailCards = railCard;
      }
      else {
        this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
        this.sharedSibling.journeySummaryModel.RailCards = railCard;
      }
    }
  }

  getPassengerDetailLabel(){
    const isAdultOrAdults : string = this.searchRequest.Adult.toString() + (this.searchRequest.Adult > 1) ? " adults " : " adult ";
    const isChildOrChildren = this.searchRequest.Child.toString() + (this.searchRequest.Child > 1) ? " children ": " child "; 
    const isChildAvailable = (this.searchRequest.Child > 0) ? ", " + isChildOrChildren : "";      
    return isAdultOrAdults + isChildAvailable;
  }

  handleFilterFailure() {
    this.showclasstoggle = false;
    this.sharedSibling.isFilterClicked = false;
    if (this.searchRequest.OperaterFilter == 1) {
      this.searchRequest.OperaterFilter = 0;
    }
    if (this.searchRequest.ChangesFilter == 0) {
      this.searchRequest.ChangesFilter = 1;
    }
    this.openEdit();
    window.scroll(0,0);
  }


  onClickFilter(isTrainOperator) {
    this.sharedSibling.isTrainOperator = isTrainOperator;
    this.sharedSibling.isFilterClicked = true;
    //Set shared cache data
    this.sharedSibling.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    this.openEdit();
  }

  openEdit() {
    this.sharedSibling.amendSearchRequest = this.searchRequest;
    this.showEdit = true;
    this.isDisabledContinue = true;
  }
  // added to hide editqtt in case we get travel soln while doing earlier/later after soldout case
  hideEditQtt(){
    this.showEdit = false;
    this.isDisabledContinue = false;
  }

  submitEdit(isSuccessful) 
  {
    // hide promotional banner
    this.displayPromotionalBanner = false;
    
    this.showEdit = false;
    if (isSuccessful) {
      let result = this.sharedSibling.amendSearchRequest;
      if (result) {
        this.searchRequest = result;
        this.getChangedFilterValue();

        this.searchRequest.JourneySearchType = 'NEW';
        // earlierLater Changes
        this.searchRequest.JourneySearchTypeReturn = 'NEW';
        this.searchRequest.FirstTrainDepartureTimesStart = '';
        this.searchRequest.LastTrainDepartureTimesStart = '';
        this.searchRequest.FirstTrainArrivalTimesStart = '';
        this.searchRequest.LastTrainArrivalTimesStart = '';

        // earlierLater Changes
        this.searchRequest.FirstTrainDepartureTimesStartReturn = '';
        this.searchRequest.LastTrainDepartureTimesStartReturn = '';
        this.searchRequest.FirstTrainArrivalTimesStartReturn = '';
        this.searchRequest.LastTrainArrivalTimesStartReturn = '';

        this.sharedSibling.searchRequest = this.searchRequest;
        this.getRailCards();
        
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        this.sharedSibling.isSearchApiError = false;
        this.sharedSibling.isEarlierLaterSearchApiError = false;
        this.passengerDetailLabel = this.getPassengerDetailLabel();
        if (result.TravelSolutionDirection == "ONE_WAY") {
          this.journeyType = "Single";
        }
        else if (result.TravelSolutionDirection == "RETURN") {
          this.journeyType = "Return";
        }
        else {
          this.journeyType = "Open-Return";
        }
      }

      if (result.TravelSolutionDirection == "RETURN") {
        setTimeout(()=>this.mixingDeckReturnList.ngOnInit(),200);
        
      }
      else {
        setTimeout(()=>this.mixingDeckList.ngOnInitFunction(),200);
      }
    }
  }
  // created method for get railcard value on onload & edit journey
  getRailCards() {
    if (this.searchRequest.RailCardList != null && this.searchRequest.RailCardList.length > 0) {
      let railCard = '';
      if (this.searchRequest.RailCardList.length == 1)
        railCard = this.commonServices?.railCardsList?.filter(x => x.Code == this.searchRequest.RailCardList[0].RailCard)[0].Name.toString();
      else
        railCard = "Multiple Railcards"
      if (this.sharedSibling.journeySummaryModel != null) {
        this.sharedSibling.journeySummaryModel.RailCards = railCard;
      }
      else {
        this.sharedSibling.journeySummaryModel = new JourneySummaryModel();
        this.sharedSibling.journeySummaryModel.RailCards = railCard;
      }
    }
  }

  getChangedFilterValue() {
    if (this.isSubmitViaFilters) {
      this.searchRequest.OperaterFilter = this.isOperatorFilterChoosed ? 1 : 0;
      this.searchRequest.ChangesFilter = this.isChangeFilterChoosed ? 0 : 1;
      this.isSubmitViaFilters = false;
    } else {
      this.isOperatorFilterChoosed = (this.searchRequest.OperaterFilter === 1) ? true : false;
      this.isChangeFilterChoosed = (this.searchRequest.ChangesFilter === 0) ? true : false;
    }
  }

  operatorFilterSubmitEdit() {
    this.isSubmitViaFilters = true;
    this.isOperatorFilterChoosed = !this.isOperatorFilterChoosed;
    this.sharedSibling.amendSearchRequest = this.sharedSibling.searchRequest;
    this.submitEdit(true);
  }
  changeFilterSubmitEdit() {
    this.isSubmitViaFilters = true;
    this.isChangeFilterChoosed = !this.isChangeFilterChoosed;
    this.sharedSibling.amendSearchRequest = this.sharedSibling.searchRequest;
    this.submitEdit(true);
  }
  
  ticketNotFound(msg) {
    let dialogRef = this.dialog.open(TicketNotFoundComponent, {
      disableClose: false,
      data: {
        message: msg
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.searchRequest = this.sharedSibling.searchRequest;
      this.openEdit();
    });
  }
  farebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: true,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }
  receiveTooltipStatus() {
    this.checkAllTooltipStatus();
  }
  checkAllTooltipStatus() {
    if (this.mixingDeckList.tooltip13 != undefined && this.mixingDeckList.tooltip14 != undefined) {
      if (!this.tooltip2.isOpen() && !this.mixingDeckList.tooltip13.isOpen()
        && !this.mixingDeckList.tooltip14.isOpen()) {
        this.showHelp(false);
      }
    }
    if (this.mixingDeckReturnList.tooltip15 != undefined && this.mixingDeckReturnList.tooltip17 != undefined && this.mixingDeckReturnList.tooltip16 != undefined) {
      if (!this.tooltip2.isOpen() && !this.mixingDeckReturnList.tooltip15.isOpen()
        && !this.mixingDeckReturnList.tooltip17.isOpen() && !this.mixingDeckReturnList.tooltip16.isOpen()) {
        this.showHelp(false);
      }
    }
  }
  showHelp(status) {
    if (status) {
      this.hide = true;
      this.show = false;
      this.tooltip2.open();
      this.getMixingDeckOpenTooltip();
    }
    else {
      this.hide = false;
      this.show = true;
      this.tooltip2.close();
      this.getMixingDeckCloseTooltip();
    }
  }

  getMixingDeckOpenTooltip() {
    if (this.mixingDeckList.tooltip13 != undefined) {
      this.mixingDeckList.tooltip13.open();
    }
    if (this.mixingDeckList.tooltip14 != undefined) {
      this.mixingDeckList.tooltip14.open();
    }
    if (this.mixingDeckReturnList.tooltip15 != undefined) {
      this.mixingDeckReturnList.tooltip15.open();
    }
    if (this.mixingDeckReturnList.tooltip16 != undefined) {
      this.mixingDeckReturnList.tooltip16.open();
    }
    if (this.mixingDeckReturnList.tooltip17 != undefined) {
      this.mixingDeckReturnList.tooltip17.open();
    }
  }

  getMixingDeckCloseTooltip() {
    if (this.mixingDeckList.tooltip13 != undefined) {
      this.mixingDeckList.tooltip13.close();
    }
    if (this.mixingDeckList.tooltip14 != undefined) {
      this.mixingDeckList.tooltip14.close();
    }
    if (this.mixingDeckReturnList.tooltip15 != undefined) {
      this.mixingDeckReturnList.tooltip15.close();
    }
    if (this.mixingDeckReturnList.tooltip16 != undefined) {
      this.mixingDeckReturnList.tooltip16.close();
    }
    if (this.mixingDeckReturnList.tooltip17 != undefined) {
      this.mixingDeckReturnList.tooltip17.close();
    }
  }

  removingCojData() {
    if (JSON.parse(localStorage.getItem("isCOJChange")) === true) {
      localStorage.removeItem("isCOJChange");
      if (this.sharedSibling) {
        this.sharedSibling.reviewBuyCache = null;
        this.sharedSibling.reviewBuyResponse = null;
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      }
    }
  }
  removeUpgradeData() {
    this.storageDataService.clearSessionStorageData("isUpgradeChange");
  }

  disabledContinueBtn(){
    if(this.isDisabledContinue){
      this.sharedSibling.isDisabledContinue.next(true);
    }
  }

  openJourneyExtraForSingleFare() {
    if (this.mixingDeckReturnList.isSingleFareSelected) {
      if ((this.mixingDeckReturnList.selectedSingleReturnTravelSolution === undefined || this.mixingDeckReturnList.selectedSingleReturnTravelSolution == null || this.mixingDeckReturnList.selectedSingleReturnTravelSolution.TravelSolId === undefined) && (this.mixingDeckReturnList.selectedReturnTimeId === null || this.mixingDeckReturnList.selectedReturnTimeId === undefined)) {
        this.notificationservice.error("Please select return journey first.");
        return false;
      }
    }
    else {
      if (this.mixingDeckReturnList.selectedReturnTimeId === undefined || !this.checkReturnTravelSolutionSelected()) {
        this.notificationservice.error("Please select return time first.");
        return false;
      }
    }
    if (this.mixingDeckReturnList.totalFare === undefined || this.mixingDeckReturnList.totalFare == 0) {
      this.notificationservice.error("Please select a journey first.");
      return false;
    }
  }

  openJourneyExtraForSingleFareOne() {
    if ((this.mixingDeckReturnList.selectedSingleReturnTravelSolution === undefined || this.mixingDeckReturnList.selectedSingleReturnTravelSolution == null || this.mixingDeckReturnList.selectedSingleReturnTravelSolution.TravelSolId === undefined) && (this.mixingDeckReturnList.selectedReturnTimeId === null || this.mixingDeckReturnList.selectedReturnTimeId === undefined)) {
      this.notificationservice.error("Please seslect return journey first.");
      return false;
    }
    if (this.mixingDeckReturnList.isSingleFareSelected) {
      if (moment(this.mixingDeckReturnList.selectedSingleReturnTravelSolution.DepartureDate) <= moment(this.mixingDeckReturnList.selectedTravelSolution.ArrivalDate)) {
        this.notificationservice.error("Return service should not be before departing service.");
        return false;
      }
    } else {
      if (moment(this.mixingDeckReturnList.selectedSingleReturnTravelSolutionForReturn.DepartureDate) <= moment(this.mixingDeckReturnList.selectedTravelSolution.ArrivalDate)) {
        this.notificationservice.error("Return service should not be before departing service.");
        return false;
      }
    }
  }
  openJourneyExtraForReturnReq() {
    if (this.searchRequest.IsReturnRequest) {
      let getNotificationForSingleFare = this.openJourneyExtraForSingleFare();
      if (!getNotificationForSingleFare && getNotificationForSingleFare !== undefined) {
        return false;
      }

      let getNotificationForSingleFareOne = this.openJourneyExtraForSingleFareOne();
      if (!getNotificationForSingleFareOne && getNotificationForSingleFareOne !== undefined) {
        return false;
      }

    }
    else {
      if (this.mixingDeckList.selectedTravelSolution === undefined || this.mixingDeckList.selectedTravelSolution === null || this.mixingDeckList.selectedTravelSolution.TravelSolId === undefined
        || this.mixingDeckList.singleFare === undefined || this.mixingDeckList.singleFare == 0) {
        this.notificationservice.error("Please select a journey first.");
        return false;
      }
    }
  }
  openJourneyExtra(isCheckQuickBuy?: boolean) {
    if (this.sharedSibling.reviewBuyResponse != null && this.sharedSibling.reviewBuyResponse.BasketCount != 0) {
      this.reviewBuyDetail = this.sharedSibling?.reviewBuyResponse?.Journey?.find(x => x.SeasonDeatil != null);
      if (this.reviewBuyDetail != null || this.reviewBuyDetail != undefined) {
        this.notificationservice.warn(this.errorMessageEnum.removeBasketItemErrorMessage);
        return false;
      }
    }
    let getNoficationForReturnReq = this.openJourneyExtraForReturnReq();
    if (!getNoficationForReturnReq && getNoficationForReturnReq !== undefined) {
      return false;
    }
    this.setTravelSolution();
    this.sharedSibling.evaluateRequest = this.evaluateTravelRequest;
    this.sharedSibling.sendSearchRequest(this.searchRequest);
    this.sharedSibling.isSingleReturnCase = !this.mixingDeckReturnList.isSingleFareSelected;
    if (this.mixingDeckReturnList.searchResponse != undefined) {
      this.sharedSibling.firstTravelSolDepartureTime = this.mixingDeckReturnList.searchResponse.TravelSolutions[0].DepartureDate;
      this.sharedSibling.secondTravelSolDepartureTime = this.mixingDeckReturnList.searchResponseReturn.TravelSolutions[0].DepartureDate;
      this.sharedSibling.firstTravelSolDepartureTimeAmend = this.mixingDeckReturnList.searchResponse.Request.DepartureTimesStart;
      this.sharedSibling.secondTravelSolDepartureTimeAmend = this.mixingDeckReturnList.searchResponseReturn.Request.ReturnTimesStart;
    }
    try {
      let fastestTravelSolutionIds = [];
      let fastestTravelSolutionIdsReturn = [];
      let cheapestTravelSolutionIds = [];
      let cheapestTravelSolutionIdsReturn = [];
      if (this.searchRequest.IsReturnRequest) {
        fastestTravelSolutionIds = [...this.mixingDeckReturnList.fastestTravelSolutionId];
        fastestTravelSolutionIdsReturn = [...this.mixingDeckReturnList.fastestTravelSolutionIdSingleReturn];
        cheapestTravelSolutionIds = [...this.mixingDeckReturnList.cheapestTravelSolutionId];
        cheapestTravelSolutionIdsReturn = [...this.mixingDeckReturnList.cheapestTravelSolutionIdSingleReturn];
      } else {
        fastestTravelSolutionIds = [...this.mixingDeckList.fastestTravelSolutionId];
        cheapestTravelSolutionIds = [...this.mixingDeckList.cheapestTravelSolutionId];
      }
      this.dataLayerService.loadGALayerForAddToCart(this.sharedSibling.journeySummaryModel, this.mixingDeckReturnList.activeTab, this.searchRequest, fastestTravelSolutionIds, fastestTravelSolutionIdsReturn, cheapestTravelSolutionIds, cheapestTravelSolutionIdsReturn);
      this.ga4dataLayerService.loadGA4selectItem(this.sharedSibling.journeySummaryModel, null, this.mixingDeckReturnList.activeTab, this.searchRequest, null, isCheckQuickBuy);
    } catch (error) {
      console.log(error);
    }
    this.onClickContinueOrQuickBuy(isCheckQuickBuy);
  }
  
  // PICO-2212, PICO-2213 & PICO-2215 check method for click on continue btn or quick buy btn
  onClickContinueOrQuickBuy(isCheckQuickBuy) {
    if (isCheckQuickBuy) {
      this.getQuickBuyService(isCheckQuickBuy);
    } else {
      this.getEvaluateData(isCheckQuickBuy);
    }
  }

  checkReturnTravelSolutionSelected(): boolean {
    let isSelected = false;
    this.mixingDeckReturnList.searchResponseReturn.TravelSolutions.forEach(travelSolution => {
      travelSolution.ReturnFareList.forEach(element => {
        if (element.OfferId == this.mixingDeckReturnList.selectedOfferId && element.ServiceId
          == this.mixingDeckReturnList.selectedServiceId) {
          isSelected = true;
        }
      });
    });
    return isSelected;
  }

  setTravelSolution() {
    this.evaluateTravelRequest = new EvaluateTravelRequest;
    if (this.searchRequest.IsReturnRequest) {
      this.evaluateTravelRequest.OutwardTravelSolutionCache = this.mixingDeckReturnList.selectedTravelSolution.TravelSolutionCache;
      this.evaluateTravelRequest.OutwardSearchCustomCache = this.mixingDeckReturnList.searchResponse.Request.SearchCache;
      this.evaluateTravelRequest.OutwardTravelSolId = this.mixingDeckReturnList.selectedTravelSolution.TravelSolId;
      this.evaluateTravelRequest.OutwardOfferId = this.mixingDeckReturnList.selectedOfferId;
      this.evaluateTravelRequest.OutwardCatlogServiceId = this.mixingDeckReturnList.selectedServiceId;

      if (this.mixingDeckReturnList.isSingleFareSelected) {
        this.evaluateTravelRequest.ReturnTravelSolutionCache = this.mixingDeckReturnList.selectedSingleReturnTravelSolution.TravelSolutionCache;
        this.evaluateTravelRequest.ReturnSearchCustomCache = this.mixingDeckReturnList.searchResponseReturn.Request.SearchCacheReturn;
        this.evaluateTravelRequest.ReturnTravelSolId = this.mixingDeckReturnList.selectedSingleReturnTravelSolution.TravelSolId;
        this.evaluateTravelRequest.ReturnOfferId = this.mixingDeckReturnList.selectedSingleReturnOfferId;
        this.evaluateTravelRequest.ReturnCatlogServiceId = this.mixingDeckReturnList.selectedSingleReturnServiceId;
      }
      else {
        this.evaluateTravelRequest.ReturnTravelSolutionCache = this.mixingDeckReturnList.selectedSingleReturnTravelSolutionForReturn.TravelSolutionCache;
        this.evaluateTravelRequest.ReturnSearchCustomCache = this.mixingDeckReturnList.searchResponseReturn.Request.SearchCacheReturn;
        this.evaluateTravelRequest.ReturnTravelSolId = this.mixingDeckReturnList.selectedReturnTimeId;
        this.evaluateTravelRequest.ReturnOfferId = this.mixingDeckReturnList.selectedOfferId;
        this.evaluateTravelRequest.ReturnCatlogServiceId = this.mixingDeckReturnList.selectedServiceId;
      }

    }
    else {
      this.evaluateTravelRequest.OutwardTravelSolutionCache = this.mixingDeckList.selectedTravelSolution.TravelSolutionCache;
      this.evaluateTravelRequest.OutwardSearchCustomCache = this.mixingDeckList.searchResponse.Request.SearchCache;
      this.evaluateTravelRequest.OutwardTravelSolId = this.mixingDeckList.selectedTravelSolution.TravelSolId;
      this.evaluateTravelRequest.OutwardOfferId = this.mixingDeckList.selectedFare.OfferId;
      this.evaluateTravelRequest.OutwardCatlogServiceId = this.mixingDeckList.selectedFare.ServiceId;
    }
  }

  openDialog() {
    this.dialog.open(ParkingPopupComponent, {
      width: '1086px',
    });
  }


  onChangeStationsSearch() {
    let arrivalLocation = this.searchRequest.ArrivalLocation;
    let arrivalLocationName = this.searchRequest.ArrivalLocationName;
    this.searchRequest.ArrivalLocation = this.searchRequest.DepartureLocation;
    this.searchRequest.DepartureLocation = arrivalLocation;
    this.searchRequest.ArrivalLocationName = this.searchRequest.DepartureLocationName;
    this.searchRequest.DepartureLocationName = arrivalLocationName;
    if (this.searchRequest.IsReturnRequest) {
      this.mixingDeckReturnList.ngOnInit();
    }
    else {
       this.mixingDeckList.ngOnInitFunction();
    }
  }
  nreHandoffData(handOffDataRequest) {
    this.searchSolutionService.nreHandOffTravelSolutionData(handOffDataRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.sharedSibling.evaluateRequest = null;
              this.searchRequest = this.sharedSibling.searchRequest = this.responseData.Data.Request;
              this.sharedSibling.isAmendFresh = true;
              this.sharedSibling.setSharedCache();
              this.storageDataService.clearStorageData("sharedSibling");
              this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
              this.ticketNotFound(this.responseData.Data.Message);
              this.setSearchRequestJourneyTypeAndPassengerDetailLabelFromNre();

              this.commonServices.callApiForGetLocationMasterData();
              this.getRailcardStationData();
              if (!sessionStorage.getItem('pageReloaded')) {
                this.iframeSrc = this.commonServices.trackNreHandOffUrl(this.responseData.Data, false);
              }
              
            }
          }
          else {
            this.notificationservice.error(this.responseData.ResponseMessage);
          }
        }
        else {
          this.notificationservice.error(this.responseData.ResponseMessage);
        }

      });
  }

  getJourneyType(searchRequest) {
    if (searchRequest.TravelSolutionDirection == 'ONE_WAY') {
      this.journeyType = 'Single';
    }
    else if (searchRequest.TravelSolutionDirection == 'RETURN' || searchRequest.TravelSolutionDirection == 'FORWARD') {
      this.journeyType = 'Return';
    }
    else {
      this.journeyType = 'Open-Return';
    }
  }
  getQueryString() {
    this.commonServices.loaderRequired = true;
    let queryString = localStorage.getItem("searchQueryString");
    if (!environment.production) {
      queryString = "http://localhost:4200/search-results?oriCode=700010017&oriName=Manchester Piccadilly (MAN)&destCode=700010001&destName=Birmingham New Street (BHM)&oadInd=Leave After&outHourField=10&outMinuteField=00&outDate=13/11/2022&jt=Return&noa=1&noc=0&inHourField=13&inMinuteField=00&inDate=17/11/2022&oadIndReturn=Leave After";
    }
    if (queryString != undefined && queryString != null) {
      if (queryString.includes('?')) {
        this.sharedSibling.mixingDeckUrl = queryString;
        const params = new HttpParams({ fromString: queryString.split('?')[1] });
        this.createSearchRequestDataFromQueryString(params);
        if (params.get("jt") === 'Single') {
          this.searchRequest.TravelSolutionDirection = 'ONE_WAY';
          this.searchRequest.IsReturnRequest = false;
          this.journeyType = 'Single';
        }
        else if (params.get("jt") === 'Return') {
          this.setSearchRequestDataForReturnJourneyType(params);
        }
        else {
          this.searchRequest.TravelSolutionDirection = 'OPEN_RETURN';
          this.searchRequest.IsReturnRequest = false;
          this.journeyType = 'Open-Return';
        }
        let dateString = params.get('outDate');
        let dateParts = dateString.split("/");
        let dateObject = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
        dateObject.setHours(+params.get('outHourField'));
        dateObject.setMinutes(+params.get('outMinuteField'));
        this.searchRequest.DepartureTimesStart = moment(dateObject).format('YYYY-MM-DDTHH:mm');
        
          //Added a property so on earlier/later editQtt input dates do not change
        this.sharedSibling.editQttDepartureTimeStart = this.searchRequest.DepartureTimesStart;
        this.passengerDetailLabel = this.getPassengerDetailLabel();

        let rCount = +params.get('rCount');
        for (let i = 0; i < rCount; i++) {
          let railcard = new RailCardModel;
          railcard.RailCard = params.get('rcCode' + (i + 1).toString());
          railcard.Adult = +params.get('rcNoa' + (i + 1).toString());
          railcard.Child = +params.get('rcNoc' + (i + 1).toString());
          railcard.RailCardCount = +params.get('rcNum' + (i + 1).toString());
          this.searchRequest.RailCardList.push(railcard);
        }
        this.sharedSibling.searchRequest = this.searchRequest;
        localStorage.setItem('search', JSON.stringify(this.searchRequest));
      }
    }
    localStorage.setItem(this.localStorageKeyEnum.checkoutFlowStrategy, this.quickBuyEnum.quickBuy);
  }
  //PICO-2212 for show the quick buy button on behalf of check value checkoutFlowStrategy in localstorage
  displayQuickBuyBtn() {
    if (localStorage.getItem(this.localStorageKeyEnum.checkoutFlowStrategy) == this.quickBuyEnum.quickBuy) {
      return true;
    }
    return false;
  }

  getRailcardStationData() {
    if (!this.sharedSibling.isAmendSearchOpen) {
      this.commonServices.loaderRequired = true;
    }
    this.commonServices.getRailcardStations().subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          this.getRailcardStations(this.responseData);
          this.getRailCards();
        }
      });
  }

  getRailcardStations(responseData) {
    if (responseData.ResponseCode == '200') {
      this.sharedSibling.railcardStationMasterData = responseData?.Data;
      let disabledDates = [];
      if (this.sharedSibling?.railcardStationMasterData?.DisabledDates) {
        for (let date of this.sharedSibling.railcardStationMasterData.DisabledDates) {
          const dt = new Date(date).getTime();
          disabledDates.push(dt);
        }
      }
      this.sharedSibling.railcardStationMasterData.DisabledDatesinString = disabledDates;
      localStorage.setItem("disableDates", JSON.stringify(disabledDates));
      localStorage.setItem('railcardStationList', JSON.stringify(responseData.Data));
      if (this.sharedSibling?.railcardStationMasterData) {
        this.commonServices.railCardsList = this.sharedSibling.railcardStationMasterData.Railcard;
      }
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
    else {
      this.notificationservice.error(responseData.ResponseMessage);
      this.railcardStationData = JSON.parse(localStorage.getItem('railcardStationList'));
      if (this.railcardStationData?.Railcard)
        this.commonServices.railCardsList = this.railcardStationData?.Railcard;
    }
  }

  getEvaluateData(isCheckQuickBuy) {
    this.journeyExtraService.getEvaluateResponse(this.evaluateTravelRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.sharedSibling.journeyExtrasResponseShared = this.responseData.Data;
              this.sharedSibling.createReservationRequest = new CreateReservationRequest();
              if (this.sharedSibling.journeySummaryModel != null) {
                this.sharedSibling.journeySummaryModel.OutwardPlusbus = false;
                this.sharedSibling.journeySummaryModel.ReturnPlusbus = false;
                this.sharedSibling.journeySummaryModel.OutwardBicycleReservation = false;
                this.sharedSibling.journeySummaryModel.ReturnBicycleReservation = false;
                this.sharedSibling.journeySummaryModel.OutwardLondonTravelcard = false;
                this.sharedSibling.journeySummaryModel.ReturnLondonTravelcard = false;
                this.sharedSibling.journeySummaryModel.MultiOutwardPlusbus = false;
                this.sharedSibling.journeySummaryModel.MultiReturnPlusbus = false;
              }
              this.searchRequest.IsFlexiTicketSelected = false;
              this.setSelectedJourneyDataObjForQuickBuyOrCOntinue(isCheckQuickBuy, this.sharedSibling?.journeyExtrasResponseShared?.XmlId);
              //Set shared cache data
              this.sharedSibling.setSharedCache();
              this.storageDataService.clearStorageData("sharedSibling");
              this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
              this.doesJourneyExtraResponseExists();
            }
            else {
              this.notificationservice.error(this.responseData.ResponseMessage);
            }
          }
          else {
            this.getTimeOutErrorMsg();
          }
        }
      });
  }

  doesJourneyExtraResponseExists() {
    if(this.doesReservationMandatory()) {
      this.router.navigate([`./` + this.appRouteEnum.JourneyExtras]);
    }
    else {
      this.createReservationRequest = new CreateReservationRequest;
      this.createReservationRequest.EvaluateTravelCache = this.sharedSibling.journeyExtrasResponseShared.EvaluateTravelCache;
      this.createReservationRequest.OutwardReservation = this.sharedSibling.journeyExtrasResponseShared.OutwardReservation;
      this.createReservationRequest.ReturnReservation = this.sharedSibling.journeyExtrasResponseShared.ReturnReservation;
      this.createReservationRequest.SkipTravelExtraPage = true;
      let fareBreakDownDataNreBasket: FareBreakdownModel[] = [];
      let nreJourneyExtrasResponse: NreJourneyExtrasResponse;
      this.commonServices.postReservationData(this.createReservationRequest, fareBreakDownDataNreBasket, nreJourneyExtrasResponse);
    }
  }

  doesReservationMandatory() {
    return (this.sharedSibling?.journeyExtrasResponseShared && (this.sharedSibling.journeyExtrasResponseShared.Detail || (this.sharedSibling.journeyExtrasResponseShared.OutwardReservation && this.sharedSibling.journeyExtrasResponseShared.OutwardReservation != this.appConstantsService.noReservation && this.sharedSibling.journeyExtrasResponseShared.OutwardReservation != this.appConstantsService.optional) || (this.sharedSibling.journeyExtrasResponseShared.ReturnReservation && this.sharedSibling.journeyExtrasResponseShared.ReturnReservation != this.appConstantsService.noReservation && this.sharedSibling.journeyExtrasResponseShared.ReturnReservation != this.appConstantsService.optional)));
  }

  getTimeOutErrorMsg() {
    this.sharedSibling.isSearchApiError = true;
    this.sharedSibling.timeoutErrorMessage = `Your return journey is outside of the time restrictions for the ticket type you've selected.
    Please select an alternative ticket type or an earlier or later return journey.`;
  }

  // PICO-2212, PICO-2213 & PICO-2215 calling api for Quick Buy Service
  getQuickBuyService(isCheckQuickBuy) {
    this.commonServices.loaderRequired = true;
    this.evaluateTravelRequest.PreviousCache = this.sharedSibling.reviewBuyCache;
    this.journeyExtraService.postQuickBuyServiceData(this.evaluateTravelRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.quickBuyServiceResponse = this.responseData.Data;
              localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.quickBuyServiceResponse.IsReviewMergedFlowEnabled));
              this.getResOfQuickBuyService(this.quickBuyServiceResponse);
              localStorage.setItem(this.localStorageKeyEnum.isQuickBuyOrContinue, this.quickBuyEnum.quickBuy);
              this.ga4dataLayerService.loadGALayerForQuickBuy(this.router.url);
              this.setSelectedJourneyDataObjForQuickBuyOrCOntinue(isCheckQuickBuy, this.quickBuyServiceResponse?.XmlId);
            } else {
              this.notificationservice.error(this.responseData.ResponseMessage);
              this.spinnerService.hide();
            }
          } else {
            this.getTimeOutErrorMsg();
            this.spinnerService.hide();
          }
        }
      });
  }
  // PICO-2212, PICO-2213 & PICO-2215 getting response of Quick Buy Service & redirect on review buy
  getResOfQuickBuyService(quickBuyServiceResponse) {
    if (quickBuyServiceResponse) {
      this.sharedSibling.reviewBuyResponse = this.responseData.Data;
      this.sharedSibling.reviewBuyCache = this.sharedSibling.reviewBuyResponse.ReviewBuyCache;
      this.sharedSibling.ReservationCache = this.responseData.Data.ReservationCache;
      this.sharedSibling.reviewBuyResponse.Journey = null;
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      if (quickBuyServiceResponse.ReservationMessage != null) {
        let respMsg = quickBuyServiceResponse.ReservationMessage;

        this.spinnerService.hide();
        let dialogRef = this.dialog.open(InfoPopupComponent, {
          width: '500px',
          disableClose: false,
          data: {
            Message: respMsg
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          if (!quickBuyServiceResponse.IsBlock) {
            this.setNavigationAccordingToDeliveryPageSkipCondition();
          }
        });
      } else {
        this.setNavigationAccordingToDeliveryPageSkipCondition();
      }
    }
  }

  setStep(val: number) {
    this.step = val;
  }
  ticketInfo(ticketType: string, fare: FareModel) {
    if(fare == undefined){
      fare=this.sharedSibling.journeySummaryModel.SingleSelectedFare;
    }
    if(ticketType == undefined){
      ticketType = fare.TicketType;
    }
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
  setStep2(step2) {
    this.step2 = step2;
  }
  setStep1(step1) {
    this.step1 = step1;
  }

  setSearchRequestDataForReturnJourneyType (params) {
    this.searchRequest.TravelSolutionDirection = 'RETURN';
    this.searchRequest.IsReturnRequest = true;
    let dateStringOne = params.get('inDate');
    let datePartsOne = dateStringOne.split("/");
    let dateObjectReturn = new Date(+datePartsOne[2], +datePartsOne[1] - 1, +datePartsOne[0]);
    dateObjectReturn.setHours(+params.get('inHourField'));
    dateObjectReturn.setMinutes(+params.get('inMinuteField'));
    this.searchRequest.ReturnTimesStart = moment(dateObjectReturn).format('YYYY-MM-DDTHH:mm');
    //Added a property so on earlier/later editQtt input dates do not change
    this.sharedSibling.editQttReturnTimeStart = this.searchRequest.ReturnTimesStart;
    this.journeyType = 'Return';
    this.searchRequest.TraveltypeReturn = params.get("oadIndReturn") === 'Leave After' ? "DEPARTAFTER" : "ARRIVEBY";
  }

  createSearchRequestDataFromQueryString (params) {
    this.searchRequest.DepartureLocationName = params.get("oriName");
    this.searchRequest.ArrivalLocationName = params.get("destName");
    this.searchRequest.DepartureLocation = +params.get("oriCode");
    this.searchRequest.ArrivalLocation = +params.get("destCode");
    this.searchRequest.PathConstraintLocation = +params.get("viaCode");
    this.searchRequest.JourneySearchType = 'NEW';
    this.searchRequest.JourneySearchTypeReturn = 'NEW';
    this.searchRequest.FirstTrainDepartureTimesStart = '';
    this.searchRequest.LastTrainDepartureTimesStart = '';
    this.searchRequest.FirstTrainArrivalTimesStart = '';
    this.searchRequest.LastTrainArrivalTimesStart = '';
    this.searchRequest.Adult = +params.get("noa");
    this.searchRequest.Child = +params.get("noc");
    this.searchRequest.Traveltype = params.get("oadInd") === 'Leave After' ? "DEPARTAFTER" : "ARRIVEBY";
    this.searchRequest.PromotionCode = params.get("prmCode") != undefined && params.get("prmCode") != null && params.get("prmCode") !== "" ? params.get("prmCode") : "";
    this.searchRequest.TicketClassFilter = "";
    this.searchRequest.ChangesFilter = 1;
    this.searchRequest.OperaterFilter = 0;
  }
  
  // PICO-2212, PICO-2213 & PICO-2215 call method for quickbuy authenticate
  quickBuyAuthentication() {
    let customerKey = localStorage.getItem('CustomerKey');
    let customerEmail = localStorage.getItem('Email');
    if (customerKey && customerEmail) {
      this.openJourneyExtra(true);
    } else {
      this.spinnerService.hide();
      this.commonServices.loaderRequired = true;
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = false;
      dialogConfig.autoFocus = true;
      dialogConfig.width = "60%";
      dialogConfig.panelClass = 'class-dialog1';
      dialogConfig.data = { isLoginFromQuickBuy: true, isQuickBuy: true };
      let dialogRef = this.dialog.open(LoginPageComponent, dialogConfig);
      dialogRef.afterClosed().subscribe((flag) => {
        if (flag) {
          this.openJourneyExtra(true);
        }
      });
    }
  }

  setNavigationAccordingToDeliveryPageSkipCondition(){
    if (this.commonServices.doesDeliveryPageSkipped()) {
      localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'true');
      this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
    } else {
      this.router.navigate([`./` + this.appRouteEnum.ReviewBuy]);
    }
  }

  nullOrUndefinedCheckForSharedSiblingRefresh(sharedSiblingRefresh){
    return sharedSiblingRefresh != null && sharedSiblingRefresh != undefined;
  }

  nullorUndefinedCheckForReviewBuyResponseOfSharedSibling(){
    return this.sharedSibling.reviewBuyResponse != null && this.sharedSibling.reviewBuyResponse != undefined;
  }

  setSelectedJourneyDataObjForQuickBuyOrCOntinue(isCheckQuickBuy, XmlId) {
    let selectedJourneyObjForQuickBuyOrContinue = {
      departureStation: this.searchRequest.DepartureLocationName,
      arrivalStation: this.searchRequest?.ArrivalLocationName,
      outDepartureDate: this.sharedSibling?.journeySummaryModel?.SingleRouteModel?.DepartureDate,
      outArrivalDate: this.sharedSibling?.journeySummaryModel?.SingleRouteModel?.ArrivalDate,
      retDepartureDate: this.sharedSibling?.journeySummaryModel?.ReturnRouteModel?.DepartureDate,
      retArrivalDate: this.sharedSibling?.journeySummaryModel?.ReturnRouteModel?.ArrivalDate,
      passengerCount: this.searchRequest?.Adult + this.searchRequest?.Child,
      singleTicketType: this.sharedSibling.journeySummaryModel.SingleTicketType,
      returnTicketType: this.sharedSibling.journeySummaryModel.ReturnTicketType,
      singleTicketPrice: this.sharedSibling?.journeySummaryModel?.SingleSelectedFare?.Price,
      returnTicketPrice: this.sharedSibling?.journeySummaryModel?.ReturnSelectedFare?.Price,
      singleDuration: this.sharedSibling?.journeySummaryModel?.SingleRouteModel?.Duration,
      returnDuration: this.sharedSibling?.journeySummaryModel?.ReturnRouteModel?.Duration,
      isCheckQuickBuy: isCheckQuickBuy,
      XmlId: XmlId
    }
    this.selectedJourneyDataForQuickBuyOrContiue.push(selectedJourneyObjForQuickBuyOrContinue);
    this.sharedSibling.selectedJourneyDataForQuickBuyOrContiue = this.selectedJourneyDataForQuickBuyOrContiue;
  }

  setSearchRequestJourneyTypeAndPassengerDetailLabelFromNre(){
    if (this.sharedSibling.searchRequest?.DepartureLocation != null) {
      this.searchRequest = this.sharedSibling.searchRequest;
      this.getJourneyType(this.searchRequest);
      this.passengerDetailLabel = this.getPassengerDetailLabel();
    }
  }
  
}

