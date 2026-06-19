import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ResponseData } from 'src/app/models/common/response.model';
import { CojEvaluateTravelRequest } from 'src/app/models/journey-extras/evaluate-request.model';
import { BasketJourneyRequestDto, CojReviewBuyResponse, JourneyExtrasDetail, ReservationDetail, ReviewBuyResponse } from 'src/app/models/review-buy/review-buy-model';
import { JourneyExtraService } from 'src/app/services/journey-extras.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppConstantsService, AppRouteEnum, DiscountCodeStatusEnum, Ga4ItemListEnum, LocalStorageKeyEnum } from 'src/app/utility/app-constants.service';
import { browserRefresh } from 'src/app/app-component/app.component';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { COJSearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import * as moment from 'moment';
import { SeatpickerPopupComponent } from '../review-and-buy/seatpicker-popup/seatpicker-popup.component';
import { ReviewBuyService } from 'src/app/services/review-buy.service';
import { PaymentPageRequest } from 'src/app/models/payment-details/payment-request.model';
import { PaymentDetailRequest } from 'src/app/models/payment-details/payment-details-request.model';
import { PaymentDetailResponse } from 'src/app/models/payment-details/payment-details-response.model';
import { CommonServices } from 'src/app/services/common.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { TimeoutComponent } from '../review-and-buy/timeout/timeout.component';
import { ValidatePaymentResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import { InfoPopupComponent } from '../mixing-deck/info-popup/info-popup.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
    selector: 'app-coj-review-and-buy',
    templateUrl: './coj-review-and-buy.component.html',
    styleUrls: ['./coj-review-and-buy.component.css'],
    standalone: false
})
export class CojReviewAndBuyComponent implements OnInit, OnDestroy {

  CojReviewBuyRequest: CojEvaluateTravelRequest;
  responseData: ResponseData;
  CojReviewBuyResponseDto: CojReviewBuyResponse;
  isOutwardJourneyExist: boolean = false;
  isReturnJourneyExist: boolean = false;
  outwardDetail: ReservationDetail = null;
  returnDetail: ReservationDetail = null;
  arrivalLocation: string;
  departureLocation: string;
  outwardChanges: number;
  returnChanges: number;
  outwardDuration: string;
  returnDuration: string;
  outwardTicketType: string;
  returnTicketType: string;
  outwardTicketClass: string;
  returnTicketClass: string;
  outwardTicketRestriction: string;
  returnTicketRestriction: string;
  returnTicketDescription: string;
  outwardTicketDescription: string;
  outwardLegs = [];
  returnLegs = [];
  browserRefresh: boolean;
  searchRequest: COJSearchRequestModel;
  journeyDirection: string;
  outwardDate: string;
  returnDate: string;
  outNoOfAdult: number = 0;
  outNoOfChild: number = 0;
  retNoOfAdult: number = 0;
  retNoOfChild: number = 0;
  step = 0;
  step1 = 0;
  step2 = 0;
  continueBtnText: string = "Continue";
  priceToPayOutward: string = "0";
  priceToPayReturn: string = "0";
  totalPriceToPay: any = "0";
  adminFee = 0;
  COJEvaluateCache: string;
  oldPriceOutward = 0;
  oldPriceReturn = 0;
  OperatorOutward: number;
  OperatorReturn: number;
  OperatorChangeOutward: number;
  OperatorChangeReturn: number;
  saleCompanyOutward: string;
  saleCompanyReturn: string;
  DepartureDate: string;
  ArrivalDate: string;
  DepartureTimeOutward: string;
  DepartureTimeReturn: string;
  ArrivalTimeOutward: string;
  ArrivalTimeReturn: string;
  isNonRefundableTicketOutward = false;
  isNonRefundableTicketReturn = false;
  isOpenSeatpicker: boolean = false;
  isLegChoosed: boolean = false;
  choosedTrainLeg: any;
  isOutwardLegChoosed: boolean;
  isShowPriceBreakDown: boolean = false;
  sticky: boolean;
  paymentRequest: PaymentPageRequest;
  paymentDetailsRequest: PaymentDetailRequest;
  paymentDetailsResponse: PaymentDetailResponse;
  activeTabFromSearchPage: number;
  validatePaymentResponse :ValidatePaymentResponse;
 isUpgradeChange: boolean;
 upgradeReviewBuyRequest: CojEvaluateTravelRequest;
 UpgradeAmount: number;
 outwardJourneyExtras: JourneyExtrasDetail[] = [];
 returnJourneyExtras: JourneyExtrasDetail[] = [];

  notificationService: NotificationService;
  commonService: CommonServices;
  appConstantsService: AppConstantsService;
  sharedSibling: SharedService;
  journeyExtraService: JourneyExtraService;
  router: Router;
  appRouteEnum: AppRouteEnum;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  reviewBuyService: ReviewBuyService;
  paymentDetailsService: PaymentDetailsService;
  spinnerService: NgxSpinnerService;
  ga4datalayerService: GA4DatalayerService;
  ga4ItemListEnum: Ga4ItemListEnum;
  localStorageKeyEnum: LocalStorageKeyEnum;
  getOpenedFeatureValueForUpgardeAndCOj: string;
  TotalRefundAmount: number = 0;
  totalDifference: number = 0;
  showDiscountCodeMessage: boolean = true;
  discountCodeStatusEnum: DiscountCodeStatusEnum;
  outwardGroupSaveRailCardArray = [];
  outwardNonGroupSaveRailCardArray = [];
  returnGroupSaveRailCardArray = [];
  returnNonGroupSaveRailCardArray = [];

  constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {
    this.notificationService = this.injector.get(NotificationService);
    this.commonService = this.injector.get(CommonServices);
    this.appConstantsService = this.injector.get(AppConstantsService);
    this.sharedSibling = this.injector.get(SharedService);
    this.journeyExtraService = this.injector.get(JourneyExtraService);
    this.router = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.reviewBuyService = this.injector.get(ReviewBuyService);
    this.paymentDetailsService = this.injector.get(PaymentDetailsService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.ga4datalayerService = this.injector.get(GA4DatalayerService);
    this.ga4ItemListEnum = this.injector.get(Ga4ItemListEnum);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.discountCodeStatusEnum = this.injector.get(DiscountCodeStatusEnum);
  }

  ngOnInit() {
    this.isUpgradeChange = this.storageDataService.getSessionStorageData("isUpgradeChange",true);
    this.browserRefresh = browserRefresh;
    if (this.browserRefresh) {
      if(this.isUpgradeChange === true) {
        this.getUpgradeSessionDataOnRefresh();
      }
      else {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh) {
        this.sharedSibling.CojSearchRequest = sharedSiblingRefresh.CojSearchRequest;
        this.sharedSibling.COJjourneySummaryModel = sharedSiblingRefresh.COJjourneySummaryModel;
        this.sharedSibling.postSaleReviewBuyCache = sharedSiblingRefresh.postSaleReviewBuyCache;
        this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.sharedSibling.journey = sharedSiblingRefresh.journey;
        this.sharedSibling.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedSibling.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedSibling.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.sharedSibling.locationMasterData = sharedSiblingRefresh.locationMasterData;
        this.sharedSibling.CojReviewBuyRequest = sharedSiblingRefresh.CojReviewBuyRequest;
        //Set shared cache data
        this.sharedSibling.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
      }
    }
    }
    
    this.oldPriceOutward = this.sharedSibling.COJjourneySummaryModel ? this.sharedSibling.COJjourneySummaryModel.OldOutwardPrice : 0;
    this.oldPriceReturn = this.sharedSibling.COJjourneySummaryModel ? this.sharedSibling.COJjourneySummaryModel.OldReturnPrice : 0;
    this.activeTabFromSearchPage = this.sharedSibling.COJjourneySummaryModel ? this.sharedSibling.COJjourneySummaryModel.activeTab : 0;
    this.getReviewBuydata();
    // page_meta_data -- Ga4-datalayer event
    this.ga4datalayerService.loadGA4DataLayerAllPages(true);
    this.getOpenedFeatureValueForUpgardeAndCOj = this.isUpgradeChange ? this.ga4ItemListEnum.openedSeatPickerFromUpgrade : this.ga4ItemListEnum.openedSeatPickerFromCoj;
  }

  ngOnDestroy() {
    if (this.router.getCurrentNavigation().trigger == "popstate" && this.router.url.includes(this.appRouteEnum.ValidatePaymentDo)) {   
      this.goBack();  
    }
  }

