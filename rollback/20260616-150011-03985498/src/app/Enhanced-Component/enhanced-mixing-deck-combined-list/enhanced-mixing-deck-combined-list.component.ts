import { HttpParams } from "@angular/common/http";
import { Component, HostListener, Injector, OnInit} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { EnhancedPriceBreakdownDialogs } from "../enhanced-dialogs/enhanced-price-breakdown-dialogs/enhanced-price-breakdown-dialogs.component";
import { EnhancedClassDetailsDialogsComponent } from "../enhanced-dialogs/enhanced-class-details-dialogs/enhanced-class-details-dialogs.component";
import { EnhancedJourneySummaryDialogsComponent } from "../enhanced-dialogs/enhanced-journey-summary-dialogs/enhanced-journey-summary-dialogs.component";
import { EnhancedJourneyDetailsAndItineraryDialogsComponent } from "../enhanced-dialogs/enhanced-journey-details-and-itinerary-dialogs/enhanced-journey-details-and-itinerary-dialogs.component";
import { EnhancedRailcardRestrictionsDialogs } from "../enhanced-dialogs/enhanced-Railcard-restrictions-dialogs/enhanced-Railcard-restrictions-dialogs.component";
import { EnhancedReturnDateAndTimeDialog } from "../enhanced-dialogs/enhanced-return-date-and-time-dialog/enhanced-return-date-and-time-dialog.component";
import * as moment from "moment";
import { ResponseData } from "src/app/models/common/response.model";
import { EnhancedRailCardModel } from "src/app/models/enhanced-mixing-deck/enhanced-railcard.model";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { EnhancedSearchResponseModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-response.model";
import { JourneySummaryModel, TravelSolutionModel } from "src/app/models/mixing-deck/travel-solution.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { ClassTypeEnum, EnhancedAccessbilityMessageEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedFilterStatusEnum, EnhancedFooterButtonText, EnhancedGa4DatalayeEventNameEnum, EnhancedGA4SearchSourceEnum, EnhancedJourneyFilterText, EnhancedLoaderTextEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedMixingDeckConsoleErrorMessage, EnhancedMixingDeckPopupHeadingEnum, EnhancedMixingDeckPopupMessageEnum, EnhancedModalFooterTextEnum, EnhancedSearchTypeEnum, EnhancedSeeEarlierAndLaterTrainTextEnum, EnhancedTravelSolutionTypesEnum, EnhancedTravelTypeEnum, ErrorMessageEnum, LocalStorageKeyEnum, MixingDeckCombineListEnum, QuickBuyEnum, TravelSolutionJourneyTypeEnum, TravelSolutionStatusEnum } from "src/app/utility/app-constants.service";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { environment } from "src/environments/environment";
import { DeviceDetectorService } from "ngx-device-detector";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { EnhancedSearchSolutionService } from "src/app/services/enhanced-search-solution.service";
import { browserRefresh } from '../../app-component/app.component'
import { EnhancedDatepickerPopupComponent } from "../enhanced-dialogs/enhanced-datepicker-popup-dialogs/enhanced-datepicker-popup-dialogs.component";
import { EnhancedRxjsSubjectsCommonService } from "src/app/services/enhanced-rxjs-subject.service";
import { EnhancedNoTrainAvailableDialogs } from "../enhanced-dialogs/enhanced-no-trains-available-dialogs/enhanced-no-trains-available-dialogs.component";
import { EnhancedSearchInformationDialogs } from "../enhanced-dialogs/enhanced-search-information-dialogs/enhanced-search-information-dialogs.component";
import { ConfigurationSettings } from "src/app/models/common/configuration-settings.model";
import { RailcardStationMasterData } from "src/app/models/master/railcard-station.model";
import { DatePipe, Location  } from "@angular/common";
import { FareBreakdownModel } from "src/app/models/mixing-deck/fare-breakdown.model";
import { SearchStateService } from "src/app/services/search-state.service";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { GA4SearchEventParam } from "src/app/models/mixing-deck/search-request.model";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { HandOffDataReqDto } from "src/app/models/journey-extras/nre-response.model";
import { SearchSolutionService } from "src/app/services/search-solutions.service";
import { TicketNotFoundComponent } from "src/app/Component/mixing-deck/ticket-not-found/ticket-not-found.component";
import { EnhancedCommonErrorPopupComponent } from "../enhanced-dialogs/enhanced-common-error-popup/enhanced-common-error-popup.component";
import { MonetateService } from "src/app/utility/monetate/monetate.service";

@Component({
  selector: "app-enhanced-mixing-deck-combined-list",
  templateUrl: "./enhanced-mixing-deck-combined-list.component.html",
  styleUrls: ["./enhanced-mixing-deck-combined-list.component.css"],
})
export class EnhancedMixingDeckCombinedListComponent implements OnInit {
  router: Router;
  storageDataService: StorageDataService;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;
  mixingDeckCombinedListEnum: MixingDeckCombineListEnum;
  localStorageKeyEnum: LocalStorageKeyEnum;
  quickBuyEnum: QuickBuyEnum;
  commonServices: CommonServices;
  sharedService: SharedService;
  sharedServiceCache: SharedServiceCache;
  searchRequest: EnhancedSearchRequestModel;
  journeyType: string;
  passengerDetailLabel: string;
  enhancedSearchSolutionService: EnhancedSearchSolutionService;
  responseData: ResponseData;
  searchResponse: EnhancedSearchResponseModel;
  searchReturnResponse: EnhancedSearchResponseModel;
  errorMessageEnum: ErrorMessageEnum;
  isReturnDataLoad: boolean;
  isOutwardFareSelected: boolean = false;
  isReturnFareSelected: boolean = false;
  selectedOutwardFare: TravelSolutionModel;
  selectedReturnFare: TravelSolutionModel;
  nextPage: string;
  data: any;
  _notificationservice: NotificationService;
  retainedDepartureTimesStart: string;
  retainedReturnTimesStart: string;
  isMobile: boolean = false;
  isTablet: boolean = false;
  showOutward: boolean = true;
  showReturn: boolean = false;
  deviceService: DeviceDetectorService;
  displayPromotionalBanner: boolean = false;
  isSubmitViaFilters = false;
  isOperatorFilterChoosed: boolean;
  isChangeFilterChoosed: boolean;
  showEdit: boolean = false;
  isDisabledContinue : boolean = false;
  browserRefresh: boolean;
  isLoaderActive: boolean = true;
  travelSolutionStatusEnum: TravelSolutionStatusEnum;
  isOutward: boolean = false;
  isReturn: boolean = false;
  configurationSettings: ConfigurationSettings;
  railcardStationData: RailcardStationMasterData;
  selectedJourneyDataForQuickBuyOrContiue: any[] = [];
  dynamicClassEnum: EnhancedDynamicClassesNameEnum;
  onReturnSection: boolean;
  datePipe: DatePipe;
  isCancelVisibleBtn: boolean = true;
  mixingDeckPopupMsgEnum : EnhancedMixingDeckPopupMessageEnum;
  classTypeEnum: ClassTypeEnum;
  mixingDeckPopupHeadingEnum : EnhancedMixingDeckPopupHeadingEnum;
  isUserClickedReturnBtn: boolean;
  isHideEarlierReturn: boolean = true;
  isHideLaterReturn: boolean = true;
  isHideEarlier: boolean = true;
  isHideLater: boolean = true;
  selectedTravelSolutionData: any;
  outwardFarePreselectedValue: number;
  returnFarePreselectedValue: number;
  enhancedMixingDeckConsoleErrorMessage: EnhancedMixingDeckConsoleErrorMessage;
  enhancedJourneyFilter: EnhancedJourneyFilterText;
  enhancedFooterButtonText: EnhancedFooterButtonText;
  enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
  enhancedSearchTypeEnum: EnhancedSearchTypeEnum;
  enhancedTravelTypeEnum: EnhancedTravelTypeEnum;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  enhancedAccessbilityMessageEnum: EnhancedAccessbilityMessageEnum;
  searchStateService: SearchStateService;
  isBackFromTicketClass: boolean;
  ga4dataLayerService: GA4DatalayerService;
  searchResponseboth: EnhancedSearchResponseModel;
  enhancedModalFooterMessageEnum: EnhancedModalFooterTextEnum;
  enhancedGA4SearchSourceEnum: EnhancedGA4SearchSourceEnum;
  isBrowserShowOutwardPreSelectedData : boolean;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
  enhancedGA4DataLayerEventNameEnum: EnhancedGa4DatalayeEventNameEnum;
  enhancedSeeEarlierAndLaterTrainTextEnum : EnhancedSeeEarlierAndLaterTrainTextEnum;
  isFilterClicked: boolean = false;
  selectedFilterArray: string[] = [];
  enhancedFilterStatusEnum: EnhancedFilterStatusEnum;
  route: ActivatedRoute;
  requestId: string;
  handOffDataReqDto: HandOffDataReqDto;
  searchSolutionService: SearchSolutionService;
  iframeSrc: any;
  
  enhancedLoaderTextEnum : EnhancedLoaderTextEnum;
  monetateService: MonetateService;
  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent) {
    console.log('POPSTATE:', history.state);
    // When back button is pressed
    if (this.router.url.includes(`/${this.enhancedAppRouteEnum.searchResult}`)) {
      if(this.showReturn){
        this.showReturn = false;
        this.showOutward = true;
        this.isUserClickedReturnBtn = false;
      } else {
        this.showReturn = true;
        this.showOutward = false;
        this.isUserClickedReturnBtn = true;
      }
    }
  }
  
  constructor(private readonly injector: Injector, public dialog: MatDialog, public enhancedRxjsService: EnhancedRxjsSubjectsCommonService, private readonly location: Location) {
    this.router = this.injector.get(Router);
    this.storageDataService = this.injector.get(StorageDataService);
    this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.mixingDeckCombinedListEnum = this.injector.get(
      MixingDeckCombineListEnum
    );
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.commonServices = this.injector.get(CommonServices);
    this.sharedService = this.injector.get(SharedService);
    this.searchRequest = new EnhancedSearchRequestModel();
    this.enhancedSearchSolutionService = this.injector.get(
      EnhancedSearchSolutionService
    );
    this.errorMessageEnum = this.injector.get(ErrorMessageEnum);
    this.searchRequest.RailCardList = new Array<EnhancedRailCardModel>();
    this._notificationservice = this.injector.get(NotificationService);
    this.deviceService = this.injector.get(DeviceDetectorService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.travelSolutionStatusEnum = this.injector.get(TravelSolutionStatusEnum);
    this.configurationSettings = new ConfigurationSettings();
    this.dynamicClassEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
    this.datePipe = this.injector.get(DatePipe);
    this.mixingDeckPopupMsgEnum = this.injector.get(EnhancedMixingDeckPopupMessageEnum);
    this.classTypeEnum = this.injector.get(ClassTypeEnum);
    this.mixingDeckPopupHeadingEnum = this.injector.get(EnhancedMixingDeckPopupHeadingEnum);
    this.enhancedMixingDeckConsoleErrorMessage = this.injector.get(EnhancedMixingDeckConsoleErrorMessage);
    this.enhancedJourneyFilter = this.injector.get(EnhancedJourneyFilterText);
    this.enhancedFooterButtonText = this.injector.get(EnhancedFooterButtonText);
    this.enhancedTravelSolutionTypesEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
    this.enhancedSearchTypeEnum =  this.injector.get(EnhancedSearchTypeEnum);
    this.enhancedTravelTypeEnum = this.injector.get(EnhancedTravelTypeEnum);
    this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
    this.enhancedAccessbilityMessageEnum = this.injector.get(EnhancedAccessbilityMessageEnum);
    this.searchStateService = this.injector.get(SearchStateService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.enhancedModalFooterMessageEnum = this.injector.get(EnhancedModalFooterTextEnum);
    this.enhancedGA4SearchSourceEnum = this.injector.get(EnhancedGA4SearchSourceEnum);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
    this.enhancedGA4DataLayerEventNameEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    this.enhancedSeeEarlierAndLaterTrainTextEnum = this.injector.get(EnhancedSeeEarlierAndLaterTrainTextEnum);
    this.enhancedFilterStatusEnum = this.injector.get(EnhancedFilterStatusEnum);
    this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedService.fareBreakdownModelData[0] = new FareBreakdownModel();
    this.route = this.injector.get(ActivatedRoute);
    this.handOffDataReqDto = new HandOffDataReqDto();
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
    this.monetateService = this.injector.get(MonetateService);
  }

  ngOnInit(): void {
    try {
      this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
      this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false); 
      this.emitBasketCount(this.sharedService);
      /* page_meta_data method calling by passing argument as true */
      this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
      this.monetateService.setPageType();
      this.initializeDeviceFlags();
      this.handleHomePageRedirect();
    } catch (error) {
      console.error(this.enhancedMixingDeckConsoleErrorMessage?.onInitConcoleErrorMessage, error);
    }
  }

  private proceedFurtherExecution(isNreSearch: boolean = false) {
    this.setOperatorAndChangeFilterFlags();
    this.loadSearchRequestIfAmend();
    this.checkAndLoadJourneyType();
    this.sharedService.journeySummaryModel = null;
    this.getRailcardStationData();
    this.mobilePperatorFilterSubmitEdit();
    this.removingCojData();
    this.removeUpgradeData();
    this.selectedJourneyDataForQuickBuyOrContiue = this.sharedService?.selectedJourneyDataForQuickBuyOrContiue || [];
    this.retainedDepartureTimesStart = null;
    this.retainedReturnTimesStart = null;
    this.searchRequest.Searchtype = "";
    this.searchRequest.SearchtypeReturn = "";
    const data = this.searchStateService.get();
    if (data) {
      this.selectedTravelSolutionData = data?.outAndRetTravelSolData;
      this.isBackFromTicketClass = data?.isBackFromTicketClass;
    }
    this.getAllTravelSolution(isNreSearch);
  }

  setFooterBtnText(){
    this.nextPage = this.searchRequest?.IsReturnRequest ? this.enhancedFooterButtonText?.selectReturnTrainText : this.enhancedFooterButtonText?.selectTicketAndClassText;
  }
  
  private initializeDeviceFlags(): void {
    this.browserRefresh = browserRefresh;
    if(this.browserRefresh){
      this.searchRequest.OperaterFilter = 0;
      this.searchRequest.ChangesFilter = 1;
      this.searchStateService.clear();
    }
    this.isMobile = this.deviceService.isMobile() && window.screen.width < 1024;
    this.isTablet = (this.deviceService.isTablet() || this.commonServices.checkIsiPad(navigator.userAgent)) && window.screen.width < 1024;

    if(this.isMobile || this.isTablet){
      this.showOutward = true;
      this.showReturn = false;
    } else {
      this.showOutward = true;
      this.showReturn = true;
    }
    this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
    this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
  }
  
  private handleHomePageRedirect(): void {
    this.storageDataService.setStorageData(
      this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1),
      "false",
      false
    );
    this.route.queryParamMap.subscribe(params => {
      this.requestId = params.get("requestId");
    });
    if (this.requestId != "" && this.requestId != null) {
      this.handOffDataReqDto.requestId = this.requestId;
      this.nreHandoffData(this.handOffDataReqDto);
    } else {
      let isRedirectFromHomePage = this.storageDataService.getStorageData(
        this.mixingDeckCombinedListEnum.isRedirectFromHomePage,
        true
      );
    
      if (!environment.production) {
        isRedirectFromHomePage = true;
      }
    
      if (isRedirectFromHomePage) {
        this.getQueryString();
      }
    
      if (this.browserRefresh) {
        this.getSharedCacheData(isRedirectFromHomePage);
      }
    
      isRedirectFromHomePage = false;
      localStorage.setItem(this.mixingDeckCombinedListEnum?.isRedirectFromHomePage, JSON.stringify(isRedirectFromHomePage));
      this.sharedService.isAmendFresh = true;
      this.proceedFurtherExecution(false);
    }
  }
  
  private setOperatorAndChangeFilterFlags(): void {
    this.isOperatorFilterChoosed = this.searchRequest.OperaterFilter === 1;
    this.isChangeFilterChoosed = this.searchRequest.ChangesFilter === 0;
  }
  
  private loadSearchRequestIfAmend(): void {
    if (this.sharedService.isAmendSearchOpen) {
      this.searchRequest = this.sharedService.searchRequest;
      this.openEdit();
    }
  }
  
  private checkAndLoadJourneyType(): void {
    if (this.sharedService?.searchRequest?.DepartureLocation) {
      this.getJourneyTypeOnLoad();
      this.passengerDetailLabel = this.getPassengerDetailLabel();
    }
  }

  getJourneyTypeOnLoad() {
    this.searchRequest = this.sharedService.searchRequest;
    if (this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.oneWay) {
      this.journeyType = this.enhancedTravelSolutionTypesEnum?.single?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.single?.slice(1);
    }
    else if ([this.enhancedTravelSolutionTypesEnum?.return, this.enhancedTravelSolutionTypesEnum?.forward].indexOf(this.searchRequest.TravelSolutionDirection) > -1) {
      this.journeyType = this.enhancedTravelSolutionTypesEnum?.return?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.return?.slice(1);
      this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.return; //Added this because in case of return, value was 'FORWARD', which fails return scenario checks for 'RETURN' resultinfg in no call to getTravelSol (FGPICOET-138)
    }
    else {
      this.journeyType = 'Open-Return';
    }
  }

  removingCojData() {
    if (JSON.parse(localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.isCOJChange)) === true) {
      localStorage.removeItem(this.enhancedLocalOrSessionStorageKeyEnum?.isCOJChange);
      if (this.sharedService) {
        this.sharedService.reviewBuyCache = null;
        this.sharedService.reviewBuyResponse = null;
        //Set shared cache data
        this.sharedService.setSharedCache();
        this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
        this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
      }
    }
  }
  removeUpgradeData() {
    this.storageDataService.clearSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.isUpgradeChange);
  }

  getRailcardStationData() {
    if (!this.sharedService.isAmendSearchOpen) {
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

  getRailcardStations(responseData: any): void {
    if (responseData.ResponseCode !== '200') {
      this.handleErrorResponse(responseData);
      return;
    }
  
    this.sharedService.railcardStationMasterData = responseData?.Data;
    let disabledDates = this.getDisabledDates(this.sharedService?.railcardStationMasterData?.DisabledDates);
  
    this.sharedService.railcardStationMasterData.DisabledDatesinString = disabledDates;
  
    localStorage.setItem(this.enhancedLocalOrSessionStorageKeyEnum?.disableDates, JSON.stringify(disabledDates));
    localStorage.setItem(this.enhancedLocalOrSessionStorageKeyEnum?.railcardStationList, JSON.stringify(responseData.Data));
  
    if (this.sharedService?.railcardStationMasterData?.Railcard) {
      this.commonServices.railCardsList = this.sharedService.railcardStationMasterData.Railcard;
    }
  
    this.cacheSharedData();
  }
  
  private getDisabledDates(disabledDatesList: any) {
    return disabledDatesList.map(date => new Date(date).getTime());
  }
  
  private handleErrorResponse(responseData: any): void {
    this.railcardStationData = JSON.parse(localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.railcardStationList) ?? '{}');
    if (this.railcardStationData?.Railcard) {
      this.commonServices.railCardsList = this.railcardStationData.Railcard;
    }
  }
  
  private cacheSharedData(): void {
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
    this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
  }

  mobilePperatorFilterSubmitEdit(){
    this.enhancedRxjsService.event$.subscribe(data => {
      if(data){
        if(data?.selectedFilter == this.enhancedJourneyFilter?.bothFilter){
          this.isOperatorFilterChoosed = false;
          this.isChangeFilterChoosed = false;
          this.BothFilterSubmitEditInCaseOfMobile();
        } else if(data?.selectedFilter == this.enhancedJourneyFilter?.avantiFilter){
          this.isChangeFilterChoosed = false;
          this.isOperatorFilterChoosed = this.isOperatorFilterChoosed ? false : this.isOperatorFilterChoosed;
          this.operatorFilterSubmitEdit();
        } else if (data?.selectedFilter == this.enhancedJourneyFilter?.directFilter) {
          this.isChangeFilterChoosed = this.isChangeFilterChoosed ? false : this.isChangeFilterChoosed;
          this.isOperatorFilterChoosed = false;
          this.changeFilterSubmitEdit();
        } else {
          this.clearFilters();
        }
      }
    });
  }

  getQueryString(): void {
    this.commonServices.loaderRequired = true;
    try {
      let queryString = localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.searchQueryString);
      if (!environment.production) {
        queryString = this.getMockQueryString();
      }
      if (!queryString?.includes("?")) {
        localStorage.setItem(
          this.localStorageKeyEnum.checkoutFlowStrategy,
          this.quickBuyEnum.default
        );
        return;
      }
      this.sharedService.mixingDeckUrl = queryString;
      let params = new HttpParams({ fromString: queryString.split("?")[1] });
      this.createSearchRequestDataFromQueryString(params);
      this.populateSearchRequest(params);
      this.sharedService.searchRequest = structuredClone(this.searchRequest);
      localStorage.setItem("search", JSON.stringify(this.searchRequest));
      localStorage.setItem(
        this.localStorageKeyEnum.checkoutFlowStrategy,
        this.quickBuyEnum.default
      );
      this.searchRequest.DepartureTimesStartShow = new Date(
        this.searchRequest.DepartureTimesStart
      );
    } catch (error) {
      console.error(
        this.enhancedMixingDeckConsoleErrorMessage?.queryStringConsoleErrorMessage,
        error
      );
    }
  }

  getAllTravelSolution(isNreSearch) {
    if(this.isMobile || this.isTablet){
      this.setFooterBtnText();
    } else {
      this.nextPage = this.enhancedFooterButtonText?.selectTicketAndClassText;
    }
    
    if (!this.searchRequest?.Searchtype) {
      this.searchRequest.Searchtype = "";
    }
    if (!this.searchRequest?.SearchtypeReturn) {
      this.searchRequest.SearchtypeReturn = "";
    }
    this.searchRequest.DepartureTimesStart = moment(
      new Date(this.searchRequest?.DepartureTimesStart)
    ).format("YYYY-MM-DDTHH:mm");
    //In case of return journey we got travel solution direction as forward
    if (
      this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return ||
      this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.forward
    ) {
      this.isReturnDataLoad = true;
      this.searchRequest.IsReturnRequest = true;
      this.onReturnSection = this.searchRequest.IsReturnRequest ? false : true;
      this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
      this.getTravelSolutionInCaseOfReturn(isNreSearch);
    } else if (
      this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.oneWay ||
      this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn
    ) {
      if (this.searchRequest.retainedSingleDepartureTimeStart) {
        this.searchRequest.DepartureTimesStart = moment(
          this.searchRequest.retainedSingleDepartureTimeStart
        ).format("YYYY-MM-DDTHH:mm");
      }
      if (this.searchRequest.Searchtype) {
        this.searchRequest.JourneySearchType = this.searchRequest.Searchtype;
        this.setEarlierLaterSearchDates();
      }
      this.searchRequest.ReturnTimesStart = null;
      this.getTravelSolutionsAPI_Call(isNreSearch);
    }
  }

  getTravelSolutionInCaseOfReturn(isNreSearch){
    this.searchRequest.ReturnTimesStart = moment(
        new Date(this.searchRequest.ReturnTimesStart)
      ).format("YYYY-MM-DDTHH:mm");
      if (
        this.searchRequest.Searchtype ||
        this.searchRequest.SearchtypeReturn
      ) {
        // earlierLater Changes
        if (this.isReturnDataLoad) {
          // earlierLater Changes
          this.searchRequest.JourneySearchTypeReturn =
            this.searchRequest.SearchtypeReturn;

          this.getFirstAndLastTrainDepartRetTimeStart();
        } else{
          this.searchRequest.JourneySearchType = this.searchRequest.Searchtype;
          this.doesAvantiTravelSolExistsInCaseReturnDtafalse();
        }
      }
      if (localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE)) {
        let nreStorageDataObj = JSON.parse(localStorage.getItem(this.localStorageKeyEnum?.nreDataResponse));
        if(nreStorageDataObj?.SearchRequest){
          this.searchRequest = nreStorageDataObj?.SearchRequest;
        }
      }
      this.getTravelSolutionsAPI_Call(isNreSearch);
  }

  doesAvantiTravelSolExistsInCaseReturnDtafalse(): void {
    let travelSolutions = this.searchResponse?.TravelSolutions;
    if (!travelSolutions?.length) return;
  
    this.isRetainedReturnTimeStart();
  
    let firstSol = travelSolutions[0];
    let lastSol = travelSolutions[travelSolutions.length - 1];
  
    this.setTrainTimes(firstSol, lastSol);
  
    if (this.searchRequest.Traveltype === this.enhancedTravelTypeEnum?.departAfter) {
      this.getDepartAndRetTimeStartInCaseSearchType();
    } else {
      this.searchRequest.DepartureTimesStart = this.getArrivalBasedDepartureTime();
    }
  
    this.retainedDepartureTimesStart = this.searchRequest.DepartureTimesStart;
  }

  getDepartAndRetTimeStartInCaseSearchType() {
      if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.earilier) {
        let numberOfMlSeconds = new Date(this.searchRequest.FirstTrainDepartureTimesStart).getTime();
        let subtractMlSeconds = 20 * 60 * 60 * 1000;
        this.searchRequest.DepartureTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
      } else if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.later) {
  
        this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
  
        if (this.searchRequest.SearchtypeReturn == this.enhancedSearchTypeEnum?.earilier && (new Date(this.searchRequest.DepartureTimesStart).getDate() == new Date(this.searchRequest.ReturnTimesStart).getDate())) {
          let numberOfMlSeconds = new Date(this.searchReturnResponse.TravelSolutions[0].DepartureDate).getTime();
          let subtractMlSeconds = 0.25 * 60 * 60 * 1000;
          this.searchRequest.ReturnTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
        }
      }
  }

  getFirstAndLastTrainDepartRetTimeStart(): void {
    let travelSolutions = this.searchReturnResponse?.TravelSolutions;
    if (!travelSolutions?.length) return;
  
    if (this.retainedDepartureTimesStart) {
      this.searchRequest.DepartureTimesStart = moment(new Date(this.retainedDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
    }
  
    let firstSol = travelSolutions[0];
    let lastSol = travelSolutions[travelSolutions.length - 1];
  
    this.setReturnTrainTimes(firstSol, lastSol);
    this.getDepartAndRetTimeStartInCaseOfTravelType();
    this.retainedReturnTimesStart = this.searchRequest.ReturnTimesStart;
  }

  getDepartAndRetTimeStartInCaseOfTravelType() {
    if (this.searchRequest.TraveltypeReturn == this.enhancedTravelTypeEnum?.departAfter) {
      if (this.searchRequest.SearchtypeReturn == this.enhancedSearchTypeEnum?.earilier) {
        let numberOfMlSeconds = new Date(
          this.searchRequest.FirstTrainDepartureTimesStartReturn
        ).getTime();
        let subtractMlSeconds = 20 * 60 * 60 * 1000;
        this.searchRequest.ReturnTimesStart = moment(
          new Date(numberOfMlSeconds - subtractMlSeconds)
        ).format("YYYY-MM-DDTHH:mm");
        let addFifteenMins = 0.25 * 60 * 60 * 1000;
        if (
          this.searchRequest.ReturnTimesStart <=
          this.searchResponse?.TravelSolutions[
            this.searchResponse?.TravelSolutions.length - 1
          ].DepartureDate
        ) {
          //when see earlier of return -- returnTimestart would be outwards last train departture time plus 15 min
          let numberOfMlSecondsOne = new Date(
            this.searchResponse?.TravelSolutions[
              this.searchResponse?.TravelSolutions.length - 1
            ].DepartureDate
          ).getTime();
          this.searchRequest.ReturnTimesStart = moment(
            new Date(numberOfMlSecondsOne + addFifteenMins)
          ).format("YYYY-MM-DDTHH:mm");
        }
      } else if (this.searchRequest.SearchtypeReturn == this.enhancedSearchTypeEnum?.later) {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(
          new Date(this.searchRequest.LastTrainDepartureTimesStartReturn)
        ).format("YYYY-MM-DDTHH:mm");
      }
    } else {
      if (this.searchRequest.SearchtypeReturn == this.enhancedSearchTypeEnum?.earilier) {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(
          new Date(
            this.searchRequest.FirstTrainArrivalTimesStartReturn
          ).setHours(23, 59)
        ).format("YYYY-MM-DDTHH:mm");
      } else if (this.searchRequest.SearchtypeReturn == this.enhancedSearchTypeEnum?.later) {
        // earlierLater Changes
        this.searchRequest.ReturnTimesStart = moment(
          new Date(
            this.searchRequest.LastTrainArrivalTimesStartReturn
          ).setHours(23, 59)
        ).format("YYYY-MM-DDTHH:mm");
      }
    }
  }

  isRetainedReturnTimeStart() {
    if (this.retainedReturnTimesStart) {
      this.searchRequest.ReturnTimesStart = moment(
        new Date(this.retainedReturnTimesStart)
      ).format("YYYY-MM-DDTHH:mm");
    }
  }

 getTravelSolutionsAPI_Call(isNreSearch) {
    this.isLoaderActive = true;
    if(!this.isOutward && !this.isReturn){
      this.isReturnFareSelected = false;
      this.isOutwardFareSelected = false;
      this.showOutward = true;
      this.showReturn = this.isMobile || this.isTablet ? false : true;
      this.isUserClickedReturnBtn = false;
    } else if(!this.isOutward && this.isReturn && this.isReturnFareSelected){
      this.searchReturnResponse = null;
      this.isReturnFareSelected = !this.isReturnFareSelected;
      this.returnFarePreselectedValue = null;
      this.sharedService.isDisabledContinue.next(true);
    } else if(this.isOutward) {
      this.searchResponse = null;
      this.isOutwardFareSelected = false;
      this.outwardFarePreselectedValue = null;
      this.sharedService.isDisabledContinue.next(true);
    } else if (this.isReturn) {
      this.searchReturnResponse = null;
      this.isReturnFareSelected = false;
      this.returnFarePreselectedValue = null;
      this.sharedService.isDisabledContinue.next(true);
    }
    this.createDataForPassingWhileNavigating();
    this.enhancedSearchSolutionService
      .enhancedGetSolutions(this.searchRequest)
      .subscribe((res) => {
        if (res != null) {
          this.isLoaderActive = false;
          this.responseData = res as ResponseData;
          this.searchRequest.TravelSolutionDirection =
            this.searchRequest.TravelSolutionDirection !== this.enhancedTravelSolutionTypesEnum?.openReturn && this.searchRequest.TravelSolutionDirection !== this.enhancedTravelSolutionTypesEnum?.oneWay 
              ? this.enhancedTravelSolutionTypesEnum?.return
              : this.searchRequest.TravelSolutionDirection;
          if (this.responseData.ResponseCode == "200") {
            let notrainavailable;
            this.sharedService.isSearchApiError = false;
            this.sharedService.isEarlierLaterSearchApiError = false;
            this.sharedService.isSearchErrorSoldOut = false;
            this.sharedService.isReturnSearchErrorSoldOut = false;
            this.sharedService.isTrainDepartedOrCancelled = false;
            if (this.doesSingleTravelExists()) {
              this.searchResponse = this.responseData?.Data?.SingleTravel;
              this.isHideEarlier = this.searchResponse.HideEarlier;
              this.isHideLater = this.searchResponse.HideLater;
              this.searchRequest.DepartureTimesStartShow = this.searchResponse ? this.searchResponse?.Date : this.searchRequest.DepartureTimesStartShow;
              localStorage.setItem(
                this.localStorageKeyEnum.reviewMergedFlowAppSetting,
                String(this.searchResponse.IsReviewMergedFlowEnabled)
              );
              if (this.searchResponse != null) {
                notrainavailable = this.searchResponse.TravelSolutions.filter(
                  (a) => !a.IsTrainClosed
                );
                this.fineNoTrainsAvailable(notrainavailable);
              }
            }
            this.resetJourneySummaryModelForSingleTravel();
            this.getSearchResReturnInCaseOfRetTravel(notrainavailable);
            this.clearAllSearchResponseReturn();
            this.getDepartAndReturnTimeStart();
            this.setTravelSolutionsForOpenReturn();
            let isShowInfoPopup = this.isReturn ? this.searchReturnResponse?.IsShowPopup : this.searchResponse?.IsShowPopup;
            if(isShowInfoPopup && (this.isOutward || this.isReturn)){
              let message = this.isReturn ? this.searchReturnResponse?.Message : this.searchResponse?.Message;
              let heading = this.isOutward ? this.mixingDeckPopupHeadingEnum?.outwardDateUpdated : this.mixingDeckPopupHeadingEnum?.returnDateUpdated;
              this.showCommonPopupForUserInformation(message, heading);
            } else if (this.searchResponse?.IsShowPopup && this.searchReturnResponse?.IsShowPopup && !this.isOutward && !this.isReturn) {
                let message = this.mixingDeckPopupMsgEnum?.outwardAndReturnDateUpdatedMsg;
                let heading = this.mixingDeckPopupHeadingEnum?.outWardAndReturnDateUpdate;
                this.showCommonPopupForUserInformation(message, heading);
            }
            else if (this.searchResponse?.IsShowPopup && !this.isOutward && !this.isReturn){
              let message = this.searchResponse?.Message;
              let heading = this.mixingDeckPopupHeadingEnum?.outwardDateUpdated;
              this.showCommonPopupForUserInformation(message, heading);
            } else if (this.searchReturnResponse?.IsShowPopup && !this.isReturn && !this.isOutward) {
              let message = this.searchReturnResponse?.Message;
              let heading = this.mixingDeckPopupHeadingEnum?.returnDateUpdated;
              this.showCommonPopupForUserInformation(message, heading);
            }
            if(this.isBackFromTicketClass){
              this.selectedJourneyFromBackToTicketAndClass(this.searchResponse, this.searchReturnResponse);
              this.isBackFromTicketClass = false;
            }
            if(!this.isOutward && !this.isReturn && !this.isFilterClicked){
              this.callGa4DataLayerEventsOnSuccess();

              //monetate call for search
              this.monetateService.setAddTrainSearchData(this.searchRequest);
              this.monetateService.flushEvents();
            }
            if (this.isOutward || this.isReturn) {
              this.getSelectedCardMsgOnEarlierLater(this.searchResponse, this.searchReturnResponse);
            }
            if((this.searchRequest.OperaterFilter === 1 || this.searchRequest.ChangesFilter === 0) || this.selectedFilterArray.includes('Clear')){
              this.callGa4DataLayerEventsOnFilterChange(this.enhancedFilterStatusEnum?.updateText);
            }
              let getDataFromNRE = localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE) === "true";
              let nreStorageDataObj = JSON.parse(localStorage.getItem(this.localStorageKeyEnum?.nreDataResponse));
              if (isNreSearch) {
                this.ticketNotFound();
              }
              if(getDataFromNRE){
                this.markSelectedTravelFromNRE(nreStorageDataObj, this.searchResponse, this.searchReturnResponse);
                localStorage.removeItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE);
              }
            
          } else if(this.responseData.ResponseCode == '201') {
            this.selectedFilterArray = [];
            this.checkJourneySearchTypeValue();
            let responseMessage = this.responseData?.ResponseMessage;
             if(!this.isOutward && !this.isReturn && !this.isFilterClicked){
              this.callGa4DataLayerEventsOnError();

              //monetate call for search
              this.monetateService.setAddTrainSearchData(this.searchRequest);
              this.monetateService.flushEvents();
             }
            if (
              !this.responseData?.Data?.SingleTravel &&
              this.searchRequest?.PromotionCode !== ""
            ) {
              this.sharedService.journeySummaryModel.IsPromo = true;
            }
            if (this.responseData?.Data?.IsNoResultsForChangesFilters) {
              let heading = this.mixingDeckPopupHeadingEnum?.noResultWithFilter;
              this.showCommonPopupForUserInformation(this.responseData?.Data?.ChangesFilterMessage, heading);
            } else if(this.responseData?.Data?.IsNoResultsForOperartorFilters){
              let heading = this.mixingDeckPopupHeadingEnum?.noResultWithFilter;
              this.showCommonPopupForUserInformation(this.responseData?.Data?.OperartorFilterMessage, heading);
            } else if (responseMessage.includes('No more trains available')) {
              this.openTrainNotAvailablePopup(this.mixingDeckPopupHeadingEnum?.noTrainsAvailableHeading, this.mixingDeckPopupMsgEnum?.noTrainsAvailableMessage, this.enhancedModalFooterMessageEnum?.editSearchTxt, true);
            }
            this.callGa4DataLayerEventsOnFilterChangeError(this.enhancedFilterStatusEnum?.updateText);
          } else if(this.responseData.ResponseCode == '202') {
              this.callGa4DataLayerEventsOnError();
              this.selectedFilterArray = [];
              this.checkJourneySearchTypeValue();
              this.openTrainNotAvailablePopup(this.mixingDeckPopupHeadingEnum?.noTrainsAvailableHeading, this.mixingDeckPopupMsgEnum?.noTrainsAvailableMessage, this.enhancedModalFooterMessageEnum?.editSearchTxt, true);
              this.callGa4DataLayerEventsOnFilterChangeError(this.enhancedFilterStatusEnum?.updateText);
          } else {
            this.callGa4DataLayerEventsOnError();
            this.selectedFilterArray = [];
            this.checkJourneySearchTypeValue();
            this.openTrainNotAvailablePopup(this.mixingDeckPopupHeadingEnum?.somethingWentWronhErrorHeading, this.mixingDeckPopupMsgEnum?.somethingWentWrongErrorMessage, this.enhancedModalFooterMessageEnum?.searchAgainTxt, false);
            this.callGa4DataLayerEventsOnFilterChangeError(this.enhancedFilterStatusEnum?.updateText);
          }
          localStorage.removeItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE);
        }
      });
    }

  private getDepartAndReturnTimeStart(): void {
    const {
      evaluateRequest,
      firstTravelSolDepartureTimeAmend,
      secondTravelSolDepartureTimeAmend,
      editQttDepartureTimeStart,
      editQttReturnTimeStart,
    } = this.sharedService;

    const { TravelSolutions, Request } = this.searchResponse || {};

    const isSearchValid =
      evaluateRequest && this.searchResponse && TravelSolutions;

    if (isSearchValid) {
      if (firstTravelSolDepartureTimeAmend) {
        let formattedDeparture = moment(
          firstTravelSolDepartureTimeAmend
        ).format("YYYY-MM-DDTHH:mm");
        this.searchRequest.DepartureTimesStart = formattedDeparture;
        if (Request) {
          Request.DepartureTimesStart = formattedDeparture;
        }
      }

      if (secondTravelSolDepartureTimeAmend) {
        let formattedReturn = moment(
          secondTravelSolDepartureTimeAmend
        ).format("YYYY-MM-DDTHH:mm");
        this.searchRequest.ReturnTimesStart = formattedReturn;
        this.searchReturnResponse.Request.ReturnTimesStart = formattedReturn;
      }
    }

    const { JourneySearchType, JourneySearchTypeReturn } = this.searchRequest;

    let isEarlierLaterSearch =
      JourneySearchType === this.enhancedSearchTypeEnum?.earilier ||
      JourneySearchType === this.enhancedSearchTypeEnum?.later ||
      JourneySearchTypeReturn === this.enhancedSearchTypeEnum?.earilier ||
      JourneySearchTypeReturn === this.enhancedSearchTypeEnum?.later;

    if (isEarlierLaterSearch) {
      this.searchRequest.DepartureTimesStart = editQttDepartureTimeStart;

      if (editQttReturnTimeStart) {
        this.searchRequest.ReturnTimesStart = editQttReturnTimeStart;
      }
    }
  }

  private clearAllSearchResponseReturn() {
    if (
      this.responseData.Data.ReturnTravel == null &&
      this.searchRequest.Searchtype == "" &&
      this.searchRequest.SearchtypeReturn == ""
    ) {
      this.searchReturnResponse = null;
    }

    if (
      this.responseData.Data.SingleTravel &&
      this.responseData.Data.ReturnTravel &&
      this.responseData.Data.SingleTravel.TravelSolutions == null &&
      this.responseData.Data.ReturnTravel.TravelSolutions == null
    ) {
      this.searchResponse = null;
      this.searchReturnResponse = null;
    }
  }

  private getSearchResReturnInCaseOfRetTravel(notrainavailable) {
    if (this.responseData.Data.ReturnTravel) {
      let returnnotavailable;
      this.searchReturnResponse = this.responseData.Data.ReturnTravel;
      this.isHideEarlierReturn = this.searchReturnResponse.HideEarlier;
      this.isHideLaterReturn = this.searchReturnResponse.HideLater;
      this.searchRequest.ReturnTimesStartShow = this.searchReturnResponse?.TravelSolutions ? this.searchReturnResponse?.Date : this.searchRequest?.ReturnTimesStartShow;

      if (
        new Date(this.searchReturnResponse.Date).getFullYear().toString() ===
        "1"
      ) {
        this.searchReturnResponse.Date = new Date(
          this.searchRequest.ReturnTimesStart
        );
      }
      if (this.searchReturnResponse.TravelSolutions != null) {
        returnnotavailable = this.searchReturnResponse.TravelSolutions.filter(
          (a) => !a.IsRetTrainClosed
        );

        if (returnnotavailable.length <= 0) {
          this.sharedService.isReturnSearchErrorSoldOut = true;
          this.sharedService.timeoutErrorMessage =
            this.errorMessageEnum.soldOutErrorMessage;
        }
      }
      if (
        returnnotavailable &&
        returnnotavailable.length <= 0 &&
        notrainavailable &&
        notrainavailable.length <= 0
      ) {
        this.sharedService.isSearchErrorSoldOut = true;
        this.sharedService.isReturnSearchErrorSoldOut = true;
        this.sharedService.timeoutErrorMessage =
          this.errorMessageEnum.soldOutErrorMessage;
      }
    }
  }

  private resetJourneySummaryModelForSingleTravel() {
    this.sharedService.journeySummaryModel ??= new JourneySummaryModel();

    if (this.searchResponse) {
      this.sharedService.journeySummaryModel.IsPromo =
        this.searchResponse.IsPromo;
    } else if (!this.searchResponse && this.searchRequest?.PromotionCode !== "")  {
        this.sharedService.journeySummaryModel.IsPromo = true;
    }

    if (
      !this.responseData?.Data?.SingleTravel &&
      !this.searchRequest.Searchtype &&
      !this.searchRequest.SearchtypeReturn
    ) {
      this.searchResponse = null;
    }
  }

  private fineNoTrainsAvailable(notrainavailable) {
    if (notrainavailable.length <= 0) {
      this.sharedService.isSearchErrorSoldOut = true;
      this.sharedService.timeoutErrorMessage =
        this.errorMessageEnum.soldOutErrorMessage;
    }
    let departedOrCacelledTrain = this.searchResponse.TravelSolutions.filter(
      (a) => !(a.IsAlreadyDepartured || a.IsCancelled)
    );
    if (departedOrCacelledTrain.length <= 0) {
      this.sharedService.isTrainDepartedOrCancelled = true;
    }
  }

  private doesSingleTravelExists(): boolean {
    return !!this.responseData?.Data?.SingleTravel?.TravelSolutions;
  }

  private createSearchRequestDataFromQueryString(params) {
    this.searchRequest.DepartureLocationName = params.get("oriName");
    this.searchRequest.ArrivalLocationName = params.get("destName");
    this.searchRequest.DepartureLocation = +params.get("oriCode");
    this.searchRequest.ArrivalLocation = +params.get("destCode");
    this.searchRequest.PathConstraintLocation = +params.get("viaCode");
    this.searchRequest.JourneySearchType = "NEW";
    this.searchRequest.JourneySearchTypeReturn = "NEW";
    this.searchRequest.FirstTrainDepartureTimesStart = "";
    this.searchRequest.LastTrainDepartureTimesStart = "";
    this.searchRequest.FirstTrainArrivalTimesStart = "";
    this.searchRequest.LastTrainArrivalTimesStart = "";
    this.searchRequest.Adult = +params.get("noa");
    this.searchRequest.Child = +params.get("noc");
    this.searchRequest.Traveltype =
      params.get("oadInd") === "Leave After" ? this.enhancedTravelTypeEnum?.departAfter : this.enhancedTravelTypeEnum?.arriveBy;
    this.searchRequest.PromotionCode =
      params.get("prmCode") != undefined &&
      params.get("prmCode") != null &&
      params.get("prmCode") !== ""
        ? params.get("prmCode")
        : "";
    this.searchRequest.TicketClassFilter = "";
    this.searchRequest.ChangesFilter = 1;
    this.searchRequest.OperaterFilter = 0;
  }

  private setSearchRequestDataForReturnJourneyType(params) {
    this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
    this.searchRequest.IsReturnRequest = true;
    let dateStringOne = params.get("inDate");
    let datePartsOne = dateStringOne.split("/");
    let dateObjectReturn = new Date(
      +datePartsOne[2],
      +datePartsOne[1] - 1,
      +datePartsOne[0]
    );
    dateObjectReturn.setHours(+params.get("inHourField"));
    dateObjectReturn.setMinutes(+params.get("inMinuteField"));
    this.searchRequest.ReturnTimesStart =
      moment(dateObjectReturn).format("YYYY-MM-DDTHH:mm");
    //Added a property so on earlier/later editQtt input dates do not change
    this.sharedService.editQttReturnTimeStart =
      this.searchRequest.ReturnTimesStart;
    this.journeyType = this.enhancedTravelSolutionTypesEnum?.return?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.return?.slice(1);;
    this.searchRequest.TraveltypeReturn =
      params.get("oadIndReturn") === "Leave After" ? this.enhancedTravelTypeEnum?.departAfter : this.enhancedTravelTypeEnum?.arriveBy;
  }

  private getMockQueryString(): string {
    return `http://localhost:4200/search-results?oriCode=700010000&oriName=London Euston (EUS)&destCode=700010017&destName=Manchester Piccadilly (MAN)&oadInd=Leave After&outHourField=13&outMinuteField=00&outDate=17/09/2025&jt=Single&noa=1&noc=0`;
  }

  private populateSearchRequest(params: HttpParams): void {
    let journeyType = params.get("jt");

    switch (journeyType?.toLowerCase()) {
      case this.enhancedTravelSolutionTypesEnum?.single:
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.oneWay;
        this.searchRequest.IsReturnRequest = false;
        this.journeyType = this.enhancedTravelSolutionTypesEnum?.single?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.single?.slice(1);;
        break;
      case this.enhancedTravelSolutionTypesEnum?.return?.toLowerCase():
      case this.enhancedTravelSolutionTypesEnum?.forward?.toLowerCase():
        this.setSearchRequestDataForReturnJourneyType(params);
        break;
      default:
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.openReturn;
        this.searchRequest.IsReturnRequest = false;
        this.journeyType = "Open-Return";
    }

    this.setDepartureTime(params);
    this.sharedService.editQttDepartureTimeStart =
      this.searchRequest.DepartureTimesStart;
    this.passengerDetailLabel = this.getPassengerDetailLabel();

    this.addRailcardsFromParams(params);
  }

  private getPassengerDetailLabel() {
    let isAdultOrAdults: string =
      this.searchRequest.Adult.toString() + (this.searchRequest.Adult > 1)
        ? " adults "
        : " adult ";
    let isChildOrChildren =
      this.searchRequest.Child.toString() + (this.searchRequest.Child > 1)
        ? " children "
        : " child ";
    let isChildAvailable =
      this.searchRequest.Child > 0 ? ", " + isChildOrChildren : "";
    return isAdultOrAdults + isChildAvailable;
  }

  private setDepartureTime(params: HttpParams): void {
    let dateParts = (params.get("outDate") ?? "").split("/");
    let dateObject = new Date(
      +dateParts[2],
      +dateParts[1] - 1,
      +dateParts[0]
    );

    dateObject.setHours(+(params.get("outHourField") ?? 0));
    dateObject.setMinutes(+(params.get("outMinuteField") ?? 0));

    this.searchRequest.DepartureTimesStart =
      moment(dateObject).format("YYYY-MM-DDTHH:mm");
  }

  private addRailcardsFromParams(params: HttpParams): void {
    let rCount = +(params.get("rCount") ?? "0");
    for (let i = 0; i < rCount; i++) {
      let index = (i + 1).toString();
      let railCardCode = params.get(`rcCode${index}`);
      let adult = +(params.get(`rcNoa${index}`) ?? "0");
      let child = +(params.get(`rcNoc${index}`) ?? "0");
      let railCardCount = +(params.get(`rcNum${index}`) ?? "0");
      let railcard = new EnhancedRailCardModel();
      railcard.RailCard = railCardCode;
      railcard.Adult = adult;
      railcard.Child = child;
      railcard.RailCardCount = railCardCount;
      this.searchRequest.RailCardList.push(railcard);
    }
  }

  onOutwardFareSelection(event, isFromReturn = false): void {
  let selectedIndex = this.searchResponse?.TravelSolutions.findIndex(x => x.TravelSolId == event.value)
  let solutions = this.searchResponse?.TravelSolutions ?? [];
  this.outwardFarePreselectedValue = event.value;
  let selected = false;

  solutions.forEach((ts, index) => {
    let isEnabled = !this.isRadioDisabled(ts);

    if (!isEnabled) {
      ts["isSelected"] = false; // Always ensure disabled ones are not selected
      return;
    }

    let isCurrent = index === selectedIndex;

    ts["isSelected"] = isCurrent;

    if (isCurrent) {
      this.selectedOutwardFare = ts;
      selected = true;
    }
  });

  this.isOutwardFareSelected = selected;
  if(this.isReturnFareSelected || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.oneWay || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn){
    this.sharedService.isDisabledContinue.next(false);
  }
  if (this.isOutwardFareSelected && !isFromReturn) {
    this.createDataForPassingWhileNavigating();
  }
  this.setJourneySummaryModelForOutward();
}

  setJourneySummaryModelForOutward(){
    try {
      let tempFarelist = this.selectedOutwardFare?.FareList?.filter(m => m.Price == this.selectedOutwardFare?.SingleFare);
      this.sharedService.journeySummaryModel ??= new JourneySummaryModel();
      this.sharedService.journeySummaryModel.SingleTime = this.selectedOutwardFare?.DarwinDepartureTime + ' → ' + this.selectedOutwardFare?.DarwinArrivalTime;
      this.sharedService.journeySummaryModel.SingleDuration = this.selectedOutwardFare?.Duration;
      this.sharedService.journeySummaryModel.SingleChanges = this.selectedOutwardFare?.Changes;
      this.sharedService.journeySummaryModel.SingleTicketType = tempFarelist[0]?.TicketTypeName;
      this.sharedService.journeySummaryModel.SingleCurrency = tempFarelist[0]?.Currency;
      this.sharedService.journeySummaryModel.SinglePrice = tempFarelist[0]?.Price;
      this.sharedService.journeySummaryModel.SingleTicketDescription = tempFarelist[0]?.TicketDescription;
      this.sharedService.journeySummaryModel.SingleOperator = this.selectedOutwardFare?.Operator;
      this.sharedService.journeySummaryModel.SingleOperatorChange = this.selectedOutwardFare?.OperatorChange;
      this.sharedService.journeySummaryModel.SingleSaleCompany = this.selectedOutwardFare?.SaleCompany;
      this.sharedService.journeySummaryModel.SingleSelectedFare = tempFarelist[0];
      this.sharedService.journeySummaryModel.SingleSearchCache = this.searchResponse?.Request?.SearchCache;
      this.sharedService.journeySummaryModel.SingleRouteModel = this.selectedOutwardFare;
    } catch (error){
      console.log(error);
    }
  }

  setJourneySummaryModelForReturn(){
    try{
      let tempFarelist = this.selectedReturnFare?.FareList?.filter(m => m.Price == this.selectedReturnFare?.SingleFare);
      this.sharedService.journeySummaryModel ??= new JourneySummaryModel();
      this.sharedService.journeySummaryModel.ReturnTime = this.selectedReturnFare?.DarwinDepartureTime + ' → ' + this.selectedReturnFare?.DarwinArrivalTime;
      this.sharedService.journeySummaryModel.ReturnDuration = this.selectedReturnFare?.Duration;
      this.sharedService.journeySummaryModel.ReturnChanges = this.selectedReturnFare?.Changes;
      if(this.checkTraveSolutionDirection()){
          this.sharedService.journeySummaryModel.ReturnTicketType = this.sharedService?.journeySummaryModel?.SingleTicketType;
      } else {
        this.sharedService.journeySummaryModel.ReturnTicketType = tempFarelist[0]?.TicketTypeName;
      }
      this.sharedService.journeySummaryModel.ReturnCurrency = tempFarelist[0]?.Currency;
      this.sharedService.journeySummaryModel.ReturnPrice = tempFarelist[0]?.Price;
      this.sharedService.journeySummaryModel.ReturnTicketDescription = tempFarelist[0]?.TicketDescription;
      this.sharedService.journeySummaryModel.ReturnOperator = this.selectedReturnFare?.Operator;
      this.sharedService.journeySummaryModel.ReturnOperatorChange = this.selectedReturnFare?.OperatorChange;
      this.sharedService.journeySummaryModel.ReturnSaleCompany = this.selectedReturnFare?.SaleCompany;
      this.sharedService.journeySummaryModel.ReturnSelectedFare = tempFarelist[0];
      this.sharedService.journeySummaryModel.ReturnSearchCache = this.searchResponse?.Request?.SearchCache;
      this.sharedService.journeySummaryModel.ReturnRouteModel = this.selectedReturnFare;
    } catch(error){
      console.log(error);
    }
  }

  checkTraveSolutionDirection(){
    return (this.searchRequest.TravelSolutionDirection == 'OPEN_RETURN' ? true : (this.searchRequest.TravelSolutionDirection == 'RETURN' ? (this.sharedService?.journeySummaryModel?.IsSingleFareSelected ? false : true) : false)) 
    && !(this.sharedService.isSearchErrorSoldOut || this.sharedService.isReturnSearchErrorSoldOut);
  }

  showReturnDivInMobile(){
    if (this.isMobile || this.isTablet) {
      if(this.searchReturnResponse){
        window.history.pushState({ part: this.travelSolutionEnum.returnString }, '', window.location.href);
        this.showOutward = false;
        this.showReturn = true;
        this.scrollToElement("returnDiv");
      }
    } else {
      this.showOutward = true;
      this.showReturn = true;
    }
  }

  onReturnFareSelection(event) {
    
    let selectedIndex = this.searchReturnResponse?.TravelSolutions.findIndex(x => x.TravelSolId == event.value)
    let solutions = this.searchReturnResponse?.TravelSolutions ?? [];
    this.returnFarePreselectedValue = event.value;
    let selected = false;

     solutions.forEach((ts, index) => {
    let isEnabled = !this.isRadioDisabled(ts);

    if (!isEnabled) {
      ts["isSelected"] = false; // Always ensure disabled ones are not selected
      return;
    }

      let isCurrent = index === selectedIndex;

      ts["isSelected"] = isCurrent;

      if (isCurrent) {
        this.selectedReturnFare = ts;
        selected = true;
      }
    });

    this.isReturnFareSelected = selected;
    if(this.isOutwardFareSelected){
      this.sharedService.isDisabledContinue.next(false);
    }
    if (this.isReturnFareSelected) {
      this.createDataForPassingWhileNavigating();
    }
    this.setJourneySummaryModelForReturn();
  }

  createDataForPassingWhileNavigating(): void {
    let {
      Adult,
      Child,
      RailCardList
    } = this.searchRequest ?? {};
  
    let singleFare = !this.isReturnFareSelected ? this.selectedOutwardFare?.SingleFare : 0;
  
    let returnFare = this.selectedReturnFare?.ReturnFare ?? 0;
    let selectedReturnSingleFare = this.selectedReturnFare?.SingleFare ?? 0;
    let outwardFare = this.selectedOutwardFare?.SingleFare ?? 0;
  
    let totalFare = this.getTotalFare(returnFare, selectedReturnSingleFare, outwardFare);
  
    this.data = {
      selectedReturnTravelSolution: this.isReturnFareSelected ? this.selectedReturnFare : "",
      selectedOutwardTravelSolution: this.isOutwardFareSelected ? this.selectedOutwardFare : "",
      reDirectedUrl: "/select-ticket-and-class",
      selectedAdult: Adult,
      selectedChild: Child,
      selectedRailcard: RailCardList,
      singleFare,
      totalFare,
      isOutwardSelected: this.isOutwardFareSelected,
      isReturnSelected: this.isReturnFareSelected,
      journeySummaryModel: this.sharedService.journeySummaryModel,
      OpenReturnExpiryDate: this.selectedOutwardFare?.OpenReturnExpiryDate
    };
  }

  getTotalFare(returnFare, selectedReturnSingleFare, outwardFare){
    let totalFare = 0;
    if (this.isReturnFareSelected) {
      if (returnFare === 0) {
        totalFare = selectedReturnSingleFare + outwardFare;
      } else {
        totalFare = returnFare + outwardFare;
      }
    }
    return totalFare;
  }

  onClickGetEarlierSearch() {
    this.isOutwardFareSelected = false;
    if(this.searchRequest?.IsReturnRequest){
      this.onClickReturnGetEarlierSearch(false, true);
    } else{
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedSeeEarlierAndLaterTrainTextEnum?.seeEarlierTrains,this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText, `/${this.enhancedAppRouteEnum?.searchResult}`, null, true);
    this.isOutward = true;
    this.isReturn = false;
    this.searchRequest.Searchtype = this.enhancedSearchTypeEnum?.earilier;
    this.searchRequest.SearchCache = this.searchResponse?.Request?.SearchCache;
    this.searchRequest.SearchIndex = this.searchResponse?.Request?.SearchIndex;
    this.searchRequest.TravelSolCount =
      this.searchResponse?.Request?.TravelSolCount;
    this.searchRequest.JourneySearchType = this.searchRequest?.Searchtype;
    //this.doesAvantiTravelSolExistsInCaseReturnDtafalse();
    this.getAllTravelSolution(false);
    }
  }

  onClickGetLaterSearch() {
    this.isOutwardFareSelected = false;
    if(this.searchRequest?.IsReturnRequest){
      this.onClickReturnGetLaterSearch(false, true);
    } else {
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedSeeEarlierAndLaterTrainTextEnum?.seeLaterTrains,this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText, `/${this.enhancedAppRouteEnum?.searchResult}`, null, true);
    this.isOutward = true;
    this.isReturn = false;
    this.searchRequest.Searchtype = this.enhancedSearchTypeEnum?.later;
    this.searchRequest.SearchCache = this.searchResponse?.Request?.SearchCache;
    this.searchRequest.SearchIndex = this.searchResponse?.Request?.SearchIndex;
    this.searchRequest.TravelSolCount =
      this.searchResponse?.Request?.TravelSolCount;
    this.searchRequest.JourneySearchType = this.searchRequest?.Searchtype;
    //this.doesAvantiTravelSolExistsInCaseReturnDtafalse();
    this.getAllTravelSolution(false);
    }
  }

  onClickReturnGetEarlierSearch(isReturnCase, isOutwardEarlier) {
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedSeeEarlierAndLaterTrainTextEnum?.seeEarlierTrains,this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText, `/${this.enhancedAppRouteEnum?.searchResult}`, null, true);
    if (this.isOutwardBeforeReturnJourney() || !isReturnCase) {
      this.isOutward = isOutwardEarlier;
      this.isReturn = !isOutwardEarlier;
      this.isReturnDataLoad = isReturnCase;
      if (this.isReturnDataLoad) {
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
        this.searchRequest.SearchCacheReturn =
          this.searchReturnResponse?.Request?.SearchCacheReturn;
        this.searchRequest.SearchIndexReturn =
          this.searchReturnResponse?.Request?.SearchIndexReturn;
        this.searchRequest.TravelSolCountReturn =
          this.searchReturnResponse?.Request?.TravelSolCountReturn;
        this.searchRequest.SearchtypeReturn = this.enhancedSearchTypeEnum?.earilier;
      }
      else {
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
        this.searchRequest.SearchCache = this.searchResponse?.Request?.SearchCache;
        this.searchRequest.SearchIndex = this.searchResponse?.Request?.SearchIndex;
        this.searchRequest.TravelSolCount = this.searchResponse?.Request?.TravelSolCount;
        this.searchRequest.Searchtype = this.enhancedSearchTypeEnum?.earilier;
      }
      this.getTravelSolutionInCaseOfReturn(false);
    } else {
      let message = this.mixingDeckPopupMsgEnum?.selectDifferentReturnTimeMsg;
      let heading = this.mixingDeckPopupHeadingEnum?.selectDifferentReturnTime;
      this.showCommonPopupForUserInformation(message, heading);
    }
  }

  onClickReturnGetLaterSearch(isReturnCase, isOutwardLater) {
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedSeeEarlierAndLaterTrainTextEnum?.seeLaterTrains,this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText, `/${this.enhancedAppRouteEnum?.searchResult}`, null, true);
    if (this.isOutwardBeforeReturnJourney() || isReturnCase) {
      this.isOutward = isOutwardLater;
      this.isReturn = !isOutwardLater;
      this.isReturnDataLoad = isReturnCase;
      if (this.isReturnDataLoad) {
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
        this.searchRequest.SearchCacheReturn =
          this.searchReturnResponse?.Request?.SearchCacheReturn;
        this.searchRequest.SearchIndexReturn =
          this.searchReturnResponse?.Request?.SearchIndexReturn;
        this.searchRequest.TravelSolCountReturn =
          this.searchReturnResponse?.Request?.TravelSolCountReturn;
        this.searchRequest.SearchtypeReturn = this.enhancedSearchTypeEnum?.later;
      }
      else {
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.forward;
        this.searchRequest.SearchCache = this.searchResponse?.Request?.SearchCache;
        this.searchRequest.SearchIndex = this.searchResponse?.Request?.SearchIndex;
        this.searchRequest.TravelSolCount = this.searchResponse?.Request?.TravelSolCount;
        this.searchRequest.Searchtype = this.enhancedSearchTypeEnum?.later;
      }
      this.getTravelSolutionInCaseOfReturn(false);
    } else {
      let message = this.mixingDeckPopupMsgEnum?.selectDifferentReturnTimeMsg;
      let heading = this.mixingDeckPopupHeadingEnum?.selectDifferentReturnTime;
      this.showCommonPopupForUserInformation(message, heading);
    }
  }

  isRadioDisabled(travelSolution: any): boolean {
    let ts = travelSolution ?? {};
    return (
      ts.IsTrainClosed === true ||
      ts.IsAlreadyDepartured === true ||
      ts.IsCancelled === true ||
      ts.IsSaleable === true
    );
  }

  getTravelSolutionStatus(travelSolution: any): string {
    if (travelSolution?.IsTrainClosed) {
      return this.travelSolutionStatusEnum?.soldOutText;
    }
    if (travelSolution?.IsAlreadyDepartured) {
      return this.travelSolutionStatusEnum?.departedText;
    }
    if (travelSolution?.IsCancelled) {
      return this.travelSolutionStatusEnum?.cancelledText;
    }
    if (travelSolution?.IsSaleable) {
      return this.travelSolutionStatusEnum?.noFareAvailable;
    }
    if (this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn) {
      return this.travelSolutionStatusEnum?.openReturnCardText;
    }
    return this.travelSolutionStatusEnum?.oneWayText;
  }

  isTravelSolutionAvailable(travelSolution: any): boolean {
    return (
      !travelSolution?.IsSaleable &&
      !travelSolution?.IsAlreadyDepartured &&
      !travelSolution?.IsSoldOutService &&
      !travelSolution?.IsCancelled &&
      !travelSolution?.IsTrainClosed &&
      !travelSolution?.IsSaleable
    );
  }

  isOutwardBeforeReturnJourney(): boolean {
    let outwardLength = this.searchResponse?.TravelSolutions?.length;
    let returnLength = this.searchReturnResponse?.TravelSolutions?.length;

    let outwardLastTrain = outwardLength
      ? this.searchResponse.TravelSolutions[outwardLength - 1]
      : null;

    let returnFirstTrain = returnLength
      ? this.searchReturnResponse.TravelSolutions[0]
      : null;

    if (!outwardLastTrain || !returnFirstTrain) {
      return true; // Can't compare, assume valid
    }

    return outwardLastTrain.ArrivalDate < returnFirstTrain.DepartureDate;
  }

  isButtonDisabled(): boolean {
    return (
      !this.isOutwardFareSelected ||
      (this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return && !this.isReturnFareSelected)
    );
  }

  setEarlierLaterSearchDates() {
      if (this.searchResponse && this.searchResponse.TravelSolutions) {
        this.searchRequest.FirstTrainDepartureTimesStart = this.searchResponse.TravelSolutions[0].DepartureDate;
        this.searchRequest.LastTrainDepartureTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].DepartureDate;
        this.searchRequest.FirstTrainArrivalTimesStart = this.searchResponse.TravelSolutions[0].ArrivalDate;
        this.searchRequest.LastTrainArrivalTimesStart = this.searchResponse.TravelSolutions[this.searchResponse.TravelSolutions.length - 1].ArrivalDate;
        if (this.searchRequest.Traveltype == this.enhancedTravelTypeEnum?.departAfter) {
          if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.earilier) {
            let numberOfMlSeconds = new Date(this.searchRequest.FirstTrainDepartureTimesStart).getTime();
            let subtractMlSeconds = 20 * 60 * 60 * 1000;
            this.searchRequest.DepartureTimesStart = moment(new Date(numberOfMlSeconds - subtractMlSeconds)).format('YYYY-MM-DDTHH:mm');
          } else if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.later) {
            this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainDepartureTimesStart)).format('YYYY-MM-DDTHH:mm');
          }
        } else {
          if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.earilier) {
  
            this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.FirstTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
          } else if (this.searchRequest.Searchtype == this.enhancedSearchTypeEnum?.later) {
            this.searchRequest.DepartureTimesStart = moment(new Date(this.searchRequest.LastTrainArrivalTimesStart).setHours(23, 59)).format('YYYY-MM-DDTHH:mm');
          }
        }
        // retaining modified departuretimestart to use on return from travel extra 
        this.searchRequest.retainedSingleDepartureTimeStart = this.searchRequest.DepartureTimesStart;
      }
  }

  openEnhancedRouteDetailInfo(row, isReturnTicket) {
    let selectedFare = this.sharedService.formatPrice(row?.SingleFare);;
    let previousSelectedTravelSolution;
    if(!isReturnTicket) {
      previousSelectedTravelSolution = this.selectedOutwardFare;
    } else {
      previousSelectedTravelSolution = this.selectedReturnFare;
    }
    this.loadGTMDataLayeronExpandingSolutions(row,isReturnTicket, selectedFare, previousSelectedTravelSolution);
    this.dialog.open(EnhancedJourneyDetailsAndItineraryDialogsComponent, {
      disableClose: true,
      panelClass: [this.dynamicClassEnum?.enhancedCommonPopupPanelClass, this.dynamicClassEnum?.journeyDetailItinearyPanelClass],
      width: '72rem',
      autoFocus: false,
      data: {
        TravelSolutionCache: row.TravelSolutionCache,
        TravelSolutionId: row.TravelSolId,
        SaleCompanyId: row.SaleCompanyId,
        Changes: row.Changes,
        Duration: row.Duration,
        IsDisruption: row.IsDelayed,
        SearchCustomCache: isReturnTicket ? this.searchReturnResponse.Request.SearchCacheReturn : this.searchResponse.Request.SearchCache
      }
    });
  }

 
     enhancedWhysThatSoldOutTicketPopup(isSaleable: boolean){
       this.dialog.open(EnhancedJourneySummaryDialogsComponent, {
         disableClose: true,
         panelClass: ['ticket-detail-mobile'],
         width: "45rem",
         autoFocus: false,
         data: {
          isSaleable: isSaleable
         }
       });
     
    }
 enhancedClassDetailsDialogs(){
   this.dialog.open(EnhancedClassDetailsDialogsComponent, {
    disableClose: true,
    panelClass: [this.dynamicClassEnum?.filterRangePanelClass],
    width: '72rem',
 
  autoFocus: false,
 
 
 });
 
 }
 
 enhancedPriceBreakdownDialogs(){
   this.dialog.open(EnhancedPriceBreakdownDialogs, {
    disableClose: true,
    panelClass: [this.dynamicClassEnum?.filterRangePanelClass],
    width: '600px',
 
  autoFocus: false,
 
 
 }); 
 
 }

 EnhancedRailcardRestrictionsDialogs(){
  this.dialog.open(EnhancedRailcardRestrictionsDialogs, {
   disableClose: true,
   panelClass: [ this.dynamicClassEnum?.filterRangePanelClass, this.dynamicClassEnum?.enhancedRailcardNotAppliedPanelClass],
   width: '600px',

 autoFocus: false,


});

}
 
