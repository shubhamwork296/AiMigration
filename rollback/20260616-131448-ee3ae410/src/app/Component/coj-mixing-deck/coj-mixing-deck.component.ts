import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { COJSearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppRouteEnum, CommonIconImg, DiscountCodeStatusEnum, TravelSolutionDirectionEnum, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { browserRefresh } from 'src/app/app-component/app.component';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { CojSingleListComponent } from './Coj-Single-List/coj-single-list.component';
import { CojReturnListComponent } from './Coj-Return-List/coj-return-list.component';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { TicketInfoComponent } from '../mixing-deck/ticket-info/ticket-info.component';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { MatDialog } from '@angular/material/dialog';
import { RouteDetailsComponent } from '../mixing-deck/route-details/route-details.component';
import { JourneySummaryModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { CojEvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import * as moment from 'moment';
import { CojJourneyExtrasComponent } from '../coj-journey-extras/coj-journey-extras.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { SearchResponseModel } from 'src/app/models/mixing-deck/search-response.model';
import { DiscountCodeNotificationPopupComponent } from './discount-code-notification-popup/discount-code-notification-popup.component';
import { CommonServices } from 'src/app/services/common.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-coj-mixing-deck',
  templateUrl: './coj-mixing-deck.component.html',
  styleUrls: ['./coj-mixing-deck.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CojMixingDeckComponent implements OnInit {
  step = 0;
  step1 = 0;
  step2 = 0;
  sticky: boolean;
  searchRequest: COJSearchRequestModel;
  browserRefresh: boolean;
  journeyDirection: string;
  outwardDate: string;
  returnDate: string;
  noOfAdult: number;
  noOfChild: number;
  showclasstoggle: boolean = false;
  evaluateTravelRequest: CojEvaluateTravelRequest;
  @ViewChild("CojSingleList", { static: false }) CojSingleList: CojSingleListComponent;
  @ViewChild("CojReturnList", { static: false }) CojReturnList: CojReturnListComponent;
  initialSearchRequest: COJSearchRequestModel;
  ga4datalayerService: GA4DatalayerService;
  storageDataService: StorageDataService;
  isReturnTicketTypeForCoj: boolean = false;
  searchResponse: SearchResponseModel;
  searchResponseReturn: SearchResponseModel;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  commonIconImg : CommonIconImg;
  discountCodeStatus: string;
  discountCodeStatusEnum: DiscountCodeStatusEnum;
  commonService: CommonServices;
  callToggleMethodSubscription: Subscription;
  travelSolutionEnum: TravelSolutionJourneyTypeEnum;

  constructor(private readonly router: Router, private readonly appRouteEnum: AppRouteEnum,private readonly dialog: MatDialog, public sharedSibling : SharedService,
    private readonly injector: Injector,private readonly sharedServiceCache : SharedServiceCache, public notificationService: NotificationService,) {
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedSibling.IsNOResultsForOutwardEarlierLater = false;
    this.sharedSibling.IsNOResultsForReturnEarlierLater = false;
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.discountCodeStatusEnum = this.injector.get(DiscountCodeStatusEnum);
    this.commonService = this.injector.get(CommonServices);
    this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
    this.callToggleMethodSubscription= this.commonService.callToggleOnChangeForNoFaresAndExpiredDiscountCode$.subscribe(value => {
      if(value){
        this.ontoggleChange('', value);
      }
    })
   }

  ngOnInit() {
    this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "true", false);
    this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "false", false);
    this.removeUpgradeData();
    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
    this.sharedSibling.COJjourneySummaryModel = new JourneySummaryModel();
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh) {
        this.sharedSibling.reviewBuyCache = sharedSiblingRefresh.reviewBuyCache;
          this.sharedSibling.CojSearchRequest = sharedSiblingRefresh.CojSearchRequest;
          this.sharedSibling.journey = sharedSiblingRefresh.journey;
          this.sharedSibling.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedSibling.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        if (this.sharedSibling.reviewBuyResponse != null && this.sharedSibling.reviewBuyResponse != undefined) {
          this.sharedSibling.reviewBuyCache = this.sharedSibling.reviewBuyResponse.ReviewBuyCache;
          this.sharedSibling.getBasketCount.emit(0);
        }
        this.sharedSibling.locationMasterData = sharedSiblingRefresh.locationMasterData;
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
      }
    }
    this.searchRequest = this.sharedSibling.CojSearchRequest;
    this.searchRequest.SearchRequestDto.JourneySearchType = 'NEW';
    this.searchRequest.SearchRequestDto.FirstTrainDepartureTimesStart = '';
    this.searchRequest.SearchRequestDto.LastTrainDepartureTimesStart = '';
    this.searchRequest.SearchRequestDto.FirstTrainArrivalTimesStart = '';
    this.searchRequest.SearchRequestDto.LastTrainArrivalTimesStart = '';

    if(this.searchRequest?.SearchRequestDto) {
      this.journeyDirection = this.searchRequest.SearchRequestDto.TravelSolutionDirection;
      this.outwardDate = this.searchRequest.SearchRequestDto.DepartureTimesStart;
      this.sharedSibling.COJjourneySummaryModel.outwardDate = this.searchRequest.SearchRequestDto.DepartureTimesStart;
      this.returnDate = this.searchRequest.SearchRequestDto.ReturnTimesStart;
      this.sharedSibling.COJjourneySummaryModel.returnDate = this.searchRequest.SearchRequestDto.ReturnTimesStart;
      this.noOfAdult = this.searchRequest.SearchRequestDto.Adult;
      this.noOfChild = this.searchRequest.SearchRequestDto.Child;
    }
    this.addRailcardToCOJjourneySummaryModel();
    this.sharedSibling.getBasketCount.emit(0);
    this.initialSearchRequest = JSON.parse(JSON.stringify(this.searchRequest));
    this.searchResponse = new SearchResponseModel();
    this.searchResponseReturn = new SearchResponseModel();
    this.sharedSibling.isReturnTicketTypeForCoj.subscribe(searchResponse => {
      this.isReturnTicketTypeForCoj = searchResponse.IsReturnTypeTicket;
      this.searchResponse = searchResponse.SingleTravel;
      this.searchResponseReturn = searchResponse.ReturnTravel;
      if(!this.searchResponse){
        this.searchResponse = new SearchResponseModel();
      }
      this.searchResponse.IsDiscountCodeAvailable = searchResponse.IsDiscountCodeAvailable;
      this.searchResponse.OutwordDiscountCodeStatus = searchResponse.OutwordDiscountCodeStatus;
      this.searchResponse.ReturnDiscountCodeStatus = searchResponse.ReturnDiscountCodeStatus;
      this.searchResponse.IsDiscountCodeAvailableOnOriginalJourney = searchResponse.IsDiscountCodeAvailableOnOriginalJourney;
      this.searchResponse.IsComplimentaryDiscountApplied = searchResponse.IsComplimentaryDiscountApplied;
    });
    this.sharedSibling.isSingleTicketTypeForCoj.subscribe(searchResponse => {
      this.searchResponse.IsDiscountCodeAvailable = searchResponse?.IsDiscountCodeAvailable;
      this.searchResponse.OutwordDiscountCodeStatus = searchResponse?.OutwordDiscountCodeStatus;
      this.searchResponse.ReturnDiscountCodeStatus = searchResponse?.ReturnDiscountCodeStatus;
      this.searchResponse.IsDiscountCodeAvailableOnOriginalJourney = searchResponse?.IsDiscountCodeAvailableOnOriginalJourney;
      this.searchResponse.IsComplimentaryDiscountApplied = searchResponse.IsComplimentaryDiscountApplied;
    })
  }
  removeUpgradeData() {
       this.storageDataService.clearSessionStorageData("isUpgradeChange");
     }

  addRailcardToCOJjourneySummaryModel() {
    if (this.searchRequest?.SearchRequestDto?.RailCardList?.length > 0) {
      let railCard = '';
      if (this.searchRequest.SearchRequestDto.RailCardList.length == 1) {
        railCard =this.searchRequest.SearchRequestDto.RailCardList[0].RailCard[0];
      } else {
        railCard = "Multiple Railcards";
      }
      if (this.sharedSibling.COJjourneySummaryModel) {
        this.sharedSibling.COJjourneySummaryModel.RailCards = railCard;
      }
      else {
        this.sharedSibling.COJjourneySummaryModel = new JourneySummaryModel();
        this.sharedSibling.COJjourneySummaryModel.RailCards = railCard;
      }
    }
  }

    onGoBack() {
      this.router.navigate(["./"+ this.appRouteEnum.ViewBooking]);
    }  

  onContinueCheckForOneWayTravelSolutionDirection(){
    if (this.sharedSibling?.COJjourneySummaryModel?.SingleChoosedTravelSolution) {
      this.createReviewBuyRequestModel();
      if (this.sharedSibling.COJjourneySummaryModel.IsCOJWithTravelExtra) {
        this.openCOJWithTravelExtraPopup();
      }
      else {
        // go to review buy
        this.router.navigate([`./` + this.appRouteEnum.CojReviewBuy]);
      }
    } else {
      this.notificationService.warn('Please select a journey first');
    }
  }
  
  OnClickNotCOJjourneySummaryModel(){
    this.createReviewBuyRequestModel();
    if (this.sharedSibling.COJjourneySummaryModel.IsCOJWithTravelExtra) {
      this.openCOJWithTravelExtraPopup();
    }
    else {
      // go to review buy          
      this.router.navigate([`./` + this.appRouteEnum.CojReviewBuy]);
    }
  }

  onContinue() {
    this.searchRequest = this.initialSearchRequest;
    this.sharedSibling.CojSearchRequest = this.searchRequest;
    // need to check this condition in case of outward leg only, if outward departure date is greater than return date.
    if (this.sharedSibling.COJjourneySummaryModel.ReturnChoosedTravelSolution && this.searchRequest.SearchRequestDto.ChoosedTrainleg === this.travelSolutionDirectionEnum.both) {
      if (moment(this.sharedSibling?.COJjourneySummaryModel?.ReturnChoosedTravelSolution?.DepartureDate) <= moment(this.sharedSibling?.COJjourneySummaryModel?.SingleChoosedTravelSolution?.ArrivalDate)) {
        this.notificationService.error("Return service should not be before departing service.");
        return;
      }
    }
    if (this.searchRequest?.SearchRequestDto?.TravelSolutionDirection === this.travelSolutionDirectionEnum.oneWay || this.searchRequest?.SearchRequestDto?.TravelSolutionDirection === this.travelSolutionDirectionEnum.openReturn) {
      this.onContinueCheckForOneWayTravelSolutionDirection();
    }
    else if (this.isReturnTicketTypeForCoj && this.searchRequest?.SearchRequestDto) {
     this.warningMessageWhenTicketTypeIsRetForCoj();
    }
    else if ((this.searchRequest?.SearchRequestDto?.TravelSolutionDirection === this.travelSolutionDirectionEnum.forward || this.searchRequest?.SearchRequestDto?.TravelSolutionDirection === this.travelSolutionDirectionEnum.return)) {
      this.warningMessageWhenTicketTypeIsNotRetForCoj();
    }
    this.ga4datalayerService.loadGA4selectItemForCOJ(this.sharedSibling.COJjourneySummaryModel, this.sharedSibling.COJjourneySummaryModel.activeTab, this.searchRequest.SearchRequestDto);
  }

    createReviewBuyRequestModel() {
      this.evaluateTravelRequest = new CojEvaluateTravelRequest();
      if (this.isReturnTicketTypeForCoj) {
        if (this.searchRequest.SearchRequestDto.ChoosedTrainleg != this.travelSolutionDirectionEnum.return_Leg) { // for Outward and Both
          this.evaluateTravelRequest.OutwardCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.ServiceId;
          this.evaluateTravelRequest.OutwardOfferId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.OfferId;
          this.evaluateTravelRequest.OutwardTravelSolId = this.sharedSibling.COJjourneySummaryModel.SingleChoosedTravelSolution.TravelSolId;
          this.evaluateTravelRequest.OutwardTravelSolutionCache = this.sharedSibling.COJjourneySummaryModel.SingleChoosedTravelSolution.TravelSolutionCache;
        }
        if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.return_Leg) { // return leg
          this.evaluateTravelRequest.OutwardTravelSolutionCache = this.searchResponse.TravelSolutionCache;
        }
        this.evaluateTravelRequest.OutwardSearchCustomCache = this.sharedSibling.COJjourneySummaryModel.SingleSearchCache;
   
        this.checkForwardJourneyDirectionInCaseOfReturnTicket();
        
      } else {
        this.evaluateTravelRequest.OutwardCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.ServiceId;
        this.evaluateTravelRequest.OutwardOfferId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.OfferId;
        this.evaluateTravelRequest.OutwardTravelSolId = this.sharedSibling.COJjourneySummaryModel.SingleChoosedTravelSolution.TravelSolId;
        this.evaluateTravelRequest.OutwardTravelSolutionCache = this.sharedSibling.COJjourneySummaryModel.SingleChoosedTravelSolution.TravelSolutionCache;
        this.evaluateTravelRequest.OutwardSearchCustomCache = this.sharedSibling.COJjourneySummaryModel.SingleSearchCache;

        if (this.journeyDirection === this.travelSolutionDirectionEnum.forward) {
          if (this.sharedSibling.COJjourneySummaryModel.activeTab === 0) {
            this.evaluateTravelRequest.ReturnCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.ReturnSelectedFare.ServiceId;
            this.evaluateTravelRequest.ReturnOfferId = this.sharedSibling.COJjourneySummaryModel.ReturnSelectedFare.OfferId;
          }
          else if (this.sharedSibling.COJjourneySummaryModel.activeTab === 1) {
            this.evaluateTravelRequest.ReturnOfferId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.OfferId;
            this.evaluateTravelRequest.ReturnCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.ServiceId;
          }
          this.evaluateTravelRequest.ReturnTravelSolId = this.sharedSibling.COJjourneySummaryModel.ReturnChoosedTravelSolution.TravelSolId;
          this.evaluateTravelRequest.ReturnTravelSolutionCache = this.sharedSibling.COJjourneySummaryModel.ReturnChoosedTravelSolution.TravelSolutionCache;
          this.evaluateTravelRequest.ReturnSearchCustomCache = this.sharedSibling.COJjourneySummaryModel.ReturnSearchCache;
        }
      }
      this.evaluateTravelRequest.CustomerKey = localStorage.getItem('CustomerKey');
      this.evaluateTravelRequest.TravelId = this.sharedSibling.COJjourneySummaryModel.TravelId;
      this.evaluateTravelRequest.TravelSolutionId = this.sharedSibling.COJjourneySummaryModel.TravelSolutionId;
      this.evaluateTravelRequest.DeliveryMode = this.sharedSibling.COJjourneySummaryModel.DeliveryMode;
      this.evaluateTravelRequest.ReopenCache = this.sharedSibling.COJjourneySummaryModel.ReopenCache;
      this.evaluateTravelRequest.ChoosedTrainleg = this.searchRequest.SearchRequestDto.ChoosedTrainleg;
      this.evaluateTravelRequest.IsPostSaleUpgrade = false;
      // Sending purchsed journey have travel extra or not
      this.evaluateTravelRequest.IsCOJWithTravelExtra = this.sharedSibling.COJjourneySummaryModel.IsCOJWithTravelExtra;

      this.sharedSibling.CojReviewBuyRequest = this.evaluateTravelRequest;
      this.evaluateTravelRequest.IsDiscountCodeAvailable = this.searchResponse.IsDiscountCodeAvailable;
      this.evaluateTravelRequest.IsDiscountCodeAvailableOnOriginalJourney = this.searchResponse?.IsDiscountCodeAvailableOnOriginalJourney;
      this.evaluateTravelRequest.DiscountCodeStatus = this.searchResponse?.OutwordDiscountCodeStatus;
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
    }

  checkForwardJourneyDirectionInCaseOfReturnTicket() {
    if (this.journeyDirection === this.travelSolutionDirectionEnum.forward) {
      if (this.searchRequest.SearchRequestDto.ChoosedTrainleg != this.travelSolutionDirectionEnum.outward_Leg) { // for Return and Both
        if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.return_Leg) {
          this.evaluateTravelRequest.ReturnCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.ReturnSelectedFare.ServiceId;
          this.evaluateTravelRequest.ReturnOfferId = this.sharedSibling.COJjourneySummaryModel.ReturnSelectedFare.OfferId;
        }
        else if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.both) {
          this.evaluateTravelRequest.ReturnOfferId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.OfferId;
          this.evaluateTravelRequest.ReturnCatlogServiceId = this.sharedSibling.COJjourneySummaryModel.SingleSelectedFare.ServiceId;
        }
        this.evaluateTravelRequest.ReturnTravelSolId = this.sharedSibling.COJjourneySummaryModel.ReturnChoosedTravelSolution.TravelSolId;
        this.evaluateTravelRequest.ReturnTravelSolutionCache = this.sharedSibling.COJjourneySummaryModel.ReturnChoosedTravelSolution.TravelSolutionCache;
      }
      if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.outward_Leg) {
        this.evaluateTravelRequest.ReturnTravelSolutionCache = this.searchResponseReturn.TravelSolutionCache;
      }
      this.evaluateTravelRequest.ReturnSearchCustomCache = this.sharedSibling.COJjourneySummaryModel.ReturnSearchCache;
    }
  }

  showRouteDetails(TravelSolution, isReturnCase) {
    this.dialog.open(RouteDetailsComponent, {
      width: '1086px',
      disableClose: false,
      id: "routeDetailsPopUpReturn",
      data: {
        TravelSolutionCache: TravelSolution.TravelSolutionCache,
        TravelSolutionId: TravelSolution.TravelSolId,
        SaleCompanyId: TravelSolution.SaleCompanyId,
        Changes: TravelSolution.Changes,
        Duration: TravelSolution.Duration,
        SearchCustomCache: isReturnCase ? this.sharedSibling.COJjourneySummaryModel.ReturnSearchCache : this.sharedSibling.COJjourneySummaryModel.SingleSearchCache,
      }
    });
  }

    moreDetails(ticketType: string,fare:FareModel) {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass :'ticket-info',
        data: {
          TicketType: ticketType.trim(),
          fare:fare
        }
      });
    }

    setStep2(step2) {
      this.step2 = step2;
    }
    setStep1(step1) {
      this.step1 = step1;
    }
    setStep(val: number) {
      this.step = val;
    }
    showclickEvent() {
      this.showclasstoggle = !this.showclasstoggle;
    }

  // Open COJ with travel extra popup
  openCOJWithTravelExtraPopup() {
    let dialogRef = this.dialog.open(CojJourneyExtrasComponent, {
      width: '611px',
      disableClose: true,
      data: {
        cojEvaluateTravelRequest: this.evaluateTravelRequest,
        isReturnJourney: this.isReturnTicketTypeForCoj
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.success) {
        if (result.procced) {
          this.evaluateTravelRequest.JourneyExtras = result.journeyExtras;
          this.evaluateTravelRequest.JourneyExtrasResponseDto = result.journeyExtrasResponse;
          this.sharedSibling.CojReviewBuyRequest = this.evaluateTravelRequest;
          //Set shared cache data
          this.sharedSibling.setSharedCache();
          this.storageDataService.clearStorageData("sharedSibling");
          this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
          //Set shared cache data;
          // go to review buy          
          this.router.navigate([`./` + this.appRouteEnum.CojReviewBuy]);
        } else {
          return false;
        }
      }
      else {
        if (result.message)
          this.notificationService.error(result.message);
        else
          this.notificationService.error("Something went wrong. Please try again later.");
        return false;
      }
    });
  }
 

  // execute method for return journey more details ticket info in case of (advance single) and (pure return && both leg)
  moreDetailForTicketTypeInCaseOfAdvanceSingleAndPureReturn() {
    return (this.isReturnTicketTypeForCoj && this.searchRequest.SearchRequestDto.ChoosedTrainleg === this.travelSolutionDirectionEnum.both) ? (this.sharedSibling?.COJjourneySummaryModel?.SingleSelectedFare.TicketType) : (this.sharedSibling?.COJjourneySummaryModel?.ReturnSelectedFare?.TicketType);
  }

  // execute method for return journey more details ticket info in case of (advance single) and( pure return && both leg)
  moreDetailForOutAndRetInCaseOfAdvanceSingleAndPureReturn() {
    return (this.isReturnTicketTypeForCoj && this.searchRequest.SearchRequestDto.ChoosedTrainleg === this.travelSolutionDirectionEnum.both) ? (this.sharedSibling?.COJjourneySummaryModel?.SingleSelectedFare) : (this.sharedSibling?.COJjourneySummaryModel?.ReturnSelectedFare);
  }

  warningMessageWhenTicketTypeIsRetForCoj(){
    if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.outward_Leg && !this.sharedSibling?.COJjourneySummaryModel?.SingleChoosedTravelSolution) {
      this.notificationService.warn('Please select a outward journey first');
    } else if (this.searchRequest.SearchRequestDto.ChoosedTrainleg == this.travelSolutionDirectionEnum.return_Leg && !this.sharedSibling?.COJjourneySummaryModel?.ReturnChoosedTravelSolution && this.sharedSibling?.COJjourneySummaryModel?.activeTab === 0) {
      this.notificationService.warn('Please select a return journey first');
    } else {
      this.OnClickNotCOJjourneySummaryModel();
    }
  }

  warningMessageWhenTicketTypeIsNotRetForCoj(){
    if (!this.sharedSibling?.COJjourneySummaryModel?.SingleChoosedTravelSolution) {
      this.notificationService.warn('Please select a outward journey first');
    } else if (!this.sharedSibling?.COJjourneySummaryModel?.ReturnChoosedTravelSolution && this.sharedSibling?.COJjourneySummaryModel?.activeTab === 0) {
      this.notificationService.warn('Please select a return journey first');
    } else {
      this.OnClickNotCOJjourneySummaryModel();
    }
  } 

  ontoggleChange(event, isContinueClicked){
    if(this.journeyDirection === this.travelSolutionDirectionEnum.oneWay || this.journeyDirection === this.travelSolutionDirectionEnum.openReturn && !this.sharedSibling.IsNOResultsForOutwardEarlierLater){
      this.CojSingleList.onDiscountToggleChange(event, isContinueClicked);
    } else if(this.journeyDirection === this.travelSolutionDirectionEnum.forward && !this.sharedSibling.IsNOResultsForOutwardEarlierLater && !this.sharedSibling.IsNOResultsForReturnEarlierLater){
      this.CojReturnList.onDiscountToggleChange(event, isContinueClicked);
    }    
  }
  ngOnDestroy(){
    this.callToggleMethodSubscription?.unsubscribe();
  }
}