  getReviewBuydata() {
    if (this.isUpgradeChange === true) {
      this.CojReviewBuyRequest = this.sharedSibling.upgradeReviewBuyRequest;
    }
    else {
      this.CojReviewBuyRequest = this.sharedSibling.CojReviewBuyRequest;
    }
    this.journeyExtraService.getCojEvaluateResponse(this.CojReviewBuyRequest).subscribe(
      resp => {
        if (resp !== null) {
          this.responseData = resp as ResponseData;
          let ResponseCode = +this.responseData.ResponseCode;
          if (ResponseCode === 200) {
            this.CojReviewBuyResponseDto = this.responseData.Data;
            this.CojReviewBuyResponseDto.IsDiscountCodeAvailableOnOriginalJourney = this.responseData?.Data?.IsDiscountCodeAvailableOnOriginalJourney;
            this.CojReviewBuyResponseDto.IsDiscountCodeAvailable = this.responseData?.Data?.IsDiscountCodeAvailable;
            this.CojReviewBuyResponseDto.DiscountCodeStatus = this.responseData?.Data?.DiscountCodeStatus;
            
            //PICO-4085 check for outward multiple same railcard with count
            if (this.CojReviewBuyResponseDto?.Journey?.[0]?.OutwardDetail?.Fares) {
              this.commonService.checkMultipleRailcardCountForOutward(this.CojReviewBuyResponseDto?.Journey[0]);
            }
            //PICO-4085 check for return multiple same railcard with count
            if (this.CojReviewBuyResponseDto?.Journey?.[0]?.ReturnDetail?.Fares) {
              this.commonService.checkMultipleRailcardCountForReturn(this.CojReviewBuyResponseDto?.Journey[0]);
            }
            // add to cart event for Coj
            this.ga4datalayerService.loadGADataLayerAddToCartForCoj(this.CojReviewBuyResponseDto, false);
           this.bindReviewBuyData();
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
      }
      });
  }

  bindReviewBuyData() {
    if (this.CojReviewBuyResponseDto.IsSuccess) {
      this.sharedSibling.CojReviewBuyResponseDto = this.CojReviewBuyResponseDto;
      this.sharedSibling.postSaleReviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
      this.sharedSibling.reviewBuyResponse = new ReviewBuyResponse();
      this.sharedSibling.reviewBuyResponse = this.CojReviewBuyResponseDto;
      this.sharedSibling.reviewBuyResponse.BasketCount = 0;
      this.sharedSibling.reviewBuyResponse.ReviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
      this.adminFee = this.CojReviewBuyResponseDto.COJData ? this.CojReviewBuyResponseDto.COJData.AdminFee : 0;
      this.COJEvaluateCache = this.CojReviewBuyResponseDto?.COJData?.COJEvaluateCache;
      this.UpgradeAmount = this.CojReviewBuyResponseDto.COJData ? this.CojReviewBuyResponseDto.COJData.UpgradeMissingAmount : 0;
      this.TotalRefundAmount = this.CojReviewBuyResponseDto.COJData ? this.CojReviewBuyResponseDto.COJData.TotalRefundAmount : 0;
      this.totalDifference = this.CojReviewBuyResponseDto.COJData ? this.CojReviewBuyResponseDto.COJData.TotalDifference : 0
      this.bindJourneyData();
    }
    else {
      if (this.CojReviewBuyResponseDto.ErrorMessage != null) {
        let respMsg = this.CojReviewBuyResponseDto.ErrorMessage;
        let newMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service.`;
        let oldMsg = `There are no more seats available to reserve for your chosen ticket on the outward/return service. You can buy this ticket without reservations or you can change your service or ticket selection and try again.`;
        let modifiedMsg = respMsg.replace(oldMsg, newMsg);

        let dialogRef = this.dialog.open(InfoPopupComponent, {
          width: '500px',
          disableClose: false,
          data: {
            Message: modifiedMsg
          }
        });
        dialogRef.afterClosed().subscribe(() => this.goBack());
      }
    }
  }


  getFormattedDate(passedDate: string) {
    let dateArr =  new Date(passedDate).toDateString().split(' ');
    let day = dateArr[0];
    let month = dateArr[1];
    let dateOfMonth = dateArr[2];
    let year = dateArr[3];
    return `${day}, ${dateOfMonth} ${month} ${year}`;
}

  bindJourneyData() {
    if (this.CojReviewBuyResponseDto?.Journey?.length > 0) {
      this.isOutwardJourneyExist = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail ? true : false;
      this.isReturnJourneyExist = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail ? true : false;
      this.arrivalLocation = this.CojReviewBuyResponseDto.Journey[0].Arrival;
      this.departureLocation = this.CojReviewBuyResponseDto.Journey[0].Departure;
      this.bindOutwardJourneyData(this.isOutwardJourneyExist);
      this.bindReturnJourneyData(this.isReturnJourneyExist);
      this.setBindJourneyData();
      this.ga4datalayerService.loadGALayerForAddToCartInfo(this.sharedSibling.upgradeSearchRequest.SearchRequestDto, this.CojReviewBuyResponseDto.Journey[0], this.commonService.jourenyExtraForCheckout(), true, false, this.totalPriceToPay);
    }
  }

  setBindJourneyData() {
    this.totalPriceToPay = this.CojReviewBuyResponseDto.COJData.TotalToPay.toFixed(2);
    this.continueBtnText = +this.totalPriceToPay > 0 ? "Continue" : "Confirm";
  }

  bindOutwardJourneyData(isOutwardJourneyExist : boolean) {
    if(isOutwardJourneyExist) {
      this.outwardDetail = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail;
      this.outwardDuration = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.Duration;
      this.outwardChanges = +this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.Changes;
      this.outwardTicketType = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.TicketType;
      this.outwardTicketClass = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.TicketClass;
      this.outwardTicketRestriction = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.TicketRestriction;
      this.outwardTicketDescription = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.TicketDescription;
      this.outwardLegs = this.CojReviewBuyResponseDto.Journey[0].OutwardSeat;
      this.OperatorOutward = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.Operator;
      this.OperatorChangeOutward = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.OperatorChange;
      this.saleCompanyOutward = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.SaleCompany;
      if(this.isUpgradeChange === true) {
        this.priceToPayOutward = (this.outwardDetail.CojPrice - this.sharedSibling.upgradeOutwardPrice).toFixed(2);
      } else {
        this.priceToPayOutward = (this.outwardDetail.CojPrice - this.oldPriceOutward) < 0 ? "0" : (this.outwardDetail.CojPrice - this.oldPriceOutward).toFixed(2);
      }
      this.DepartureDate = this.getFormattedDate(this.outwardDetail.DepartureTime);
      this.DepartureTimeOutward = moment(this.outwardDetail.DepartureTime).format("HH:mm");
      this.ArrivalTimeOutward = moment(this.outwardDetail.ArrivalTime).format("HH:mm");
      this.isNonRefundableTicketOutward = this.commonService.isTicketTypeAdvance(this.outwardTicketType);
      this.outNoOfAdult = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.NoOfAdult;
      this.outNoOfChild = this.CojReviewBuyResponseDto.Journey[0].OutwardDetail.NoOfChild;
      this.outwardJourneyExtras = this.CojReviewBuyResponseDto.Journey[0].OutwardJourneyExtras;
    }
  }

  priceToPayReturnJourneyData(){
    if(this.activeTabFromSearchPage === 1){
      return this.returnDetail.CojPrice.toFixed(2);
    }else if((this.returnDetail.CojPrice - this.oldPriceReturn) < 0){
        return "0"
    }
    return (this.returnDetail.CojPrice - this.oldPriceReturn).toFixed(2);
  }  

  bindReturnJourneyData(isReturnJourneyExist: boolean) {
    if(isReturnJourneyExist) {
      this.returnDetail = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail;
      this.returnDuration = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.Duration;
      this.returnChanges = +this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.Changes;
      this.returnTicketType = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.TicketType;
      this.returnTicketClass = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.TicketClass;
      this.returnTicketRestriction = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.TicketRestriction;
      this.returnTicketDescription = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.TicketDescription;
      this.returnLegs = this.CojReviewBuyResponseDto.Journey[0].ReturnSeat;
      this.OperatorReturn = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.Operator;
      this.OperatorChangeReturn = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.OperatorChange;
      this.saleCompanyReturn = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.SaleCompany;
      this.priceToPayReturn = this.priceToPayReturnJourneyData();
      if(this.isUpgradeChange === true) {
        this.priceToPayReturn = (this.returnDetail.CojPrice - this.sharedSibling.upgradeReturnPrice).toFixed(2);
      } else {
        this.priceToPayReturn = this.priceToPayReturnJourneyData();
      }
      this.ArrivalDate = this.getFormattedDate(this.returnDetail.DepartureTime);
      this.DepartureTimeReturn = moment(this.returnDetail.DepartureTime).format("HH:mm");
      this.ArrivalTimeReturn = moment(this.returnDetail.ArrivalTime).format("HH:mm");
      this.isNonRefundableTicketReturn = this.commonService.isTicketTypeAdvance(this.returnTicketType);
      this.retNoOfAdult = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.NoOfAdult;
      this.retNoOfChild = this.CojReviewBuyResponseDto.Journey[0].ReturnDetail.NoOfChild;
      this.returnJourneyExtras = this.CojReviewBuyResponseDto.Journey[0].ReturnJourneyExtras;
    }
  }

  goBack() {
    if(this.isUpgradeChange === true) {
       this.router.navigate(["./" + this.appRouteEnum.upgradeSelect]);
    } else {
      this.router.navigate(["./" + this.appRouteEnum.CojMixingDeck]);
    }
  }

  getPaymentdetails() {
    this.commonService.loaderRequired = true;
    this.paymentDetailsRequest = new PaymentDetailRequest();
    this.paymentDetailsRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.paymentDetailsRequest.Email = localStorage.getItem('Email');
    this.paymentDetailsRequest.ReviewBuyCache = this.sharedSibling.postSaleReviewBuyCache;
    this.paymentDetailsRequest.IsPostSale = true;
    this.paymentDetailsService.paymentDetails(this.paymentDetailsRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.commonService.loaderRequired = false;
            this.paymentDetailsResponse = new PaymentDetailResponse();
            this.paymentDetailsResponse = this.responseData.Data;
            this.sharedSibling.postSaleReviewBuyCache = this.paymentDetailsResponse.ReviewBuyCache;
            this.sharedSibling.totalPriceToPayReviewBuy = this.totalPriceToPay;
            this.setPaymentDetailsPageData(); 
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  setPaymentDetailsPageData() {
    if (this.isUpgradeChange === true) {
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearSessionStorageData("sharedSibling");
      this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
    } else {
      //Set shared cache data
      this.sharedSibling.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
    }
    if (this.paymentDetailsResponse.IsBasketJourneyValid) {
      localStorage.removeItem("isChangeReplace");
      localStorage.removeItem("paymentForSmartcard");
      localStorage.setItem("paymentForSmartcard", "false");
      if (this.isUpgradeChange === false || this.isUpgradeChange === null || this.isUpgradeChange === undefined || !this.isUpgradeChange) {
        localStorage.setItem("isCOJChange", "true");
      }
      localStorage.setItem('JourneyValidforPayemnt', 'false');
      if (this.isUpgradeChange === true) {
        this.router.navigate([`./` + this.appRouteEnum.upgradePayment]);
      }
      else {
        this.router.navigate([`./` + this.appRouteEnum.CojPayment]);
      }
    }
    else {
      this.commonService.loaderRequired = false;
      this.spinnerService.hide();
      this.timeoutpopup(this.paymentDetailsResponse.BasketJourneyMessage, true);
    }
  }

  timeoutpopup(message, _isCallApi) {
    this.dialog.open(TimeoutComponent, {
      disableClose: false,
      width: '600px',
      data: {
        Message: message
      }
    });
    
  }
  
  openPaymentDetails() {
    if (this.conditionToCheckCojReviewBuyResponseDto()) {
      this.notificationService.error("Please add a journey first.");
      return;
    }

    this.sharedSibling.postSaleReviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
    if(this.isUpgradeChange === true) {
    //Set shared cache data
    this.sharedSibling.setSharedCache();
    this.storageDataService.clearSessionStorageData("sharedSibling");
    this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
    } else {
     //Set shared cache data
     this.sharedSibling.setSharedCache();
     this.storageDataService.clearStorageData("sharedSibling");
     this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
     }
    this.getPaymentdetails();
  }

  onContinue() {

    if (this.conditiontoCheckCojReviewBuyResponseDto()) {
      this.notificationService.error("Please add a journey first.");
      return;
    }

    if(+this.totalPriceToPay > 0) {
      this.openPaymentDetails();
    }
    else if(+this.totalPriceToPay === 0) {
      this.createProcessPaymentRequest();
      this.commonService.loaderRequired = true;
      this.processPayment();
    }
    // begin_checkout event for Coj
    this.ga4datalayerService.loadGADataLayerAddToCartForCoj(this.CojReviewBuyResponseDto, true);
  }

  processPayment() {
    this.journeyExtraService.PaymentprocessOrder(this.paymentRequest).subscribe(
      resp => {
        if (resp !== null) {
          this.responseData = resp as ResponseData;
          let ResponseCode = +this.responseData.ResponseCode;
          if (ResponseCode === 200) {
            this.validatePaymentResponse = this.responseData.Data;
            this.sharedSibling.validatePaymentResponse = this.validatePaymentResponse;
            this.storageDataService.clearStorageData("isRedirectFromValidateDo");
            this.storageDataService.setStorageData("isRedirectFromValidateDo", true, true);
            this.sharedSibling.reviewBuyCache = "";
            this.sharedSibling.postSaleReviewBuyCache = "";
            this.sharedSibling.reviewBuyResponse = null;

            if (this.isUpgradeChange === true) {
              this.storageDataService.setSessionStorageData('validatePaymentResponse', this.validatePaymentResponse, true);
              //Set shared cache data
              this.sharedSibling.setSharedCache();
              this.storageDataService.clearSessionStorageData("sharedSibling");
              this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
              this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isUpgrade: true } });
            } else {
              localStorage.setItem('validatePaymentResponse', JSON.stringify(this.validatePaymentResponse));
              //Set shared cache data
              this.sharedSibling.setSharedCache();
              this.storageDataService.clearStorageData("sharedSibling");
              this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
              this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isCoj: true } });
            }
          }
        }
      }
    )
  }

  createProcessPaymentRequest() {
    this.paymentRequest = new PaymentPageRequest();
    this.paymentRequest.ReviewBuyCache  =  this.sharedSibling.postSaleReviewBuyCache;
    this.paymentRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.paymentRequest.Email = localStorage.getItem('Email');
    this.paymentRequest.FirstName = localStorage.getItem('FirstName');
    this.paymentRequest.LastName = localStorage.getItem('LastName');
    this.paymentRequest.UserName = localStorage.getItem('UserName');
    this.paymentRequest.IsRenewSeason = false;
    this.paymentRequest.EvaluateCache = this.sharedSibling.reviewBuyResponse.COJData.COJEvaluateCache;
    this.paymentRequest.IsCOJ = true;
}

  onClosingTrainLegs() {
    this.isOpenSeatpicker = false;
    this.isLegChoosed = false;
    this.choosedTrainLeg = null;
  }
  
  onModifyWithSeatPickerClick(){
    this.isOpenSeatpicker = true;
    setTimeout(() => {
      document.querySelector('#selectTrainLegsDiv').scrollIntoView();
    },0);
  }

  onTrainLegClick(trainLeg, isValidLeg, isOutwardLegChoosed: boolean) {
    if(isValidLeg) {
      this.isLegChoosed = true;
      this.choosedTrainLeg = trainLeg;
      this.isOutwardLegChoosed = isOutwardLegChoosed;
    }
  }

  onShowPriceBreakdown() {
    this.isShowPriceBreakDown = !this.isShowPriceBreakDown;
  }
  
  onSelectTrainClick(isOutWardJourney: boolean) {
    try {
      let dialogRef = this.dialog.open(SeatpickerPopupComponent, {
        disableClose: true,
        panelClass: 'seat-picker',
        data: {
          seatInfo: this.choosedTrainLeg,
          journey: this.CojReviewBuyResponseDto.Journey[0],
          isOutWardJourney: isOutWardJourney,
          openedFeature: this.getOpenedFeatureValueForUpgardeAndCOj,
          bookingReferenceNumber: localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber),
          isPostSale: true,
          reopenCache: this.isUpgradeChange === true ? this.sharedSibling.upgradeReviewBuyRequest.ReopenCache : this.sharedSibling.CojReviewBuyRequest.ReopenCache
        }
      });
      this.isLegChoosed = false;
      this.choosedTrainLeg = null;
      this.ga4datalayerService.loadGALayerForOpenChangeSeatPicker(this.getOpenedFeatureValueForUpgardeAndCOj, localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber), this.ga4ItemListEnum.openAction);

      // To prevent page refresh on seat picker popup open added this class on html and body tag
      document.getElementsByTagName('html')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
      document.getElementsByTagName('body')[0].classList.add('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');

      dialogRef.afterClosed().subscribe(() => {
        // on seat picker popup close removed this class from html and body tag
        document.getElementsByTagName('html')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
        document.getElementsByTagName('body')[0].classList.remove('prevent-pulldownRefresh-Scrolling-OnSeatPickerPopup');
        this.getBasketJourney();
        this.ga4datalayerService.loadGALayerForOpenChangeSeatPicker(this.getOpenedFeatureValueForUpgardeAndCOj, localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber), this.ga4ItemListEnum.exitAction);
      });
    } catch (error) {
      this.ga4datalayerService.loadGALayerForOpenChangeSeatPicker(this.getOpenedFeatureValueForUpgardeAndCOj, localStorage.getItem(this.localStorageKeyEnum.bookingRefrenceNumber), this.ga4ItemListEnum.saveSeatPickerOpenFailedAction, error);
    }
  }
  getBasketJourney() {
    let basketJourneyRequestDto = new BasketJourneyRequestDto();
    if(this.sharedSibling.postSaleReviewBuyCache) {
      basketJourneyRequestDto.IsNreBasket = false;
      basketJourneyRequestDto.IsSeason = false;
      basketJourneyRequestDto.ReviewBuyCache = this.sharedSibling.postSaleReviewBuyCache;
      basketJourneyRequestDto.IsPostSale = true;
    }
    if(!this.isUpgradeChange && this.sharedSibling?.CojReviewBuyResponseDto?.IsDiscountCodeAvailableOnOriginalJourney){
      basketJourneyRequestDto.EvaluateCache = this.sharedSibling?.CojReviewBuyResponseDto?.COJData?.COJEvaluateCache;
      basketJourneyRequestDto.IsDiscountCodeAvailable = this.sharedSibling?.CojReviewBuyResponseDto?.IsDiscountCodeAvailable;
      basketJourneyRequestDto.IsDiscountCodeAvailableOnOriginalJourney = this.sharedSibling?.CojReviewBuyResponseDto?.IsDiscountCodeAvailableOnOriginalJourney;
    }
    this.reviewBuyService.getBasketJourney(basketJourneyRequestDto).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          let ResponseCode = +this.responseData.ResponseCode;
          if (ResponseCode === 200) {
            this.CojReviewBuyResponseDto = this.responseData.Data;
            this.bindJourneyData();
            this.sharedSibling.reviewBuyResponse.ReviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
            if (this.isUpgradeChange || localStorage.getItem("isCOJChange") == "true") {
              this.sharedSibling.postSaleReviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
            } else {
              this.sharedSibling.reviewBuyCache = this.CojReviewBuyResponseDto.ReviewBuyCache;
            }
          }
        }
    });
  }

  formattedSeatType(SeatTypes: string) {
    let seatTypeString= "";
    if(SeatTypes) {
      seatTypeString = ", ";
      SeatTypes.split(",").forEach(seatType => {
        seatTypeString+= (seatType.match(/[A-Z][a-z]+/g).join(" ")+", ");
       });
      seatTypeString= seatTypeString.slice(0,-2);
    }
    return seatTypeString;
  }
  
  formattedSeat( SeatFacing: string, SeatPosition: string) {
    let seatString= "";
    
    if(SeatFacing && SeatFacing!=="-" && SeatFacing!=="") {
      seatString+= SeatFacing.match(/[A-Z][a-z]+/g).join(" ") + ', ';
    }
    if(SeatPosition && SeatPosition!=="-" && SeatPosition!=="") {
      seatString+= SeatPosition.match(/[A-Z][a-z]+/g).join(" ");
    }
    return seatString;
  }

  getUpgradeSessionDataOnRefresh() {
    let sharedSiblingRefresh = this.storageDataService.getSessionStorageData("sharedSibling", true);
    if (sharedSiblingRefresh) {
          this.sharedSibling.upgradeSearchRequest = sharedSiblingRefresh.upgradeSearchRequest;
          this.sharedSibling.journey = sharedSiblingRefresh.journey;
          this.sharedSibling.upgradeReviewBuyRequest = sharedSiblingRefresh.upgradeReviewBuyRequest;
          //Set shared cache data
          this.sharedSibling.setSharedCache();
          this.storageDataService.clearSessionStorageData("sharedSibling");
          this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
    }
  }

  closeDiscountCodeMessageInMobile(){
    this.showDiscountCodeMessage = !this.showDiscountCodeMessage;
  }

  conditionToCheckCojReviewBuyResponseDto(){
    return !this.CojReviewBuyResponseDto?.Journey?.[0];
  }

  conditiontoCheckCojReviewBuyResponseDto(){
    return !this.CojReviewBuyResponseDto?.Journey?.length;
  }

  testData1 = {
    "Data": {
      "ReviewBuyCache": "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",
      "BasketCount": 1,
      "Journey": [
        {
          "Journey": "Journey 1",
          "JourneyType": "Return journey for 2 Adult",
          "GAJourneyType": null,
          "NectarCardNumber": null,
          "Departure": "Birmingham New Street (BHM)",
          "Arrival": "London Paddington (PAD)",
          "DepartureDate": "0001-01-01T00:00:00",
          "ArrivalDate": "0001-01-01T00:00:00",
          "ReturnDepartureDate": "0001-01-01T00:00:00",
          "ReturnArrivalDate": "0001-01-01T00:00:00",
          "CreationDate": "2021-08-27T12:14:18.1728921",
          "BookingDate": "0001-01-01T00:00:00",
          "SeasonDeatil": null,
          "OutwardDetail": {
            "TravelType": "Outward",
            "TravelDate": "Sat 25 Sep 15:10 (BHM)-17:04 (PAD)",
            "Changes": 1,
            "Duration": "1h 54m",
            "GADuration": null,
            "TicketType": "Advance Single Standard Premium",
            "TicketClass": "Standard Premium",
            "Price": 183.6,
            "CojPrice": 70.8,
            "Currency": "GBP",
            "Fares": [
              {
                "Price": 35.4,
                "Railcard": "No Railcard",
                "BasePrice": 35.4,
                "Currency": "GBP",
                "IsCheck": false,
                "FarePerson": "1 * Adult",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              },
              {
                "Price": 35.4,
                "Railcard": "No Railcard",
                "BasePrice": 35.4,
                "Currency": "GBP",
                "IsCheck": false,
                "FarePerson": "1 * Adult",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              }
            ],
            "Brand": null,
            "CallingPointName": null,
            "DepartureTime": "2021-09-25T15:10:00",
            "ArrivalTime": "2021-09-25T17:04:00",
            "TicketDescription": "AVANTI WEST COAST ONLY",
            "TicketRestriction": "<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
            "Operator": 1,
            "OperatorChange": 0,
            "SaleCompany": ""
          },
          "ReturnDetail": {
            "TravelType": "Return",
            "TravelDate": "Wed 6 Oct 18:52 (PAD)-20:45 (BHM)",
            "Changes": 1,
            "Duration": "1h 53m",
            "GADuration": null,
            "TicketType": "Advance Single",
            "TicketClass": "Standard",
            "Price": 0,
            "CojPrice": 112.8,
            "Currency": "GBP",
            "Fares": [
              {
                "Price": 56.4,
                "Railcard": "No Railcard",
                "BasePrice": 56.4,
                "Currency": "GBP",
                "IsCheck": false,
                "FarePerson": "1 * Adult",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              },
              {
                "Price": 56.4,
                "Railcard": "No Railcard",
                "BasePrice": 56.4,
                "Currency": "GBP",
                "IsCheck": false,
                "FarePerson": "1 * Adult",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              }
            ],
            "Brand": null,
            "CallingPointName": null,
            "DepartureTime": "2021-10-06T18:52:00",
            "ArrivalTime": "2021-10-06T20:45:00",
            "TicketDescription": "Avanti West Coast only",
            "TicketRestriction": "Not applicable.<br>",
            "Operator": 1,
            "OperatorChange": 0,
            "SaleCompany": ""
          },
          "OutwardSeat": [
            {
              "Departure": "Birmingham New Street (BHM)",
              "Arrival": "London Euston (EUS)",
              "Seat": [
                {
                  "TravelType": "Outward",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "H",
                  "Seat": "33",
                  "SeatFacing": "Forward",
                  "SeatPosition": "Window",
                  "SeatType": "TableSeat, PowerSocket",
                  "CoachType": "NoPreference"
                },
                {
                  "TravelType": "Outward",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "H",
                  "Seat": "30",
                  "SeatFacing": "Backward",
                  "SeatPosition": "Window",
                  "SeatType": "TableSeat, PowerSocket",
                  "CoachType": "NoPreference"
                }
              ],
              "IsSeatPicker": true,
              "DepartureLocation": 700010001,
              "ArrivalLocation": 700010000
            },
            {
              "Departure": "London Euston (EUS)",
              "Arrival": "London Paddington (PAD)",
              "Seat": [],
              "IsSeatPicker": false,
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700013073
            }
          ],
          "ReturnSeat": [
            {
              "Departure": "London Paddington (PAD)",
              "Arrival": "London Euston (EUS)",
              "Seat": [],
              "IsSeatPicker": false,
              "DepartureLocation": 700013073,
              "ArrivalLocation": 700010000
            },
            {
              "Departure": "London Euston (EUS)",
              "Arrival": "Birmingham New Street (BHM)",
              "Seat": [
                {
                  "TravelType": "Return",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "E",
                  "Seat": "49",
                  "SeatFacing": "Forward",
                  "SeatPosition": "Window",
                  "SeatType": "NearLuggageRack",
                  "CoachType": "NoPreference"
                },
                {
                  "TravelType": "Return",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "E",
                  "Seat": "50",
                  "SeatFacing": "Forward",
                  "SeatPosition": "Aisle",
                  "SeatType": "NearLuggageRack",
                  "CoachType": "NoPreference"
                }
              ],
              "IsSeatPicker": true,
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700010001
            }
          ],
          "OutwardJourneyExtras": [],
          "ReturnJourneyExtras": [],
          "DeliveryDetail": [
            {
              "DeliveryModeName": "TOD",
              "Price": 0,
              "Currency": "GBP",
              "FarePerson": "2 * Adult",
              "IsOrderSmartCard": false,
              "SmartCardNumber": null,
              "SmartCardList": null
            }
          ],
          "DiscountedPrice": 0,
          "DiscountPercent": null,
          "DiscountCode": "",
          "IsRailCardApplied": false,
          "DiscountCodeMessageRailCardApplied": "",
          "GACouponCode": null,
          "IsDiscountVisible": true,
          "Adult": 2,
          "Child": 0,
          "Brand": null,
          "CallingPointName": null,
          "IsPromo": false
        }
      ],
      "IsNreBasket": false,
      "IsBasketJourneyValid": true,
      "BasketJourneyMessage": "",
      "PromotionCode": "",
      "COJData": {
        "COJEvaluateCache": "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",
        "AdminFee": 0
      }
    },
    "ResponseMessage": "Success",
    "ResponseCode": 200,
    "Error": ""
  };
  testData2 = {
    "Data": {
      "ReviewBuyCache": "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",
      "BasketCount": 1,
      "Journey": [
        {
          "Journey": "Journey 1",
          "JourneyType": "Single journey for 1 Adult And 1 Child",
          "GAJourneyType": null,
          "NectarCardNumber": null,
          "Departure": "London Euston (EUS)",
          "Arrival": "Glasgow Central (GLC)",
          "DepartureDate": "0001-01-01T00:00:00",
          "ArrivalDate": "0001-01-01T00:00:00",
          "ReturnDepartureDate": "0001-01-01T00:00:00",
          "ReturnArrivalDate": "0001-01-01T00:00:00",
          "CreationDate": "2021-08-27T09:09:56.2003989",
          "BookingDate": "0001-01-01T00:00:00",
          "SeasonDeatil": null,
          "OutwardDetail": {
            "TravelType": "Outward",
            "TravelDate": "Thu 30 Sep 15:30 (EUS)-20:01 (GLC)",
            "Changes": 0,
            "Duration": "4h 31m",
            "GADuration": null,
            "TicketType": "Advance Single Standard Premium",
            "TicketClass": "Standard Premium",
            "Price": 115.8,
            "CojPrice": 115.8,
            "Currency": "GBP",
            "Fares": [
              {
                "Price": 77.2,
                "Railcard": "No Railcard",
                "BasePrice": 77.2,
                "Currency": "GBP",
                "IsCheck": false,
                "FarePerson": "1 * Adult",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              },
              {
                "Price": 38.6,
                "Railcard": "No Railcard",
                "BasePrice": 77.2,
                "Currency": "GBP",
                "IsCheck": true,
                "FarePerson": "1 * Child",
                "TicketDescription": null,
                "TicketRestriction": null,
                "TicketInformation": null,
                "TicketType": null,
                "OfferId": 0,
                "ServiceId": 0
              }
            ],
            "Brand": null,
            "CallingPointName": null,
            "DepartureTime": "2021-09-30T15:30:00",
            "ArrivalTime": "2021-09-30T20:01:00",
            "TicketDescription": "AVANTI WEST COAST ONLY",
            "TicketRestriction": "<p></p>\n<p class=\"tablepara\">Valid on Avanti West Coast (TOC Code: VT) services (and connecting services were applicable)</p>\n<p class=\"tablepara\">Seat reservations are compulsory<span class=\"change\">.</span></p>\n<p></p>",
            "Operator": 1,
            "OperatorChange": 0,
            "SaleCompany": ""
          },
          "ReturnDetail": null,
          "OutwardSeat": [
            {
              "Departure": "London Euston (EUS)",
              "Arrival": "Glasgow Central (GLC)",
              "Seat": [
                {
                  "TravelType": "Outward",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "H",
                  "Seat": "33",
                  "SeatFacing": "Backward",
                  "SeatPosition": "Window",
                  "SeatType": "PowerSocket, TableSeat",
                  "CoachType": "NoPreference"
                },
                {
                  "TravelType": "Outward",
                  "ReservationType": "MANDATORY",
                  "CoachNumber": "H",
                  "Seat": "30",
                  "SeatFacing": "Forward",
                  "SeatPosition": "Window",
                  "SeatType": "PowerSocket, TableSeat",
                  "CoachType": "NoPreference"
                }
              ],
              "IsSeatPicker": true,
              "DepartureLocation": 700010000,
              "ArrivalLocation": 700010012
            }
          ],
          "ReturnSeat": null,
          "OutwardJourneyExtras": [],
          "ReturnJourneyExtras": null,
          "DeliveryDetail": [
            {
              "DeliveryModeName": "TOD",
              "Price": 0,
              "Currency": "GBP",
              "FarePerson": "1 * Adult, 1 * Child",
              "IsOrderSmartCard": false,
              "SmartCardNumber": null,
              "SmartCardList": null
            }
          ],
          "DiscountedPrice": 0,
          "DiscountPercent": null,
          "DiscountCode": "",
          "IsRailCardApplied": false,
          "DiscountCodeMessageRailCardApplied": "",
          "GACouponCode": null,
          "IsDiscountVisible": true,
          "Adult": 1,
          "Child": 1,
          "Brand": null,
          "CallingPointName": null,
          "IsPromo": false
        }
      ],
      "IsNreBasket": false,
      "IsBasketJourneyValid": true,
      "BasketJourneyMessage": "",
      "PromotionCode": "",
      "COJData": {
        "COJEvaluateCache": "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",
        "AdminFee": 0
      }
    },
    "ResponseMessage": "Success",
    "ResponseCode": 200,
    "Error": ""
  }

}
