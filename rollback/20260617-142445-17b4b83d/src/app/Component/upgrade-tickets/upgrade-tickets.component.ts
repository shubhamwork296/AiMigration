import { Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { ResponseData } from 'src/app/models/common/response.model';
import { CojEvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { COJSearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { SearchResponseModel } from 'src/app/models/mixing-deck/search-response.model';
import { UpgradeResponseDto } from 'src/app/models/upgrade/upgradeResponseDto.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { AppRouteEnum, CommonIconImg, NotificationErrorMsg, TravelSolutionJourneyTypeEnum } from 'src/app/utility/app-constants.service';
import { UpgradeTicketService } from 'src/app/services/upgrade-ticket.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { FareModel } from 'src/app/models/mixing-deck/fare.model';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { CommonServices } from 'src/app/services/common.service';




@Component({
    selector: 'app-upgrade-tickets',
    templateUrl: './upgrade-tickets.component.html',
    styleUrls: ['./upgrade-tickets.component.css'],
    standalone: false
})
export class UpgradeTicketsComponent implements OnInit {

  choosedUpgradeClass: string;
  upgradeAmountOutward: number;
  upgradeAmountReturn: number;
  upgradeClassDataOutward:FareModel;
  upgradeClassDataReturn:FareModel;
  outwardStationName: string;
  returnStationName: string;
  outwardTravelDate: string;
  returnTravelDate: string;
  isOutwardSelected: boolean = false;
  isReturnSelected: boolean = false;
  upgradeSearchRequest:COJSearchRequestModel;
  currency:string;
  isStandardPremiumAvailable: boolean;
  isFirstClassAvailable: boolean;
  isOutwardAvailableForChoosedUpgrade: boolean;
  isReturnAvailableForChoosedUpgrade: boolean;
  isReturnJourney: boolean;
  isOpenReturnJourney: boolean;
  totalAmount = 0;
  responseData: ResponseData;
  upgradeResponse: UpgradeResponseDto;
  singleJourneyResponse: SearchResponseModel;
  returnJourneyResponse: SearchResponseModel;
  isOutwardFirstClassUpgradeExist: boolean;
  isOutwardStandardPremiumUpgradeExist: boolean;
  isReturnFirstClassUpgradeExist: boolean;
  isReturnStandardPremiumUpgradeExist: boolean;

   sharedSibling: SharedService;
   upgradeTicketService: UpgradeTicketService;
   storageDataService: StorageDataService;
   sharedServiceCache: SharedServiceCache;
   router: Router;
   appRouteEnum: AppRouteEnum;
   notificationService: NotificationService;
   spinnerService: NgxSpinnerService;
   ga4datalayerService: GA4DatalayerService;
   commonService: CommonServices;
   notificationErrorMsg: NotificationErrorMsg;
   commonIconImg: CommonIconImg;
   travelSolutionEnum: TravelSolutionJourneyTypeEnum;

   constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {

      // Dependency Injection without using constructor's param
      this.sharedSibling = this.injector.get(SharedService);
      this.upgradeTicketService = this.injector.get(UpgradeTicketService);
      this.storageDataService = this.injector.get(StorageDataService);
      this.sharedServiceCache = this.injector.get(SharedServiceCache);
      this.router = this.injector.get(Router);
      this.appRouteEnum = this.injector.get(AppRouteEnum);
      this.notificationService = this.injector.get(NotificationService);
      this.spinnerService = this.injector.get(NgxSpinnerService);
      this.ga4datalayerService = this.injector.get(GA4DatalayerService);
      this.commonService = this.injector.get(CommonServices);
      this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
      this.commonIconImg =  this.injector.get(CommonIconImg);
      this.travelSolutionEnum = this.injector.get(TravelSolutionJourneyTypeEnum);
  
      this.currency = this.sharedSibling.currencySymbol('');
     }

  ngOnInit() {
   this.storageDataService.setStorageData(this.travelSolutionEnum.isCOJ, "false", false);
    this.storageDataService.setStorageData(this.travelSolutionEnum.isUpgrade, "true", false); // Or API, etc.
    this.removeCojData();
    this.getUpgradeSessionDataOnRefresh();
    this.setJourneyData();
    this.fetchUpgradeData();

    // Page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
  }

  removeCojData() {
    if(JSON.parse(localStorage.getItem("isCOJChange")) === true) {
      localStorage.removeItem("isCOJChange");
    }
  }

  getUpgradeSessionDataOnRefresh() {
    let sharedSiblingRefresh = this.storageDataService.getSessionStorageData("sharedSibling", true);
    if (sharedSiblingRefresh) {
          this.sharedSibling.upgradeSearchRequest = sharedSiblingRefresh.upgradeSearchRequest;
          this.sharedSibling.journey = sharedSiblingRefresh.journey;
          //Set shared cache data
          this.sharedSibling.setSharedCache();
          this.storageDataService.clearSessionStorageData("sharedSibling");
          this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
          //Set shared cache data
    }
  }

  setJourneyData() {
    this.upgradeSearchRequest = this.sharedSibling.upgradeSearchRequest;
    this.outwardStationName = this.upgradeSearchRequest.SearchRequestDto.DepartureLocationName;
    this.returnStationName = this.upgradeSearchRequest.SearchRequestDto.ArrivalLocationName;
  }

  fetchUpgradeData() {
    this.spinnerService.show();
    this.upgradeTicketService.fetchUpgradeData(this.upgradeSearchRequest).subscribe(
      resp => {
        this.spinnerService.hide();
        if (resp !== null) {
          this.responseData = resp as ResponseData;
          let ResponseCode = +this.responseData.ResponseCode;
          if (ResponseCode === 200) {
            this.upgradeResponse = this.responseData.Data;
            this.singleJourneyResponse = this.upgradeResponse.SearchResponse.SingleTravel;
            this.returnJourneyResponse = this.upgradeResponse.SearchResponse.ReturnTravel;
            this.bindUpgradeData();
          }
      }
      });

  }

  bindUpgradeData() {
   if (!this.upgradeResponse?.SearchResponse?.IsPostSalesUpgrade) {
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking]).then(_resp => {
         this.openUgradeNotificationPopup();
      });
      return;
   }
    this.isReturnJourney = this.returnJourneyResponse ? true : false;
    this.isOpenReturnJourney = this.singleJourneyResponse?.Request?.TravelSolutionDirection == 'OPEN_RETURN' ? true : false;
    this.setDates();
    this.setOldPrice();
    this.setAvailableUpgradeClasses(this.singleJourneyResponse,this.isReturnJourney, this.returnJourneyResponse);
    let upgradeItemObject = {
      searchRequest: this.upgradeSearchRequest.SearchRequestDto,
      searchResponse: this.isReturnSelected ? this.returnJourneyResponse  : this.singleJourneyResponse,
      singleJourneyResponse: this.singleJourneyResponse,
      returnJourneyResponse: this.returnJourneyResponse,
      isOutwardSelected: this.isOutwardSelected,
      isReturnSelected: this.isReturnSelected,
      OldOutwardPrice: this.upgradeResponse.OldOutwardPrice,
      OldReturnPrice: this.upgradeResponse.OldReturnPrice,
      selectedUpgrade: null,
      activeTab: 0,
      totalPrice: this.totalAmount
    }
    this.ga4datalayerService.loadGA4UpgradeItem(upgradeItemObject, false);
  }

   openUgradeNotificationPopup() {
      let upgradeUnavailableMsgObj = {
         notificationErrorMsg: this.notificationErrorMsg.upgradeUnavailableMsg,
         notificationTitle: this.notificationErrorMsg.upgradeUnavailableTitle,
      }
      this.commonService.commonNotificationDialog('upgrade-unavailable-common-notification-dialog', upgradeUnavailableMsgObj, this.commonIconImg.exclamationIConImg, false, false);
   }

  setOldPrice() {
     this.sharedSibling.upgradeOutwardPrice = this.upgradeResponse.OldOutwardPrice;
     this.sharedSibling.upgradeReturnPrice = this.upgradeResponse.OldReturnPrice;
  }

  setDates() {
    if(this.singleJourneyResponse?.TravelSolutions?.length > 0) {
      this.outwardTravelDate = this.sharedSibling.getFormattedDate(this.singleJourneyResponse.TravelSolutions[0].DepartureDate);
    }
    if(this.returnJourneyResponse?.TravelSolutions?.length > 0) {
      this.returnTravelDate = this.sharedSibling.getFormattedDate(this.returnJourneyResponse.TravelSolutions[0].DepartureDate);
    }
  }
  
  setAvailableUpgradeClasses(singleJourneyResponse: SearchResponseModel, isReturnJourney: boolean, returnJourneyResponse: SearchResponseModel) {
    let classAvailabilityObject =  this.getAvailableUpgradeClasses(singleJourneyResponse,isReturnJourney, returnJourneyResponse);
    this.isFirstClassAvailable = classAvailabilityObject.isFirstClassAvailable;
    this.isStandardPremiumAvailable = classAvailabilityObject.isStandardPremiumAvailable;
    if(this.isFirstClassAvailable || this.isStandardPremiumAvailable) {
      this.onChoosingUpgrade(this.isStandardPremiumAvailable);
    }
    else {
       this.router.navigate([`./` + this.appRouteEnum.ViewBooking]).then(_resp => {
         this.openUgradeNotificationPopup();
       });
    }
  }

  getAvailableUpgradeClasses(singleJourneyResponse: SearchResponseModel, isReturnJourney: boolean, returnJourneyResponse: SearchResponseModel) {
    this.isOutwardFirstClassUpgradeExist = false;
    this.isOutwardStandardPremiumUpgradeExist = false;
    this.isReturnFirstClassUpgradeExist = false;
    this.isReturnStandardPremiumUpgradeExist = false;

    let classObj = this.checkUpgradeClassAvailabilityUtil(singleJourneyResponse);
    this.isOutwardFirstClassUpgradeExist = classObj.FirstClassUpgradeExist;
    this.isOutwardStandardPremiumUpgradeExist = classObj.StandardPremiumUpgradeExist;

    if(isReturnJourney) {
      let ReturnedClassObj = this.checkUpgradeClassAvailabilityUtil(returnJourneyResponse);
      this.isReturnFirstClassUpgradeExist = ReturnedClassObj.FirstClassUpgradeExist;
      this.isReturnStandardPremiumUpgradeExist = ReturnedClassObj.StandardPremiumUpgradeExist;

      return {
        isFirstClassAvailable : this.isOutwardFirstClassUpgradeExist || this.isReturnFirstClassUpgradeExist,
        isStandardPremiumAvailable : this.isOutwardStandardPremiumUpgradeExist || this.isReturnStandardPremiumUpgradeExist
      }
    }
    else {
      return {
         isFirstClassAvailable : this.isOutwardFirstClassUpgradeExist,
         isStandardPremiumAvailable : this.isOutwardStandardPremiumUpgradeExist
      }
    }
  }

  checkUpgradeClassAvailabilityUtil(JourneyResponse: SearchResponseModel) {
    let classAvailabilityObject = {FirstClassUpgradeExist: false, StandardPremiumUpgradeExist: false};

    if(JourneyResponse?.TravelSolutions?.[0]?.NewFareList?.length > 0) {
      JourneyResponse.TravelSolutions[0].NewFareList[0].FareList.forEach(fare => {
         if(fare.TicketClass === 'First') {
          classAvailabilityObject.FirstClassUpgradeExist = true;
         }
         else if(fare.TicketClass === 'Standard Premium') {
          classAvailabilityObject.StandardPremiumUpgradeExist = true;
         }
      });
    }

    return classAvailabilityObject;
  }

  goBack() {
    this.router.navigate(["./" + this.appRouteEnum.ViewBooking]);
  }

  onContinue() {
    if(this.choosedUpgradeClass && (this.isOutwardSelected || this.isReturnSelected)) {
      this.sharedSibling.upgradeReviewBuyRequest = this.createReviewBuyRequestModel();
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearSessionStorageData("sharedSibling");
      this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate(["./" + this.appRouteEnum.upgradeReviewBuy]);
    }
  }

   createReviewBuyRequestModel() {
      let evaluateTravelRequest = new CojEvaluateTravelRequest();

      if (this.isOutwardSelected) {
         evaluateTravelRequest.OutwardCatlogServiceId = this.upgradeClassDataOutward.ServiceId;
         evaluateTravelRequest.OutwardOfferId = this.upgradeClassDataOutward.OfferId;
         evaluateTravelRequest.OutwardTravelSolId = this.singleJourneyResponse.TravelSolutions[0].TravelSolId;
         evaluateTravelRequest.OutwardSearchCustomCache = this.singleJourneyResponse.Request.SearchCache;
         evaluateTravelRequest.ChoosedTrainleg = "Outward_Leg";
         evaluateTravelRequest.OutwardTravelSolutionCache = this.singleJourneyResponse.TravelSolutions[0].TravelSolutionCache;
      }

      if (this.isReturnSelected) {
         if (!this.isOutwardSelected) {
            evaluateTravelRequest.OutwardCatlogServiceId = this.upgradeClassDataReturn.ServiceId;
            evaluateTravelRequest.OutwardOfferId = this.upgradeClassDataReturn.OfferId;
            evaluateTravelRequest.OutwardTravelSolId = this.returnJourneyResponse.TravelSolutions[0].TravelSolId;
            evaluateTravelRequest.OutwardSearchCustomCache = this.returnJourneyResponse.Request.SearchCache;
            evaluateTravelRequest.ChoosedTrainleg = "Return_Leg";
            evaluateTravelRequest.OutwardTravelSolutionCache = this.returnJourneyResponse.TravelSolutions[0].TravelSolutionCache;
         }
         else {
            evaluateTravelRequest.ReturnCatlogServiceId = this.upgradeClassDataReturn.ServiceId;
            evaluateTravelRequest.ReturnOfferId = this.upgradeClassDataReturn.OfferId;
            evaluateTravelRequest.ReturnTravelSolId = this.returnJourneyResponse.TravelSolutions[0].TravelSolId;
            evaluateTravelRequest.ReturnSearchCustomCache = this.returnJourneyResponse.Request.SearchCache; evaluateTravelRequest.ChoosedTrainleg = "Both";
            evaluateTravelRequest.ReturnTravelSolutionCache = this.returnJourneyResponse.TravelSolutions[0].TravelSolutionCache;
         }
      }

      evaluateTravelRequest.CustomerKey = localStorage.getItem('CustomerKey');
      evaluateTravelRequest.TravelId = this.upgradeResponse.TravelId;
      evaluateTravelRequest.TravelSolutionId = this.upgradeResponse.TravelSolutionId;
      evaluateTravelRequest.DeliveryMode = this.upgradeResponse.DeliveryMode;
      evaluateTravelRequest.ReopenCache = this.upgradeResponse.ReopenCache;
      evaluateTravelRequest.IsPostSaleUpgrade = true;
      return evaluateTravelRequest;
   }

  onChoosingUpgrade(isStdPrem: boolean) {
    if(isStdPrem) {
      this.choosedUpgradeClass = "Standard Premium";
    } else {
      this.choosedUpgradeClass = "First";
    }
    this.setUpgradeAvailabilityOnClassChange();
       this.isOutwardSelected = this.isOutwardAvailableForChoosedUpgrade;
       this.isReturnSelected = this.isReturnAvailableForChoosedUpgrade;
    this.setPriceOfUpgradeOnClassChange(this.choosedUpgradeClass);
    let upgradeItemObject = {
      searchRequest: this.upgradeSearchRequest.SearchRequestDto,
      searchResponse: this.isReturnSelected ? this.returnJourneyResponse  : this.singleJourneyResponse,
      singleJourneyResponse: this.singleJourneyResponse,
      returnJourneyResponse: this.returnJourneyResponse,
      isOutwardSelected: this.isOutwardSelected,
      isReturnSelected: this.isReturnSelected,
      OldOutwardPrice: this.upgradeResponse.OldOutwardPrice,
      OldReturnPrice: this.upgradeResponse.OldReturnPrice,
      selectedUpgrade: this.choosedUpgradeClass,
      activeTab: 0,
      totalPrice: this.totalAmount
    }
    this.ga4datalayerService.loadGA4UpgradeItem(upgradeItemObject, true);
}

setPriceOfUpgradeOnClassChange(choosedUpgradeClass : string) {
  this.upgradeClassDataOutward = choosedUpgradeClass ? this.getUpgradeClassData(this.singleJourneyResponse, choosedUpgradeClass) : null;
  this.upgradeClassDataReturn = choosedUpgradeClass ? this.getUpgradeClassData(this.returnJourneyResponse, choosedUpgradeClass) : null;
  this.upgradeAmountOutward = this.upgradeClassDataOutward ? (this.upgradeClassDataOutward.Price - this.sharedSibling.upgradeOutwardPrice) : null;
  this.upgradeAmountReturn = this.upgradeClassDataReturn ? (this.upgradeClassDataReturn.Price - this.sharedSibling.upgradeReturnPrice) : null;
  this.setTotalPrice(this.upgradeAmountOutward, this.upgradeAmountReturn);
}

setTotalPrice(upgradeAmountOutward, upgradeAmountReturn) {
   this.totalAmount = 0;
  if(upgradeAmountOutward && this.isOutwardSelected) {
    this.totalAmount += upgradeAmountOutward;
  }
  if(upgradeAmountReturn && this.isReturnSelected) {
    this.totalAmount += upgradeAmountReturn;
  }
}

getUpgradeClassData(JourneyResponse: SearchResponseModel, choosedUpgradeClass: string) {
  let ClassData = null;

    if(JourneyResponse?.TravelSolutions?.[0]?.NewFareList?.length > 0) {
      JourneyResponse.TravelSolutions[0].NewFareList[0].FareList.forEach(fare => {
         if(fare.TicketClass === choosedUpgradeClass) {
          ClassData = fare;

         }
      });
    }

    return ClassData;
}

setUpgradeAvailabilityOnClassChange() {
  this.isOutwardAvailableForChoosedUpgrade = ((this.choosedUpgradeClass === 'First' && this.isOutwardFirstClassUpgradeExist) || 
                                              (this.choosedUpgradeClass === 'Standard Premium' && this.isOutwardStandardPremiumUpgradeExist));

  this.isReturnAvailableForChoosedUpgrade =  ((this.choosedUpgradeClass === 'First' && this.isReturnFirstClassUpgradeExist) || 
                                             (this.choosedUpgradeClass === 'Standard Premium' && this.isReturnStandardPremiumUpgradeExist));
}

onLegSelect(checkBoxEvent: MatCheckboxChange, isOutwardLeg: boolean) {
   let lastUpdatedTotalAmount = this.totalAmount;
    if(isOutwardLeg) {
      this.isOutwardSelected = checkBoxEvent.checked;
      this.totalAmount += this.isOutwardSelected ? this.upgradeAmountOutward: (-this.upgradeAmountOutward);
    } else {
      this.isReturnSelected = checkBoxEvent.checked;
      this.totalAmount += this.isReturnSelected ? this.upgradeAmountReturn: (-this.upgradeAmountReturn);
    }
    this.totalAmount = Number(this.totalAmount.toFixed(2));
    if(lastUpdatedTotalAmount == 0){
      lastUpdatedTotalAmount = this.totalAmount;
    }
    if(checkBoxEvent.checked){
      let upgradeItemObject = {
         searchRequest: this.upgradeSearchRequest.SearchRequestDto,
         searchResponse: isOutwardLeg ? this.singleJourneyResponse : this.returnJourneyResponse,
         singleJourneyResponse: !isOutwardLeg ? null : this.singleJourneyResponse,
         returnJourneyResponse: isOutwardLeg ?  null : this.returnJourneyResponse,
         isOutwardSelected: this.isOutwardSelected,
         isReturnSelected: this.isReturnSelected,
         OldOutwardPrice: this.upgradeResponse.OldOutwardPrice,
         OldReturnPrice: this.upgradeResponse.OldReturnPrice,
         selectedUpgrade: this.choosedUpgradeClass,
         activeTab: 0,
         totalPrice: lastUpdatedTotalAmount,
         onSelectedLeg: true
       }
       this.ga4datalayerService.loadGA4UpgradeItem(upgradeItemObject, true);
    }
  }
  testData1 = {
    "Data":{
       "SearchResponse":{
          "CorrelationId":null,
          "SingleTravel":{
             "TravelSolutionCache":null,
             "HideEarlier":false,
             "HideLater":false,
             "IsShowPopup":false,
             "Message":null,
             "Date":"0001-01-01T00:00:00",
             "TravelSolutions":[
                {
                   "Operator":0,
                   "OperatorChange":0,
                   "SaleCompany":null,
                   "TravelSolId":12,
                   "SingleFare":56.95,
                   "ReturnFare":0,
                   "Currency":"GBP",
                   "Changes":0,
                   "DepartureTime":"12:59 (PRE)",
                   "ArrivalTime":"15:25 (EUS)",
                   "DarwinDepartureTime":null,
                   "DarwinArrivalTime":null,
                   "DepartureDate":"2021-08-26T12:59:00",
                   "ArrivalDate":"2021-08-26T15:25:00",
                   "Duration":"2h 26m",
                   "DurationMinute":146,
                   "FareList":[
                      {
                         "Price":56.95,
                         "Currency":"GBP",
                         "TicketType":"Advance Single 1st",
                         "TicketTypeName":"Advance Single",
                         "TicketClass":"First",
                         "MinPrice":true,
                         "OfferId":2074,
                         "ServiceId":7000516,
                         "AvailableTicket":9,
                         "FareDetails":[
                            {
                               "Price":56.95,
                               "Railcard":"No Railcard",
                               "BasePrice":113.90,
                               "Currency":"GBP",
                               "IsCheck":true,
                               "FarePerson":"1 * Child",
                               "TicketDescription":null,
                               "TicketRestriction":null,
                               "TicketInformation":null,
                               "TicketType":null,
                               "OfferId":0,
                               "ServiceId":0
                            }
                         ],
                         "OutDays":"01",
                         "OutMonths":"",
                         "ReturnDays":"",
                         "ReturnMonths":"",
                         "TicketDescription":"Avanti West Coast Only",
                         "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                         "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                         "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                      }
                   ],
                   "NewFareList":[
                      {
                         "TicketType":"Advance Single",
                         "FareList":[
                            {
                               "Price":56.95,
                               "Currency":"GBP",
                               "TicketType":"Advance Single 1st",
                               "TicketTypeName":"Advance Single",
                               "TicketClass":"First",
                               "MinPrice":true,
                               "OfferId":2074,
                               "ServiceId":7000516,
                               "AvailableTicket":9,
                               "FareDetails":[
                                  {
                                     "Price":56.95,
                                     "Railcard":"No Railcard",
                                     "BasePrice":113.90,
                                     "Currency":"GBP",
                                     "IsCheck":true,
                                     "FarePerson":"1 * Child",
                                     "TicketDescription":null,
                                     "TicketRestriction":null,
                                     "TicketInformation":null,
                                     "TicketType":null,
                                     "OfferId":0,
                                     "ServiceId":0
                                  }
                               ],
                               "OutDays":"01",
                               "OutMonths":"",
                               "ReturnDays":"",
                               "ReturnMonths":"",
                               "TicketDescription":"Avanti West Coast Only",
                               "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                               "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                               "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                            }
                         ],
                         "IsMinPrice":true
                      }
                   ],
                   "ReturnFareList":[
                      
                   ],
                   "NewReturnFareList":[
                      
                   ],
                   "IsSaleable":false,
                   "IsSingleSaleable":false,
                   "IsReturnSaleable":false,
                   "SaleableMessage":null,
                   "IsDelayed":false,
                   "IsCancelled":false,
                   "IsSoldOutService":false,
                   "SoldOutMessage":null,
                   "IsDarwinNews":false,
                   "DarwinNews":null,
                   "IsHide":false,
                   "IsAlreadyDepartured":false,
                   "IsNoRsultsUsingClassFilters":false,
                   "ClassFiltersMessage":null,
                   "IsBusReplacement":false,
                   "BusReplacementMessage":null,
                   "IsOutwardPromoAvailable":false,
                   "IsReturnPromoAvailable":false,
                   "JourneyExtras":null,
                   "IsStandardFare":false,
                   "IsStandardPremiumFare":false,
                   "IsFirstClassFare":true,
                   "IsRetStandardFare":false,
                   "IsRetStandardPremiumFare":false,
                   "IsRetFirstClassFare":false
                }
             ],
             "Request": {
              "ReturnTimesStart": null,
              "TravelSolutionDirection": "ONE_WAY",
              "Traveltype": "DEPARTAFTER",
              "TraveltypeReturn": null,
              "Searchtype": "",
              "SearchtypeReturn": "",
              "SearchCache": "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",
              "SearchIndex": 1,
              "TravelSolCount": 5,
              "SearchCacheReturn": null,
              "SearchIndexReturn": 0,
              "TravelSolCountReturn": 0,
              "IsNew": 0,
              "DepartureLocationName": "London Euston (EUS)",
              "ArrivalLocationName": "Glasgow Central (GLC)",
              "TravellerId": "e8552401-7be2-4e56-853a-653117e54d26",
              "Operator": 0,
              "OperatorChange": 0,
              "Changes": 0,
              "ArrivalTime": null,
              "ArrivalDate": "0001-01-01T00:00:00",
              "Duration": null,
              "DurationMinute": 0,
              "DepartureTime": null,
              "DepartureDate": "0001-01-01T00:00:00",
              "PromotionCode": "",
              "TicketClassFilter": "",
              "ChangesFilter": -1,
              "OperaterFilter": 2,
              "IsDateChange": false,
              "HasOutJourneyExtra": false,
              "HasRetJourneyExtra": false,
              "OldTravelCache": null,
              "OldTraveller": null,
              "PostSaleDetails": null,
              "RetPostSaleDetails": null,
              "ChoosedTrainleg": null,
              "DepartureTimesStart": "2021-08-27T09:00",
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700010012,
              "PathConstraintLocation": 0,
              "Adult": 1,
              "Child": 0,
              "PathConstraintType": null,
              "RailCardList": []
            },
             "IsPromo":false
          },
          "ReturnTravel":null,
          "IsNoResultsForChangesFilters":false,
          "ChangesFilterMessage":null,
          "IsNoResultsForOperartorFilters":false,
          "OperartorFilterMessage":null
       },
       "DeliveryMode":'ETICKET',
       "TravelId":34874,
       "TravelSolutionId":3,
       "OldOutwardPrice":34.35,
       "OldReturnPrice":34.35,
       "ReopenCache":"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"
    },
    "ResponseMessage":"Success",
    "ResponseCode":200,
    "Error":""
  }
  testData2 = {
    "Data":{
       "SearchResponse":{
          "CorrelationId":null,
          "SingleTravel":{
             "TravelSolutionCache":null,
             "HideEarlier":false,
             "HideLater":false,
             "IsShowPopup":false,
             "Message":null,
             "Date":"0001-01-01T00:00:00",
             "TravelSolutions":[
                {
                   "Operator":0,
                   "OperatorChange":0,
                   "SaleCompany":null,
                   "TravelSolId":12,
                   "SingleFare":56.95,
                   "ReturnFare":0,
                   "Currency":"GBP",
                   "Changes":0,
                   "DepartureTime":"12:59 (PRE)",
                   "ArrivalTime":"15:25 (EUS)",
                   "DarwinDepartureTime":null,
                   "DarwinArrivalTime":null,
                   "DepartureDate":"2021-08-26T12:59:00",
                   "ArrivalDate":"2021-08-26T15:25:00",
                   "Duration":"2h 26m",
                   "DurationMinute":146,
                   "FareList":[
                      {
                         "Price":56.95,
                         "Currency":"GBP",
                         "TicketType":"Advance Single 1st",
                         "TicketTypeName":"Advance Single",
                         "TicketClass":"First",
                         "MinPrice":true,
                         "OfferId":2074,
                         "ServiceId":7000516,
                         "AvailableTicket":9,
                         "FareDetails":[
                            {
                               "Price":56.95,
                               "Railcard":"No Railcard",
                               "BasePrice":113.90,
                               "Currency":"GBP",
                               "IsCheck":true,
                               "FarePerson":"1 * Child",
                               "TicketDescription":null,
                               "TicketRestriction":null,
                               "TicketInformation":null,
                               "TicketType":null,
                               "OfferId":0,
                               "ServiceId":0
                            }
                         ],
                         "OutDays":"01",
                         "OutMonths":"",
                         "ReturnDays":"",
                         "ReturnMonths":"",
                         "TicketDescription":"Avanti West Coast Only",
                         "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                         "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                         "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                      }
                   ],
                   "NewFareList":[
                      {
                         "TicketType":"Advance Single",
                         "FareList":[
                            {
                               "Price":50.95,
                               "Currency":"GBP",
                               "TicketType":"Advance Single 1st",
                               "TicketTypeName":"Advance Single",
                               "TicketClass":"First",
                               "MinPrice":true,
                               "OfferId":2074,
                               "ServiceId":7000516,
                               "AvailableTicket":9,
                               "FareDetails":[
                                  {
                                     "Price":56.95,
                                     "Railcard":"No Railcard",
                                     "BasePrice":113.90,
                                     "Currency":"GBP",
                                     "IsCheck":true,
                                     "FarePerson":"1 * Child",
                                     "TicketDescription":null,
                                     "TicketRestriction":null,
                                     "TicketInformation":null,
                                     "TicketType":null,
                                     "OfferId":0,
                                     "ServiceId":0
                                  }
                               ],
                               "OutDays":"01",
                               "OutMonths":"",
                               "ReturnDays":"",
                               "ReturnMonths":"",
                               "TicketDescription":"Avanti West Coast Only",
                               "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                               "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                               "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                            },
                            {
                              "Price":40.95,
                              "Currency":"GBP",
                              "TicketType":"Advance Single 1st",
                              "TicketTypeName":"Advance Single",
                              "TicketClass":"Standard Premium",
                              "MinPrice":true,
                              "OfferId":2074,
                              "ServiceId":7000516,
                              "AvailableTicket":9,
                              "FareDetails":[
                                 {
                                    "Price":56.95,
                                    "Railcard":"No Railcard",
                                    "BasePrice":113.90,
                                    "Currency":"GBP",
                                    "IsCheck":true,
                                    "FarePerson":"1 * Child",
                                    "TicketDescription":null,
                                    "TicketRestriction":null,
                                    "TicketInformation":null,
                                    "TicketType":null,
                                    "OfferId":0,
                                    "ServiceId":0
                                 }
                              ],
                              "OutDays":"01",
                              "OutMonths":"",
                              "ReturnDays":"",
                              "ReturnMonths":"",
                              "TicketDescription":"Avanti West Coast Only",
                              "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                              "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                              "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                           }
                         ],
                         "IsMinPrice":true
                      }
                   ],
                   "ReturnFareList":[
                      
                   ],
                   "NewReturnFareList":[
                      
                   ],
                   "IsSaleable":false,
                   "IsSingleSaleable":false,
                   "IsReturnSaleable":false,
                   "SaleableMessage":null,
                   "IsDelayed":false,
                   "IsCancelled":false,
                   "IsSoldOutService":false,
                   "SoldOutMessage":null,
                   "IsDarwinNews":false,
                   "DarwinNews":null,
                   "IsHide":false,
                   "IsAlreadyDepartured":false,
                   "IsNoRsultsUsingClassFilters":false,
                   "ClassFiltersMessage":null,
                   "IsBusReplacement":false,
                   "BusReplacementMessage":null,
                   "IsOutwardPromoAvailable":false,
                   "IsReturnPromoAvailable":false,
                   "JourneyExtras":null,
                   "IsStandardFare":false,
                   "IsStandardPremiumFare":false,
                   "IsFirstClassFare":true,
                   "IsRetStandardFare":false,
                   "IsRetStandardPremiumFare":false,
                   "IsRetFirstClassFare":false
                }
             ],
             "Request": {
              "ReturnTimesStart": null,
              "TravelSolutionDirection": "ONE_WAY",
              "Traveltype": "DEPARTAFTER",
              "TraveltypeReturn": null,
              "Searchtype": "",
              "SearchtypeReturn": "",
              "SearchCache": "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",
              "SearchIndex": 1,
              "TravelSolCount": 5,
              "SearchCacheReturn": null,
              "SearchIndexReturn": 0,
              "TravelSolCountReturn": 0,
              "IsNew": 0,
              "DepartureLocationName": "London Euston (EUS)",
              "ArrivalLocationName": "Glasgow Central (GLC)",
              "TravellerId": "e8552401-7be2-4e56-853a-653117e54d26",
              "Operator": 0,
              "OperatorChange": 0,
              "Changes": 0,
              "ArrivalTime": null,
              "ArrivalDate": "0001-01-01T00:00:00",
              "Duration": null,
              "DurationMinute": 0,
              "DepartureTime": null,
              "DepartureDate": "0001-01-01T00:00:00",
              "PromotionCode": "",
              "TicketClassFilter": "",
              "ChangesFilter": -1,
              "OperaterFilter": 2,
              "IsDateChange": false,
              "HasOutJourneyExtra": false,
              "HasRetJourneyExtra": false,
              "OldTravelCache": null,
              "OldTraveller": null,
              "PostSaleDetails": null,
              "RetPostSaleDetails": null,
              "ChoosedTrainleg": null,
              "DepartureTimesStart": "2021-08-27T09:00",
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700010012,
              "PathConstraintLocation": 0,
              "Adult": 1,
              "Child": 0,
              "PathConstraintType": null,
              "RailCardList": []
            },
             "IsPromo":false
          },
          "ReturnTravel":{
            "TravelSolutionCache":null,
            "HideEarlier":false,
            "HideLater":false,
            "IsShowPopup":false,
            "Message":null,
            "Date":"0001-01-01T00:00:00",
            "TravelSolutions":[
               {
                  "Operator":0,
                  "OperatorChange":0,
                  "SaleCompany":null,
                  "TravelSolId":12,
                  "SingleFare":56.95,
                  "ReturnFare":0,
                  "Currency":"GBP",
                  "Changes":0,
                  "DepartureTime":"12:59 (PRE)",
                  "ArrivalTime":"15:25 (EUS)",
                  "DarwinDepartureTime":null,
                  "DarwinArrivalTime":null,
                  "DepartureDate":"2021-08-26T12:59:00",
                  "ArrivalDate":"2021-08-26T15:25:00",
                  "Duration":"2h 26m",
                  "DurationMinute":146,
                  "FareList":[
                     {
                        "Price":56.95,
                        "Currency":"GBP",
                        "TicketType":"Advance Single 1st",
                        "TicketTypeName":"Advance Single",
                        "TicketClass":"First",
                        "MinPrice":true,
                        "OfferId":2074,
                        "ServiceId":7000516,
                        "AvailableTicket":9,
                        "FareDetails":[
                           {
                              "Price":56.95,
                              "Railcard":"No Railcard",
                              "BasePrice":113.90,
                              "Currency":"GBP",
                              "IsCheck":true,
                              "FarePerson":"1 * Child",
                              "TicketDescription":null,
                              "TicketRestriction":null,
                              "TicketInformation":null,
                              "TicketType":null,
                              "OfferId":0,
                              "ServiceId":0
                           }
                        ],
                        "OutDays":"01",
                        "OutMonths":"",
                        "ReturnDays":"",
                        "ReturnMonths":"",
                        "TicketDescription":"Avanti West Coast Only",
                        "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                        "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                        "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                     }
                  ],
                  "NewFareList":[
                     {
                        "TicketType":"Advance Single",
                        "FareList":[
                           {
                              "Price":100.95,
                              "Currency":"GBP",
                              "TicketType":"Advance Single 1st",
                              "TicketTypeName":"Advance Single",
                              "TicketClass":"First",
                              "MinPrice":true,
                              "OfferId":2074,
                              "ServiceId":7000516,
                              "AvailableTicket":9,
                              "FareDetails":[
                                 {
                                    "Price":56.95,
                                    "Railcard":"No Railcard",
                                    "BasePrice":113.90,
                                    "Currency":"GBP",
                                    "IsCheck":true,
                                    "FarePerson":"1 * Child",
                                    "TicketDescription":null,
                                    "TicketRestriction":null,
                                    "TicketInformation":null,
                                    "TicketType":null,
                                    "OfferId":0,
                                    "ServiceId":0
                                 }
                              ],
                              "OutDays":"01",
                              "OutMonths":"",
                              "ReturnDays":"",
                              "ReturnMonths":"",
                              "TicketDescription":"Avanti West Coast Only",
                              "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                              "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                              "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                           },
                           {
                            "Price":45.95,
                            "Currency":"GBP",
                            "TicketType":"Advance Single 1st",
                            "TicketTypeName":"Advance Single",
                            "TicketClass":"Standard Premium",
                            "MinPrice":true,
                            "OfferId":2074,
                            "ServiceId":7000516,
                            "AvailableTicket":9,
                            "FareDetails":[
                               {
                                  "Price":56.95,
                                  "Railcard":"No Railcard",
                                  "BasePrice":113.90,
                                  "Currency":"GBP",
                                  "IsCheck":true,
                                  "FarePerson":"1 * Child",
                                  "TicketDescription":null,
                                  "TicketRestriction":null,
                                  "TicketInformation":null,
                                  "TicketType":null,
                                  "OfferId":0,
                                  "ServiceId":0
                               }
                            ],
                            "OutDays":"01",
                            "OutMonths":"",
                            "ReturnDays":"",
                            "ReturnMonths":"",
                            "TicketDescription":"Avanti West Coast Only",
                            "TicketRestriction":"<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
                            "TicketInformation":"Advance tickets are single (one-way) tickets for many longer and some shorter distance journeys, are available in First Class and Standard Class and offer the best available price for each journey. Tickets must be booked in advance of travel and are subject to availability. Advance tickets are valid only on the specific booked train, but can be changed before departure of the first reserved service.\r\nValid by the route shown -Outward Within 01 Day ,",
                            "ValidityInformation":"Valid by the route shown -Outward Within 01 Day ,"
                         }
                        ],
                        "IsMinPrice":true
                     }
                  ],
                  "ReturnFareList":[
                     
                  ],
                  "NewReturnFareList":[
                     
                  ],
                  "IsSaleable":false,
                  "IsSingleSaleable":false,
                  "IsReturnSaleable":false,
                  "SaleableMessage":null,
                  "IsDelayed":false,
                  "IsCancelled":false,
                  "IsSoldOutService":false,
                  "SoldOutMessage":null,
                  "IsDarwinNews":false,
                  "DarwinNews":null,
                  "IsHide":false,
                  "IsAlreadyDepartured":false,
                  "IsNoRsultsUsingClassFilters":false,
                  "ClassFiltersMessage":null,
                  "IsBusReplacement":false,
                  "BusReplacementMessage":null,
                  "IsOutwardPromoAvailable":false,
                  "IsReturnPromoAvailable":false,
                  "JourneyExtras":null,
                  "IsStandardFare":false,
                  "IsStandardPremiumFare":false,
                  "IsFirstClassFare":true,
                  "IsRetStandardFare":false,
                  "IsRetStandardPremiumFare":false,
                  "IsRetFirstClassFare":false
               }
            ],
            "Request": {
              "ReturnTimesStart": null,
              "TravelSolutionDirection": "ONE_WAY",
              "Traveltype": "DEPARTAFTER",
              "TraveltypeReturn": null,
              "Searchtype": "",
              "SearchtypeReturn": "",
              "SearchCache": "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",
              "SearchIndex": 1,
              "TravelSolCount": 5,
              "SearchCacheReturn": null,
              "SearchIndexReturn": 0,
              "TravelSolCountReturn": 0,
              "IsNew": 0,
              "DepartureLocationName": "London Euston (EUS)",
              "ArrivalLocationName": "Glasgow Central (GLC)",
              "TravellerId": "e8552401-7be2-4e56-853a-653117e54d26",
              "Operator": 0,
              "OperatorChange": 0,
              "Changes": 0,
              "ArrivalTime": null,
              "ArrivalDate": "0001-01-01T00:00:00",
              "Duration": null,
              "DurationMinute": 0,
              "DepartureTime": null,
              "DepartureDate": "0001-01-01T00:00:00",
              "PromotionCode": "",
              "TicketClassFilter": "",
              "ChangesFilter": -1,
              "OperaterFilter": 2,
              "IsDateChange": false,
              "HasOutJourneyExtra": false,
              "HasRetJourneyExtra": false,
              "OldTravelCache": null,
              "OldTraveller": null,
              "PostSaleDetails": null,
              "RetPostSaleDetails": null,
              "ChoosedTrainleg": null,
              "DepartureTimesStart": "2021-08-27T09:00",
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700010012,
              "PathConstraintLocation": 0,
              "Adult": 1,
              "Child": 0,
              "PathConstraintType": null,
              "RailCardList": []
            },
            "IsPromo":false
         },
          "IsNoResultsForChangesFilters":false,
          "ChangesFilterMessage":null,
          "IsNoResultsForOperartorFilters":false,
          "OperartorFilterMessage":null
       },
       "DeliveryMode":"ETICKET",
       "TravelId":34874,
       "TravelSolutionId":3,
       "OldOutwardPrice":34.35,
       "OldReturnPrice":34.35,
       "ReopenCache":"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"
    },
    "ResponseMessage":"Success",
    "ResponseCode":200,
    "Error":""
  }
}