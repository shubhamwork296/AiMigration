import { Component, Injector, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { GA4SearchEventParam, SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SearchSolutionService } from 'src/app/services/search-solutions.service';
import { ResponseData } from 'src/app/models/common/response.model';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { Router } from '@angular/router';
import { MixingDeckModel } from 'src/app/models/mixing-deck/mixing-deck.model';
import * as moment from 'moment';
import { AppConstantsService, AppRouteEnum, LocalStorageKeyEnum, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { CommonServices } from 'src/app/services/common.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { ConfigurationSettings } from 'src/app/models/common/configuration-settings.model';
import { LocationMasterData } from 'src/app/models/master/location-master.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { AmendSearchComponent } from '../../mixing-deck/amend-search/amend-search.component';
import { FareBreakdownComponent } from '../../mixing-deck/fare-breakdown/fare-breakdown.component';
import { SubscriptionResponse, EligibleOffers } from 'src/app/models/season-flexi/subscription-response.model';
import { LoginPageComponent } from '../../login-page/login-page.component';
import { TicketInfoComponent } from '../../mixing-deck/ticket-info/ticket-info.component';
import { JourneyModel, FareBreakdownModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { browserRefresh } from '../../../app-component/app.component';
import { CreateReservationRequest } from 'src/app/models/journey-extras/reservation.model';
import { HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
  selector: 'app-season-solutions',
  templateUrl: './season-solutions.component.html',
  styleUrls: ['./season-solutions.component.css','../../../../assets/css/styles.css'],
})
export class SeasonSolutionsComponent implements OnInit {
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  passengerDetailLabel: string;
  responseData: ResponseData;
  stationResponseData: ResponseData;
  searchSubscriptionResponse: SubscriptionResponse;
  mixingDeckModelList: MixingDeckModel[];
  evaluateTravelRequest: EvaluateTravelRequest;
  journeyType: string;
  loadDataFromCache: boolean;
  configurationSettings: ConfigurationSettings
  locations: LocationMasterData[];
  isBuyNowDisable: boolean = false;
  departure: any;
  arrival: any;
  selectedOfferId: number;
  selectedPrice: number;
  selectedServiceId: number;
  totalPrice: number;
  totalPriceCurrency: string;
  listCounter: number = 0;
  ongoingDateString: string;
  currentDateString: string;
  minDate: Date = new Date();
  maxDate: string = moment(this.minDate).add(14, 'days').format('YYYY-MM-DD');
  noDataFound: string;
  selectedIndex: any;
  offerName: string;
  selectedDurationType: string;


  @ViewChild('tooltip2', { static: false }) tooltip2: any;
  @ViewChild('tooltip17', { static: false }) tooltip17: any;
  searchRequest: SearchRequestModel;

  IsHelpPopupVisible: boolean = false;
  browserRefresh: boolean;
  reviewBuyDetail:any;

  searchSolutionService: SearchSolutionService;
  modalService: NgbModal;
  sharedSibling: SharedService;
  router: Router;
  appConstantsService: AppConstantsService;
  commonServices: CommonServices;
  notificationservice: NotificationService;
  journeyExtraService: JourneyExtraService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  spinnerService: NgxSpinnerService;
  appRouteEnum: AppRouteEnum;
  ga4DataLayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;

  constructor(private readonly injector: Injector, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.searchSolutionService = this.injector.get(SearchSolutionService);
    this.modalService = this.injector.get(NgbModal);
    this.sharedSibling = this.injector.get(SharedService);
    this.router = this.injector.get(Router);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.commonServices = this.injector.get(CommonServices);
    this.notificationservice = this.injector.get(NotificationService);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.ga4DataLayerService = this.injector.get(GA4DatalayerService);

    this.sharedSibling.isReturnLoaderCase = false;
    this.currentDateString = moment(new Date()).format('YYYY-MM-DD');
    this.searchRequest = new SearchRequestModel();
    this.searchRequest.RailCardList = new Array<RailCardModel>();
    this.configurationSettings = new ConfigurationSettings();
    this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
    this.sharedSibling.fareBreakdownModelData[0] = new FareBreakdownModel();
    this.commonServices.loadGTMDataLayerAllPages();
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
  }
  ngOnInit() {
    this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
    this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false); 
    this.storageDataService.setStorageData(this.travelSolutionEnum.isSeason.charAt(0).toLowerCase() + this.travelSolutionEnum.isSeason.slice(1), "true", false);
    // for showing basket icon when go back from review-buy to search-results
    if (this.sharedSibling?.reviewBuyResponse) {
      this.sharedSibling.getBasketCount.emit(this.sharedSibling.reviewBuyResponse.BasketCount);
    }
    // PICO-2010 - Page_meta_data Ga4-datalayer event
    this.ga4DataLayerService.loadGA4DataLayerAllPages(true);
    let isRedirectFromHomePage = JSON.parse(localStorage.getItem("isRedirectFromHomePage"));
    if (!environment.production) {
      isRedirectFromHomePage = true;
    }
    if (isRedirectFromHomePage) {
      this.getQueryString();
    }

    this.browserRefresh = browserRefresh;
    this.setBrowserRefreshData(isRedirectFromHomePage);
    isRedirectFromHomePage = false;
    localStorage.setItem("isRedirectFromHomePage",isRedirectFromHomePage);
    //Get shared cache data
    this.sharedSibling.isAmendFresh = true;
    if (this.sharedSibling.isAmendSearchOpen) {
      this.searchRequest = this.sharedSibling.searchRequest;
      this.openAmend();
    }
    
    this.commonServices.callApiForGetLocationMasterData();

    if (!this.sharedSibling.isAmendSearchOpen) {
      if (this.sharedSibling.searchRequest != null && this.sharedSibling.searchRequest != undefined)
        this.searchRequest = this.sharedSibling.searchRequest;
      if (this.searchRequest.TravelSolutionDirection == 'SEASON') {
        this.journeyType = 'Season';
      }
      this.passengerDetailLabel = this.searchRequest.Adult ? "adult" : "child";
      this.getSeasonTravelSolutions();
    }


    this.departure = this.searchRequest.DepartureLocationName.split('(')[0];
    this.arrival = this.searchRequest.ArrivalLocationName.split('(')[0];
  }

  setBrowserRefreshData(isRedirectFromHomePage) {
    //Get shared cache data
    if (this.checkForBrowserRefreshAndSeasonURL()) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh) {
        this.sharedSibling.reviewBuyCache = sharedSiblingRefresh.reviewBuyCache;
        this.sharedSibling.ReservationCache = sharedSiblingRefresh.ReservationCache;
        this.sharedSibling.locationMasterData = sharedSiblingRefresh.locationMasterData;
        if(isRedirectFromHomePage)
        {
          this.sharedSibling.searchRequest = this.searchRequest;
          this.sharedSibling.fareBreakdownModelData = new Array<FareBreakdownModel>();
          this.sharedSibling.isAmendSearchOpen = false;
        }
        else{
        this.sharedSibling.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedSibling.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedSibling.isAmendSearchOpen = (sharedSiblingRefresh.isAmendSearchOpen != undefined) ? sharedSiblingRefresh.isAmendSearchOpen : false;
        }
        this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.sharedSibling.enhancedReviewBuyResponse = sharedSiblingRefresh.enhancedReviewBuyResponse;
        this.sharedSibling.LatestJourneyCache = sharedSiblingRefresh.LatestJourneyCache;
        this.setSharedSiblingBasketCountAndReviewBuyResponse();
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
      }
    }
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
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
        this.getSeasonTravelSolutions();
        this.isBuyNowDisable = false;
        this.departure = this.searchRequest.DepartureLocationName.split('(')[0];
        this.arrival = this.searchRequest.ArrivalLocationName.split('(')[0];
        this.passengerDetailLabel = this.searchRequest.Adult ? "adult" : "child";
        this.journeyType = 'Season';
      }
    });
  }

  farebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }

  checkAllTooltipStatus() {
    if (!this.tooltip2.isOpen() && !this.tooltip17.isOpen())
      this.IsHelpPopupVisible = false;
    else
      this.IsHelpPopupVisible = true;
  }
  showHelp() {
    if (!this.IsHelpPopupVisible) {

      this.tooltip2.open();
      this.tooltip17.open();


    }
    else {

      this.tooltip2.close();
      this.tooltip17.close();

    }
    this.IsHelpPopupVisible = !this.IsHelpPopupVisible;
  }

  openJourneyExtra() {
    if((this.sharedSibling.reviewBuyResponse != null && this.sharedSibling.reviewBuyResponse.BasketCount != 0) || (this.sharedSibling?.enhancedReviewBuyResponse?.BasketCount !== 0))
    {
       this.reviewBuyDetail =this.sharedSibling?.reviewBuyResponse?.Journey?.find(x=>x.OutwardDetail != null || x.ReturnDetail != null);
       let enhancedReviewBuyDetail = this.sharedSibling?.enhancedReviewBuyResponse?.Journey?.find(x=>x.OutwardDetail != null || x.ReturnDetail != null);
    if(this.reviewBuyDetail != null || this.reviewBuyDetail != undefined || enhancedReviewBuyDetail != null || enhancedReviewBuyDetail != undefined)
    {
      this.notificationservice.warn("You can not purchase a season ticket while there are one or more non-season tickets in your basket. Please delete the tickets from your basket and try again.");
      return false;
    }
    }
   
    try {
      let selectTravelSolParams = {
        searchRequest: this.searchRequest,
        searchSource: 'Homepage',
        searchSuccess: true,
        searchError: '',
        searchResponse: this.searchSubscriptionResponse,
        defaultSelectedRow: -1,
        selectedRow: this.selectedDurationType,
        selectedPrice: this.selectedPrice,
        defaultSelectedRowSingleReturn: -1,
        SelectedRowReturn: -1
      }
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, -1, true, [], null, null, -1);
      if (this.searchSubscriptionResponse && this.searchSubscriptionResponse.SeasonEligibleOffers.length > 0) {
        this.searchSubscriptionResponse.SeasonEligibleOffers.forEach((season, index) => {
          this.callGA4Events(season, index);
        });
      }
    } catch (error) {
      console.log(error);
    }
    this.sharedSibling.evaluateRequest = this.evaluateTravelRequest;
    this.sharedSibling.sendSearchRequest(this.searchRequest);
    this.getEvaluateData();
  }

  callGA4Events(season, index) {
    if (season.WeeklyOffers && season.WeeklyOffers.OfferId == this.selectedOfferId && season.WeeklyOffers.ServiceId == this.selectedServiceId) {
      this.ga4DataLayerService.loadGA4selectItem(null, season.WeeklyOffers, 0, this.searchRequest, index, null);
    }
    else if (season.MonthlyOffers && season.MonthlyOffers.OfferId == this.selectedOfferId && season.MonthlyOffers.ServiceId == this.selectedServiceId) {
      this.ga4DataLayerService.loadGA4selectItem(null, season.MonthlyOffers, 0, this.searchRequest, index, null);
    }
    else if (season.YearlyOffers && season.YearlyOffers.OfferId == this.selectedOfferId && season.YearlyOffers.ServiceId == this.selectedServiceId) {
      this.ga4DataLayerService.loadGA4selectItem(null, season.YearlyOffers, 0, this.searchRequest, index, null);
    }
    else if (season.CustomOffers && season.CustomOffers.OfferId == this.selectedOfferId && season.CustomOffers.ServiceId == this.selectedServiceId) {
      this.ga4DataLayerService.loadGA4selectItem(null, season.CustomOffers, 0, this.searchRequest, index, null);
    }
    else if (season.FlexiOffers && season.FlexiOffers.OfferId == this.selectedOfferId && season.FlexiOffers.ServiceId == this.selectedServiceId) {
      this.ga4DataLayerService.loadGA4selectItem(null, season.FlexiOffers, 0, this.searchRequest, index, null);
    }
  }

  onChangeStationsSearch() {
    let arrivalLocation = this.searchRequest.ArrivalLocation;
    let arrivalLocationName = this.searchRequest.ArrivalLocationName;
    this.searchRequest.ArrivalLocation = this.searchRequest.DepartureLocation;
    this.searchRequest.DepartureLocation = arrivalLocation;
    this.searchRequest.ArrivalLocationName = this.searchRequest.DepartureLocationName;
    this.searchRequest.DepartureLocationName = arrivalLocationName;
    this.resetTravelSolution();
    this.getSeasonTravelSolutions();
    this.departure = this.searchRequest.DepartureLocationName.split('(')[0];
    this.arrival = this.searchRequest.ArrivalLocationName.split('(')[0];
  }


  getQueryString() {
    this.commonServices.loaderRequired = true;
    let queryString = localStorage.getItem("searchQueryString");
    if (!environment.production) {
      queryString = "localhost:4200/season-search-results?oriCode=700019696&oriName=Dagenham Dock (DDK)&destCode=700018579&destName=West Horndon (WHR)&oadInd=Arrive Before&override_handoff=MATRIX&startDate=03/04/2022&endDate=04/04/2022&jt=Season&noa=1&noc=0&isW=true&isM=true&isA=true&isC=false&isF=true&rcNum=0&rcCode=Choose Railcard..&rcNoa=1&rcNoc=0&rJson=[]&rCount=0";
    }
    if (queryString?.includes('?')) {
      this.sharedSibling.mixingDeckUrl = queryString;
      const params = new HttpParams({ fromString: queryString.split('?')[1] });
      this.searchRequest.DepartureLocationName = params.get("oriName");
      this.searchRequest.ArrivalLocationName = params.get("destName");
      this.searchRequest.DepartureLocation = +params.get("oriCode");
      this.searchRequest.ArrivalLocation = +params.get("destCode");

      this.searchRequest.Adult = +params.get("noa");
      this.searchRequest.Child = +params.get("noc");

      if (params.get("jt") === 'Season') {
        this.searchRequest.TravelSolutionDirection = 'SEASON';
        this.searchRequest.IsReturnRequest = false;
        this.journeyType = 'Season';
      }

      let startDateString = params.get('startDate');
      let startDateParts = startDateString.split("/");
      let startDateObject = new Date(+startDateParts[2], +startDateParts[1] - 1, +startDateParts[0]);
      this.searchRequest.DepartureTimesStart = moment(startDateObject).format('YYYY-MM-DDTHH:mm');
      this.ongoingDateString = moment(startDateObject).format('YYYY-MM-DD');

      if (this.searchRequest.IsCustom) {
        let endDateString = params.get('endDate');
        let endDateParts = endDateString.split("/");
        let endDateObject = new Date(+endDateParts[2], +endDateParts[1] - 1, +endDateParts[0]);
        this.searchRequest.TravelEndDate = moment(endDateObject).format('YYYY-MM-DDTHH:mm');
      }

      this.setDataFromQueryString(params);

      this.passengerDetailLabel = this.searchRequest.Adult ? "adult" : "child";

      let rCount = +params.get('rCount');
      for (let i = 0; i < rCount; i++) {
        let railcard = new RailCardModel;
        railcard.RailCard = params.get('rcCode');
        railcard.Adult = +params.get('rcNoa');
        railcard.Child = +params.get('rcNoc');
        railcard.RailCardCount = +params.get('rcNum');
        if (railcard.Child == 0) {
          this.searchRequest.RailCardList.push(railcard);
        }
      }
      this.sharedSibling.searchRequest = this.searchRequest;
    }
  }

  setDataFromQueryString(params) {
    this.searchRequest.IsWeekly = params.get("isW") == "true" ? true : false;
    this.searchRequest.IsMonthly = params.get("isM") == "true" ? true : false;
    this.searchRequest.IsAnnual = params.get("isA") == "true" ? true : false;
    this.searchRequest.IsFlexi = params.get("isF") == "true" ? true : false;
    this.searchRequest.IsCustom = params.get("isC") == "true" ? true : false;
  }

  ticketInfo(ticketType: string) {
    this.dialog.open(TicketInfoComponent, {
      disableClose: false,
      panelClass: 'ticket-info',
      data: {
        TicketType: ticketType.trim()
      }
    });
  }
  getEvaluateData() {
    this.journeyExtraService.getEvaluateResponse(this.evaluateTravelRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (this.responseData.Data != null) {
              this.sharedSibling.journeyExtrasResponseShared = this.responseData.Data;
              this.sharedSibling.createReservationRequest = new CreateReservationRequest();
              //Set shared cache data
              this.sharedSibling.setSharedCache();
              this.storageDataService.clearStorageData("sharedSibling");
              this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
              //Set shared cache data
              this.checkLogin();
            }
            else {
              this.notificationservice.error(this.responseData.ResponseMessage);
            }
          }
          else {
            this.notificationservice.error(this.responseData.ResponseMessage);
          }
        }
      });
  }

  getSeasonTravelSolutions() {
    this.searchRequest.IsSeason = true;
    this.searchSolutionService.getSeasonFlexiDetails(this.searchRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.searchSubscriptionResponse = this.responseData.Data;
            this.setSeasonData();
          }
          else {
            try {
              let selectTravelSolParams = {
                searchRequest: this.searchRequest,
                searchSource: 'Homepage',
                searchSuccess: false,
                searchError: this.responseData.ResponseMessage,
                searchResponse: null,
                defaultSelectedRow: -1,
                selectedRow: -1,
                selectedPrice: null,
                defaultSelectedRowSingleReturn: -1,
                SelectedRowReturn: -1
              }
              this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, -1, false, [], null, null, -1);
              // ga4-datalayer search and view_list_item event
               let ga4SearchEventParam = new GA4SearchEventParam();
              ga4SearchEventParam.searchSource = 'Homepage';
              ga4SearchEventParam.searchSuccess = false;
              ga4SearchEventParam.searchError = this.responseData.ResponseMessage;
              this.ga4DataLayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, null,-1,[],null,null);
             
            } catch (error) {
              console.log(error);
            }
             if (this.responseData.ResponseCode == '204') {
              this.noDataFound = this.responseData.ResponseMessage;
              this.searchSubscriptionResponse = new SubscriptionResponse();
              this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
              this.totalPrice = 0;
            }
            this.isBuyNowDisable = true;
          }
        }
      });
  }

  setSeasonData() {
    if (this.searchSubscriptionResponse != null) {
      if (this.searchSubscriptionResponse.Request != null) {
        this.searchRequest.DepartureTimesStart = moment(this.searchSubscriptionResponse.Request.DepartureTimesStart).format('YYYY-MM-DDTHH:mm');
        this.searchRequest.DepartureTimesStartShow = new Date(this.searchRequest.DepartureTimesStart);
        this.ongoingDateString = moment(new Date(this.searchRequest.DepartureTimesStart)).format('YYYY-MM-DD');
      }
      this.setCheapestOfferData();
      this.setEvaluateRequestData();
      localStorage.setItem(this.localStorageKeyEnum.reviewMergedFlowAppSetting, String(this.searchSubscriptionResponse?.IsReviewMergedFlowEnabled));
    }
    try {
      let selectTravelSolParams = {
        searchRequest: this.searchRequest,
        searchSource: 'Homepage',
        searchSuccess: true,
        searchError: '',
        searchResponse: this.searchSubscriptionResponse,
        defaultSelectedRow: this.selectedIndex,
        selectedRow: -1,
        selectedPrice: this.selectedPrice,
        defaultSelectedRowSingleReturn: -1,
        SelectedRowReturn: -1
      }
      this.commonServices.loadGTMDataLayerOnSearch(selectTravelSolParams, -1, false, [], null, null, -1);
      // ga4-datalayer search and view_list_item event
      let ga4SearchEventParam = new GA4SearchEventParam();
      ga4SearchEventParam.searchSource = 'Homepage';
      ga4SearchEventParam.searchSuccess = true;
      ga4SearchEventParam.searchError = '';
      this.ga4DataLayerService.loadGA4DataLayerOnSearch(this.searchRequest, ga4SearchEventParam, this.searchSubscriptionResponse, -1, [], null, null);
    } catch (error) {
      console.log(error);
    }
  }

  setCheapestOfferData() {
    if (this.searchSubscriptionResponse.CheapestOffer != null) {
      this.selectedOfferId = this.searchSubscriptionResponse.CheapestOffer.OfferId;
      this.selectedPrice = this.searchSubscriptionResponse.CheapestOffer.Price;
      this.selectedServiceId = this.searchSubscriptionResponse.CheapestOffer.ServiceId;
      this.selectedDurationType = this.searchSubscriptionResponse.CheapestOffer.DurationType;
      this.setTravelSolution(this.searchSubscriptionResponse.CheapestOffer);
      this.searchSubscriptionResponse.SeasonEligibleOffers.forEach((season, index) => {
        if ((season.WeeklyOffers && season.WeeklyOffers.OfferId == this.selectedOfferId && season.WeeklyOffers.ServiceId == this.selectedServiceId) || (season.MonthlyOffers && season.MonthlyOffers.OfferId == this.selectedOfferId && season.MonthlyOffers.ServiceId == this.selectedServiceId) || (season.YearlyOffers && season.YearlyOffers.OfferId == this.selectedOfferId && season.YearlyOffers.ServiceId == this.selectedServiceId) || (season.CustomOffers && season.CustomOffers.OfferId == this.selectedOfferId && season.CustomOffers.ServiceId == this.selectedServiceId) ||(season.FlexiOffers && season.FlexiOffers.OfferId == this.selectedOfferId && season.FlexiOffers.ServiceId == this.selectedServiceId)) {
          this.selectedIndex = index;
        }
      });
    }
  }

  setEvaluateRequestData() {
    if (this.sharedSibling.evaluateRequest != null && this.sharedSibling.evaluateRequest != undefined) {
      this.selectedOfferId = this.sharedSibling.evaluateRequest.OutwardOfferId;
      this.selectedServiceId = this.sharedSibling.evaluateRequest.OutwardCatlogServiceId;
      this.searchSubscriptionResponse.SeasonEligibleOffers.forEach((season, index) => {
        if (season.WeeklyOffers != null && season.WeeklyOffers != undefined && season.WeeklyOffers.OfferId == this.selectedOfferId && season.WeeklyOffers.ServiceId == this.selectedServiceId) {
          this.selectedPrice = season.WeeklyOffers.Price;
          this.selectedDurationType = season.WeeklyOffers.DurationType;
          this.setTravelSolution(season.WeeklyOffers);
          this.selectedIndex = index;
        }
        else if (season.MonthlyOffers != null && season.MonthlyOffers != undefined && season.MonthlyOffers.OfferId == this.selectedOfferId && season.MonthlyOffers.ServiceId == this.selectedServiceId) {
          this.selectedPrice = season.MonthlyOffers.Price;
          this.selectedDurationType = season.MonthlyOffers.DurationType;
          this.setTravelSolution(season.MonthlyOffers);
          this.selectedIndex = index;
        }
        else if (season.YearlyOffers != null && season.YearlyOffers != undefined && season.YearlyOffers.OfferId == this.selectedOfferId && season.YearlyOffers.ServiceId == this.selectedServiceId) {
          this.selectedPrice = season.YearlyOffers.Price;
          this.selectedDurationType = season.YearlyOffers.DurationType;
          this.setTravelSolution(season.YearlyOffers);
          this.selectedIndex = index;
        }
        else if (season.CustomOffers != null && season.CustomOffers != undefined && season.CustomOffers.OfferId == this.selectedOfferId && season.CustomOffers.ServiceId == this.selectedServiceId) {
          this.selectedPrice = season.CustomOffers.Price;
          this.selectedDurationType = season.CustomOffers.DurationType;
          this.setTravelSolution(season.CustomOffers);
          this.selectedIndex = index;
        }
        else if (season.FlexiOffers != null && season.FlexiOffers != undefined && season.FlexiOffers.OfferId == this.selectedOfferId && season.FlexiOffers.ServiceId == this.selectedServiceId) {
          this.selectedPrice = season.FlexiOffers.Price;
          this.selectedDurationType = season.FlexiOffers.DurationType;
          this.setTravelSolution(season.FlexiOffers);
          this.selectedIndex = index;
        }
      });
    }
  }

  selectedSeason(eligibleOffers: EligibleOffers, ind: any) {
    this.selectedIndex = ind;
    this.selectedOfferId = eligibleOffers.OfferId;
    this.selectedPrice = eligibleOffers.Price;
    this.selectedServiceId = eligibleOffers.ServiceId;
    this.selectedDurationType  = eligibleOffers.DurationType;
    this.setTravelSolution(eligibleOffers);
  }

  setTravelSolution(offers: EligibleOffers) {
    this.offerName = offers.DurationType;
    if(offers.DurationType == "Flexi Season"){
      this.searchRequest.IsFlexiTicketSelected = true;
    }
    else{
      this.searchRequest.IsFlexiTicketSelected = false;
    }
    this.sharedSibling.fareBreakdownModelData[0] = new FareBreakdownModel();
    this.totalPrice = offers.Price;
    this.totalPriceCurrency = offers.Currency;
    this.evaluateTravelRequest = new EvaluateTravelRequest;
    this.evaluateTravelRequest.IsSeasonTicket = true;
    this.evaluateTravelRequest.OutwardTravelSolutionCache = this.searchSubscriptionResponse.TravelSolutionCache;
    this.evaluateTravelRequest.OutwardTravelSolId = offers.TravelSolutionId;
    this.evaluateTravelRequest.OutwardOfferId = offers.OfferId;
    this.evaluateTravelRequest.OutwardCatlogServiceId = offers.ServiceId;
    this.sharedSibling.fareBreakdownModelData[0].SeasonJourney = new JourneyModel();

    let seasonJourney = new JourneyModel;
    if (this.searchRequest.Adult != 0) {
      seasonJourney.Passenger = '1 * Adult';
      seasonJourney.IsCheck = offers.IsCheck;
    }
    else if (this.searchRequest.Child != 0) {
      seasonJourney.Passenger = '1 * Child';
      seasonJourney.IsCheck = true;
    }
    seasonJourney.PricePerPerson = offers.BasePrice;
    seasonJourney.TotalPrice = offers.Price;
    if (this.searchSubscriptionResponse.Request.RailCardList.length != 0) {
      seasonJourney.RailCard = this.searchSubscriptionResponse.Request.RailCardList[0].RailCard;
      seasonJourney.PricePerPerson = offers.BasePrice;
    }
    this.sharedSibling.fareBreakdownModelData[0].SeasonJourney = seasonJourney;
  }

  checkLogin() {
    let customerKey = localStorage.getItem('CustomerKey');
    let customerEmail = localStorage.getItem('Email');
    if (customerKey != null && customerEmail != null) {
      this.router.navigate([`./` + this.appRouteEnum.JourneyExtras]);
    }
    else {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = false;
      dialogConfig.autoFocus = true;
      dialogConfig.width = "60%";
      dialogConfig.panelClass = ['class-dialog1', 'upgrade-login-popup-ts'];
      dialogConfig.data = { isLoginFromJE: false, isLoginFromSeason: true };
      this.dialog.open(LoginPageComponent, dialogConfig);
    }
  }

  onClickGetNextDaySearch() {
    if (this.listCounter < 7) {
      let date = new Date(this.searchRequest.DepartureTimesStart);
      let nextDate = date.setDate(date.getDate() + 1);
      this.searchRequest.DepartureTimesStart = moment(nextDate).format('YYYY-MM-DDTHH:mm');
      this.ongoingDateString = moment(nextDate).format('YYYY-MM-DD');
      this.getSeasonTravelSolutions();
      this.listCounter++;
    }
    else {
      this.notificationservice.warn("Maximum limit exceeded!");
    }
  }

  onClickGetPreviousDaySearch() {
    if (this.listCounter > -7) {
      let date = new Date(this.searchRequest.DepartureTimesStart);
      let nextDate = date.setDate(date.getDate() - 1);
      this.searchRequest.DepartureTimesStart = moment(nextDate).format('YYYY-MM-DDTHH:mm');
      this.ongoingDateString = moment(nextDate).format('YYYY-MM-DD');
      this.getSeasonTravelSolutions();
      this.listCounter--;
    }
    else {
      this.notificationservice.warn("Sorry, You can't click previous now.");
    }
  }

  resetTravelSolution() {
    this.totalPrice = 0
    this.evaluateTravelRequest = null;
    this.searchSubscriptionResponse = null;
  }

  setReviewBuyPageStepNoForSeason() {
    return this.commonServices.doesDeliveryPageSkipped() ? '3' : '4';
  }

  setPaymentDetailPageStepNoForSeason() {
    return this.commonServices.doesDeliveryPageSkipped() ? '4' : '5';
  }

  checkForBrowserRefreshAndSeasonURL(){
    return this.browserRefresh && this.router.url.includes(this.appRouteEnum.SeasonSolutions) && !this.router.url.includes(this.appRouteEnum.SeasonSolutions + '?');
  }

  setSharedSiblingBasketCountAndReviewBuyResponse(){
    if (this.sharedSibling?.reviewBuyResponse)
      this.sharedSibling?.getBasketCount.emit(this.sharedSibling?.reviewBuyResponse?.BasketCount);
    if (this.sharedSibling?.reviewBuyResponse?.IsRenewSmartcard) {
      this.sharedSibling.reviewBuyResponse = null;
    }
    if (this.sharedSibling?.enhancedReviewBuyResponse)
      this.sharedSibling?.getBasketCount.emit(this.sharedSibling?.enhancedReviewBuyResponse?.BasketCount);
    if (this.sharedSibling?.enhancedReviewBuyResponse?.IsRenewSmartcard) {
      this.sharedSibling.enhancedReviewBuyResponse = null;
    }
  }
}
