import { Component, Injector, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FareBreakdownComponent } from '../mixing-deck/fare-breakdown/fare-breakdown.component';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { ReviewBuyResponse, JourneyDetail, RemoveJourneyRequest, DiscountRequest, DiscountResponse, BasketJourneyRequestDto, RailCardPriceList } from 'src/app/models/review-buy/review-buy-model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { DeliveryModeRequest } from 'src/app/models/delivery-modes/delivery-modes.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { ReviewBuyService } from 'src/app/services/review-buy.service';
import { Router } from '@angular/router';
import { FareBreakdownModel, JourneyModel } from 'src/app/models/mixing-deck/fare-breakdown.model';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { FormControl, Validators } from '@angular/forms';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { browserRefresh } from '../../app-component/app.component';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { TicketInfoComponent } from '../mixing-deck/ticket-info/ticket-info.component';
import { AppRouteEnum, Ga4ItemListEnum, LocalStorageKeyEnum, NotificationErrorMsg } from 'src/app/utility/app-constants.service';
import { ConfirmPopupComponent } from './confirm-popup/confirm-popup.component';
import { CommonServices } from '../../services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { PaymentDetailRequest } from 'src/app/models/payment-details/payment-details-request.model';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { PaymentDetailResponse } from 'src/app/models/payment-details/payment-details-response.model';
import { TimeoutComponent } from './timeout/timeout.component';
import { SeatpickerPopupComponent } from './seatpicker-popup/seatpicker-popup.component';
import { JourneySummaryModel } from 'src/app/models/mixing-deck/travel-solution.model';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { DisruptionServiceComponent } from '../mixing-deck/disruption-service/disruption-service.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
  selector: 'app-review-and-buy',
  templateUrl: './review-and-buy.component.html',
  styleUrls: ['./review-and-buy.component.css']
})
export class ReviewAndBuyComponent implements OnInit {

  searchRequest: SearchRequestModel;
  reviewBuyResponse: ReviewBuyResponse;
  passengerDetailLabel: string;
  journeyType: string;
  deliveryModeRequest: DeliveryModeRequest;
  removeJourneyRequest: RemoveJourneyRequest;
  removeResponse: ReviewBuyResponse;
  discountResponse: DiscountResponse;
  addDiscountRequest: DiscountRequest;
  discountCode: string;
  reviewBuyCache: string;
  fareBreakDownData: FareBreakdownModel[];
  totalPrice: number = 0;
  responseData: ResponseData;
  discountCodeControl = new FormControl();
  firstClassPostPrice: number;
  nextDayDeliveryModePrice: number;
  browserRefresh: boolean;
  isBasketEmpty: boolean = false;
  basketJourneyRequestDto: BasketJourneyRequestDto;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: PaymentDetailResponse;
  isDiscountAddDisabled: boolean = false;
  isRedirectFromRenew: boolean;
  reviewBuyJourneyTimeStampArr: any[] = [];
  removeIndexOfreviewBuyJourneyTimeStampArr = -1;
  deletedJourney = null;
  GAremoveCartResponse: ReviewBuyResponse;

  // * New Changes Bugfix
  isOpenSeatpicker: boolean = false;
  seatReservationMessage = "Seat picker is only available on Avanti West Coast trains";
  choosedTrainLeg: any;
  isLegChoosed: boolean = false;
  isOutwardLegChoosed: boolean;
  isNreBasket: boolean;
  sticky: boolean;

  sharedService: SharedService;
  reviewBuyService: ReviewBuyService;
  router: Router;
  notificationservice: NotificationService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  commonService: CommonServices;
  spinnerService: NgxSpinnerService;
  paymentDetailsService: PaymentDetailsService;
  dataLayerService: DataLayerService;
  ga4DatalayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  isShowHeader: boolean = false;
  ga4ItemListEnum: Ga4ItemListEnum;
  railCardPriceList: RailCardPriceList;
  railCardPriceListArray: Array<RailCardPriceList> = [];
  notificationErrorMsg: NotificationErrorMsg;
  discountedPrice:  number;
  expiredJounreyDetailObject: any;

