import { Component, Injector, OnInit } from '@angular/core';
import { ValidatePaymentRequest } from 'src/app/models/payment-details/validate-payment-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { Router } from '@angular/router';
import { ValidatePaymentResponse, SmartCardValidateResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import { NgxSpinnerService } from 'ngx-spinner';
import { browserRefresh } from '../../app-component/app.component';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { AppRouteEnum, LocalStorageKeyEnum } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { InfoPopupComponent } from '../mixing-deck/info-popup/info-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { CommonServices } from '../../services/common.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';

@Component({
    selector: 'app-validate',
    templateUrl: './validate.component.html',
    styleUrls: ['./validate.component.css'],
    standalone: false
})
export class ValidateComponent implements OnInit {

  sharedServices: SharedService;
  completeOrderService: CompleteOrderService;
  router: Router;
  spinnerService: NgxSpinnerService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
  notificationService: NotificationService;
  commonService: CommonServices;
  ga4dataLayerService: GA4DatalayerService;
  localStorageKeyEnum: LocalStorageKeyEnum;

  constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.sharedServices = this.injector.get(SharedService);
    this.completeOrderService = this.injector.get(CompleteOrderService);
    this.router = this.injector.get(Router);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.notificationService = this.injector.get(NotificationService);
    this.commonService = this.injector.get(CommonServices);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);

    this.commonService.loadGTMDataLayerAllPages();
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    }

  validatePaymentRequest: ValidatePaymentRequest;
  validatePaymentResponse: ValidatePaymentResponse;
  responseData: ResponseData;
  browserRefresh: boolean;
  smartCardValidateResponse: SmartCardValidateResponse;
  isUpgradeChange: boolean = false;
  voidPaymentErrorMessageFromApi = 'Error in completeOrder';
  voidPaymentErrorMessageToShow = `Sorry we are unable to complete your purchase at this time. Please try again in 24 hours or for <a href="https://www.avantiwestcoast.co.uk/payment-error" target="_blank" class="text-spark-dark payment-sorry-popup-link">more information</a>.`;

  ngOnInit() {    
    let isChangeReplace = JSON.parse(localStorage.getItem('isChangeReplace'));
    let isCOJChange =  JSON.parse(localStorage.getItem("isCOJChange"));
    // PICO-2010 - Page_meta_data Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.isUpgradeChange = this.storageDataService.getSessionStorageData("isUpgradeChange",true);
    this.browserRefresh = browserRefresh;
    //Get shared cache data
    if (this.browserRefresh) {
      let sharedSiblingRefresh = null;
      sharedSiblingRefresh = this.setSharedSiblingRefreshOnInit();

      if (sharedSiblingRefresh) {
        this.sharedServices.ReservationCache = sharedSiblingRefresh.ReservationCache;
        this.sharedServices.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        this.setReviewByCacheOfSharedService(sharedSiblingRefresh, isCOJChange);
        this.sharedServices.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedServices.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        this.sharedServices.totalPriceToPayReviewBuy = sharedSiblingRefresh.totalPriceToPayReviewBuy;
        this.sharedServices.journey = sharedSiblingRefresh.journey;
        this.sharedServices.CojSearchRequest = sharedSiblingRefresh.CojSearchRequest;
        this.sharedServices.COJjourneySummaryModel = sharedSiblingRefresh.COJjourneySummaryModel;
        this.sharedServices.journeySummaryModel = sharedSiblingRefresh.journeySummaryModel;
        this.sharedServices.CojReviewBuyRequest = sharedSiblingRefresh.CojReviewBuyRequest;
        this.sharedServices.selectedJourneyDataForQuickBuyOrContiue = sharedSiblingRefresh?.selectedJourneyDataForQuickBuyOrContiue;

        if(this.isUpgradeChange === true) {
          this.sharedServices.upgradeSearchRequest = sharedSiblingRefresh.upgradeSearchRequest;
          this.sharedServices.upgradeReviewBuyRequest = sharedSiblingRefresh.upgradeReviewBuyRequest;
        }
         //Set shared cache data
         this.sharedServices.setSharedCache();
         this.storageDataService.clearSessionStorageData("sharedSibling");
         this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
         //Set shared cache data
      }
    }
    this.validatePaymentRequest = new ValidatePaymentRequest;
    this.validatePaymentRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.validatePaymentRequest.Email = localStorage.getItem('Email');
    this.validatePaymentRequest.OrderId = Number(localStorage.getItem(this.localStorageKeyEnum.prepareOrderId));
    this.setIsSeasonTrueForValidatePaymentRequest();
    this.callCompleteOrderMethodBasedOnChangeReplace(isChangeReplace, isCOJChange);
  }

  RefreshParent() {
    if (window.opener != null && !window.opener.closed) {
      window.opener.location.reload();
    }
  }

  getSmartcardCompleteOrder(){
   this.commonService.loaderRequired = true;
    this.completeOrderService.getSmartCardCompleteOrderResponse(this.validatePaymentRequest).subscribe(
      res => {
        this.sharedServices.isSearchResultPage = false;
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
           this.smartCardValidateResponse = this.responseData.Data;
           if ((this.smartCardValidateResponse.PaymentStatus == environment.cancelPaymentStatus) || (this.smartCardValidateResponse.PaymentStatus == environment.cardExistStatus)) {
           
            this.router.navigate([`./` + this.appRouteEnum.Payment]).then(() => {
              this.dialog.open(InfoPopupComponent, {
                width: '500px',
                disableClose: false,
                data: {
                  Message: this.smartCardValidateResponse.StatusMessage
                }
              });
            });
          }
          else {
           
            this.sharedServices.showSmartcardMessage = true;
            localStorage.removeItem("isChangeReplace");
            this.router.navigateByUrl('/' + this.appRouteEnum.PaymentsAndVouchers);
          }
          }
          else {
           this.commonService.loaderRequired = true;
            this.router.navigate([`./` + this.appRouteEnum.Payment]).then(() => {
              this.notificationService.error(this.responseData.ResponseMessage);
            });
          }
        }
      }
    );
  }

  getPaymentUrl(isCOJChange){
    if(isCOJChange) return this.appRouteEnum.CojPayment;
    if(this.isUpgradeChange === true) return this.appRouteEnum.upgradePayment;
    return this.appRouteEnum.Payment;
  }

  getCompleteOrder(isCOJChange) {
    this.commonService.loaderRequired = true;
    let isCoj = isCOJChange ? true : false;
    let paymentUrl = this.getPaymentUrl(isCOJChange);    
    let isPostSale = (isCoj || this.isUpgradeChange === true) ? true : false;
    this.completeOrderService.getCompleteOrderResponse(this.validatePaymentRequest, isPostSale).subscribe(
      res => {
        this.sharedServices.isSearchResultPage = false;
        localStorage.removeItem(this.localStorageKeyEnum.prepareOrderId);
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.validatePaymentResponse = this.responseData.Data;
            if ((this.validatePaymentResponse.PaymentStatus == environment.cancelPaymentStatus) || (this.validatePaymentResponse.PaymentStatus == environment.cardExistStatus)) {
              this.checkPaymentStatus(isCoj, paymentUrl);
            }
            else {
              this.setCompleteOrderData(isCoj);
            }
          }
          else {
            this.errorCompleteOrder(isCoj, paymentUrl);
          }
        }
      }
    );
  }

  checkPaymentStatus(isCoj, paymentUrl) {
    if (isCoj === false && this.isUpgradeChange !== true) {
      this.sharedServices.getBasketCount.emit(this.sharedServices.reviewBuyResponse.BasketCount);
      this.commonService.loaderRequired = true;
    }
    else {
      this.commonService.loaderRequired = false;
    }
    this.router.navigate([`./` + paymentUrl]).then(() => {
      if (this.isUpgradeChange === true) {
        this.storageDataService.setSessionStorageData('isErrorComingFromUpgradeChange', true, true);
      } else {
        this.dialog.open(InfoPopupComponent, {
          width: '500px',
          disableClose: false,
          data: {
            Message: this.validatePaymentResponse.StatusMessage
          }
        });
      }
    });
  }

  errorCompleteOrder(isCoj, paymentUrl) {
    if (isCoj === false && this.isUpgradeChange !== true) {
      this.sharedServices.getBasketCount.emit(this.sharedServices.reviewBuyResponse.BasketCount);
      this.commonService.loaderRequired = true;
    }
    else {
      this.commonService.loaderRequired = false;
    }
    this.router.navigate([`./` + paymentUrl]).then(() => {
      if (Number(this.responseData.ResponseCode) === 501 && this.responseData.ResponseMessage && this.responseData.ResponseMessage.toLowerCase() === this.voidPaymentErrorMessageFromApi.toLowerCase()) {
        this.dialog.open(InfoPopupComponent, {
          width: '500px',
          disableClose: false,
          data: {
            Message: this.voidPaymentErrorMessageToShow
          }
        });
      } else {
        this.notificationService.error(this.responseData.ResponseMessage);
      }
    });
  }

  setCompleteOrderData(isCoj) {
    this.sharedServices.validatePaymentResponse = this.validatePaymentResponse;
    this.storageDataService.clearStorageData("isRedirectFromValidateDo");
    this.storageDataService.setStorageData("isRedirectFromValidateDo", true, true);
    localStorage.setItem('validatePaymentResponse', JSON.stringify(this.validatePaymentResponse));
    if (isCoj) {
      this.commonService.loaderRequired = true;
      this.sharedServices.reviewBuyCache = "";
      this.sharedServices.reviewBuyResponse = null;
      //Set shared cache data
      this.sharedServices.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isCoj: true } });
    } else if (this.isUpgradeChange === true) {
      this.commonService.loaderRequired = true;
      this.sharedServices.reviewBuyCache = "";
      this.sharedServices.reviewBuyResponse = null;
      this.storageDataService.setSessionStorageData('validatePaymentResponse', this.validatePaymentResponse, true);
      //Set shared cache data
      this.sharedServices.setSharedCache();
      this.storageDataService.clearSessionStorageData("sharedSibling");
      this.storageDataService.setSessionStorageData("sharedSibling", this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isUpgrade: true } });
    }
    else {
      this.router.navigate([`./` + this.appRouteEnum.Confirmation]);
    }
  }

  callCompleteOrderMethodBasedOnChangeReplace(isChangeReplace,isCOJChange){
    if(isChangeReplace){
      this.getSmartcardCompleteOrder();
    }
    else {
    this.getCompleteOrder(isCOJChange);
    }
  }

  setIsSeasonTrueForValidatePaymentRequest(){
    if (localStorage.getItem('IsSeason')) {
      this.validatePaymentRequest.IsSeason = true;
    }
  }

  setReviewByCacheOfSharedService(sharedSiblingRefresh, isCOJChange){
    if (sharedSiblingRefresh.reviewBuyResponse) {
      if (isCOJChange || this.isUpgradeChange || sharedSiblingRefresh?.reviewBuyResponse?.IsRenewSmartcard) {
        this.sharedServices.postSaleReviewBuyCache = sharedSiblingRefresh.reviewBuyResponse.ReviewBuyCache;
      } else {
        this.sharedServices.reviewBuyCache = sharedSiblingRefresh.reviewBuyResponse.ReviewBuyCache;
      }
    }
  }

  setSharedSiblingRefreshOnInit(){
    let sharedSiblingRefresh = null;
    if(this.isUpgradeChange === true) {
      sharedSiblingRefresh = this.storageDataService.getSessionStorageData("sharedSibling", true);
    } else {
      sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
    }
    return sharedSiblingRefresh;
  }
}
