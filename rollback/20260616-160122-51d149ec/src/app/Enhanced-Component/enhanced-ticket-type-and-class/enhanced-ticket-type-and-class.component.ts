import { Component, HostListener, Injector, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { JourneySummaryModel, TravelSolutionModel } from "src/app/models/mixing-deck/travel-solution.model";
import { CommonServices } from "src/app/services/common.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { AppRouteEnum, ClassTypeEnum, EnhancedAccessbilityMessageEnum, EnhancedActiveClassTypeEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedGa4DatalayeEventNameEnum, EnhancedGA4SearchSourceEnum, EnhancedLoaderTextEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedPassangerTypeEnum, EnhancedRailcardTypeEnum, EnhancedTabIndexTypeEnum, EnhancedTravelSolutionTypesEnum, LocalStorageKeyEnum, TicketTypeEnum, TravelSolutionJourneyTypeEnum } from "src/app/utility/app-constants.service";
import { EnhancedClassDetailsDialogsComponent } from "../enhanced-dialogs/enhanced-class-details-dialogs/enhanced-class-details-dialogs.component";
import { browserRefresh } from "src/app/app-component/app.component";
import { StorageDataService } from "src/app/services/storage-data.service";
import { SharedServiceCache } from "src/app/services/SharedServiceCache.service";
import { EnhancedTicketDetailsDialogsComponent } from "../enhanced-dialogs/enhanced-ticket-detail-dialogs/enhanced-ticket-detail-dialogs.component";
import { EnhancedFareModel } from "src/app/models/enhanced-mixing-deck/enhanced-fare.model";
import { FareBreakdownModel, JourneyModel } from "src/app/models/mixing-deck/fare-breakdown.model";
import { DeviceDetectorService } from "ngx-device-detector";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { EnhancedJourneySummaryDialogsComponent } from "../enhanced-dialogs/enhanced-journey-summary-dialogs/enhanced-journey-summary-dialogs.component";
import { EnhancedSearchResponseModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-response.model";
import { EnhancedRailcardRestrictionsDialogs } from "../enhanced-dialogs/enhanced-Railcard-restrictions-dialogs/enhanced-Railcard-restrictions-dialogs.component";
import { EnhancedRxjsSubjectsCommonService } from "src/app/services/enhanced-rxjs-subject.service";
import { DatePipe } from "@angular/common";
import { SearchStateService } from "src/app/services/search-state.service";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { GA4SearchEventParam } from "src/app/models/mixing-deck/search-request.model";
import { HandOffDataReqDto, NreJourneyExtrasResponse } from "src/app/models/journey-extras/nre-response.model";
import { ResponseData } from "src/app/models/common/response.model";
import { JourneyExtraService } from "src/app/services/journey-extras.service";
import { MonetateService } from "src/app/utility/monetate/monetate.service";
import { NgxSpinnerService } from "ngx-spinner";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";

@Component({
    selector: 'app-enhanced-ticket-type-and-class',
    templateUrl: './enhanced-ticket-type-and-class.component.html',
    styleUrls: ['./enhanced-ticket-type-and-class.component.css']
})

export class EnhancedMixingDeckTicketTypeAndClassComponent implements OnInit {
    router: Router;
    departure: any;
    searchRequest: EnhancedSearchRequestModel;
    sharedService: SharedService;
    localStorageKeyEnum: LocalStorageKeyEnum;
    route: ActivatedRoute;
    selectedTravelSolutionData: any;
    selectedTravelSolDataForOutward: TravelSolutionModel;
    selectedTravelSolDataForReturn: TravelSolutionModel;
    commonServices: CommonServices;
    ticketTypeEnum: TicketTypeEnum;
    getAllSelectedTicketTypeAndClassForOutAndRet: any;
    hideAdvanceStandard = false;
    hideAdvanceFirst = false;
    hideAdvanceStdPremium = false;
    getAllTicketPriceForReturn = [];
    listOfStandardTicketTypeForOut = []; 
    listOfFirstClassTicketTypeForOut = []; 
    listOfStdPremiumClassTicketTypeForOut = [];
    listOfStandardTicketTypeForRet = []; 
    listOfFirstClassTicketTypeForRet = []; 
    listOfStdPremiumClassTicketTypeForRet = [];
    listOfStandardTicketTypeForPureReturn = []; 
    listOfFirstClassTicketTypeForPureReturn = []; 
    listOfStdPremiumClassTicketTypeForPureReturn = [];
    minPriceForOutStdClass: number;
    minPriceForOutFirstClass: number;
    minPriceForOutStdPremiumClass: number;
    minPriceForRetStdClass: number;
    minPriceForRetFirstClass: number;
    minPriceForRetStdPremiumClass: number;
    browserRefresh: boolean;
    storageDataService: StorageDataService;
    sharedServiceCache: SharedServiceCache;
    isOutwardFareAndClassSelected: boolean = false;
    isReturnFareAndClassSelected: boolean = false;
    data: any;
    selectedOutwardFare: EnhancedFareModel;
    selectedReturnFare: EnhancedFareModel;
    selectedStdRadio: number;
    selectedReturnRadio: number;
    isOutStandardClassSoldOut: boolean;
    isOutFirstClassSoldOut: boolean;
    isOutStdPremiumClassSoldOut: boolean;
    isRetStandardClassSoldOut: boolean;
    isRetFirstClassSoldOut: boolean;
    isRetStdPremiumClassSoldOut: boolean;
    classTypeEnum: ClassTypeEnum;
    showEdit: boolean = false;
    deviceService: DeviceDetectorService;
    isMobile: boolean = false;
    isTablet: boolean = false;
    showOutward: boolean = true;
    showReturn: boolean = false;
    isSectionVisible = true;
    dynamicClassEnum: EnhancedDynamicClassesNameEnum;
    searchResponse: EnhancedSearchResponseModel;
    searchReturnResponse: EnhancedSearchResponseModel;
    activeClass: string = 'Standard'; // default
    isUserClickedReturnBtn: boolean;
    journeyType: string;
    combinedFare: number = 0;
    showBottomDiv: boolean = false;
    cheaperFareType: string;
    cheaperFarePrice: number;
    isFlexibleReturnSelectedFare: number;
    selectedTabIndex: number = 0;
    appRouteEnum: AppRouteEnum;
    cheaperFare: any = null;
    datePipe: DatePipe;
    suggestedClassLinksForOutSoldOut: { index: number; label: string }[] = [];
    enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
    enhancedTravelSolutionTypesEnum: EnhancedTravelSolutionTypesEnum;
    enhancedAppRouteEnum: EnhancedAppRouteEnum;
    enhancedAccessbilityMessageEnum: EnhancedAccessbilityMessageEnum;
    returnSelectedTabIndex: number = 0;
    returnActiveClass: string = 'Standard'; // default
    searchStateService: SearchStateService;
    preventTabChange: any;
    suggestedClassLinksForRetSoldOut: { index: number; label: string }[] = [];
    availableClasses: string[] = [];
    enhancedActiveClassTypeEnum: EnhancedActiveClassTypeEnum;
    enhancedTabIndexTypeEnum: EnhancedTabIndexTypeEnum;
    enhancedPassangerTypeEnum: EnhancedPassangerTypeEnum;
    enhancedRailcardTypeEnum: EnhancedRailcardTypeEnum;
    travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
    enhancedSearchSourceTypeEnum: EnhancedGA4SearchSourceEnum;
    ga4dataLayerService: GA4DatalayerService;
    searchResponseboth: EnhancedSearchResponseModel;
    isRailCardAppliedDivVisible: boolean = false;
    selectedOutwardRailCardApplied: boolean = false;
    selectedReturnRailCardApplied: boolean = false;
    isCheaperFareSelected: boolean = false;
    cheaperFareTicketClass: string;
    requestId: string;
    handOffDataReqDto: HandOffDataReqDto;
    journeyExtraService: JourneyExtraService;
    responseData: ResponseData;
    nreJourneyExtrasResponse: NreJourneyExtrasResponse;
    fareBreakDownData: FareBreakdownModel[] = [];
    fareBreakDownDataNreBasket: FareBreakdownModel[] = [];
    iframeSrc: any;
    nreOutwardSelectedFare;
    nreReturnSelectedFare;
    isLoaderActive: boolean = true;
    enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
    monetateService: MonetateService;
    focusedOutwardClass: string | null = null;
    focusedReturnClass : string | null = null;
    cameFromFlexibleReturn : boolean = false;
    enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
    enhancedGA4DataLayerEventNameEnum: EnhancedGa4DatalayeEventNameEnum;

    @HostListener('window:popstate', ['$event'])
    onPopState(event: PopStateEvent) {
        // When back button is pressed
        if ((this.router.url.includes(`/${this.enhancedAppRouteEnum.selectTicketAndClass}`))) {
            if (this.showReturn && (this.isMobile || this.isTablet)) {
                if(localStorage.getItem(this.localStorageKeyEnum.viewOtherTrainTimesFromReturn)){
                    setTimeout(()=>{
                        this.showReturn = false;
                        this.backToOutward();
                        localStorage.removeItem(this.localStorageKeyEnum.viewOtherTrainTimesFromReturn);
                    }, 600);
                } else {
                    this.showReturn = false;
                    this.showOutward = true;
                    if (this.isCheaperFareSelected) {
                        this.isUserClickedReturnBtn = true;
                    } else {
                        this.isUserClickedReturnBtn = false;
                    }
                }
            } else {
                this.goToSearchComponent();
            }
        }
    }
    constructor(private readonly injector: Injector
        , public dialog: MatDialog
        , public enhancedRxjsService: EnhancedRxjsSubjectsCommonService
        , public spinnerService: NgxSpinnerService) {
        this.router = this.injector.get(Router);
        this.searchRequest = new EnhancedSearchRequestModel();
        this.sharedService = this.injector.get(SharedService);
        this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
        this.route = this.injector.get(ActivatedRoute);
        this.commonServices = this.injector.get(CommonServices);
        this.ticketTypeEnum = this.injector.get(TicketTypeEnum);
        this.storageDataService = this.injector.get(StorageDataService);
        this.sharedServiceCache = this.injector.get(SharedServiceCache);
        this.classTypeEnum = this.injector.get(ClassTypeEnum);
        this.deviceService = this.injector.get(DeviceDetectorService);
        this.selectedTravelSolutionData = this.router.getCurrentNavigation();
        this.searchRequest = this.sharedService.searchRequest;
        this.dynamicClassEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
        this.appRouteEnum = this.injector.get(AppRouteEnum);
        this.datePipe = this.injector.get(DatePipe);
        this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
        this.enhancedTravelSolutionTypesEnum = this.injector.get(EnhancedTravelSolutionTypesEnum);
        this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
        this.enhancedAccessbilityMessageEnum = this.injector.get(EnhancedAccessbilityMessageEnum);
        this.searchStateService = this.injector.get(SearchStateService);
        this.enhancedActiveClassTypeEnum = this.injector.get(EnhancedActiveClassTypeEnum);
        this.enhancedTabIndexTypeEnum = this.injector.get(EnhancedTabIndexTypeEnum);
        this.enhancedPassangerTypeEnum = this.injector.get(EnhancedPassangerTypeEnum);
        this.enhancedRailcardTypeEnum = this.injector.get(EnhancedRailcardTypeEnum);
        this.travelSolutionJourneyTypeEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
        this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
        this.enhancedSearchSourceTypeEnum = this.injector.get(EnhancedGA4SearchSourceEnum);
        this.handOffDataReqDto = new HandOffDataReqDto();
        this.journeyExtraService = this.injector.get(JourneyExtraService);
        this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
        this.monetateService = this.injector.get(MonetateService);
        this.enhancedGA4DataLayerService = this.injector.get(EnhancedGA4DatalayerService);
        this.enhancedGA4DataLayerEventNameEnum = this.injector.get(EnhancedGa4DatalayeEventNameEnum);
    }

    ngOnInit(): void {
        this.spinnerService.hide();
        this.sharedService.isNewLoaderForNewFlow = false;
        setTimeout(() => {
            this.isLoaderActive = false;
        }, 2000);
        // for showing basket icon when go back from review-buy to search-results
        if (this.sharedService?.enhancedReviewBuyResponse) {
            this.sharedService.getBasketCount.emit(this.sharedService?.enhancedReviewBuyResponse?.BasketCount);
        }
        /* page_meta_data method calling by passing argument as true */
        this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
        this.monetateService.setPageType();
        this.initializeDeviceFlags();
        //Get shared cache data
        if (this.browserRefresh) {
            this.getSharedCacheData();
        }
        if (!this.sharedService.fareBreakdownModelData) {
            this.sharedService.fareBreakdownModelData = new Array<FareBreakdownModel>();
        }
        if (!this.sharedService.fareBreakdownModelData[0]) {
            this.sharedService.fareBreakdownModelData[0] = new FareBreakdownModel();
            this.sharedService.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
            this.sharedService.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
        }
        if (this.sharedService.fareBreakdownModelData?.[0]) {
            this.sharedService.fareBreakdownModelData[0] = new FareBreakdownModel();
            this.sharedService.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
            this.sharedService.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
        }
        this.checkAndLoadJourneyType();

        this.route.queryParamMap.subscribe(params => {
           this.requestId = params.get("requestId");
        });
        if (this.requestId != "" && this.requestId != null) {
            this.handOffDataReqDto.requestId = this.requestId;
            this.nreHandoffData(this.handOffDataReqDto);
        } else {
            let data = this.searchStateService.get();
    
            if (data) {
              this.getAllSelectedTicketTypeAndClassForOutAndRet = data?.outAndRetTravelSolData;
              this.searchResponse = data?.searchResponse;
              this.searchReturnResponse = data?.searchReturnResponse;
              this.searchRequest = data?.mixingDeckSearchRequest;
            }
            this.getAllTicketTypeAndClassesForOutAndRet();
            this.commonServices.loaderRequired = false;
            this.updateSuggestionLinks();
            /* Search and view_item_list ga4 data layer */
            this.callGa4DataLayerEventsOnSuccess();
        }
        //monetate call for search
        this.monetateService.setAddTrainSearchData(this.searchRequest);
        this.monetateService.flushEvents();
    }

    private checkAndLoadJourneyType(): void {
        if (this.sharedService?.searchRequest?.DepartureLocation) {
            this.getJourneyTypeOnLoad();
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
            this.journeyType = this.travelSolutionJourneyTypeEnum.openReturnText;
        }
    }

    private initializeDeviceFlags(): void {
        this.browserRefresh = browserRefresh;
        this.isMobile = this.deviceService.isMobile() && window.screen.width < 1024;
        this.isTablet = (this.deviceService.isTablet() || this.commonServices.checkIsiPad(navigator.userAgent)) && window.screen.width < 1024;
        if (this.isMobile || this.isTablet) {
            this.showOutward = true;
            this.showReturn = false;
        } else {
            this.showOutward = true;
            this.showReturn = true;
        }
    }

    //Getting shared cache data on browser refresh
    getSharedCacheData() {
        let cachedData = this.storageDataService.getStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, true);
        if (!this.nullOrUndefinedCheckForSharedServiceRefresh(cachedData)) return;
        if (cachedData) {
            this.commonServices.loaderRequired = true;
            this.sharedService.reviewBuyCache = cachedData?.reviewBuyCache;
            this.sharedService.ReservationCache = cachedData?.ReservationCache;
            this.sharedService.journeySummaryModel = cachedData?.journeySummaryModel;
            this.sharedService.enhancedReviewBuyResponse = cachedData?.enhancedReviewBuyResponse;
            this.sharedService.locationMasterData = cachedData?.locationMasterData;
            this.sharedService.LatestJourneyCache = cachedData?.LatestJourneyCache;
            this.sharedService.isAmendSearchOpen = false;
            this.sharedService.searchRequest = cachedData.searchRequest;
            this.sharedService.fareBreakdownModelData = cachedData.fareBreakdownModelData;
            this.sharedService.isAmendSearchOpen = cachedData?.isAmendSearchOpen ?? false;
            this.sharedService.editQttDepartureTimeStart = cachedData.editQttDepartureTimeStart;
            if (cachedData.searchRequest?.ReturnTimesStart)
                this.sharedService.editQttReturnTimeStart = cachedData.editQttReturnTimeStart;
            if (cachedData.searchRequest?.ReturnTimesStart)
                this.sharedService.editQttReturnTimeStart = cachedData?.editQttReturnTimeStart;
            if (this.sharedService?.enhancedReviewBuyResponse) {
                this.sharedService.getBasketCount.emit(this.sharedService?.enhancedReviewBuyResponse?.BasketCount);
            }
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
            this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
        }
    }

    nullOrUndefinedCheckForSharedServiceRefresh(sharedSiblingRefresh) {
        return sharedSiblingRefresh != null && sharedSiblingRefresh != undefined;
    }

    getAllTicketTypeAndClassesForOutAndRet() {
        try {
            if (this.getAllSelectedTicketTypeAndClassForOutAndRet) {
                // Check if state is available
                this.selectedTravelSolDataForOutward = this.getAllSelectedTicketTypeAndClassForOutAndRet?.selectedOutwardTravelSolution;
                this.selectedTravelSolDataForReturn = this.getAllSelectedTicketTypeAndClassForOutAndRet?.selectedReturnTravelSolution;
                this.getTicketTypePriceForOutward(this.selectedTravelSolDataForOutward?.NewFareList);
                this.getTicketTypePriceForReturn(this.selectedTravelSolDataForReturn?.NewFareList);
                this.getTicketTypePriceForPureReturn(this.selectedTravelSolDataForOutward?.NewReturnFareList);
                this.getCheaperPriceFromOutAndPureReturn();
                this.getMinFarePriceForOutwardClasses(this.selectedTravelSolDataForOutward);
                this.getMinFarePriceForReturnClasses(this.selectedTravelSolDataForReturn);
                if (this.activeClass) {
                    this.triggerDefaultGa4Event(this.travelSolutionJourneyTypeEnum.outwardString, this.selectedTabIndex, false, this.activeClass);
                }
                if (this.returnActiveClass && this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return || this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.forward) {
                    this.triggerDefaultGa4Event(this.travelSolutionJourneyTypeEnum.returnString, this.returnSelectedTabIndex, true, this.returnActiveClass);
                }
            }
        } catch (error) { console.log(error); }
    }

    getTicketTypePriceForOutward(OutNewFareList) {
        try {
            let getStandardTicketTypeForOut = [];
            let getFirstClassTicketTypeForOut = [];
            let getStdPremiumClassTicketTypeForOut = [];
            if (OutNewFareList) {
                OutNewFareList.forEach(newFareList => {
                    if (newFareList?.FareList) {
                        getStandardTicketTypeForOut = this.filterByStandard(newFareList?.FareList);
                        if (getStandardTicketTypeForOut) {
                            this.listOfStandardTicketTypeForOut.push(...getStandardTicketTypeForOut);
                        }
                        getFirstClassTicketTypeForOut = this.filterByFirst(newFareList?.FareList);
                        if (getFirstClassTicketTypeForOut) {
                            this.listOfFirstClassTicketTypeForOut.push(...getFirstClassTicketTypeForOut);
                        }
                        getStdPremiumClassTicketTypeForOut = this.filterByStdPremium(newFareList?.FareList);
                        if (getStdPremiumClassTicketTypeForOut) {
                            this.listOfStdPremiumClassTicketTypeForOut.push(...getStdPremiumClassTicketTypeForOut);
                        }
                    }
                });
            }
        } catch (error) { console.log(error); }
    }

    getTicketTypePriceForReturn(RetNewFareList) {
        try {
            
            let getStandardTicketTypeForRet = [];
            let getFirstClassTicketTypeForRet = [];
            let getStdPremiumClassTicketTypeForRet = [];
            if (RetNewFareList) {
                RetNewFareList.forEach(newFareList => {
                    if (newFareList?.FareList) {
                        getStandardTicketTypeForRet = this.filterByStandard(newFareList?.FareList);
                        if (getStandardTicketTypeForRet) {
                            this.listOfStandardTicketTypeForRet.push(...getStandardTicketTypeForRet);
                        }
                        getFirstClassTicketTypeForRet = this.filterByFirst(newFareList?.FareList);
                        if (getFirstClassTicketTypeForRet) {
                            this.listOfFirstClassTicketTypeForRet.push(...getFirstClassTicketTypeForRet);
                        }
                        getStdPremiumClassTicketTypeForRet = this.filterByStdPremium(newFareList?.FareList);
                        if (getStdPremiumClassTicketTypeForRet) {
                            this.listOfStdPremiumClassTicketTypeForRet.push(...getStdPremiumClassTicketTypeForRet);
                        }
                    }
                });
                
                let allFares = [...this.listOfStandardTicketTypeForRet, ...this.listOfFirstClassTicketTypeForRet, ...this.listOfStdPremiumClassTicketTypeForRet];
                let overallResult = this.markCheapestFareAccrossAllClassesOfReturn(allFares);
                this.listOfStandardTicketTypeForRet = overallResult?.filter(item=> item.TicketClass === this.classTypeEnum.standardClass);
                this.listOfStdPremiumClassTicketTypeForRet = overallResult?.filter(item=> item.TicketClass === this.classTypeEnum.stdPremiumClass);
                this.listOfFirstClassTicketTypeForRet = overallResult?.filter(item=> item.TicketClass === this.classTypeEnum.firstClass);
            }
        } catch (error) { console.log(error); }
    }

    getTicketTypePriceForPureReturn(newReturnFareList) {
        try {
            let getStandardTicketTypeForPureReturn = [];
            let getFirstClassTicketTypeForPureReturn = [];
            let getStdPremiumClassTicketTypeForPureReturn = [];
            if (newReturnFareList) {
                newReturnFareList.forEach(newReturnFareList => {
                    if (newReturnFareList?.FareList) {
                        getStandardTicketTypeForPureReturn = this.filterByStandard(newReturnFareList?.FareList);
                        if (getStandardTicketTypeForPureReturn) { this.listOfStandardTicketTypeForPureReturn.push(...getStandardTicketTypeForPureReturn); }
                        getFirstClassTicketTypeForPureReturn = this.filterByFirst(newReturnFareList?.FareList);
                        if (getFirstClassTicketTypeForPureReturn) { this.listOfFirstClassTicketTypeForPureReturn.push(...getFirstClassTicketTypeForPureReturn); }
                        getStdPremiumClassTicketTypeForPureReturn = this.filterByStdPremium(newReturnFareList?.FareList);
                        if (getStdPremiumClassTicketTypeForPureReturn) { this.listOfStdPremiumClassTicketTypeForPureReturn.push(...getStdPremiumClassTicketTypeForPureReturn); }
                    }
                });
            }
        } catch (error) { console.log(error); }
    }

    getCheaperPriceFromOutAndPureReturn() {
        try {

            let isOpenReturn = this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum.openReturn;

            let outwardList = isOpenReturn ? [] : [...this.listOfStandardTicketTypeForOut, ...this.listOfStdPremiumClassTicketTypeForOut, ...this.listOfFirstClassTicketTypeForOut];
            let returnList = [...this.listOfStandardTicketTypeForPureReturn, ...this.listOfStdPremiumClassTicketTypeForPureReturn, ...this.listOfFirstClassTicketTypeForPureReturn];

            let overallResult = this.markCheapestFareAccrossAllClassesOfOutAndPureReturn(outwardList, returnList);

            if(!isOpenReturn) {
                this.listOfStandardTicketTypeForOut = overallResult.outwardList.filter(item=> item.TicketClass === this.classTypeEnum.standardClass);
                this.listOfStdPremiumClassTicketTypeForOut = overallResult.outwardList.filter(item=> item.TicketClass === this.classTypeEnum.stdPremiumClass);
                this.listOfFirstClassTicketTypeForOut = overallResult.outwardList.filter(item=> item.TicketClass === this.classTypeEnum.firstClass);
            }

            this.listOfStandardTicketTypeForPureReturn = overallResult.returnList.filter(item=> item.TicketClass === this.classTypeEnum.standardClass);
            this.listOfStdPremiumClassTicketTypeForPureReturn = overallResult.returnList.filter(item=> item.TicketClass === this.classTypeEnum.stdPremiumClass);
            this.listOfFirstClassTicketTypeForPureReturn = overallResult.returnList.filter(item=> item.TicketClass === this.classTypeEnum.firstClass);

        } catch (error) { console.log(error); }
    }

    isTicketTypeAdvance(ticketType: string) {
        try {
            if (ticketType) {
                ticketType = ticketType.toLowerCase();
                if (ticketType.indexOf(this.ticketTypeEnum.advanceTicket) != -1) {
                    return true;
                }
                return false;
            }
            return false;
        } catch (error) { console.log(error); }
    }


    private filterByStandard(fareList: any) {
        try {
            return this.filterByClassType(fareList, this.classTypeEnum?.standardClass);
        } catch (error) { console.log(error); }
    }

    private filterByFirst(fareList: any) {
        try {
            return this.filterByClassType(fareList, this.classTypeEnum?.firstClass);
        } catch (error) { console.log(error); }
    }

    private filterByStdPremium(fareList: any) {
        try {
            return this.filterByClassType(fareList, this.classTypeEnum?.stdPremiumClass);
        } catch (error) { console.log(error); }
    }

    private filterByClassType(fareList: any, classType: string): any[] {
        try {
            if (!fareList || fareList.length === 0) return [];

            let filteredFares = fareList?.filter(x => x?.TicketClass === classType);
            if (filteredFares.length === 0) return [];

            let minFare = filteredFares.reduce((prev, curr) =>
                curr?.Price < prev?.Price ? curr : prev
            );
           
            return [minFare];
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    goToSearchComponent() {
        if (this.conditionToCheckTravelSolDataForReturnOnGoToSearch()) {
            this.showOutward = true;
            this.showReturn = false;
            this.isUserClickedReturnBtn = false;
        } else {
            this.searchStateService.set({
                outAndRetTravelSolData: this.getAllSelectedTicketTypeAndClassForOutAndRet,
                isBackFromTicketClass: true,
            });
            if (this.isMobile || this.isTablet) {
                if(this.conditionToCheckOutwardAndSelectTicketAndClassPageOnGoToSearch()){
                if(this.data?.selectedOutwardTravelSolution){
                    this.showOutward = false;
                    this.showReturn = true;
                    this.isUserClickedReturnBtn = true;
                } else {
                    return;
                }
                } else {
                    window.history.replaceState({ part: this.travelSolutionJourneyTypeEnum.returnString }, '', `/${this.enhancedAppRouteEnum.searchResult}`);
                    this.router.navigate([`./` + this.enhancedAppRouteEnum.searchResult], {
                        state: { part: this.travelSolutionJourneyTypeEnum.returnString }
                    });
                }
            } else {
                this.router.navigate([`./` + this.enhancedAppRouteEnum.searchResult]);
            }
        }
    }

    backToOutward() {
        this.sharedService.isStationListAPILoaderRequired = false;
        if (this.isMobile || this.isTablet) {
            history.back();
        } else {
            this.goToSearchComponent();
        }
    }

    openTicketClassInfoPopup(event: MouseEvent, isReturn: boolean = false, classType) {
        try {
            event.stopPropagation();
            let selectedClassType = isReturn ? this.returnActiveClass : this.activeClass;
            if (selectedClassType !== classType) return;
            let selectedFareData = isReturn ? this.selectedTravelSolDataForReturn : this.selectedTravelSolDataForOutward;
            this.dialog.open(EnhancedClassDetailsDialogsComponent, {
                disableClose: true,
                panelClass: [this.dynamicClassEnum?.enhancedClassDetailPanelClass],
                width: '72rem',
                autoFocus: false,
                data: { classType: selectedClassType, selectedFareData: selectedFareData }
            });
        } catch (error) { console.log(error); }
    }

    private getMinFarePriceForOutwardClasses(selectedTravelSolDataForOutward) {
        if (selectedTravelSolDataForOutward?.MinimumFareClassType) {
            selectedTravelSolDataForOutward?.MinimumFareClassType.forEach(MinimumFareClassType => {
                if (MinimumFareClassType?.TicketClass == this.classTypeEnum?.standardClass) {
                    this.minPriceForOutStdClass = MinimumFareClassType?.Price;
                    this.isOutStandardClassSoldOut = MinimumFareClassType?.IsSoldOut;
                } else if (MinimumFareClassType?.TicketClass == this.classTypeEnum?.firstClass) {
                    this.minPriceForOutFirstClass = MinimumFareClassType?.Price;
                    this.isOutFirstClassSoldOut = MinimumFareClassType?.IsSoldOut;
                } else {
                    this.minPriceForOutStdPremiumClass = MinimumFareClassType?.Price;
                    this.isOutStdPremiumClassSoldOut = MinimumFareClassType?.IsSoldOut;
                }
            });
            let getModifiedSoldOutValue = this.modifiedMinimumFareClassType(JSON.parse(JSON.stringify(selectedTravelSolDataForOutward?.MinimumFareClassType)));
            let availableIndex = getModifiedSoldOutValue?.findIndex(c => !c.IsSoldOut);
            this.selectedTabIndex = availableIndex !== -1 ? availableIndex : 0;
            this.activeClass = getModifiedSoldOutValue[availableIndex]?.TicketClass;

            if (this.requestId != "" && this.requestId != null) {
                this.setActiveTabFromNRE(this.nreOutwardSelectedFare, getModifiedSoldOutValue, true);
            }
            else {
                let cheapestClass = this.getCheapestOverallClass(
                    this.listOfStandardTicketTypeForOut,
                    this.listOfStdPremiumClassTicketTypeForOut,
                    this.listOfFirstClassTicketTypeForOut,
                    this.listOfStandardTicketTypeForPureReturn,
                    this.listOfStdPremiumClassTicketTypeForPureReturn,
                    this.listOfFirstClassTicketTypeForPureReturn
                );

                if (cheapestClass) {
                    let cheapIndex = getModifiedSoldOutValue.findIndex(c => c.TicketClass === cheapestClass);
                    if (cheapIndex !== -1) {
                        this.selectedTabIndex = cheapIndex;
                        this.activeClass = cheapestClass;
                    }
                }
            }

            if (this.searchRequest?.PromotionCode) {
                this.applyOfferLogicForAutoSelect(this.listOfStandardTicketTypeForOut, this.listOfStdPremiumClassTicketTypeForOut, this.listOfFirstClassTicketTypeForOut, true, getModifiedSoldOutValue);
            }
        }
    }

    private getMinFarePriceForReturnClasses(selectedTravelSolDataForReturn) {
        if (selectedTravelSolDataForReturn?.MinimumFareClassType) {
            selectedTravelSolDataForReturn?.MinimumFareClassType.forEach(MinimumFareClassType => {
                if (MinimumFareClassType?.TicketClass == this.classTypeEnum?.standardClass) {
                    this.minPriceForRetStdClass = MinimumFareClassType?.Price;
                    this.isRetStandardClassSoldOut = MinimumFareClassType?.IsSoldOut;
                } else if (MinimumFareClassType?.TicketClass == this.classTypeEnum?.firstClass) {
                    this.minPriceForRetFirstClass = MinimumFareClassType?.Price;
                    this.isRetFirstClassSoldOut = MinimumFareClassType?.IsSoldOut;
                } else {
                    this.minPriceForRetStdPremiumClass = MinimumFareClassType?.Price;
                    this.isRetStdPremiumClassSoldOut = MinimumFareClassType?.IsSoldOut;
                }
            });
            let getModifiedSoldOutValue = this.modifiedMinimumFareClassType(JSON.parse(JSON.stringify(selectedTravelSolDataForReturn?.MinimumFareClassType)));
            let availableIndex = getModifiedSoldOutValue?.findIndex(c => !c.IsSoldOut);
            this.returnSelectedTabIndex = availableIndex !== -1 ? availableIndex : 0;
            this.returnActiveClass = getModifiedSoldOutValue[availableIndex]?.TicketClass;

            if (this.requestId != "" && this.requestId != null) {
                this.setActiveTabFromNRE(this.nreReturnSelectedFare, getModifiedSoldOutValue, false);
            }
            else {
                let cheapestClass = this.getCheapestOverallClass(
                    this.listOfStandardTicketTypeForRet,
                    this.listOfStdPremiumClassTicketTypeForRet,
                    this.listOfFirstClassTicketTypeForRet
                );

                if (cheapestClass) {
                    let cheapIndex = getModifiedSoldOutValue.findIndex(c => c.TicketClass === cheapestClass);
                    if (cheapIndex !== -1) {
                        this.returnSelectedTabIndex = cheapIndex;
                        this.returnActiveClass = cheapestClass;
                    }
                }
            }
            

            if (this.searchRequest?.PromotionCode) {
                this.applyOfferLogicForAutoSelect(this.listOfStandardTicketTypeForRet, this.listOfStdPremiumClassTicketTypeForRet, this.listOfFirstClassTicketTypeForRet, false, getModifiedSoldOutValue);
            }
        }
    }

    openTicketDetailInfo(enhancedFare: EnhancedFareModel, isReturn) {
        try {
            let row;
            if(!isReturn) {
                row = this.selectedTravelSolDataForOutward;
            } else {
                row = this.selectedTravelSolDataForReturn;
            }
            this.loadGTMDataLayeronExpandingSolutions(row,isReturn, enhancedFare);
            let dialogRef = this.dialog.open(EnhancedTicketDetailsDialogsComponent, {
                disableClose: true,
                panelClass: [this.dynamicClassEnum?.enhancedPopupFullWidthPanelClass],
                width: '45rem',
                autoFocus: false,
                data: {
                    fare: enhancedFare,
                    ticketTypeCode: enhancedFare?.TicketTypeCode,
                    TicketType: enhancedFare?.TicketTypeName.trim(),
                    isSearchResults: true,
                }
            });
            dialogRef.afterClosed().subscribe(() => {
            });
        } catch (error) { console.log(error); }
    }

    onOutwardFareSelection(outwardSelectedFare, isReturnFare) {
        try {
            if (this.selectedTravelSolDataForOutward) {
                // Outward Fare selection
                this.isCheaperFareSelected = false;
                this.showBottomDiv = false;
                this.listOfStandardTicketTypeForOut.forEach(fare => fare.isSelected = false);
                this.listOfStandardTicketTypeForPureReturn.forEach(fare => fare.isSelected = false);
                this.listOfStdPremiumClassTicketTypeForOut.forEach(fare => fare.isSelected = false);
                this.listOfStdPremiumClassTicketTypeForPureReturn.forEach(fare => fare.isSelected = false);
                this.listOfFirstClassTicketTypeForOut.forEach(fare => fare.isSelected = false);
                this.listOfFirstClassTicketTypeForPureReturn.forEach(fare => fare.isSelected = false);
                outwardSelectedFare.isSelected = true;
                this.selectedOutwardFare = outwardSelectedFare;
                this.isOutwardFareAndClassSelected = true;
                this.sharedService.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();
                //Fare Breakdown Latest
                this.sharedService.resetFareBreakDownData();
                this.sharedService.fareBreakdownModelData[0].IsReturnJourney = false;
                this.sharedService.fareBreakdownModelData[0].OutwardDepartureTime = this.selectedTravelSolDataForOutward?.DepartureTime?.split(' ')[0];
                this.sharedService.fareBreakdownModelData[0].OutwardArrivalTime = this.selectedTravelSolDataForOutward?.ArrivalTime?.split(' ')[0];
                this.sharedService.fareBreakdownModelData[0].OutwardDuration = this.selectedTravelSolDataForOutward?.Duration;
                this.sharedService.fareBreakdownModelData[0].OutChanges = this.selectedTravelSolDataForOutward?.Changes;
                this.sharedService.fareBreakdownModelData[0].JourneyType = this.enhancedTravelSolutionTypesEnum?.outward;
                this.sharedService.fareBreakdownModelData[0].OpenReturnExpiryDate = outwardSelectedFare?.OpenReturnExpiryDate;
                this.selectFlexibleTicketType(isReturnFare);
                this.setOutwardFarebreakDownModelData(outwardSelectedFare);
                this.createDataForPassingWhileNavigating();
                this.checkIfFlexiFareIsCheaper();

                // Check railcard applied status for outward
                this.selectedOutwardRailCardApplied = this.isExistRailCardApplied(outwardSelectedFare) === 1;
                this.updateRailCardAppliedDivState();
                this.setJourneySummaryModelForOutward();
            }
        } catch (error) { console.log(error); }
    }

    setOutwardFarebreakDownModelData(outwardSelectedFare) {
        if (outwardSelectedFare && outwardSelectedFare?.FareDetails?.length > 0) {
            outwardSelectedFare?.FareDetails.forEach(fareDetailObj => {
                let outJourney = new JourneyModel;
                outJourney.Passenger = fareDetailObj?.FarePerson;//'1 * Adult';
                outJourney.PricePerPerson = fareDetailObj?.BasePrice;
                outJourney.TotalPrice = fareDetailObj?.Price;
                outJourney.RailCard = fareDetailObj?.Railcard;
                outJourney.IsCheck = fareDetailObj?.IsCheck;
                outJourney.TicketTypeName = outwardSelectedFare?.TicketTypeName;
                this.sharedService?.fareBreakdownModelData[0]?.OutWardJourney?.push(outJourney);
            });
        }
    }

    selectFlexibleTicketType(isReturnFare) {
        if (this.isFlexibleReturnSelectedFare) {
            this.isFlexibleReturnSelectedFare = null;
            this.selectedReturnFare = null;
            this.isReturnFareAndClassSelected = false;
            this.isButtonDisabled();
            this.cameFromFlexibleReturn = false;
        }
        if (isReturnFare) {
            this.sharedService.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
            this.sharedService.fareBreakdownModelData[0].IsReturnJourney = true;
            this.sharedService.fareBreakdownModelData[0].ReturnDepartureTime = this.selectedTravelSolDataForReturn?.DepartureTime?.split(' ')[0];
            this.sharedService.fareBreakdownModelData[0].ReturnArrivalTime = this.selectedTravelSolDataForReturn?.ArrivalTime?.split(' ')[0];
            this.sharedService.fareBreakdownModelData[0].ReturnDuration = this.selectedTravelSolDataForReturn?.Duration;
            this.sharedService.fareBreakdownModelData[0].RetChanges = this.selectedTravelSolDataForReturn?.Changes;
            this.sharedService.fareBreakdownModelData[0].JourneyType = this.enhancedTravelSolutionTypesEnum?.pureReturn;
            this.selectedReturnFare = null;
            this.selectedReturnRadio = null;
            this.selectedStdRadio = null;
            this.showBottomDiv = false;
            this.isUserClickedReturnBtn = true;
            this.isOutwardFareAndClassSelected = true;
            this.isReturnFareAndClassSelected = true;
            this.cameFromFlexibleReturn = true;
        } else {
            this.isUserClickedReturnBtn = false;
        }
    }

    onReturnFareSelection(returnSelectedFare) {
        try {
            if (this.selectedTravelSolDataForReturn) {
                this.showBottomDiv = false;
                this.listOfStandardTicketTypeForRet.forEach(fare => fare.isSelected = false);
                this.listOfStdPremiumClassTicketTypeForRet.forEach(fare => fare.isSelected = false);
                this.listOfFirstClassTicketTypeForRet.forEach(fare => fare.isSelected = false);
                returnSelectedFare.isSelected = true;
                this.selectedReturnFare = returnSelectedFare;
                this.isReturnFareAndClassSelected = true;
                this.sharedService.fareBreakdownModelData[0].ReturnJourney = new Array<JourneyModel>();
                //Fare Breakdown Latest
                this.sharedService.resetFareBreakDownData();
                this.sharedService.fareBreakdownModelData[0].IsReturnJourney = true;
                this.sharedService.fareBreakdownModelData[0].ReturnDepartureTime = this.selectedTravelSolDataForReturn?.DepartureTime?.split(' ')[0];
                this.sharedService.fareBreakdownModelData[0].ReturnArrivalTime = this.selectedTravelSolDataForReturn?.ArrivalTime?.split(' ')[0];
                this.sharedService.fareBreakdownModelData[0].ReturnDuration = this.selectedTravelSolDataForReturn?.Duration;
                this.sharedService.fareBreakdownModelData[0].RetChanges = this.selectedTravelSolDataForReturn?.Changes;
                this.sharedService.fareBreakdownModelData[0].JourneyType = this.enhancedTravelSolutionTypesEnum?.return;

                this.setReturnFarebreakDownModelData(returnSelectedFare);

                if (this.isFlexibleReturnSelectedFare) {
                    this.isFlexibleReturnSelectedFare = null;
                    this.selectedOutwardFare = null;
                    this.sharedService.fareBreakdownModelData[0].OutWardJourney = null;
                    this.isOutwardFareAndClassSelected = false;
                    this.isButtonDisabled();
                    this.cameFromFlexibleReturn = false;
                }
                this.createDataForPassingWhileNavigating();
                this.checkIfFlexiFareIsCheaper();

                // Check railcard applied status for return
                this.selectedReturnRailCardApplied = this.isExistRailCardApplied(returnSelectedFare) === 1;
                this.updateRailCardAppliedDivState();
                this.setJourneySummaryModelForReturn();
            }
        } catch (error) { console.log(error); }
    }

    setReturnFarebreakDownModelData(returnSelectedFare) {
        if (returnSelectedFare && returnSelectedFare.FareDetails?.length > 0) {
            returnSelectedFare.FareDetails.forEach(fareDetail => {
                let returnJourney = new JourneyModel;
                returnJourney.Passenger = fareDetail.FarePerson;//'1 * Adult';
                returnJourney.PricePerPerson = fareDetail.BasePrice;
                returnJourney.TotalPrice = fareDetail.Price;
                returnJourney.RailCard = fareDetail.Railcard;
                returnJourney.IsCheck = fareDetail.IsCheck;
                returnJourney.TicketTypeName = returnSelectedFare?.TicketTypeName;
                this.sharedService.fareBreakdownModelData[0].ReturnJourney.push(returnJourney);
            });
        }
    }

    isButtonDisabled(): boolean {
        try {
            return (
                !this.isOutwardFareAndClassSelected ||
                (this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.return && !this.isReturnFareAndClassSelected)
            );
        } catch (error) { console.log(error); }
    }

    createDataForPassingWhileNavigating() {
        try {
            let singleFare = !this.isReturnFareAndClassSelected ? this.selectedOutwardFare?.Price : 0;
            let returnFare = this.selectedReturnFare?.Price ?? 0;
            let outwardFare = this.selectedOutwardFare?.Price ?? 0;
            let totalFare = this.getTotalFare(returnFare, outwardFare);
            this.data = {
                singleFare,
                totalFare,
                selectedOutwardTravelSolution: this.isOutwardFareAndClassSelected ? this.selectedOutwardFare : "",
                selectedReturnTravelSolution: this.isReturnFareAndClassSelected ? this.selectedReturnFare : "",
                selectedOutwardFare: this.selectedOutwardFare,
                selectedReturnFare: this.selectedReturnFare,
            };
        } catch (error) { console.log(error); }
    }

    getTotalFare(returnFare, outwardFare) {
        try {
            let totalFare = 0;
            if (this.isReturnFareAndClassSelected) {
                totalFare = returnFare + outwardFare;
            }
            return totalFare;
        } catch (error) { console.log(error); }
    }

    showReturnDivInMobile() {
        try {
            if (this.isMobile || this.isTablet) {
                if (this.selectedTravelSolDataForReturn) {
                    window.history.pushState({ part: this.travelSolutionJourneyTypeEnum.returnString }, '', window.location.href);
                    this.showOutward = false;
                    this.showReturn = true;
                    window.scroll(0,0);
                }
            } else {
                this.showOutward = true;
                this.showReturn = true;
            }
        } catch (error) { console.log(error); }
    }

    openEdit() {
        try {
            this.sharedService.isStationListAPILoaderRequired = true;
            this.sharedService.amendSearchRequest = this.searchRequest;
            this.showEdit = true;
            this.sharedService.isDisabledContinue.next(true);
            this.enhancedGA4DataLayerService?.loadGA4DataLayerOnCheckoutClickOrAttempt(this.enhancedGA4DataLayerEventNameEnum?.editNameText, this.enhancedGA4DataLayerEventNameEnum?.editActionName, undefined, undefined, true, true);
        } catch (error) { console.log(error); }
    }

    showRailCardAsLabelIfOpted() {
        try {
            let data = this.searchRequest?.RailCardList?.length > 0 &&
                (this.sharedService.journeySummaryModel?.RailCards != null);
            return data;
        } catch (error) { console.log(error); }
    }

    closeSection() {
        this.showBottomDiv = !this.showBottomDiv;
    }

    enhancedWhysThatSoldOutTicketPopup() {
        try {
            this.dialog.open(EnhancedJourneySummaryDialogsComponent, {
                disableClose: true,
                panelClass: [this.dynamicClassEnum?.filterRangePanelClass, this.dynamicClassEnum?.enhancedPopupFullWidthPanelClass], 
                width: '45rem',
                autoFocus: false,
            });
        } catch (error) { console.log(error); }
    }

    submitEdit(isSuccessful: boolean): void {
        try {
            if (!isSuccessful) {
                this.showEdit = !this.showEdit;
            } else {
                this.searchRequest = this.sharedService.amendSearchRequest;
                this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
                this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
                this.sharedService.searchRequest = structuredClone(this.searchRequest);
                this.sharedService.setSharedCache();
                this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
                this.storageDataService.setStorageData(
                    this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling,
                    this.sharedServiceCache,
                    true
                );
                this.router.navigate([`./` + this.appRouteEnum.MixingDeck]);
            }
        } catch (error) { console.log(error); }
    }

    onTabChange(event: MatTabChangeEvent, tabType: 'outward' | 'return', isReturn): void {
        try {
            let isOutward = tabType === this.travelSolutionJourneyTypeEnum.outwardString;
            let travelSolData = isOutward ? this.selectedTravelSolDataForOutward : this.selectedTravelSolDataForReturn;
            let selectedTabKey = isOutward ? this.enhancedTabIndexTypeEnum.selectedTabIndex : this.enhancedTabIndexTypeEnum.returnSelectedTabIndex;
            let activeClassKey = isOutward ? this.enhancedActiveClassTypeEnum.activeClass : this.enhancedActiveClassTypeEnum.returnActiveClass;
            this.availableClasses = [
                travelSolData?.IsStandardFare ? this.classTypeEnum.standardClass : null,
                travelSolData?.IsStandardPremiumFare ? this.classTypeEnum.stdPremiumClass : null,
                travelSolData?.IsFirstClassFare ? this.classTypeEnum.firstClass : null,
            ].filter(Boolean);
            let tabIndex = event.index;
            this[selectedTabKey] = tabIndex;
            this[activeClassKey] = this.availableClasses[tabIndex];

            let { selectedTabFares, cheapestFarePrice } = this.getSelectedTabFares(tabType, this.availableClasses[tabIndex]);

            // Get correct fares array based on tabType + tabIndex
            this.callGa4DataLayerEventsOnTabChange(this.availableClasses[tabIndex], 'selected', isReturn, selectedTabFares, this[selectedTabKey], cheapestFarePrice);
        } catch (error) { console.log(error); }
    }

    openNotAppliedRailCard() {
        try {
            this.dialog.open(EnhancedRailcardRestrictionsDialogs, {
                disableClose: true,
                panelClass: [this.dynamicClassEnum?.enhancedFooterAlertCommonPanelClass, this.dynamicClassEnum?.enhancedRailcardNotAppliedPanelClass],
                width: '45rem',
                autoFocus: false,
            });
        } catch (error) { console.log(error); }
    }

    handleUserClick(event: boolean) {
        try {
            this.isUserClickedReturnBtn = event;
        } catch (error) { console.log(error); }
    }

    checkIfFlexiFareIsCheaper() {
        try {
            let flexiOptions;
            if (this.returnActiveClass !== this.activeClass) return;
            if (this.selectedOutwardFare && this.selectedReturnFare) {
                this.combinedFare = this.selectedOutwardFare?.Price + this.selectedReturnFare?.Price;
                switch (this.activeClass) {
                    case this.classTypeEnum?.standardClass:
                        flexiOptions = this.listOfStandardTicketTypeForPureReturn;
                        break;
                    case this.classTypeEnum?.stdPremiumClass:
                        flexiOptions = this.listOfStdPremiumClassTicketTypeForPureReturn;
                        break;
                    case this.classTypeEnum?.firstClass:
                        flexiOptions = this.listOfFirstClassTicketTypeForPureReturn;
                        break;
                }

                // Find cheapest flexi option
                this.findCheapestFlexiOption(flexiOptions);

                if (this.cheaperFare) {
                    this.showBottomDiv = true;
                    this.cheaperFareType = this.cheaperFare.TicketType;
                    this.cheaperFarePrice = this.cheaperFare.Price;
                    this.cheaperFareTicketClass = this.cheaperFare.TicketClass;
                } else {
                    this.showBottomDiv = false;
                }
            }
        } catch (error) { console.log(error); }
    }

    findCheapestFlexiOption(flexiOptions) {
        let cheapestFlexiFare = flexiOptions.reduce((min, curr) => {
            return curr.Price < min.Price ? curr : min;
        });

        if (cheapestFlexiFare.Price < this.combinedFare) {
            this.cheaperFare = cheapestFlexiFare;
        } else {
            this.cheaperFare = null;
        }
    }

    onSelectCheapestFlexiOption() {
        try {
            if (!this.cheaperFare) return;
            switch (this.activeClass) {
                case this.classTypeEnum?.standardClass:
                    let flexi = this.listOfStandardTicketTypeForPureReturn.find(f => f.Price === this.cheaperFare?.Price);
                    if (flexi) {
                        // deselect others and select this
                        this.isFlexibleReturnSelectedFare = flexi?.Price;
                        this.selectedOutwardFare = flexi;
                        setTimeout(() => {
                            document.querySelector('#stdFlexibleReturn').scrollIntoView();
                        }, 200);
                    }
                    break;
                case this.classTypeEnum?.stdPremiumClass:
                    let flexiP = this.listOfStdPremiumClassTicketTypeForPureReturn.find(f => f.Price === this.cheaperFare?.Price);
                    if (flexiP) {
                        this.isFlexibleReturnSelectedFare = flexiP?.Price;
                        this.selectedOutwardFare = flexiP;
                        setTimeout(() => {
                            document.querySelector('#stdPremFlexibleReturn').scrollIntoView();
                        }, 200);
                    }
                    break;
                case this.classTypeEnum?.firstClass:
                    let flexiF = this.listOfFirstClassTicketTypeForPureReturn.find(f => f.Price === this.cheaperFare?.Price);
                    if (flexiF) {
                        this.isFlexibleReturnSelectedFare = flexiF?.Price;
                        this.selectedOutwardFare = flexiF;
                        setTimeout(() => {
                            document.querySelector('#firstClassFlexibleReturn').scrollIntoView();
                        }, 200);
                    }
                    break;
            }
            this.cheaperFare = null;
            this.selectedStdRadio = null;
            this.selectedReturnRadio = null;
            this.selectedReturnFare = null;
            this.showBottomDiv = false;
            this.createDataForPassingWhileNavigating();
            this.isOutwardFareAndClassSelected = true;
            this.isReturnFareAndClassSelected = true;
            this.sharedService.fareBreakdownModelData[0].OutWardJourney = null;
            this.sharedService.fareBreakdownModelData[0].OutWardJourney = new Array<JourneyModel>();

            this.setOutwardFarebreakDownModelData(this.selectedOutwardFare);

            this.sharedService.fareBreakdownModelData[0].ReturnJourney = null;
            if (this.isMobile || this.isTablet) {
                this.isCheaperFareSelected = true;  
                this.backToOutward();
            }
        } catch (error) { console.log(error); }
    }

    getAriaLabelForJourneyTitle(searchRequest, selectedTravelSol, isOutward) {
        try {
            if (!searchRequest) return;
            let date = isOutward ? this.datePipe.transform(searchRequest?.DepartureTimesStartShow, 'EEE, dd MMM yyyy') : this.datePipe.transform(searchRequest?.ReturnTimesStartShow, 'EEE, dd MMM yyyy');
            let from = this.commonServices.getCityNameOnly(isOutward ? searchRequest?.DepartureLocationName : searchRequest?.ArrivalLocationName);
            let to = this.commonServices.getCityNameOnly(isOutward ? searchRequest?.ArrivalLocationName : searchRequest?.DepartureLocationName);
            let journeyLabel = isOutward ? this.travelSolutionJourneyTypeEnum.outwardString : `return`;
            let departTime = selectedTravelSol ? selectedTravelSol?.DepartureTime.split(" ")[0] : '';
            let arrivalTime = selectedTravelSol ? selectedTravelSol?.ArrivalTime.split(" ")[0] : '';
            return `Select ${journeyLabel} ticket: ${date},departing at ${departTime} from ${from}, arriving at ${arrivalTime} at ${to}`
        } catch (error) { console.log(error); }
    }

    getAriaLabelForTicketTypeFareRadio(fare) {
        try {
            if (!fare) return;
            return `Select ${fare?.TicketType} ticket for ${this.sharedService.currencySymbol('')}${fare?.Price} to users`;
        } catch (error) { console.log(error); }
    }

    updateSuggestionLinks() {
        try {
            if (this.selectedTravelSolDataForOutward) {
                if (this.isOutStandardClassSoldOut && (!this.isOutStdPremiumClassSoldOut || !this.isOutFirstClassSoldOut)) {
                    if (!this.isOutStdPremiumClassSoldOut && this.isOutStdPremiumClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: 1, label: this.classTypeEnum?.stdPremiumClass });
                    }
                    if (!this.isOutFirstClassSoldOut && this.isOutFirstClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: (this.selectedTravelSolDataForOutward?.IsStandardPremiumFare ? 2 : 1), label: this.classTypeEnum?.first });
                    }
                } else if (this.isOutStdPremiumClassSoldOut && (!this.isOutFirstClassSoldOut || !this.isOutStandardClassSoldOut)) {
                    if (!this.isOutFirstClassSoldOut && this.isOutFirstClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: (this.selectedTravelSolDataForOutward?.IsStandardFare ? 2 : 1), label: this.classTypeEnum?.first });
                    }
                    if (!this.isOutStandardClassSoldOut && this.isOutStandardClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: 0, label: this.classTypeEnum?.standard });
                    }
                } else if (this.isOutFirstClassSoldOut && (!this.isOutStandardClassSoldOut || !this.isOutStdPremiumClassSoldOut)) {
                    if (!this.isOutStandardClassSoldOut && this.isOutStandardClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: 0, label: this.classTypeEnum?.standard });
                    }
                    if (!this.isOutStdPremiumClassSoldOut && this.isOutStdPremiumClassSoldOut !== undefined) {
                        this.suggestedClassLinksForOutSoldOut.push({ index: ((!this.selectedTravelSolDataForOutward?.IsStandardFare) ? 0 : 1), label: this.classTypeEnum?.stdPremiumClass });
                    }
                }
            }
            if (this.selectedTravelSolDataForReturn) {
                if (this.isRetStandardClassSoldOut && (!this.isRetStdPremiumClassSoldOut || !this.isRetFirstClassSoldOut)) {
                    if (!this.isRetStdPremiumClassSoldOut && this.isRetStdPremiumClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: 1, label: this.classTypeEnum?.stdPremiumClass });
                    }
                    if (!this.isRetFirstClassSoldOut && this.isRetFirstClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: (this.selectedTravelSolDataForReturn?.IsStandardPremiumFare ? 2 : 1), label: this.classTypeEnum?.first });
                    }
                } else if (this.isRetStdPremiumClassSoldOut && (!this.isRetFirstClassSoldOut || !this.isRetStandardClassSoldOut)) {
                    if (!this.isRetFirstClassSoldOut && this.isRetFirstClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: (this.selectedTravelSolDataForReturn?.IsStandardFare ? 2 : 1), label: this.classTypeEnum?.first });
                    }
                    if (!this.isRetStandardClassSoldOut && this.isRetStandardClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: 0, label: this.classTypeEnum?.standard });
                    }
                } else if (this.isRetFirstClassSoldOut && (!this.isRetStandardClassSoldOut || !this.isRetStdPremiumClassSoldOut)) {
                    if (!this.isRetStandardClassSoldOut && this.isRetStandardClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: 0, label: this.classTypeEnum?.standard });
                    }
                    if (!this.isRetStdPremiumClassSoldOut && this.isRetStdPremiumClassSoldOut !== undefined) {
                        this.suggestedClassLinksForRetSoldOut.push({ index: ((!this.selectedTravelSolDataForReturn?.IsStandardFare) ? 0 : 1), label: this.classTypeEnum?.stdPremiumClass });
                    }
                }
            }
        } catch (error) { console.log(error); }
    }

    isOnlyOneFareSelected(selectedTravelSolData): boolean {
        try {
            let flags = [
                selectedTravelSolData?.IsStandardFare,
                selectedTravelSolData?.IsStandardPremiumFare,
                selectedTravelSolData?.IsFirstClassFare
            ];
            // Count how many are true
            return flags.filter(Boolean).length === 1;
        } catch (error) { console.log(error); }
    }    

    getArialLabelForSelectedClass(classType, isSoldOut, selectedMinPrice, direction: 'outward' | 'return'): string {
        try {
                let price = `${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(selectedMinPrice)}`;
                let baseLabel = this.getBaseLabel(classType);
                let legendText = this.getLegendText(classType);
                let isSelected = direction === 'outward' ? this.activeClass === classType : this.returnActiveClass === classType;  
                let isFocused = direction === 'outward' ? this.focusedOutwardClass === classType : this.focusedReturnClass === classType; 
                
                if(!isSoldOut && isSelected){
                    return `Select class to travel. Use arrow keys to switch. ${baseLabel}, from ${price}. ${legendText}`;
                }

                if (isSoldOut && isSelected) {
                  return `Select class to travel. Use arrow keys to switch. ${baseLabel}. Sold out online. ${legendText}.`;
                }

                if (isFocused && !isSelected && !isSoldOut) {
                return `${baseLabel}. ${price}. ${legendText}.`;
                }

                if (isFocused && !isSelected && isSoldOut) {
                  return `${baseLabel}. Sold out online. ${legendText}.`;
                }
        } catch (error) { console.log(error); }
    }

    getAriaLabel(fare: any, getDirection): string {
        try {
            if (!fare) return '';
            let price = `${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(fare?.Price)}`;
            let count = fare?.FareDescription?.length || 0;
            return `${fare?.TicketType} ${(this.isMobile || this.isTablet) ? getDirection : ''} ${price} List with ${count} items.`

        } catch (error) { console.log(error); }
    }

    getAriaLabelAfterSelected(fare, isOutward) {
        try {
            if (fare && fare?.isSelected) {
                let adults = this.searchRequest?.Adult ?? 0;
                let children = this.searchRequest?.Child ?? 0;
                let getPromoOrRailcard = this.getRailcardOrPromoText();
                let label = '';
                if (adults > 0) {
                    label += `${adults} ${adults === 1 ? 'Adult' : 'Adults'}`;
                }

                if (children > 0) {
                    if (label) label += ' , ';
                    label += `${children} ${children === 1 ? this.enhancedPassangerTypeEnum.ChildText : this.enhancedPassangerTypeEnum.ChildrenText}`;
                }
                if (isOutward) {
                    if (this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return) {
                        return `${this.enhancedAccessbilityMessageEnum.outTicketSelected} ${label}, ${getPromoOrRailcard}. total ${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(fare?.Price)} ${this.enhancedAccessbilityMessageEnum.nextSelectReturnString}`;
                    }
                    return `${this.enhancedAccessbilityMessageEnum?.singleTicketSelected} ${label}, ${getPromoOrRailcard}. total ${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(fare?.Price)} ${this.enhancedAccessbilityMessageEnum.checkPriceBreakDownOrContinueString}`;
                } else {
                    return `${this.enhancedAccessbilityMessageEnum.retTicketSelected} ${label}, ${getPromoOrRailcard}. total ${this.sharedService.currencySymbol('')}${this.sharedService.formatPrice(fare?.Price)} ${this.enhancedAccessbilityMessageEnum.checkPriceBreakDownOrContinueString}`
                }
            }
        } catch (error) { console.log(error); }
    }

    getRailcardOrPromoText(): string {
        try {
            let promo = this.searchRequest?.PromotionCode;
            let railcards = this.searchRequest?.RailCardList ?? [];

            if (promo) {
                return this.enhancedRailcardTypeEnum.promotionAppliedText;
            } else if (railcards.length > 0) {
                return `${railcards.length} ${railcards.length > 1 ? 'Railcards' : 'Railcard'}`;
            } else {
                return this.enhancedRailcardTypeEnum.noRailcardText;
            }
        } catch (error) { console.log(error); }
    }

    isExistAvantiOperator(SelectedTravelSolData) {
        if (SelectedTravelSolData && (SelectedTravelSolData?.Operator === 1 || SelectedTravelSolData?.Operator === 2)) {
            return true;
        }
        return false;
    }

    redirectingOnSearchResultsPage() {
        if(this.showReturn){
         localStorage.setItem(this.localStorageKeyEnum.viewOtherTrainTimesFromReturn, "true");
        }
        if(this.showOutward){
        localStorage.setItem(this.localStorageKeyEnum.viewOtherTrainTimesFromOutward, "true");
        }
        this.backToOutward();
    }

    isExistRailCardApplied(fare) {
        try {
            let count = 0;
            if ((this.searchResponse && this.searchResponse?.Request && this.searchResponse?.Request?.RailCardList?.length > 0) || (this.searchReturnResponse && this.searchReturnResponse?.Request && this.searchReturnResponse?.Request?.RailCardList?.length > 0) || (this.nreJourneyExtrasResponse?.SearchRequest?.RailCardList?.length > 0) ) {
                if (fare?.IsRailCardAvailableForFare) {
                    return 1;
                } else {
                    return 2;
                }
            }
            return count;
        } catch (error) { console.log(error); }
    }

    modifiedMinimumFareClassType(minimumFareClassType) {
        try {
            let TICKET_ORDER = [this.classTypeEnum.standardClass, this.classTypeEnum.stdPremiumClass, this.classTypeEnum.firstClass];
            return minimumFareClassType.sort((a, b) => {
                return TICKET_ORDER.indexOf(a.TicketClass) - TICKET_ORDER.indexOf(b.TicketClass);
            });
        } catch (error) { console.log(error); }
    }

    isLabelLessCard(fare: any): boolean {
        try {
            return !fare?.isCheapestFareOverall &&
                !fare?.IsLimited &&
                !fare?.InOffer &&
                this.isExistRailCardApplied(fare) !== 1;
        } catch (error) { console.log(error); }
    }

    shouldAddClass(fare: any): boolean {
        try {
            let hasRailcard = this.isExistRailCardApplied(fare) === 1;
            let isLimited = fare?.IsLimited;
            let hasPriceOrOffer = !!fare?.isCheapestFareOverall  || !!fare?.InOffer;

            return hasRailcard && isLimited && hasPriceOrOffer;
        } catch (error) { console.log(error); }
    }

    isPriceBreakDownButtonDisabled(): boolean {
        try {
            return (
                this.isOutwardFareAndClassSelected || this.isReturnFareAndClassSelected
            );
        } catch (error) { console.log(error); }
    }

    markCheapestFareAccrossAllClassesOfReturn(fareList: any[]): any[] {
        try {
            if (!fareList || fareList.length === 0) return [];

            fareList.sort((a, b) => a.Price - b.Price);
            // Find minimum price
            let cheapestPrice = Math.min(...fareList.filter(obj=>!obj.IsSeatNotAvailable).map(f => f.Price));

             // Find the count for minimum fare
            let minFareCount = fareList.filter(item=> item.Price === cheapestPrice && item.IsSeatNotAvailable === false).length;

            let applyCheapestTag = false;

            // Mark cheapest only if single minimum fare is available and more than 1 fares available.
            if(minFareCount === 1){
                applyCheapestTag = fareList.filter(item=>!item.IsSeatNotAvailable).length > 1;
            }
            
            // Set flag for fares matching cheapest price
            return fareList.map(fare => ({
                ...fare,
                isCheapestFareOverall: applyCheapestTag && fare.Price === cheapestPrice
            }));
        } catch (error) { console.log(error); }
    }

    markCheapestFareAccrossAllClassesOfOutAndPureReturn(outwardList: any[], returnList: any[]): { outwardList: any[], returnList: any[] } {
        try {
            let isOpenReturn = this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum.openReturn;
            // Combine both lists to find the cheapest fare easily
            let combined = [...outwardList, ...returnList];
            
            // Find the minimum fare
            let minFare = Math.min(...combined.filter(obj=>!obj.IsSeatNotAvailable).map(item => item.Price));

            // Find the count for minimum fare
            let minFareCount = combined.filter(item=> item.Price === minFare && item.IsSeatNotAvailable === false).length;

            let applyCheapestTag = false;

            // Mark cheapest only if single minimum fare is available and more than 1 fares available.
            if(minFareCount === 1) {
                applyCheapestTag = isOpenReturn ? returnList.filter(item=>!item.IsSeatNotAvailable).length > 1 : outwardList.filter(item=>!item.IsSeatNotAvailable).length > 1;
            }
            
            // Mark cheapest fare in list1
            let updatedList1 = outwardList.map(item => ({
                ...item,
                isCheapestFareOverall: applyCheapestTag && item.Price === minFare
            }));

            // Mark cheapest fare in list2
            let updatedList2 = returnList.map(item => ({
                ...item,
                isCheapestFareOverall: applyCheapestTag && item.Price === minFare
            }));

            updatedList1.sort((a, b) => a.Price - b.Price);
            updatedList2.sort((a, b) => a.Price - b.Price);

            return { outwardList: updatedList1, returnList: updatedList2 };
        } catch (error) { console.log(error); }
    }

    applyOfferLogicForAutoSelect(listOfStandardTicketType, listOfStdPremiumClassTicketType, listOfFirstClassTicketType, isOutward, modifiedSoldOutList) {
        try {
            let selectedOffer: any = null;
            let combined = [
                ...listOfStandardTicketType.map(item => ({
                    ...item,
                    classType: this.classTypeEnum.standardClass,
                    tabIndex: 0
                })),
                ...listOfStdPremiumClassTicketType.map(item => ({
                    ...item,
                    classType: this.classTypeEnum.stdPremiumClass,
                    tabIndex: 1
                })),
                ...listOfFirstClassTicketType.map(item => ({
                    ...item,
                    classType: this.classTypeEnum.firstClass,
                    tabIndex: 2
                }))
            ];

            combined = combined.map(item => {let matched = modifiedSoldOutList?.find((c) => c.TicketClass === item.classType);
            return { ...item, IsSoldOut: matched?.IsSoldOut ?? false };
            });

            let inOfferItems = combined.filter(item => item?.InOffer && !item?.IsSoldOut);

            if (inOfferItems.length === 1) {
                selectedOffer = inOfferItems[0];
            } else if (inOfferItems?.length > 1) {
                selectedOffer = inOfferItems.reduce((cheapest, current) =>
                    current?.Price < cheapest?.Price ? current : cheapest,
                    inOfferItems[0] 
                );
            }

            this.getSelectedOffer(selectedOffer, isOutward);

        } catch (error) { console.log(error); }
    }

    getSelectedOffer(selectedOffer, isOutward) {
        try {
            if (selectedOffer) {
                if (isOutward) {
                    this.selectedTabIndex = selectedOffer?.tabIndex;
                } else {
                    this.returnSelectedTabIndex = selectedOffer?.tabIndex;
                }
            }
        } catch (error) { console.log(error); }
    }

    getArticle(fareType: string): string {
        try {
            if (!fareType) return '';
            let firstChar = fareType?.trim()?.charAt(0)?.toLowerCase();
            if (['a', 'e', 'i', 'o', 'u'].includes(firstChar)) {
                return 'An';
            }
            return 'A';
        } catch (error) { console.log(error); }
    }

    updateRailCardAppliedDivState() {
        try {
            // outward OR return → show
            if (this.selectedOutwardRailCardApplied || this.selectedReturnRailCardApplied) {
                let result = this.getPassengerAndDistinctRailCards(this.searchRequest);
                let passengers = result?.Passengers;
                let distinctRailCards = result?.DistinctRailCards;

                // Condition 1: Exactly 2 passengers with only "Two Together" railcard → hide
                if (passengers?.Total === 2 && distinctRailCards?.length === 1 && distinctRailCards[0]?.RailCard === "2TR") {
                    this.isRailCardAppliedDivVisible = false;
                    return;
                }

                if (passengers?.Total >= 2 && distinctRailCards?.length === 1 && distinctRailCards[0]?.RailCardCount > 1) {
                    this.isRailCardAppliedDivVisible = false;
                    return;
                }

                // Condition 2: 2 or more passengers with different railcards → show
                if (passengers?.Total >= 2 && distinctRailCards?.length > 0) {
                    this.isRailCardAppliedDivVisible = true;
                    return;
                }

            } else {
                this.isRailCardAppliedDivVisible = false;
            }
        } catch (error) { console.log(error); }
    }

    getPassengerAndDistinctRailCards(searchRequest: any) {
        // 1. Passenger list
        let passengers = {
            Adult: searchRequest?.Adult || 0,
            Child: searchRequest?.Child || 0,
            Total: (searchRequest?.Adult || 0) + (searchRequest?.Child || 0)
        };

        // 2. Distinct RailCard aggregation
        let distinctRailCards: any[] = [];
        (searchRequest?.RailCardList || []).forEach((item: any) => {
            let existing = distinctRailCards?.find(r => r?.RailCard === item?.RailCard);
            if (existing) {
                existing.Adult += item?.Adult || 0;
                existing.Child += item?.Child || 0;
                existing.RailCardCount += item?.RailCardCount || 0;
            } else {
                distinctRailCards.push({
                    RailCard: item?.RailCard,
                    Adult: item?.Adult || 0,
                    Child: item?.Child || 0,
                    RailCardCount: item?.RailCardCount || 0
                });
            }
        });

        return {
            Passengers: passengers,
            DistinctRailCards: distinctRailCards
        };
    }

    closeRailcardAppliedSection() {
        this.isRailCardAppliedDivVisible = false;
    }

    loadGTMDataLayeronExpandingSolutions(element, isSingleReturnElement, selectedFare) {
        let indexOfElement = -1;
        try {
        if (isSingleReturnElement) {
            indexOfElement = this.searchReturnResponse.TravelSolutions.indexOf(element);
            let inward = this.enhancedTravelSolutionTypesEnum?.inward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.inward?.slice(1).toLowerCase();
            this.ga4dataLayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, -1, inward, selectedFare, false, true, this.enhancedSearchSourceTypeEnum?.selectTicketAndClass);
        }
        else if (!isSingleReturnElement) {
            indexOfElement = this.searchResponse.TravelSolutions.indexOf(element);
            let outward = this.enhancedTravelSolutionTypesEnum?.outward?.charAt(0).toUpperCase() + this.enhancedTravelSolutionTypesEnum?.outward?.slice(1).toLowerCase();
            this.ga4dataLayerService.loadGA4ViewItem(element, this.searchRequest, indexOfElement, -1, outward, selectedFare, false, true, this.enhancedSearchSourceTypeEnum?.selectTicketAndClass);
        }
        } catch (err) { console.log(err); }
    }

    callGa4DataLayerEventsOnTabChange(tabName, selectedStatus, isReturn, selectedTabFares, tabIndex, cheapestFarePrice) {
        try {
            this.searchResponseboth = new EnhancedSearchResponseModel();
            if (isReturn) {
                this.searchResponseboth.RetTravelSolutions = this.searchReturnResponse?.TravelSolutions ?? [];
            } else {
                this.searchResponseboth.TravelSolutions = this.searchResponse?.TravelSolutions ?? [];
            }

            let filterObject = {
                selectedFilter: tabName,
                filterStatus: selectedStatus,
                tabFares: selectedTabFares ?? [],
                tabIndex: tabIndex,
                cheapestFarePrice: cheapestFarePrice
            }

            // ga4-datalayer search and view_list_item event
            let ga4SearchEventParam = new GA4SearchEventParam();
            ga4SearchEventParam.searchSource = this.enhancedSearchSourceTypeEnum?.selectTicketAndClass;
            ga4SearchEventParam.searchSuccess = true;
            ga4SearchEventParam.searchError = "";

            this.ga4dataLayerService.changeClassTabGA4DataLayerEvent(
                this.selectedTravelSolDataForOutward,
                this.selectedTravelSolDataForReturn,
                this.searchRequest,
                ga4SearchEventParam,
                this.searchResponseboth,
                null,
                true,
                filterObject,
                isReturn
            );
        } catch (error) {
            console.log(error);
        }
    }

    private getSelectedTabFares(tabType: 'outward' | 'return', activeClass: string): { selectedTabFares: any[], cheapestFarePrice: number | null } {
        try {
            let isOutward = tabType === this.travelSolutionJourneyTypeEnum.outwardString;
            let isOpenReturn = this.searchRequest?.TravelSolutionDirection === this.enhancedTravelSolutionTypesEnum?.openReturn;

            // Class-wise ticket mappings
            let classMap = {
                [this.classTypeEnum.standardClass]: {
                    out: this.listOfStandardTicketTypeForOut || [],
                    pureReturn: this.listOfStandardTicketTypeForPureReturn || [],
                    ret: this.listOfStandardTicketTypeForRet || []
                },
                [this.classTypeEnum.stdPremiumClass]: {
                    out: this.listOfStdPremiumClassTicketTypeForOut || [],
                    pureReturn: this.listOfStdPremiumClassTicketTypeForPureReturn || [],
                    ret: this.listOfStdPremiumClassTicketTypeForRet || []
                },
                [this.classTypeEnum.firstClass]: {
                    out: this.listOfFirstClassTicketTypeForOut || [],
                    pureReturn: this.listOfFirstClassTicketTypeForPureReturn || [],
                    ret: this.listOfFirstClassTicketTypeForRet || []
                }
            };

            let ticketSets = classMap[activeClass];
            let fares: any[] = [];

            if (ticketSets) {
                if (isOutward) {
                    fares = isOpenReturn ? ticketSets.pureReturn : [...ticketSets.out, ...ticketSets.pureReturn];
                } else {
                    fares = ticketSets.ret;
                }
            }

            // find cheapest fare for that class
            const selectedTabFares = structuredClone(fares);
            let cheapestFare = selectedTabFares?.find(f => f?.isCheapestFareOverall);
            let cheapestFarePrice = cheapestFare ? parseFloat(cheapestFare?.Price) : null;
            return { selectedTabFares, cheapestFarePrice };
        } catch (error) { console.log(error); }
    }

    private triggerDefaultGa4Event(tabType, tabIndex: number, isReturn: boolean, activeClass: string): void {
        let { selectedTabFares, cheapestFarePrice } = this.getSelectedTabFares(tabType, activeClass);

        this.callGa4DataLayerEventsOnTabChange(activeClass, 'default', isReturn, selectedTabFares, tabIndex, cheapestFarePrice);
    }

    setJourneySummaryModelForOutward(){
      try {
        this.sharedService.journeySummaryModel ??= new JourneySummaryModel();
        this.sharedService.journeySummaryModel.SingleTime = this.selectedTravelSolDataForOutward?.DarwinDepartureTime + ' → ' + this.selectedTravelSolDataForOutward?.DarwinArrivalTime;
        this.sharedService.journeySummaryModel.SingleDuration = this.selectedTravelSolDataForOutward?.Duration;
        this.sharedService.journeySummaryModel.SingleChanges = this.selectedTravelSolDataForOutward?.Changes;
        this.sharedService.journeySummaryModel.SingleTicketType = this.selectedOutwardFare?.TicketTypeName;
        this.sharedService.journeySummaryModel.SingleCurrency = this.selectedOutwardFare?.Currency;
        this.sharedService.journeySummaryModel.SinglePrice = this.selectedOutwardFare?.Price;
        this.sharedService.journeySummaryModel.SingleTicketDescription = this.selectedOutwardFare?.TicketDescription;
        this.sharedService.journeySummaryModel.SingleOperator = this.selectedTravelSolDataForOutward?.Operator;
        this.sharedService.journeySummaryModel.SingleOperatorChange = this.selectedTravelSolDataForOutward?.OperatorChange;
        this.sharedService.journeySummaryModel.SingleSaleCompany = this.selectedTravelSolDataForOutward?.SaleCompany;
        this.sharedService.journeySummaryModel.SingleSelectedFare = this.selectedOutwardFare;
        this.sharedService.journeySummaryModel.SingleSearchCache = this.searchResponse?.Request?.SearchCache;
        this.sharedService.journeySummaryModel.SingleRouteModel = this.selectedTravelSolDataForOutward;
      } catch (error){
        console.log(error);
      }
    }

    setJourneySummaryModelForReturn(){
        try{
        this.sharedService.journeySummaryModel ??= new JourneySummaryModel();
        this.sharedService.journeySummaryModel.ReturnTime = this.selectedTravelSolDataForReturn?.DarwinDepartureTime + ' → ' + this.selectedTravelSolDataForReturn?.DarwinArrivalTime;
        this.sharedService.journeySummaryModel.ReturnDuration = this.selectedTravelSolDataForReturn?.Duration;
        this.sharedService.journeySummaryModel.ReturnChanges = this.selectedTravelSolDataForReturn?.Changes;
        if(this.checkTraveSolutionDirection()){
            this.sharedService.journeySummaryModel.ReturnTicketType = this.sharedService?.journeySummaryModel?.SingleTicketType;
        } else {
            this.sharedService.journeySummaryModel.ReturnTicketType = this.selectedReturnFare.TicketTypeName;
        }
        this.sharedService.journeySummaryModel.ReturnCurrency = this.selectedReturnFare.Currency;
        this.sharedService.journeySummaryModel.ReturnPrice = this.selectedReturnFare.Price;
        this.sharedService.journeySummaryModel.ReturnTicketDescription = this.selectedReturnFare.TicketDescription;
        this.sharedService.journeySummaryModel.ReturnOperator = this.selectedTravelSolDataForReturn?.Operator;
        this.sharedService.journeySummaryModel.ReturnOperatorChange = this.selectedTravelSolDataForReturn?.OperatorChange;
        this.sharedService.journeySummaryModel.ReturnSaleCompany = this.selectedTravelSolDataForReturn?.SaleCompany;
        this.sharedService.journeySummaryModel.ReturnSelectedFare = this.selectedReturnFare;
        this.sharedService.journeySummaryModel.ReturnSearchCache = this.searchResponse?.Request?.SearchCache;
        this.sharedService.journeySummaryModel.ReturnRouteModel = this.selectedTravelSolDataForReturn;
        } catch(error){
        console.log(error);
        }
    }

    checkTraveSolutionDirection() {
        let direction = this.searchRequest.TravelSolutionDirection;
        let isOpenReturn = direction === this.enhancedTravelSolutionTypesEnum?.openReturn;
        let isReturn = direction === this.enhancedTravelSolutionTypesEnum?.return;
        let isSingleFareSelected = this.sharedService?.journeySummaryModel?.IsSingleFareSelected;
        let isSoldOut = this.sharedService.isSearchErrorSoldOut || this.sharedService.isReturnSearchErrorSoldOut;

        if (isSoldOut) {
            return false;
        }

        if (isOpenReturn) {
            return true;
        }

        if (isReturn) {
            return !isSingleFareSelected;
        }
        return false;
    }

    callGa4DataLayerEventsOnSuccess() {
      try {
        this.searchResponseboth = new EnhancedSearchResponseModel();
        this.searchResponseboth.TravelSolutions = this.searchResponse?.TravelSolutions?.filter(out => out?.TravelSolId == this.selectedTravelSolDataForOutward?.TravelSolId);
        this.searchResponseboth.RetTravelSolutions = this.searchReturnResponse ? this.searchReturnResponse?.TravelSolutions?.filter(ret => ret?.TravelSolId == this.selectedTravelSolDataForReturn?.TravelSolId) : null;
        let outwardSelectedFare = this.sharedService?.journeySummaryModel?.SingleSelectedFare;
        let returnSelectedFare = this.sharedService?.journeySummaryModel?.ReturnSelectedFare;
        // ga4-datalayer search and view_list_item event
        let ga4SearchEventParam = new GA4SearchEventParam();
        ga4SearchEventParam.searchSource = this.enhancedSearchSourceTypeEnum?.homepageSearchSource;
        ga4SearchEventParam.searchSuccess = true;
        ga4SearchEventParam.searchError = "";
        this.ga4dataLayerService.loadGA4DataLayerOnSearch(
          this.searchRequest,
          ga4SearchEventParam,
          this.searchResponseboth,
          0,
          null,
          outwardSelectedFare,
          returnSelectedFare,
          true
        );
      } catch (error) {
        console.log(error);
      }
  }

  formatFareType(fareType: string): string {
    try {
        if (!fareType) return '';
        return fareType.replace(/ 1st$/i, '');
    } catch (error) { console.log(error); }
  }

    nreHandoffData(handOffDataRequest) {
        try {
        this.journeyExtraService.nreHandoffData(handOffDataRequest).subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                if (this.responseData.Data != null) {
                  this.nreJourneyExtrasResponse = this.responseData.Data;
                  localStorage.setItem(this.enhancedLocalOrSessionStorageKeyEnum.getDataFromNRE, "true");
                  let outAndRetTravelSolData = {
                      selectedOutwardTravelSolution : this.nreJourneyExtrasResponse?.TravelSolutions,
                      selectedReturnTravelSolution : this.nreJourneyExtrasResponse?.ReturnTravelSolutions,
                  }
                  this.getAllSelectedTicketTypeAndClassForOutAndRet = outAndRetTravelSolData;
                  this.searchRequest = this.nreJourneyExtrasResponse?.SearchRequest;
                  this.setSharedServiceNRE(this.nreJourneyExtrasResponse);
                    if (this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn) {
                         let ts = this.nreJourneyExtrasResponse?.TravelSolutions;
                        if (ts) {
                            ts.SingleFare = this.nreJourneyExtrasResponse?.TravelSolutions.ReturnFare;
                            ts.FareList = this.nreJourneyExtrasResponse?.TravelSolutions.ReturnFareList;
                            ts.NewFareList = this.nreJourneyExtrasResponse?.TravelSolutions.NewReturnFareList;
                            ts.IsStandardFare = this.nreJourneyExtrasResponse?.TravelSolutions.IsRetStandardFare;
                            ts.IsStandardPremiumFare = this.nreJourneyExtrasResponse?.TravelSolutions.IsRetStandardPremiumFare;
                            ts.IsFirstClassFare = this.nreJourneyExtrasResponse?.TravelSolutions.IsRetFirstClassFare;
                        }
                    }
                    // Call NRE fare selection method
                    this.nreOutwardSelectedFare = this.commonServices.getNRESelectedFare(this.nreJourneyExtrasResponse?.TravelSolutions);
                    if(this.nreOutwardSelectedFare) {
                       this.selectedStdRadio = this.nreOutwardSelectedFare?.Price;
                       this.selectedOutwardFare = this.nreOutwardSelectedFare;
                    }
                    this.nreReturnSelectedFare = this.commonServices.getNRESelectedFare(this.nreJourneyExtrasResponse?.ReturnTravelSolutions);
                    if(this.nreReturnSelectedFare) {
                        this.selectedReturnRadio = this.nreReturnSelectedFare?.Price;
                        this.selectedReturnFare = this.nreReturnSelectedFare;
                    }
                    let travelSolutions = this.nreJourneyExtrasResponse?.TravelSolutions;
                    this.cameFromFlexibleReturn = !!travelSolutions?.NewReturnFareList?.flatMap(x => x.FareList || [])?.find(f => f.IsNRESelectedFare);
                    if(this.searchRequest.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn || this.cameFromFlexibleReturn){
                        this.isFlexibleReturnSelectedFare = this.nreOutwardSelectedFare?.Price;
                    }
                    this.setFareSelectionFlags();
                    this.createDataForPassingWhileNavigating();
                    if (this.nreJourneyExtrasResponse?.TotalPrice) {
                     this.data.totalFare = this.nreJourneyExtrasResponse?.TotalPrice;
                     this.data.singleFare = 0;
                    }
                    this.getAllTicketTypeAndClassesForOutAndRet();
                    this.updateSuggestionLinks();
                }
                else {
                this.commonServices.showEnhancedCommonErrorPopup();
                }
              }
              else {
                this.commonServices.showEnhancedCommonErrorPopup();
              }
            }
          });
        } catch (error) { console.log(error); }
    }

    setSharedServiceNRE(nreJourneyExtrasResponse) {
        this.sharedService.searchRequest = this.nreJourneyExtrasResponse.SearchRequest;
        this.searchRequest = this.nreJourneyExtrasResponse.SearchRequest;
        this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
        if (this.searchRequest.ReturnTimesStart) {
          this.searchRequest.ReturnTimesStartShow = new Date(this.searchRequest.ReturnTimesStart);
        }
        if (this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.return || this.searchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.forward){
            this.searchRequest.IsReturnRequest = true;
        }
        this.sharedService.amendSearchRequest = structuredClone(this.searchRequest);
        this.sharedService.journeyExtrasResponseShared = this.nreJourneyExtrasResponse.JourneyExtras;
        this.setFarebreakdownNRE();
        if (!sessionStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum?.pageReloaded)) {
          this.iframeSrc = this.commonServices.trackNreHandOffUrl(nreJourneyExtrasResponse, true);
          localStorage.setItem(this.localStorageKeyEnum.nreDataResponse, JSON.stringify(nreJourneyExtrasResponse));
        }
        this.commonServices.cacheSharedData();
    }

    setFarebreakdownNRE() {
        let fareBreakdownModel = new FareBreakdownModel;
        fareBreakdownModel.OutWardJourney = [];
        fareBreakdownModel.ReturnJourney = [];
        if(this.nreJourneyExtrasResponse?.SearchRequest?.TravelSolutionDirection == this.enhancedTravelSolutionTypesEnum?.openReturn){
            let openExpiryDate = this.nreJourneyExtrasResponse?.TravelSolutions?.NewReturnFareList?.flatMap(x => x.FareList || [])?.find(f => f.IsNRESelectedFare)?.OpenReturnExpiryDate;
            fareBreakdownModel.OpenReturnExpiryDate = openExpiryDate;
            fareBreakdownModel.IsReturnJourney = true;
        }
        this.nreJourneyExtrasResponse.OutwardFares.forEach(obj => {
          let outJourney = new JourneyModel;
          outJourney.Passenger = obj.FarePerson;//'1 * Adult';
          outJourney.PricePerPerson = obj.BasePrice;
          outJourney.TotalPrice = obj.Price;
          outJourney.RailCard = obj.Railcard;
          outJourney.IsCheck = obj.IsCheck;
          outJourney.TicketTypeName = this.nreJourneyExtrasResponse.OutwardFares[0]?.TicketType;
          fareBreakdownModel.OutWardJourney.push(outJourney);
        });
        this.nreJourneyExtrasResponse.ReturnFares.forEach(obj => {
          let retJourney = new JourneyModel;
          retJourney.Passenger = obj.FarePerson;//'1 * Adult';
          retJourney.PricePerPerson = obj.BasePrice;
          retJourney.TotalPrice = obj.Price;
          retJourney.RailCard = obj.Railcard;
          retJourney.IsCheck = obj.IsCheck;
          retJourney.TicketTypeName = this.nreJourneyExtrasResponse.ReturnFares[0]?.TicketType;
          fareBreakdownModel.ReturnJourney.push(retJourney);
        });
        this.fareBreakDownData.push(fareBreakdownModel);
        if (this.nreJourneyExtrasResponse.IsBasket) {
          this.fareBreakDownDataNreBasket.push(fareBreakdownModel);
        }
        this.sharedService.fareBreakdownModelData = this.fareBreakDownData;

        if (this.sharedService.fareBreakdownModelData?.length > 0) {
            let model = this.sharedService.fareBreakdownModelData[0];

            let outwardSol = this.nreJourneyExtrasResponse?.TravelSolutions;
            let returnSol  = this.nreJourneyExtrasResponse?.ReturnTravelSolutions;

            if (outwardSol) {
                model.OutwardDepartureTime = outwardSol?.DepartureTime?.split(' ')[0];
                model.OutwardArrivalTime = outwardSol?.ArrivalTime?.split(' ')[0];
                model.OutwardDuration = outwardSol?.Duration;
                model.OutChanges = outwardSol?.Changes;
            }

            if (returnSol) {
            model.ReturnDepartureTime = returnSol.DepartureTime?.split(" ")[0];
            model.ReturnArrivalTime = returnSol.ArrivalTime?.split(" ")[0];
            model.ReturnDuration = returnSol.Duration;
            model.RetChanges = returnSol.Changes;
            }
        }
    }

    setFareSelectionFlags() {
        this.isOutwardFareAndClassSelected = !!this.nreOutwardSelectedFare;
        this.isReturnFareAndClassSelected = !!this.nreReturnSelectedFare;
        if(this.isFlexibleReturnSelectedFare){
            this.isOutwardFareAndClassSelected = true;
            this.isReturnFareAndClassSelected = true;
        }
        this.isPriceBreakDownButtonDisabled();
    }

    private setActiveTabFromNRE(selectedFare, classList, isOutward: boolean) {
        if (!selectedFare || !classList || classList.length === 0) return;

        let idx = classList.findIndex(c => c?.TicketClass?.toLowerCase() === selectedFare?.TicketClass?.toLowerCase());
        if (idx === -1) return;
        if (isOutward) {
            this.selectedTabIndex = idx;
            this.activeClass = selectedFare?.TicketClass;
        } else {
            this.returnSelectedTabIndex = idx;
            this.returnActiveClass = selectedFare?.TicketClass;
        }
    }

  conditionToCheckTravelSolDataForReturnOnGoToSearch(){
      return (this.isMobile || this.isTablet) && this.selectedTravelSolDataForReturn && this.showReturn;
  }

  conditionToCheckOutwardAndSelectTicketAndClassPageOnGoToSearch(){
      return this.showOutward && this.router.url.includes(`/${this.enhancedAppRouteEnum.selectTicketAndClass}`);
  }

  ngOnDestory(){
      this.sharedService.isUserClickedOnReviewBtn = false;
  }

     private getCheapestOverallClass(...ticketLists) {
        try {
            for (let list of ticketLists) {
                if (Array.isArray(list)) {
                    let cheapest = list.find(x => x?.isCheapestFareOverall === true);
                    if (cheapest) return cheapest.TicketClass;
                }
            }
            return null;
        } catch (error) { console.log(error); }
    }

    getRailcardNotAppliedAriaLabel(searchRequest, isReturn: boolean): string {
        try {
            let outwardDate = searchRequest?.DepartureTimesStartShow;
            let returnDate = searchRequest?.ReturnTimesStartShow;

            let formattedDate = isReturn ? this.datePipe.transform(returnDate, 'EEE, dd MMM yyyy') : this.datePipe.transform(outwardDate, 'EEE, dd MMM yyyy');

            let direction = isReturn ? `${this.travelSolutionJourneyTypeEnum.return}` : `${this.travelSolutionJourneyTypeEnum.outward}`;

            return `Railcard not applied to this ticket for your journey ${direction}, ${formattedDate}`;
         } catch (error) { console.log(error); }
    }

    getLearnMoreAriaLabel(searchRequest, isOutward: boolean): string {
      try {
        let outwardDate = searchRequest?.DepartureTimesStartShow;
        let returnDate = searchRequest?.ReturnTimesStartShow;
        let formattedDate = isOutward ? this.datePipe.transform(outwardDate, 'EEEE, dd MMMM yyyy') : this.datePipe.transform(returnDate, 'EEEE, dd MMMM yyyy');
        return `Learn more about the comfort in each class for your journey ${isOutward ? this.travelSolutionJourneyTypeEnum.outward : this.travelSolutionJourneyTypeEnum.return}, ${formattedDate}`;
      } catch (error) { console.log(error); }
    }

    getBaseLabel(classType: any): string {
        switch (classType) {
            case this.classTypeEnum.standardClass:
            return `${this.classTypeEnum.standard}`;
            case this.classTypeEnum.stdPremiumClass:
            return `${this.classTypeEnum.stdPremiumClass}`;
            case this.classTypeEnum.firstClass:
            return `${this.classTypeEnum.first}`;
            default:
            return '';
        }
    }

    getLegendText(classType: any): string {
        switch (classType) {
            case this.classTypeEnum.standardClass:
            return `${this.enhancedAccessbilityMessageEnum.standardClassLegendTxt}`;
            case this.classTypeEnum.stdPremiumClass:
            return `${this.enhancedAccessbilityMessageEnum.standardPremiumClassLegendTxt}`;
            case this.classTypeEnum.firstClass:
            return `${this.enhancedAccessbilityMessageEnum.firstClassLegendTxt}`;
            default:
            return '';
        }
    }


    onTabFocus(event: FocusEvent, direction: 'outward' | 'return') {
        try{
            let tabEl = (event.target as HTMLElement)?.closest('.mat-mdc-tab');
            if (!tabEl) return;

            let tabList = tabEl.parentElement?.children;
            if (!tabList) return;

            let index = Array.from(tabList).indexOf(tabEl);

            let classType = this.getClassTypeByIndex(index);
            if (direction === 'outward') {
                this.focusedOutwardClass = classType;
            } else {
                this.focusedReturnClass = classType;
            }
        } catch (error) { console.log(error); }
    }

    getClassTypeByIndex(index: number) {
        switch (index) {
            case 0:
            return this.classTypeEnum.standardClass;
            case 1:
            return this.classTypeEnum.stdPremiumClass;
            case 2:
            return this.classTypeEnum.firstClass;
            default:
            return null;
        }
    }
}