EnhancedReturnDateAndTimeDialog(){
  this.dialog.open(EnhancedReturnDateAndTimeDialog, {
   disableClose: true,
   panelClass: [this.dynamicClassEnum?.filterRangePanelClass],
   width: '600px',

      autoFocus: false,
    });
  }

  submitEdit(isSuccessful: boolean): void {
    if(isSuccessful){
      this.sharedService.isStationListAPILoaderRequired = false;
      this.outwardFarePreselectedValue = null;
      this.returnFarePreselectedValue = null;
      this.isReturnFareSelected = false;
      this.isOutwardFareSelected = false;
      this.showOutward = true;
      this.showReturn = this.isMobile || this.isTablet ? false : true;
      this.isOutward = false;
      this.isReturn = false;
      this.isUserClickedReturnBtn = false;
      this.searchResponse = null;
      this.searchReturnResponse = null;
      this.isHideEarlier = true;
      this.isHideLater = true;
      this.isHideEarlierReturn = true;
      this.isHideLaterReturn = true;
    } else {
      if(this.searchRequest?.ReturnTimesStart == null && this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.return){
        this.searchRequest.TravelSolutionDirection = this.enhancedTravelSolutionTypesEnum?.oneWay;
      }
      window.scroll(0,0);
    }
    this.enhancedRxjsService.setSharedData(null);
    if(!this.isCancelVisibleBtn){
      this.isChangeFilterChoosed = false;
      this.isOperatorFilterChoosed = false;
      this.sharedService.amendSearchRequest.OperaterFilter = 0;
      this.sharedService.amendSearchRequest.ChangesFilter = 1;
    }
    this.isCancelVisibleBtn = true;
    this.displayPromotionalBanner = false;
    this.showEdit = false;
    if (!isSuccessful) return;

    let result = structuredClone(this.sharedService.amendSearchRequest);
    if (!result) return;

    this.searchRequest = structuredClone(result);
    this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
    this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
    this.getChangedFilterValue();

    this.resetJourneySearchTypes();
    this.clearTrainTimes();

    this.sharedService.searchRequest = structuredClone(this.searchRequest);
    this.getRailCards();

    this.updateSharedStorage();
    this.resetSearchErrors();
    this.passengerDetailLabel = this.getPassengerDetailLabel();

    this.journeyType = this.getJourneyType(result.TravelSolutionDirection);
    this.retainedDepartureTimesStart = null;
    this.retainedReturnTimesStart = null;
    this.getAllTravelSolution(false);
  }

  private resetJourneySearchTypes(): void {
    this.searchRequest.JourneySearchType = this.enhancedSearchTypeEnum?.new;
    this.searchRequest.JourneySearchTypeReturn = this.enhancedSearchTypeEnum?.new;
    if (!this.searchRequest?.Searchtype) {
      this.searchRequest.Searchtype = '';
    }
    if(!this.searchRequest.SearchtypeReturn){
      this.searchRequest.SearchtypeReturn = '';
    }
  }

  private clearTrainTimes(): void {
    let empty = "";
    Object.assign(this.searchRequest, {
      FirstTrainDepartureTimesStart: empty,
      LastTrainDepartureTimesStart: empty,
      FirstTrainArrivalTimesStart: empty,
      LastTrainArrivalTimesStart: empty,
      FirstTrainDepartureTimesStartReturn: empty,
      LastTrainDepartureTimesStartReturn: empty,
      FirstTrainArrivalTimesStartReturn: empty,
      LastTrainArrivalTimesStartReturn: empty,
    });
  }

  private updateSharedStorage(): void {
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
    this.storageDataService.setStorageData(
      this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
      this.sharedServiceCache,
      true
    );
  }

  private resetSearchErrors(): void {
    this.sharedService.isSearchApiError = false;
    this.sharedService.isEarlierLaterSearchApiError = false;
  }

  private getJourneyType(direction): string {
    switch (direction) {
      case this.enhancedTravelSolutionTypesEnum?.oneWay:
        return this.enhancedTravelSolutionTypesEnum?.single?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.single?.slice(1);
      case this.enhancedTravelSolutionTypesEnum?.return:
        return this.enhancedTravelSolutionTypesEnum?.return?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.return?.slice(1);;
      default:
        return "Open-Return";
    }
  }

  getChangedFilterValue(): void {
    if (this.isSubmitViaFilters) {
      this.searchRequest.OperaterFilter = Number(this.isOperatorFilterChoosed);
      this.searchRequest.ChangesFilter = this.isChangeFilterChoosed ? 0 : 1;
      this.isSubmitViaFilters = false;
    } else {
      this.isOperatorFilterChoosed = this.searchRequest.OperaterFilter === 1;
      this.isChangeFilterChoosed = this.searchRequest.ChangesFilter === 0;
    }
  }

  operatorFilterSubmitEdit() {
    this.isFilterClicked = true;
    this.isSubmitViaFilters = true;
    this.isOperatorFilterChoosed = !this.isOperatorFilterChoosed;
    this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
    this.setSelectedFilterArrayInAvantiTrains();
    this.submitEdit(true);
  }

  changeFilterSubmitEdit() {
    this.isFilterClicked = true;
    this.isSubmitViaFilters = true;
    this.isChangeFilterChoosed = !this.isChangeFilterChoosed;
    this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
    this.setSelecteFilterArrayInDirectTrains();
    this.submitEdit(true);
  }

  getRailCards() {
    if (
      this.searchRequest.RailCardList != null &&
      this.searchRequest.RailCardList.length > 0
    ) {
      let railCard = "";
      if (this.searchRequest.RailCardList.length == 1)
        railCard = this.commonServices?.railCardsList
          ?.filter(
            (x) => x.Code == this.searchRequest.RailCardList[0].RailCard
          )[0]
          .Name.toString();
      else railCard = "Multiple Railcards";
      if (this.sharedService.journeySummaryModel != null) {
        this.sharedService.journeySummaryModel.RailCards = railCard;
      } else {
        this.sharedService.journeySummaryModel = new JourneySummaryModel();
        this.sharedService.journeySummaryModel.RailCards = railCard;
      }
    }
  }

  private setTrainTimes(first: any, last: any): void {
    this.searchRequest.FirstTrainDepartureTimesStart = first.DepartureDate;
    this.searchRequest.LastTrainDepartureTimesStart = last.DepartureDate;
    this.searchRequest.FirstTrainArrivalTimesStart = first.ArrivalDate;
    this.searchRequest.LastTrainArrivalTimesStart = last.ArrivalDate;
  }
  
  private getArrivalBasedDepartureTime(): string {
    let isEarlier = this.searchRequest.Searchtype === this.enhancedSearchTypeEnum?.earilier;
    let baseDate = isEarlier
      ? this.searchRequest.FirstTrainArrivalTimesStart
      : this.searchRequest.LastTrainArrivalTimesStart;
  
    return moment(new Date(baseDate).setHours(23, 59)).format("YYYY-MM-DDTHH:mm");
  }

  private setReturnTrainTimes(first: any, last: any): void {
    this.searchRequest.FirstTrainDepartureTimesStartReturn = first.DepartureDate;
    this.searchRequest.LastTrainDepartureTimesStartReturn = last.DepartureDate;
    this.searchRequest.FirstTrainArrivalTimesStartReturn = first.ArrivalDate;
    this.searchRequest.LastTrainArrivalTimesStartReturn = last.ArrivalDate;
  }
  
  private formatDate(date: string | Date): string {
    return moment(new Date(date)).format("YYYY-MM-DDTHH:mm");
  }

  openEdit() {
    this.sharedService.isStationListAPILoaderRequired = true;
    this.isFilterClicked = false;
    this.sharedService.amendSearchRequest = structuredClone(this.searchRequest);
    this.showEdit = true;
    this.sharedService.isDisabledContinue.next(true);
    this.sharedService.setJourneyTxtMode(false);
    this.enhancedGA4DataLayerService?.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedGA4DataLayerEventNameEnum?.editNameText, this.enhancedGA4DataLayerEventNameEnum?.editActionName, undefined, undefined, true, true);
  }
  // added to hide editqtt in case we get travel soln while doing earlier/later after soldout case
  hideEditQtt(){
    this.showEdit = false;
    this.isDisabledContinue = false;
  }

  //Getting shared cache data on browser refresh
  getSharedCacheData(isRedirectFromHomePage: boolean): void {

    let cachedData = this.storageDataService.getStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, true);
    if (!this.nullOrUndefinedCheckForSharedServiceRefresh(cachedData)) return;
  
    this.commonServices.loaderRequired = true;
    let shared = this.sharedService;
  
    shared.reviewBuyCache = cachedData.reviewBuyCache;
    shared.ReservationCache = cachedData.ReservationCache;
    shared.journeySummaryModel = cachedData.journeySummaryModel;
    shared.enhancedReviewBuyResponse = cachedData.enhancedReviewBuyResponse;
    shared.locationMasterData = cachedData.locationMasterData;
    shared.LatestJourneyCache = cachedData.LatestJourneyCache;
    shared.selectedJourneyDataForQuickBuyOrContiue = cachedData?.selectedJourneyDataForQuickBuyOrContiue ?? [];
    shared.reviewBuyResponse = cachedData?.reviewBuyResponse;
    if (this.nullorUndefinedCheckForReviewBuyResponseOfSharedSibling()) {
      shared.getBasketCount.emit(shared.reviewBuyResponse.BasketCount);
    }
  
    if (isRedirectFromHomePage) {
      shared.fareBreakdownModelData = new Array<FareBreakdownModel>();
      shared.searchRequest = structuredClone(this.searchRequest);
      shared.isAmendSearchOpen = false;
    } else {
      shared.searchRequest = cachedData.searchRequest;
      shared.searchRequest.OperaterFilter = 0;
      shared.searchRequest.ChangesFilter = 1;
      shared.fareBreakdownModelData = cachedData.fareBreakdownModelData;
      shared.isAmendSearchOpen = cachedData.isAmendSearchOpen ?? false;
      shared.editQttDepartureTimeStart = cachedData.editQttDepartureTimeStart;
  
      if (cachedData.searchRequest?.ReturnTimesStart) {
        shared.editQttReturnTimeStart = cachedData.editQttReturnTimeStart;
      }
    }
  
      // for showing basket icon when go back from review-buy to search-results
      this.emitBasketCount(shared);
  
    if (shared.reviewBuyResponse?.IsRenewSmartcard) {
      shared.reviewBuyResponse = null;
    }

    shared.setSharedCache();
    this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
    this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
  }

  nullOrUndefinedCheckForSharedServiceRefresh(sharedSiblingRefresh){
      return sharedSiblingRefresh != null && sharedSiblingRefresh != undefined;
  }
    
  nullorUndefinedCheckForReviewBuyResponseOfSharedService(shared) {
    return shared?.enhancedReviewBuyResponse;
  }

  clearFilters(){
    this.selectedFilterArray = ['Clear'];
    this.isSubmitViaFilters = true;
    this.isOperatorFilterChoosed = false;
    this.isChangeFilterChoosed = false
    this.sharedService.amendSearchRequest = structuredClone(this.sharedService.searchRequest);
    this.submitEdit(true);
  }

  getFareMessage(newFareList: any[], newReturnFareList: any[], travelSolution): string {
    let classOrder = [this.classTypeEnum?.standardClass, this.classTypeEnum?.stdPremiumClass, this.classTypeEnum?.firstClass];
    let unavailableClasses : string[] = [];
    newFareList = this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn ? travelSolution?.FareList : newFareList;
    newReturnFareList = this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn ? travelSolution?.NewFareList : newReturnFareList;
    newFareList?.forEach(ticket => {
      ticket?.FareList?.forEach(fare => {
        let firstClass;
        firstClass = fare?.TicketClass == 'First' ? this.classTypeEnum?.firstClass : fare?.TicketClass;
        if (!fare?.IsSeatNotAvailable && fare?.TicketClass && !unavailableClasses?.includes(firstClass)) {
          unavailableClasses.push(firstClass);
        }
      });
    });

    newReturnFareList?.forEach(ticket => {
      ticket?.FareList?.forEach(fare => {
        let firstClass;
        firstClass = fare?.TicketClass == 'First' ? this.classTypeEnum?.firstClass : fare?.TicketClass;
        if (!fare?.IsSeatNotAvailable && fare?.TicketClass && !unavailableClasses?.includes(firstClass)) {
          unavailableClasses.push(firstClass);
        }
      });
    });

    if (
      unavailableClasses.length === 0 ||
      (unavailableClasses.includes(this.classTypeEnum.standardClass) &&
      unavailableClasses.includes(this.classTypeEnum.stdPremiumClass) &&
      unavailableClasses.includes(this.classTypeEnum.firstClass))
    ) {
      return '';
    }

    // Return in required order
    let sortedResult = classOrder.filter(cls => unavailableClasses.includes(cls));

    let last = sortedResult.pop();
    let joined = sortedResult.length ? sortedResult.join(", ") + " and " + last : last;

    return `${joined} Class only`;
  }

  onClickOfAddReturnJourney(){
    this.showDatepickerPopup(false);
  } 
 
  showDatepickerPopup(isDepart) {
    let dialogRef = this.dialog.open(EnhancedDatepickerPopupComponent, {
      disableClose: true,
 autoFocus: false,
      panelClass: this.dynamicClassEnum?.enhancedDatePickerPanelClass,
      data: {
        DepartureTimesStart: this.searchRequest?.DepartureTimesStart,
        ReturnTimesStart: null,
        TraveltypeReturn: null,
        Traveltype: this.enhancedTravelTypeEnum?.departAfter,
        isDepart: isDepart,
        IsOpenReturn: false,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.showEdit = true;
        this.sharedService.amendSearchRequest = structuredClone(
          this.searchRequest
        );
        this.sharedService.amendSearchRequest.TravelSolutionDirection =
          this.enhancedTravelSolutionTypesEnum?.return;
        let data = {
          result: result,
          isDepart: isDepart,
          amendSearchRequest: this.sharedService.amendSearchRequest,
        };
        this.enhancedRxjsService.setSharedData(data);
        this.sharedService.isDisabledContinue.next(true);
        this.sharedService.setJourneyTxtMode(false);
        window.scroll(0,0);
      } else {
        this.showEdit = false;
      }
    });
  }

  showOrHideNoTrainAvailableReturnDiv(){
    return this.searchResponse && this.searchResponse?.TravelSolutions?.length > 0 && this.searchReturnResponse && !this.searchReturnResponse?.TravelSolutions;
  }

  showOrHideNoTrainAvailableOutwardDiv(){
    return this.searchReturnResponse && this.searchReturnResponse?.TravelSolutions?.length > 0 && this.searchResponse && !this.searchResponse?.TravelSolutions;
  }

  openTrainNotAvailablePopup(errorHeading, errorMessage, footerBtnText, isNoTrainPopup) {
    let dialogRef = this.dialog.open(EnhancedNoTrainAvailableDialogs, {
      disableClose: true,
      panelClass: [this.dynamicClassEnum?.enhancedFooterAlertCommonPanelClass],
      width: "45rem",
      autoFocus: false,
      data: {
        errorHeading: errorHeading,
        errorMessage: errorMessage,
        footerBtnText: footerBtnText,
        isNoTrain: isNoTrainPopup,
        hideCancelbutton: () => this.hideCancelbutton(),
      },
    });
    dialogRef.afterClosed().subscribe((result) => {});
  }

  hideCancelbutton(){
    this.isCancelVisibleBtn = false;
    this.isChangeFilterChoosed = false;
    this.isOperatorFilterChoosed = false;
    this.openEdit();
  }

  showCommonPopupForUserInformation(message, heading){
    let dialogRef = this.dialog.open(EnhancedSearchInformationDialogs, {
      disableClose: true,
      panelClass: [this.dynamicClassEnum?.enhancedFooterAlertCommonPanelClass],
      width: "45rem",
      autoFocus: false,
      data: {
        Message: message,
        isReturn: this.isReturnDataLoad,
        isOutwardClicked: this.isOutward,
        isReturnClicked: this.isReturn,
        heading: heading,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (heading == this.mixingDeckPopupHeadingEnum?.noResultWithFilter) {
        this.isSubmitViaFilters = true;
        this.isOperatorFilterChoosed = false;
        this.isChangeFilterChoosed = false;
        this.submitEdit(true);
      }
    });
  }

  
getAriaLabel(travelSolution: any): string {
    try {
      if (!travelSolution) return '';
      let labels: string[] = [];
      if (!travelSolution?.isSelected) {
        if (travelSolution.IsFastest) labels.push('Fastest');
        if (travelSolution.IsCheapest) labels.push('Cheapest');
        if (travelSolution.IsLimitedTickets) labels.push('Limited tickets');
        let operatorLabel = this.getOperatorLabelText(travelSolution);
        let journeyTime = this.commonServices.formatdurationTime(travelSolution?.Duration);
        let changesLabel = travelSolution?.Changes === 0 ? `direct` : `with ${travelSolution?.Changes} ${travelSolution?.Changes === 1 ? 'change' : 'changes'}`;
        let fareLabel = this.isTravelSolutionAvailable(travelSolution) ? `${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(travelSolution?.SingleFare)}` : '';
        let operatorFareMessage = (travelSolution?.Operator === 2 || travelSolution?.Operator === 1) ? this.getFareMessage(travelSolution?.NewFareList, travelSolution?.NewReturnFareList, travelSolution) : '';
        let infoMessageForSelectJourney = `Select this card to proceed with this journey. For more journey details, use the journey details and itinerary link.`
        if ((travelSolution.Operator === 1 || travelSolution.Operator === 2)) {
          labels.push(`${operatorLabel} departs ${travelSolution?.DarwinDepartureTime}. arrives ${travelSolution?.DarwinArrivalTime} ${journeyTime} ${changesLabel} ${this.getTravelSolutionStatus(travelSolution)} ${fareLabel}. ${operatorFareMessage}`);
        } else if (travelSolution.Operator === 3) {
          if (travelSolution.SaleCompany) {
            labels.push(`${travelSolution.SaleCompany} departs ${travelSolution?.DarwinDepartureTime}, arrives ${travelSolution?.DarwinArrivalTime} ${journeyTime} ${changesLabel} ${this.getTravelSolutionStatus(travelSolution)} ${fareLabel}. ${operatorFareMessage}`);
          }
        } else if (travelSolution.Operator === 4) {
          labels.push(`Multiple operators departs ${travelSolution?.DarwinDepartureTime}, arrives ${travelSolution?.DarwinArrivalTime} ${journeyTime} ${changesLabel} ${this.getTravelSolutionStatus(travelSolution)} ${fareLabel}. ${operatorFareMessage}`);
        }
        return labels.join(', ');
      }
    } catch (error) { console.log(error); }
  }

  getAriaLabelAfterSelected(travelSolution, isOutward) {
    if (travelSolution && travelSolution?.isSelected) {
      if (isOutward) {
        if (this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return) {
          return this.enhancedAccessbilityMessageEnum?.outwardAndRetSelected;
        } else if (this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn) {
          return this.enhancedAccessbilityMessageEnum?.openReturnSelected;
        }
        return this.enhancedAccessbilityMessageEnum?.outwardSelected;
      } else {
        return this.enhancedAccessbilityMessageEnum?.bothJourneySelected;
      }
    }
  }

  setTravelSolutionsForOpenReturn() {
    if (this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn) {
      if (this.searchResponse?.TravelSolutions != null) {
        this.searchResponse.TravelSolutions.forEach(travelSolution => {
          travelSolution.SingleFare = travelSolution.ReturnFare;
          travelSolution.FareList = travelSolution.ReturnFareList;
          travelSolution.NewFareList = travelSolution.NewReturnFareList;
          travelSolution.IsStandardFare = travelSolution.IsRetStandardFare;
          travelSolution.IsStandardPremiumFare = travelSolution.IsRetStandardPremiumFare;
          travelSolution.IsFirstClassFare = travelSolution.IsRetFirstClassFare;
        });
      }
    }
  }

  showRailCardAsLabelIfOpted(){
    let data =  !this.searchResponse?.IsPromo && 
          !this.searchReturnResponse?.IsPromo && 
          this.searchRequest?.RailCardList?.length > 0 && 
          (this.sharedService.journeySummaryModel?.RailCards != null);
    return data;
  }

  getAriaLabelForDisabledJourney(travelSolution) {
    try {
      if (this.isRadioDisabled(travelSolution)) {
        let operatorLabel = this.getOperatorLabelText(travelSolution);
        if (travelSolution?.IsSoldOutService) {
          return `${operatorLabel} departs at ${travelSolution?.DarwinDepartureTime}, arrives at ${travelSolution?.DarwinArrivalTime}. Tickets for this train has been sold out online`;
        }
        if (travelSolution?.IsCancelled) {
          return `${operatorLabel} departs at ${travelSolution?.DarwinDepartureTime}, arrives at ${travelSolution?.DarwinArrivalTime} has been cancelled.`;
        }
        return;
      }
      return;
    } catch (error) { console.log(error); }
  }

  getOperatorLabelText(travelSolution) {
    return travelSolution?.OperatorChange > 0 ? this.enhancedAccessbilityMessageEnum?.otherTrainOperator : this.enhancedAccessbilityMessageEnum?.avantiTrainOperator;
  }

  setIndexValueForFocusToDisabledCard(travelSolution: any) {
    if (travelSolution?.IsTrainClosed || travelSolution?.IsCancelled) {
      return true;
    }
    return false;
  }

  getAriaLabelForJourneyTitle(searchRequest, isOutward) {
    try {
      if (!searchRequest) return;
      let date = isOutward ? this.datePipe?.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe?.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');
      let from = this.commonServices.getCityNameOnly(isOutward ? searchRequest?.DepartureLocationName : searchRequest?.ArrivalLocationName);
      let to = this.commonServices.getCityNameOnly(isOutward ? searchRequest?.ArrivalLocationName : searchRequest?.DepartureLocationName);
      let journeyLabel = isOutward ? `outward` : `return`;
      return `Select ${journeyLabel} train: ${date} from ${from} to ${to}`
    } catch (error) { console.log(error); }
  }

  getAriaLabelForOpenReturnJourney(searchRequest) {
    try {
      if (!searchRequest) return;
      return `Open return: from ${this.commonServices.getCityNameOnly(searchRequest?.ArrivalLocationName)} to ${this.commonServices.getCityNameOnly(searchRequest?.DepartureLocationName)}`
    } catch (error) { console.log(error); }
  }

  scrollToElement(divId): void {
    setTimeout(() => {
      document.getElementById(divId).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }, 200);
  }

  handleUserClick(event: boolean) {
    this.isUserClickedReturnBtn = event;
  }

  conditionToShowOrHideAddReturnJourneyBtn(){
    return !this.searchRequest?.IsReturnRequest && this.searchResponse && !this.isMobile && !this.isTablet && this.searchRequest?.TravelSolutionDirection !== this.enhancedTravelSolutionTypesEnum?.openReturn;
  }

  selectedJourneyFromBackToTicketAndClass(searchResponse, searchReturnResponse) {
    try {
      if (this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.oneWay || this.searchRequest.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn) {
        this.getPreSelectedOutTravelDataOnBack(searchResponse);
      }
      if (this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.forward) {
        if (!this.isMobile && !this.isTablet) {
          this.getPreSelectedOutTravelDataOnBack(searchResponse);
          this.getPreSelectedRetTravelDataOnBack(searchReturnResponse);
        } else {
          let state = history.state;
          if (state && state.part === this.travelSolutionEnum.returnString && localStorage.getItem(this.localStorageKeyEnum.viewOtherTrainTimesFromOutward) === null) {
            this.showReturn = true;
            this.showOutward = false;
            this.isUserClickedReturnBtn = true;
            this.getPreSelectedRetTravelDataOnBack(searchReturnResponse);
            this.getPreSelectedOutTravelDataOnBack(searchResponse);
            window.history.replaceState({ part: this.travelSolutionEnum.returnString }, '', window.location.href);
          } else {
            this.showReturn = false;
            this.showOutward = true;
            this.getPreSelectedOutTravelDataOnBack(searchResponse);
            window.history.replaceState({ part: this.travelSolutionEnum.outwardString }, '', window.location.href);
            localStorage.removeItem(this.localStorageKeyEnum.viewOtherTrainTimesFromOutward);
          }
          //For safety, push initial outward state if needed:
          if (!state || !state.part) {
            history.replaceState({ part: this.travelSolutionEnum.outwardString }, '', window.location.href);
          }
        }
      }
    } catch (error) { console.log(error); }
  }

  conditionToShowOfferTag(travelSolution){
    if(this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.return || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.forward) {
      return !!travelSolution?.IsOutwardPromoAvailable || !!travelSolution?.IsReturnPromoAvailable;
    } else {
      return travelSolution?.IsOutwardPromoAvailable;
    }
  }

  getPreSelectedOutTravelDataOnBack(searchResponse, isFromReturn = false) {
    try {
      if (searchResponse && searchResponse?.TravelSolutions && searchResponse?.TravelSolutions?.length > 0) {
        if (this.selectedTravelSolutionData?.selectedOutwardTravelSolution) {
          let match = searchResponse?.TravelSolutions.find(travel =>
            travel.TravelSolId === this.selectedTravelSolutionData?.selectedOutwardTravelSolution?.TravelSolId
          );
          if (match) {
            let preSelectTravelData = {
              value: match?.TravelSolId
            }
           this.onOutwardFareSelection(preSelectTravelData, isFromReturn);
          }
        }
      }
    } catch (error) { console.log(error); }
  }

  getPreSelectedRetTravelDataOnBack(searchReturnResponse) {
    try {
      if (searchReturnResponse && searchReturnResponse?.TravelSolutions && searchReturnResponse?.TravelSolutions?.length > 0) {
        if (this.selectedTravelSolutionData?.selectedReturnTravelSolution) {
          let match = searchReturnResponse?.TravelSolutions.find(travel =>
            travel.TravelSolId === this.selectedTravelSolutionData?.selectedReturnTravelSolution?.TravelSolId
          );
          if (match) {
            let preSelectTravelData = {
              value: match?.TravelSolId
            }
            this.onReturnFareSelection(preSelectTravelData);
          }
        }
      }
    } catch (error) { console.log(error); }
  }

  callGa4DataLayerEventsOnError() {
    try {
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam();
      ga4SearchEventParam.searchSource = this.enhancedGA4SearchSourceEnum?.homepageSearchSource;
      ga4SearchEventParam.searchSuccess = false;
      ga4SearchEventParam.searchError = this.responseData.ResponseMessage;
      this.ga4dataLayerService.loadGA4DataLayerOnSearch(
        this.searchRequest,
        ga4SearchEventParam,
        null,
        -1,
        null,
        null,
        null,
        true
      );


    } catch (error) {
      console.log(error);
    }
  }

  callGa4DataLayerEventsOnSuccess() {
      try {
        this.searchResponseboth = new EnhancedSearchResponseModel();
        this.searchResponseboth.TravelSolutions = this.searchResponse.TravelSolutions;
        this.searchResponseboth.RetTravelSolutions = this.searchReturnResponse ? this.searchReturnResponse.TravelSolutions : null;
        // ga4-datalayer search and view_list_item event
        let ga4SearchEventParam = new GA4SearchEventParam();
        ga4SearchEventParam.searchSource = this.enhancedGA4SearchSourceEnum?.homepageSearchSource;
        ga4SearchEventParam.searchSuccess = true;
        ga4SearchEventParam.searchError = "";
        this.ga4dataLayerService.loadGA4DataLayerOnSearch(
          this.searchRequest,
          ga4SearchEventParam,
          this.searchResponseboth,
          0,
          null,
          null,
          null,
          true
        );
      } catch (error) {
        console.log(error);
      }
  }

  loadGTMDataLayeronExpandingSolutions(element, isSingleReturnElement, selectedFare, previousSelectedTravelSolution) {
    let indexOfElement = -1;
    try {
      if (isSingleReturnElement && element?.TravelSolId !== previousSelectedTravelSolution?.TravelSolId) {
        indexOfElement = this.searchReturnResponse.TravelSolutions.indexOf(element);
        let inward = this.enhancedTravelSolutionTypesEnum?.inward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.inward?.slice(1).toLowerCase();
        this.ga4dataLayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, -1, inward, selectedFare, false, true);
      }
      else if (!isSingleReturnElement && element?.TravelSolId !== previousSelectedTravelSolution?.TravelSolId) {
        indexOfElement = this.searchResponse.TravelSolutions.indexOf(element);
        let outward = this.enhancedTravelSolutionTypesEnum?.outward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.outward?.slice(1).toLowerCase();
        this.ga4dataLayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, -1, outward, selectedFare, false, true);
      }
    } catch (err) { console.log(err); }
  }
  
  BothFilterSubmitEditInCaseOfMobile() {
    this.isSubmitViaFilters = true;
    this.isChangeFilterChoosed = !this.isChangeFilterChoosed;
    this.isOperatorFilterChoosed = !this.isOperatorFilterChoosed;
    this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
    this.submitEdit(true);
  }

  methodToCallOpenEditQTT(){
    window.scroll(0,0);
    this.openEdit();
  }

  getSelectedCardMsgOnEarlierLater(searchResponse, searchReturnResponse) {
    try {
      if (searchResponse && searchResponse?.TravelSolutions && this.isReturn && this.outwardFarePreselectedValue) {
        searchResponse?.TravelSolutions?.forEach(solution => {
          if (solution?.TravelSolId === this.outwardFarePreselectedValue) {
            solution.isSelected = true;
          }
        });
      }
      if (searchReturnResponse && searchReturnResponse?.TravelSolutions && this.isOutward && this.returnFarePreselectedValue) {
        searchReturnResponse?.TravelSolutions.forEach(solution => {
          if (solution?.TravelSolId === this.returnFarePreselectedValue) {
            solution.isSelected = true;
          }
        });
      }
    } catch (error) { console.log(error); }
  }

  checkJourneySearchTypeValue() {
    //Added a property so on earlier/later editQtt input dates do not change   
    if (this.searchRequest.JourneySearchType == 'EARLIER' || this.searchRequest.JourneySearchType == 'LATER' || this.searchRequest.JourneySearchTypeReturn == 'EARLIER' || this.searchRequest.JourneySearchTypeReturn == 'LATER') {
      this.searchRequest.DepartureTimesStart = this.sharedService.editQttDepartureTimeStart;
      if (this.sharedService.editQttReturnTimeStart)
        this.searchRequest.ReturnTimesStart = this.sharedService.editQttReturnTimeStart;
    }
  }

  callGa4DataLayerEventsOnFilterChange(filterStatus) {
      try {
        this.searchResponseboth = new EnhancedSearchResponseModel();
        this.searchResponseboth.TravelSolutions = this.searchResponse.TravelSolutions;
        this.searchResponseboth.RetTravelSolutions = this.searchReturnResponse ? this.searchReturnResponse.TravelSolutions : null;
        // ga4-datalayer search and view_list_item event
        let ga4SearchEventParam = new GA4SearchEventParam();
        ga4SearchEventParam.searchSource = this.enhancedGA4SearchSourceEnum?.homepageSearchSource;
        ga4SearchEventParam.searchSuccess = true;
        ga4SearchEventParam.searchError = "";
        let filterObject = {
          selectedFilter: this.selectedFilterArray.join(" | "),
          filterStatus: filterStatus
        }
        this.ga4dataLayerService.filterGA4DataLayerEvent(
          this.searchRequest,
          ga4SearchEventParam,
          this.searchResponseboth,
          0,
          null,
          null,
          null,
          true,
          filterObject
        );
      } catch (error) {
        console.log(error);
      }
  }

  callGa4DataLayerEventsOnFilterChangeError(filterStatus) {
    try {
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam();
      ga4SearchEventParam.searchSource = this.enhancedGA4SearchSourceEnum?.homepageSearchSource;
      ga4SearchEventParam.searchSuccess = false;
      ga4SearchEventParam.searchError = this.responseData.ResponseMessage;
      let filterObject = {
          selectedFilter: null,
          filterStatus: filterStatus
        }
      this.ga4dataLayerService.filterGA4DataLayerEvent(
        this.searchRequest,
        ga4SearchEventParam,
        null,
        -1,
        null,
        null,
        null,
        true,
        filterObject
      );

    } catch (error) {
      console.log(error);
    }
  }

  
  setSelectedFilterArrayInAvantiTrains(){
    if(this.isOperatorFilterChoosed){
      if(!this.selectedFilterArray.includes(`${this.enhancedJourneyFilter?.avantiFilter}`)){
        this.selectedFilterArray.unshift(`${this.enhancedJourneyFilter?.avantiFilter} trains`);
      }
    }else {
      if(this.selectedFilterArray.includes(`${this.enhancedJourneyFilter?.avantiFilter}`)){
        this.selectedFilterArray = this.selectedFilterArray.filter(m => m !== `${this.enhancedJourneyFilter?.avantiFilter} trains`);
      }
    }
  }

  setSelecteFilterArrayInDirectTrains(){
    if(this.isChangeFilterChoosed){
      if(!this.selectedFilterArray.includes(`${this.enhancedJourneyFilter?.directFilter}`)){
        this.selectedFilterArray.push(`${this.enhancedJourneyFilter?.directFilter} trains`);
      }
    }else {
      if(this.selectedFilterArray.includes(`${this.enhancedJourneyFilter?.directFilter}`)){
        this.selectedFilterArray = this.selectedFilterArray.filter(m => m !== `${this.enhancedJourneyFilter?.directFilter} trains`);
      }
    }
  }

  nullorUndefinedCheckForReviewBuyResponseOfSharedSibling() {
    return this.sharedService?.reviewBuyResponse;
  }

  emitBasketCount(sharedService){
    if (sharedService?.enhancedReviewBuyResponse || this.commonServices?.checkIsSeasonJourneyAvailable()) {
        let reviewBuyDetail = this.commonServices?.checkIsSeasonJourneyAvailable();
        if(reviewBuyDetail != null){
          sharedService?.getBasketCount.emit(sharedService?.reviewBuyResponse?.BasketCount);
        } else {
          sharedService?.getBasketCount.emit(sharedService?.enhancedReviewBuyResponse?.BasketCount);
        }
      }
  }

  ngOnDestroy() {
    this.sharedService.isStationListAPILoaderRequired = true;
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.enhancedAppRouteEnum.selectTicketAndClass)) {
      let selectedData = {
      outAndRetTravelSolData: this.data,
      searchResponse: this.searchResponse,
      searchReturnResponse: this.searchReturnResponse,
      mixingDeckSearchRequest: this.searchRequest
     };
    this.searchStateService.set(selectedData);
      this.router.navigate([this.enhancedAppRouteEnum.selectTicketAndClass], {
        state: { travelSolutionData: this.selectedTravelSolutionData }
      });
    }
  }

  nreHandoffData(handOffDataRequest) {
    try {
    this.searchSolutionService.nreHandOffTravelSolutionData(handOffDataRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.sharedService.evaluateRequest = null;
              this.searchRequest = this.sharedService.searchRequest = this.responseData.Data.Request;
              this.sharedService.isAmendFresh = true;
              this.sharedService.setSharedCache();
              this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
              this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
              if (this.sharedService?.searchRequest && this.sharedService?.searchRequest?.DepartureLocation) {
                this.searchRequest = this.sharedService.searchRequest;
                this.getJourneyType(this.sharedService);
                this.passengerDetailLabel = this.getPassengerDetailLabel();
              }

              this.commonServices.callApiForGetLocationMasterData();
              this.getRailcardStationData();
              if (!sessionStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.pageReloaded)) {
                this.iframeSrc = this.commonServices.trackNreHandOffUrl(this.responseData.Data, false);
                localStorage.setItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE, "true");
                localStorage.setItem(this.localStorageKeyEnum.nreDataResponse, JSON.stringify(this.responseData.Data));
              }
              this.proceedFurtherExecution(true);
            }
          }
          else {
            this.commonServices.showEnhancedCommonErrorPopup();
          }
        }
        else {
          this.commonServices.showEnhancedCommonErrorPopup();
        }

      });
    } catch(error){ console.log(error); }
  }

  ticketNotFound() {
    let dialogRef = this.dialog.open(EnhancedCommonErrorPopupComponent, {
          disableClose: true,
          panelClass: [this.dynamicClassEnum?.enhancedFooterAlertCommonPanelClass, this.dynamicClassEnum?.enhancedRailcardNotAppliedPanelClass],
          width: "45rem",
          autoFocus: false,
          data: {
            Message: `${this.errorMessageEnum.nreApiFailedErrorMessage}`,
            headerTitle: `${this.mixingDeckPopupHeadingEnum?.somethingWentWrongNreErrorTitle}`,
            isTicketNotFound: true
          },
        });
      dialogRef.afterClosed().subscribe(() => {
        this.searchRequest = this.sharedService.searchRequest;
        this.openEdit();
      });
    }

  conditionToShowGroupSaveTag(travelSolution){
    if(this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.return || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.forward) {
      return !!travelSolution?.IsOutwardGroupSaveAvailable || !!travelSolution?.IsReturnGroupSaveAvailable;
    } else {
      return travelSolution?.IsOutwardGroupSaveAvailable;
    }
  }

  markSelectedTravelFromNRE(nreStorageDataObj, searchResponse, searchReturnResponse){
    try {
      let nreOutward = nreStorageDataObj?.TravelSolutions;
      let nreReturn = nreStorageDataObj?.ReturnTravelSolutions;
      let outwardList  = searchResponse?.TravelSolutions || [];
      let returnList  = searchReturnResponse?.TravelSolutions || [];

      // --- Match Outward ---
      if (nreOutward) {
        outwardList.forEach(item => { 
          const match = this.areSolutionsSame(nreOutward, item);
          item.isSelected = match;
          if (match) {
            this.selectedOutwardFare = item;  // <-- SET SELECTED OUTWARD
            this.outwardFarePreselectedValue = item.TravelSolId; 
            this.isOutwardFareSelected = true;
            this.createDataForPassingWhileNavigating();
          }
        });
      }

      // --- Match Return ---
      if (nreReturn) { 
        returnList.forEach(item => { 
          const match = this.areSolutionsSame(nreReturn, item);
          item.isSelected = match;
          if (match) {
            this.selectedReturnFare = item;  // <-- SET SELECTED RETURN
            this.returnFarePreselectedValue = item.TravelSolId;
            this.isReturnFareSelected = true;
            this.createDataForPassingWhileNavigating();
          }
        });
      }
    } catch(error){ console.log(error); }
  }

  areSolutionsSame(a, b): boolean {
    return (
      this.normalizeDate(a.DepartureDate) === this.normalizeDate(b.DepartureDate) &&
      this.normalizeDate(a.ArrivalDate) === this.normalizeDate(b.ArrivalDate) &&
      a.DepartureTime === b.DepartureTime &&
      a.ArrivalTime === b.ArrivalTime &&
      a.Duration === b.Duration
    );
  }

  normalizeDate(dateString: string): string {
    return new Date(dateString).toISOString().split('T')[0];
  }

  getJourneyItineraryAriaLabel(searchRequest, isReturn: boolean, travelSolution): string {
    try{
      let outwardDate = searchRequest?.DepartureTimesStartShow;
      let returnDate = searchRequest?.ReturnTimesStartShow;
      let formattedDate = isReturn ? this.datePipe.transform(returnDate, 'EEE, dd MMM yyyy') : this.datePipe.transform(outwardDate, 'EEE, dd MMM yyyy');
      let direction = isReturn ? `${this.travelSolutionEnum.return}` : `${this.travelSolutionEnum.outward}`;
      return `Journey details and itinerary for your journey ${direction}, ${formattedDate}. Departs ${travelSolution?.DarwinDepartureTime}. Arrives ${travelSolution?.DarwinArrivalTime}`;
    } catch(error){ console.log(error); }
  }


}