  constructor(private readonly injector: Injector, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.sharedService = this.injector.get(SharedService);
    this.reviewBuyService = this.injector.get(ReviewBuyService);
    this.router = this.injector.get(Router);
    this.notificationservice = this.injector.get(NotificationService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.paymentDetailsService = this.injector.get(PaymentDetailsService);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4DatalayerService = this.injector.get(GA4DatalayerService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.basketJourneyRequestDto = new BasketJourneyRequestDto();
    this.reviewBuyResponse = new ReviewBuyResponse();
    this.reviewBuyResponse.Journey = new Array<JourneyDetail>();
    this.deliveryModeRequest = new DeliveryModeRequest;
    this.removeJourneyRequest = new RemoveJourneyRequest;
    this.addDiscountRequest = new DiscountRequest;
    this.reviewBuyResponse = this.sharedService.reviewBuyResponse;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
      this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
    }
    this.searchRequest = this.sharedService.searchRequest;
    this.fareBreakDownData = [];
    this.discountCodeControl.setValidators([Validators.minLength(19), Validators.maxLength(19)]);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
  }
  step = 0;
  ngOnDestroy() {
    let reviewBackBtnMsgsObj = {
      notificationErrorMsg: this.notificationErrorMsg.backToSearchPageMsgFromReviewBuy,
      notificationTitle: this.notificationErrorMsg.backToSearchPageTitleFromReviewBuy,
    }
    if (this.router.getCurrentNavigation().trigger == "popstate" && (this.router.url.includes(this.appRouteEnum.MixingDeck) || this.router.url.includes(this.appRouteEnum.SeasonSolutions) || this.router.url.includes(this.appRouteEnum.DeliveryMode) || this.router.url.includes(this.appRouteEnum.ValidatePaymentDo) || this.router.url.includes(this.appRouteEnum.JourneyExtras))) {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigateByUrl("/" + this.appRouteEnum.ReviewBuy).then(() => {

        this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true);

      });
    }
    else if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.Payment)) {
      if (this.commonService.isExistJourneyValidForPaymentKey()) {
        this.router.navigateByUrl("/" + this.appRouteEnum.ReviewBuy).then(() => {
          this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true);
        });
      }
      else {
        this.openPaymentDetails();
      }
    }
  }

  ticketInfo(ticket: any) {
    if (ticket == 'season') {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticket.trim()
        }
      });
    } else {
      this.dialog.open(TicketInfoComponent, {
        disableClose: false,
        panelClass: 'ticket-info',
        data: {
          TicketType: ticket.TicketType.trim(),
          TicketDescription: ticket.TicketDescription,
          TicketRestriction: ticket.TicketRestriction,
          ticketTypeCode: ticket.TicketTypeCode,
          IsViewBooking: true,
          TicketInformation: ticket.TicketInformation
        }
      });
    }
  }

  timeoutpopup(message, isCallApi) {
    let dialogRef = this.dialog.open(TimeoutComponent, {
      disableClose: false,
      width: '600px',
      data: {
        Message: message
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      if (isCallApi) {
        this.dataLayerService.loadGTMDataLayerOnPageUpdate();
        // virtual_page_view -- Ga4-datalayer event
        this.ga4DatalayerService.loadGA4DataLayerAllPages(false);

        this.getBasketJourney(0);
      }
    });
  }

  ngOnInit() {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(true);
    this.browserRefresh = browserRefresh;
    let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    this.sharedService.showEdit = false;
    //Get shared cache data
    if (this.commonService.isExistRenewSmartcard(sharedSiblingRefresh)) {
      this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.journey = sharedSiblingRefresh.Journey;
      this.reviewBuyCache = sharedSiblingRefresh.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.postSaleReviewBuyCache = this.reviewBuyCache;
      this.setFareBreakDown();
    }
    else {
      if (this.browserRefresh) {
        this.browserRefreshData(sharedSiblingRefresh);
        if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
          this.getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh);
        }
      }
      //Get shared cache data
      this.reviewBuyJourneyTimeStampArr = this.sharedService.reviewBuyJourneyTimeStampArr || [];
      this.getBasketJourney(0);
    }
    this.GAremoveCartResponse = new ReviewBuyResponse();
    // PICO-2212, PICO-2213 & PICO-2215 method is called to check which button is click for showing header on review buy
    this.isShowHeader = this.commonService.isCheckForQuickBuyOrContinue();
  }

  getSharedCacheDataOnBrowserRefresh(sharedSiblingRefresh) {
    this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
    this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
    if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
      this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
      this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
    }
    this.searchRequest = sharedSiblingRefresh.searchRequest;
    this.sharedService.searchRequest = sharedSiblingRefresh.searchRequest;
    this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
    this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
    this.sharedService.reviewBuyJourneyTimeStampArr = sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
    this.sharedService.createReservationRequest = sharedSiblingRefresh.createReservationRequest;
    this.sharedService.railCardPriceList = sharedSiblingRefresh.railCardPriceList;
    this.railCardPriceListArray = this.sharedService.railCardPriceList;
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
  }

  checkandRemoveJourneyOnSeatUpdateFail() {
    this.reviewBuyJourneyTimeStampArr.forEach((timesStamp, index) => {
      if (timesStamp.updateCount > 0 && timesStamp.updateCount < 3) {
        this.removeJourneyRequest.JourneyCreationDate = timesStamp.reviewBuyOrginalTimeStamp;
        this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
        this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
        this.removeJourneyData(this.removeJourneyRequest,0);
        this.removeIndexOfreviewBuyJourneyTimeStampArr = index;
      }
    })
  }

  setStep(step, _journey?) {
    this.step = step;
  }

  onFocusOutGetDiscountCode(event) {
    this.discountCode = event.target.value;
  }
  addDiscount(journeyDetail: JourneyDetail, isAddDiscount) {
    this.commonService.loaderRequired = true;
    this.discountCode = this.discountCodeControl.value;
    if (this.discountCode.length != 19) {
      this.notificationservice.warn('Please enter a valid discount code.');
      return false;
    }
    this.addDiscountRequest.JourneyCreationDate = journeyDetail.CreationDate;
    this.addDiscountRequest.ReviewBuyCache = this.reviewBuyCache;
    this.addDiscountRequest.DiscountCode = this.discountCode;
    this.addDiscountRequest.IsAddDiscountCode = isAddDiscount;
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(false);
    this.reviewBuyService.addDiscountCode(this.addDiscountRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.discountResponse = this.responseData.Data;
            if (this.discountResponse.IsInvalid) {
              this.commonService.loaderRequired = false;
              this.spinnerService.hide();
            }
            else {
              this.isCheckAddDiscountOrNot(isAddDiscount);
              
              this.reviewBuyCache = this.discountResponse.ReviewBuyCache;
              this.sharedService.reviewBuyCache = this.reviewBuyCache;
              this.getBasketJourney(0);
              this.notificationservice.success(this.discountResponse.DiscountMessage);
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  isCheckAddDiscountOrNot(isAddDiscount) {
    if (isAddDiscount) {
      this.railCardPriceListArray = [];
      this.reviewBuyResponse.Journey.forEach(journey => {
        this.getOutAndRetRailCardPriceListForFareBreakDownModel(journey);
      });
    }
  }

  removeErrorMessage() {
    if (!this.discountCodeControl.value && this.discountCodeControl.value != '') {
      this.discountResponse.DiscountMessage = '';
    }
  }

  addNewJourney() {
    this.sharedService.isAmendSearchOpen = true;
    this.sharedService.evaluateRequest = null;
    this.sharedService.railcardStationMasterData = JSON.parse(localStorage.getItem('railcardStationList'));
    if (this.reviewBuyResponse && this.reviewBuyResponse.Journey && this.reviewBuyResponse.Journey.length > 0) {
      if (this.reviewBuyResponse.Journey[0].SeasonDeatil == null) {
        window.scrollTo(0, 0);
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.sharedService.showEdit = true;
      }
      else if (this.reviewBuyResponse.Journey[0].SeasonDeatil != null) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }
    else {
      if (!this.searchRequest.IsSeason) {
        window.scrollTo(0, 0);
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.sharedService.showEdit = true;
      }
      else if (this.searchRequest.IsSeason) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }

  }

  openPaymentDetails() {

    if (!this.reviewBuyResponse?.Journey?.length || this.reviewBuyResponse?.BasketCount === 0 && !this.reviewBuyResponse?.IsRenewSmartcard) {
      this.notificationservice.error("Please add a journey first.");
      return;
    }

    if (this.isExistRenewSmartcard()) {
      this.sharedService.postSaleReviewBuyCache = this.reviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = this.reviewBuyCache;
    }
    //Set shared cache data
    this.sharedService.setSharedCache();
    this.storageDataService.clearStorageData("sharedSibling");
    this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    //Set shared cache data
    this.getPaymentdetails();

  }

  setFareBreakDown() {
    this.fareBreakDownData = [];
    this.totalPrice = 0;
    if (this.reviewBuyResponse?.Journey != null) {
      this.reviewBuyResponse.Journey.forEach(journey => {
        let fareBreakdownModel = new FareBreakdownModel;
        fareBreakdownModel.OutWardJourney = [];
        fareBreakdownModel.ReturnJourney = [];
        fareBreakdownModel.OutwardJourneyExtras = [];
        fareBreakdownModel.ReturnJourneyExtras = [];
        fareBreakdownModel.DeliveryDetails = [];
        fareBreakdownModel.JourneyType = journey.Journey;
        fareBreakdownModel.DiscountPrice = journey.DiscountedPrice;
        fareBreakdownModel.DiscountPercent = journey.DiscountPercent;
        fareBreakdownModel.DiscountType = journey.DiscountType;
        this.totalPrice += journey.JourneyTotalPrice;
        if (journey.IsDiscountVisible) {
          this.discountCodeControl.setValue(journey.DiscountCode);
        }
        this.commonService.getOutwardFaresBreakData(journey, fareBreakdownModel);

        this.commonService.getReturnFaresBreakData(journey, fareBreakdownModel);

        if (journey.OutwardJourneyExtras != null) {

          journey.OutwardJourneyExtras.forEach(obj => {
            let journeyExtra = new JourneyModel;
            journeyExtra.Passenger = obj.FarePerson;
            journeyExtra.PricePerPerson = obj.Price;
            journeyExtra.TotalPrice = obj.Price;
            journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
            fareBreakdownModel.OutwardJourneyExtras.push(journeyExtra);
          });
        }
        if (journey.ReturnJourneyExtras != null) {

          journey.ReturnJourneyExtras.forEach(obj => {
            let journeyExtra = new JourneyModel;
            journeyExtra.Passenger = obj.FarePerson;
            journeyExtra.PricePerPerson = obj.Price;
            journeyExtra.TotalPrice = obj.Price;
            journeyExtra.JourneyExtrasTitle = obj.JourneyExtraName;
            fareBreakdownModel.ReturnJourneyExtras.push(journeyExtra);
          });
        }
        this.fareBreakForDeliveryDetail(journey, fareBreakdownModel);

        this.fareBreakModelForSeason(journey, fareBreakdownModel);
        this.fareBreakDownData.push(fareBreakdownModel);
      });
      this.sharedService.fareBreakdownModelData = this.fareBreakDownData;
    }
  }
  fareBreakForDeliveryDetail(journey, fareBreakdownModel) {
    if (journey.DeliveryDetail != null) {
      journey.DeliveryDetail.forEach(obj => {
        let journeyDelivery = new JourneyModel;
        journeyDelivery.Passenger = obj.FarePerson;
        journeyDelivery.PricePerPerson = obj.Price;
        journeyDelivery.TotalPrice = obj.Price;
        journeyDelivery.JourneyDeliveryTitle = obj.DeliveryModeName;

        if (obj.DeliveryModeName == 'NEXTDAYDELIVERY') {
          this.nextDayDeliveryModePrice = obj.Price;
        }
        else if (obj.DeliveryModeName == 'FIRSTCLASSPOST') {
          this.firstClassPostPrice = obj.Price;
        }
        fareBreakdownModel.DeliveryDetails.push(journeyDelivery);
      });
    }
  }
  fareBreakModelForSeason(journey, fareBreakdownModel){
    if (journey.SeasonDeatil != null) {
      fareBreakdownModel.SeasonJourney = new JourneyModel;
      if (journey.SeasonDeatil.JourneyTicketDescription.toLowerCase().indexOf('adult') !== -1) {
        fareBreakdownModel.SeasonJourney.Passenger = '1 * Adult';
        fareBreakdownModel.SeasonJourney.IsCheck = journey.SeasonDeatil.IsCheck;
      }
      else if (journey.SeasonDeatil.JourneyTicketDescription.toLowerCase().indexOf('child') !== -1) {
        fareBreakdownModel.SeasonJourney.Passenger = '1 * Child';
        fareBreakdownModel.SeasonJourney.IsCheck = true;
      }
      fareBreakdownModel.SeasonJourney.PricePerPerson = journey.SeasonDeatil.BasePrice;
      fareBreakdownModel.SeasonJourney.TotalPrice = journey.SeasonDeatil.Price;
      fareBreakdownModel.SeasonJourney.RailCard = journey.SeasonDeatil.RailCard;
    }
  }

  removeJourney(journeyCreatationDate: Date) {
    this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
    this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
    this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    if (this.reviewBuyResponse?.IsNreBasket) {
      let dialogRef = this.dialog.open(ConfirmPopupComponent, {
        width: '500px',
        disableClose: false,
      });
      dialogRef.componentInstance.confirmMessage = "Removing a journey will clear your basket. Do you wish to proceed?"
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.removeJourneyData(this.removeJourneyRequest,0);
        }
        else {
          return false;
        }
      });
    }
    else {
      let dialogRef = this.dialog.open(ConfirmPopupComponent, {
        width: '458px',
        disableClose: false,
      });
      dialogRef.componentInstance.confirmTitle = "Remove this journey?"
      dialogRef.componentInstance.confirmMessage = "Are you sure you want to remove this journey?\n You will not be able to recover it once removed"
      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult) {
          this.removeJourneyData(this.removeJourneyRequest,0);
        }
        else {
          return false;
        }
      });
    }
  }

  seatPickerPopup(journey: any, seatInfo: any, isOutWardJourney: boolean) {
    let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
      disableClose: true,
      panelClass: 'seat-picker',
      data: {
        seatInfo: seatInfo,
        journey: journey,
        isOutWardJourney: isOutWardJourney,
        openedFeature: this.ga4ItemListEnum.openedSeatPickerFromBooking,
        bookingReferenceNumber: undefined,
        isPostSale: false
      }
    });
    this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromBooking, undefined, this.ga4ItemListEnum.openAction);

     // To prevent page refresh on seat picker popup open added this class on html and body tag
     document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
     document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
 
    // * New Changes 
    if (this.isOpenSeatpicker) {
      this.isOpenSeatpicker = false;
      this.isLegChoosed = false;
      this.choosedTrainLeg = null;
    }

    dialogRef.afterClosed().subscribe(() => {
      this.reviewBuyCache = this.sharedService.reviewBuyCache;
      this.reviewBuyResponse = this.sharedService.reviewBuyResponse;

      // on seat picker popup close removed this class from html and body tag
      document.getElementsByTagName('html')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
      document.getElementsByTagName('body')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');

      if (this.sharedService.reviewBuyCache == "") {
        this.setFareBreakDown();
      }
      else {
        this.getBasketJourney(0);
      }
      this.ga4DatalayerService.loadGALayerForOpenChangeSeatPicker(this.ga4ItemListEnum.openedSeatPickerFromBooking, undefined, this.ga4ItemListEnum.exitAction);
    });

  }

  getRemoveJourneyData(removeJourneyRequest) {
    this.removeResponse = this.responseData.Data;
    this.reviewBuyCache = this.removeResponse.ReviewBuyCache;
    this.sharedService.reviewBuyCache = this.reviewBuyCache;
    this.sharedService.getBasketCount.emit(this.removeResponse.BasketCount);
    this.sharedService.reviewBuyResponse.ReviewBuyCache = this.removeResponse.ReviewBuyCache;
    this.sharedService.reviewBuyResponse.BasketCount = this.removeResponse.BasketCount;
    this.deletedJourney = this.reviewBuyResponse.Journey.filter(m => m.CreationDate === removeJourneyRequest.JourneyCreationDate);
    this.GAremoveCartResponse.Journey = this.deletedJourney;
    this.reviewBuyResponse.Journey = this.reviewBuyResponse.Journey.filter(m => m.CreationDate != removeJourneyRequest.JourneyCreationDate);
    if (this.removeResponse.BasketCount == 0 && this.reviewBuyResponse.Journey.length == 0) {
      this.searchRequest.PromotionCode = "";
      if (this.sharedService.journeySummaryModel == null) {
        this.sharedService.journeySummaryModel = new JourneySummaryModel();
      }
      this.sharedService.journeySummaryModel.IsPromo = false;
      this.sharedService.isAmendSearchOpen = true;
      this.isBasketEmpty = true; // Check for removing bottom ad journey button
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      if (!this.searchRequest.IsSeason) {
        this.sharedService.amendSearchRequest = this.sharedService.searchRequest;
        this.sharedService.showEdit = true;
      }
      else if (this.searchRequest.IsSeason) {
        this.router.navigate([`./` + this.appRouteEnum.SeasonSolutions]);
      }
    }
    else {
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }

    if (this.removeIndexOfreviewBuyJourneyTimeStampArr > -1) {
      let index = this.removeIndexOfreviewBuyJourneyTimeStampArr;
      this.reviewBuyJourneyTimeStampArr.splice(index, 1);
      this.removeIndexOfreviewBuyJourneyTimeStampArr = -1;

      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }
  removeJourneyData(removeJourneyRequest, index) {
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // virtual_page_view -- Ga4-datalayer event
    this.ga4DatalayerService.loadGA4DataLayerAllPages(false);
    this.reviewBuyService.removejourney(removeJourneyRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.getRemoveJourneyData(removeJourneyRequest);
            this.ga4DatalayerService.loadGALayerForReviewBuyRemoveCart(this.GAremoveCartResponse, false, null, null, null, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
            this.commonService.deletedRemovedJourneyForQuickBuyOrContinue(this.deletedJourney);
            // To Update the journey data
            this.getBasketJourney(index);
          }
          else {
            this.deletedJourney = this.reviewBuyResponse.Journey.filter(m => m.CreationDate === removeJourneyRequest.JourneyCreationDate);
            this.GAremoveCartResponse.Journey = this.deletedJourney;
            this.reviewBuyResponse.Journey = this.reviewBuyResponse.Journey.filter(m => m.CreationDate != removeJourneyRequest.JourneyCreationDate)
          }
          this.setFareBreakDown();
          this.dataLayerService.loadGALayerForReviewBuyRemoveCart(this.GAremoveCartResponse);        
        }
      });
  }

  getBasketJourney(index) {
    this.railCardPriceList = new RailCardPriceList();
    if (this.checkBlankOrNullReviewBuyCache()) {
      return;
    }
    this.basketJourneyRequestDto.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    this.basketJourneyRequestDto.IsSeason = this.searchRequest.IsSeason;
    this.basketJourneyRequestDto.ReviewBuyCache = this.reviewBuyCache;
    this.setDiscountedPrice();
    this.setRailCardPriceListOfBasketJourneyRequestDTO();
    this.basketJourneyRequestDto.IsPostSale = false;
    this.commonService.loaderRequired = true;
    this.reviewBuyService.getBasketJourney(this.basketJourneyRequestDto).subscribe(
      res => {
        if (res != null) {
          this.commonService.loaderRequired = false;
          this.spinnerService.hide();
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.reviewBuyResponse = this.responseData.Data;
            this.ga4DatalayerService.loadGALayerForViewBasket(this.reviewBuyResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
            //word spacing
            this.reviewBuyResponse.Journey.forEach(journey => {
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.OutwardSeat);
              this.commonService.getOrganisedOutwardAndReturnSeatInfo(journey.ReturnSeat);

              // Remove Standard Premium from TicketType from OutwardDetail
              this.removeStandPreFromTicketTypeForOutAndReturn(journey);

            })


            if (!this.reviewBuyResponse.IsBasketJourneyValid) {
              this.timeoutpopup(this.reviewBuyResponse.BasketJourneyMessage, false);
            }
            this.sharedService.reviewBuyResponse = this.reviewBuyResponse;
            this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
            this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;

            this.getBasketJourneyForPromoValue();

            this.sharedService.searchRequest = this.searchRequest;
            this.sharedService.getBasketCount.emit(this.reviewBuyResponse.BasketCount);
            this.addTimeStampToReviewBuyJourneyTimeStampArr();
            this.checkandRemoveJourneyOnSeatUpdateFail();
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.setFareBreakDown();
            this.dataLayerService.loadGALayerForCheckoutStep2(this.reviewBuyResponse);
            if(this.commonService.removedJourneyOnReservationTimeExpired(index, this.expiredJounreyDetailObject)){
              this.removeJourneyWhenExpired(this.expiredJounreyDetailObject?.removeJourneyArrayObject[index + 1].journeyCreationDate, index+1);
            }  

          }
        }
      });

  }

  getOutAndRetRailCardPriceListForFareBreakDownModel(journey) {
    this.railCardPriceList = new RailCardPriceList();
    if (journey) {
      this.railCardPriceList.CreationDate = journey.CreationDate;
      if (journey.OutwardDetail) {
        this.railCardPriceList.Outward = this.getOutAndRetRailCardPrice(journey.OutwardDetail);
      }
      if (journey.ReturnDetail) {
        this.railCardPriceList.Return = this.getOutAndRetRailCardPrice(journey.ReturnDetail);
      }
      this.railCardPriceListArray.push(this.railCardPriceList);
      this.sharedService.railCardPriceList = this.railCardPriceListArray;
    }
  }

  getOutAndRetRailCardPrice(journeyDetail) {
    let outAndRetRailCardPriceList = [];
    if (journeyDetail && journeyDetail.RailCardPrice && journeyDetail.RailCardPrice.length > 0) {
      journeyDetail.RailCardPrice.forEach(railCardPrice => {
        outAndRetRailCardPriceList.push(railCardPrice);
      });
    }
    return outAndRetRailCardPriceList;
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
  getBasketJourneyForPromoValue() {
    if (this.reviewBuyResponse != null) {
      if (this.reviewBuyResponse.PromotionCode != "" && this.reviewBuyResponse.PromotionCode != null) {
        this.searchRequest.PromotionCode = this.reviewBuyResponse.PromotionCode;
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = true;
      }
      else {
        this.searchRequest.PromotionCode = "";
        if (this.sharedService.journeySummaryModel == null) {
          this.sharedService.journeySummaryModel = new JourneySummaryModel();
        }
        this.sharedService.journeySummaryModel.IsPromo = false;
      }
    }
  }

  addTimeStampToReviewBuyJourneyTimeStampArr() {
    let alrdyPresentJourney = false;
    this.reviewBuyResponse.Journey.forEach(journey => {
      alrdyPresentJourney = false;
      this.reviewBuyJourneyTimeStampArr.forEach(timeStampObj => {
        if (timeStampObj.CreationDate === new Date(journey.CreationDate).getTime()) {
          alrdyPresentJourney = true;
        }
      });

      if (alrdyPresentJourney === false) {
        this.reviewBuyJourneyTimeStampArr.push({
          CreationDate: new Date(journey.CreationDate).getTime(),
          updateCount: 0,
          reviewBuyOrginalTimeStamp: journey.CreationDate
        });
      }
    });
    this.sharedService.reviewBuyJourneyTimeStampArr = this.reviewBuyJourneyTimeStampArr;
  }


  showFarebreakdown() {
    this.dialog.open(FareBreakdownComponent, {
      width: '600px',
      disableClose: false,
      panelClass: ['farebreak', 'common-popup-theme'],
    });
  }

  getPaymentdetails() {
    this.ga4DatalayerService.loadGALayerForConfirmOrderDetailInfo(this.reviewBuyResponse, this.sharedService?.selectedJourneyDataForQuickBuyOrContiue);
    this.commonService.loaderRequired = true;
    this.paymentDetailsRequest = new PaymentDetailRequest();
    this.paymentDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.paymentDetailsRequest.Email = localStorage.getItem('Email');
    this.setReviewBuyCacheAndPostSaleInPaymentDetailRequest();
    this.reviewBuyCache = this.sharedService.reviewBuyCache;
    this.paymentDetailsService.paymentDetails(this.paymentDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.commonService.loaderRequired = false;
            this.paymentDetailsResponse = new PaymentDetailResponse();
            this.paymentDetailsResponse = this.responseData.Data;
            this.setReviewBuyCacheInSharedService();
            this.reviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
            //Set shared cache data
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            //Set shared cache data
            this.setSharedCacheData();
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }
  isChangeSeatAvailable(journey) {
    let isChangeSeatAvailableFlag = false;

    journey.OutwardSeat.forEach(element => {
      if (element.IsSeatPicker) {
        isChangeSeatAvailableFlag = true;
        return isChangeSeatAvailableFlag;
      }
    });

    if (journey.ReturnSeat) {
      journey.ReturnSeat.forEach(returnSeat => {
        if (returnSeat.IsSeatPicker) {
          isChangeSeatAvailableFlag = true;
          return isChangeSeatAvailableFlag;
        }
      });
    }
    return isChangeSeatAvailableFlag;
  }
  // * New Bugfix Changes

  onChangeSeat(index, journey) {
    // open seat picker directly on change seat click if there is only one train leg -- prashant
    if (!journey.ReturnSeat && journey.OutwardSeat.length == 1 && journey.OutwardSeat[0].IsSeatPicker) {
      this.seatPickerPopup(journey, journey.OutwardSeat[0], true);
      return;
    }
    // open seat picker directly on change seat click if there is only one train leg -- prashant


    this.isOpenSeatpicker = true;
    setTimeout(() => {
      document.querySelectorAll('#selectTrainLegsDiv')[index].scrollIntoView({ block: 'center' });
    }, 0);
  }

  onClosingTrainLegs() {
    this.isOpenSeatpicker = false;
    this.isLegChoosed = false;
    this.choosedTrainLeg = null;
  }

  onTrainLegClick(trainLeg, isValidLeg, isOutwardLegChoosed: boolean) {
    if (isValidLeg) {
      this.isLegChoosed = true;
      this.choosedTrainLeg = trainLeg;
      this.isOutwardLegChoosed = isOutwardLegChoosed;
    }
  }

  showRouteDetails(row, isReturnCase) {
    console.log(row);
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
        SearchCustomCache: isReturnCase ? this.sharedService.journeySummaryModel.ReturnSearchCache : this.sharedService.journeySummaryModel.SingleSearchCache,
      }
    });
  }

  removeTravelExtras(travelExtraDetail, TravelExtraType, index, journey) {
    let data = {
      reviewBuyCache: this.reviewBuyCache,
      ReservationCache: this.sharedService.ReservationCache,
      travelExtra: {
        offerId: travelExtraDetail.OfferId,
        serviceId: travelExtraDetail.ServiceId,
        selectCount: travelExtraDetail.Count,
        isReturn: (TravelExtraType == 'RETURN') ? true : false,
        solutionNodeRef: travelExtraDetail.SolutionNodeRef,
      },
      IsNreBasket: this.isNreBasket,
      isSeason: this.searchRequest.IsSeason,
      journeyCreationDate: journey.CreationDate
    }
    this.commonService.loaderRequired = true;
    this.reviewBuyService.removeTravelExtras(data).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            if (TravelExtraType == 'OUTWARD') {
              journey.OutwardJourneyExtras.splice(index, 1);
            }

            if (TravelExtraType == 'RETURN') {
              journey.ReturnJourneyExtras.splice(index, 1);
            }
            this.sharedService.reviewBuyCache = this.responseData.Data.ReviewBuyCache;
            this.reviewBuyCache = this.sharedService.reviewBuyCache;
            this.sharedService.ReservationCache = this.responseData.Data.ReservationCache;
            this.sharedService.reviewBuyResponse.ReviewBuyCache = this.reviewBuyCache;
            this.sharedService.previousCache = null;
            this.sharedService.setSharedCache();
            this.storageDataService.clearStorageData("sharedSibling");
            this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
            this.commonService.loaderRequired = true;
            this.getBasketJourney(0);
          }
        }
      });
  }

  browserRefreshData(sharedSiblingRefresh) {
    if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
      this.sharedService.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
      this.sharedService.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
      if (this.reviewBuyResponse != null && this.reviewBuyResponse != undefined) {
        this.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
        this.sharedService.reviewBuyCache = this.reviewBuyResponse.ReviewBuyCache;
      }
      this.sharedService.previousCache = sharedSiblingRefresh.previousCache;
      this.sharedService.ReservationCache = sharedSiblingRefresh.ReservationCache;
      if (this.sharedService.reviewBuyResponse)
        this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
      this.sharedService.locationMasterData = sharedSiblingRefresh.locationMasterData;
      this.sharedService.reviewBuyJourneyTimeStampArr = sharedSiblingRefresh.reviewBuyJourneyTimeStampArr || [];
      this.sharedService.railCardPriceList = sharedSiblingRefresh.railCardPriceList;
      this.railCardPriceListArray = this.sharedService.railCardPriceList;
      //Set shared cache data
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }

  scrollOpenedMatPanelntoView(index) {
    setTimeout(() => {
      document.querySelectorAll('#matExpansionPanelId')[index].scrollIntoView();
    }, 100);
  }

  HasReservationTimeExpiredForAnyJourney(){
    try {
      let journeyDetailObject = this.commonService.checkIfJourneyHsExpiredOrNot(this.reviewBuyResponse);
      this.expiredJounreyDetailObject = journeyDetailObject;
      if (journeyDetailObject.isJourneyExpired) {
        let expiredJourneyRemovedMsgsObj = {
          notificationErrorMsg: this.notificationErrorMsg.expiredJourneyNotificationMessage,
          notificationTitle: this.notificationErrorMsg.expiredJourneyNotificationTitle,
        }
        let dialogRef = this.commonService.commonNotificationDialog('expired-journey-removed-notification-dialog', expiredJourneyRemovedMsgsObj, '', false, false, false, false);
        dialogRef.afterClosed().subscribe(() => {
          this.removeJourneyWhenExpired(journeyDetailObject.removeJourneyArrayObject[0].journeyCreationDate, 0);
        });
      } else {
        this.openPaymentDetails();
      }
    } catch(error) {
      console.log(error);
      this.openPaymentDetails();
    }
  }

  removeJourneyWhenExpired(journeyCreatationDate, index){
    this.removeJourneyRequest.JourneyCreationDate = journeyCreatationDate;
    this.removeJourneyRequest.ReviewBuyCache = this.reviewBuyCache;
    this.removeJourneyRequest.IsNreBasket = this.reviewBuyResponse.IsNreBasket;
    this.removeJourneyData(this.removeJourneyRequest, index);
  }

  goBackToSearchResults() {
    let reviewBackBtnMsgsObj = {
      notificationErrorMsg: this.notificationErrorMsg.backToSearchPageMsgFromReviewBuy,
      notificationTitle: this.notificationErrorMsg.backToSearchPageTitleFromReviewBuy,
    }
    this.commonService.commonNotificationDialog('review-backbtn-common-notification-dialog', reviewBackBtnMsgsObj, '', true, false, true, true)
  }
  
  isExistRenewSmartcard() {
    if (this.sharedService?.reviewBuyResponse?.IsRenewSmartcard) {
      return true;
    }
    return false;
  }

  checkDiscountedPrice(){
    return this.addDiscountRequest.IsAddDiscountCode || this.discountedPrice;
  }

  checkBlankOrNullReviewBuyCache(){
    return this.reviewBuyCache == "" || this.reviewBuyCache == null;
  }

  checkJourneyIsAvailableInReviewBuyResponseOrNot(){
    return this.reviewBuyResponse && this.reviewBuyResponse.Journey;
  }

  setDiscountedPrice(){
    if (this.checkJourneyIsAvailableInReviewBuyResponseOrNot()) {
      this.reviewBuyResponse.Journey.forEach(journey => {
        this.discountedPrice = journey.DiscountedPrice;
      });
    }
  }

  setRailCardPriceListOfBasketJourneyRequestDTO(){
    if (this.checkDiscountedPrice()) {
      this.basketJourneyRequestDto.RailCardPriceList = this.railCardPriceListArray;
    }
  }
  
  setReviewBuyCacheAndPostSaleInPaymentDetailRequest(){
    if (this.isExistRenewSmartcard()) {
      this.paymentDetailsRequest.IsPostSale = true;
      this.paymentDetailsRequest.ReviewBuyCache = this.sharedService.postSaleReviewBuyCache;
    } else {
      this.paymentDetailsRequest.IsPostSale = false;
      this.paymentDetailsRequest.ReviewBuyCache = this.sharedService.reviewBuyCache;
    }
  }

  setReviewBuyCacheInSharedService(){
    if (this.isExistRenewSmartcard()) {
      this.sharedService.postSaleReviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
    } else {
      this.sharedService.reviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
    }
  }

  setSharedCacheData(){
    if (this.paymentDetailsResponse.IsBasketJourneyValid) {
      localStorage.removeItem("isChangeReplace");
      localStorage.removeItem("paymentForSmartcard");
      localStorage.setItem("paymentForSmartcard", "false");
      this.router.navigate([`./` + this.appRouteEnum.Payment]);
      localStorage.setItem('JourneyValidforPayemnt', 'false');
    }
    else {
      this.commonService.loaderRequired = false;
      this.spinnerService.hide();
      this.timeoutpopup(this.paymentDetailsResponse.BasketJourneyMessage, true);
    }
  }
}
