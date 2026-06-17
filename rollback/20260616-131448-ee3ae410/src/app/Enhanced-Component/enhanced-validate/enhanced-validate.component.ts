import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { browserRefresh } from 'src/app/app-component/app.component';
import { InfoPopupComponent } from 'src/app/Component/mixing-deck/info-popup/info-popup.component';
import { ResponseData } from 'src/app/models/common/response.model';
import { EnhancedValidatePaymentRequest } from 'src/app/models/enhanced-payment-details/enhanced-validate-payment-request.model';
import { EnhancedValidatePaymentResponse } from 'src/app/models/enhanced-payment-details/enhanced-validate-payment-response.model';
import { SmartCardValidateResponse } from 'src/app/models/payment-details/validate-payment-response.model';
import { CommonServices } from 'src/app/services/common.service';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { EnhancedCompleteOrderService } from 'src/app/services/enhanced-complete-order.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { AppRouteEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedLoaderTextEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedPaymentPageMessageEnum, LocalStorageKeyEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';
import { EnhancedPaymentNotCompletedDialogComponent } from '../enhanced-dialogs/enhanced-payment-not-completed-dialog/enhanced-payment-not-completed-dialog.component';

@Component({
  selector: 'app-enhanced-validate',
  templateUrl: './enhanced-validate.component.html',
  styleUrls: ['./enhanced-validate.component.css']
})
export class EnhancedValidateComponent {
  isUpgradeChange: boolean = false;
  storageDataService: StorageDataService;
  browserRefresh: boolean;
  sharedServices: SharedService;
  sharedServiceCache: SharedServiceCache;
  enhancedValidatePaymentRequest: EnhancedValidatePaymentRequest;
  localStorageKeyEnum: LocalStorageKeyEnum;
  commonService: CommonServices;
  appRouteEnum: AppRouteEnum;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  responseData: ResponseData;
  completeOrderService: CompleteOrderService;
  enhancedValidatePaymentResponse: EnhancedValidatePaymentResponse;
  smartCardValidateResponse: SmartCardValidateResponse;
  router: Router;
  enhancedCompleteOrderService: EnhancedCompleteOrderService;
  voidPaymentErrorMessageFromApi = 'Error in completeOrder';
  voidPaymentErrorMessageToShow = `Sorry we are unable to complete your purchase at this time. Please try again in 24 hours or for <a href="https://www.avantiwestcoast.co.uk/payment-error" target="_blank" class="text-spark-dark payment-sorry-popup-link">more information</a>.`;
  enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
  enhancedPaymentPageMessageEnum: EnhancedPaymentPageMessageEnum;
  enhancedDynamicClassesNameEnum: EnhancedDynamicClassesNameEnum;
  isLoaderActive : boolean = false;
  enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
  constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {
    this.storageDataService = this.injector.get(StorageDataService);
    this.sharedServices = this.injector.get(SharedService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
     this.commonService = this.injector.get(CommonServices);
     this.appRouteEnum = this.injector.get(AppRouteEnum);
     this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
     this.completeOrderService = this.injector.get(CompleteOrderService);
     this.router = this.injector.get(Router);
     this.enhancedCompleteOrderService = this.injector.get(EnhancedCompleteOrderService);
     this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
     this.enhancedPaymentPageMessageEnum = this.injector.get(EnhancedPaymentPageMessageEnum);
     this.enhancedDynamicClassesNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
     this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
  }

  ngOnInit() {   
    let isChangeReplace = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.isChangeReplace));
    let isCOJChange =  JSON.parse(localStorage.getItem(this.enhancedLocalOrSessionStorageKeyEnum.isCOJChange));

    this.isUpgradeChange = this.storageDataService.getSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum.isUpgradeChange,true);
    this.browserRefresh = browserRefresh;

    //Get shared cache data
    if (this.browserRefresh) {
      let sharedSiblingRefresh = null;
      sharedSiblingRefresh = this.setSharedSiblingRefreshOnInit();

      if (sharedSiblingRefresh) {
        this.sharedServices.ReservationCache = sharedSiblingRefresh.ReservationCache;
        this.sharedServices.enhancedReviewBuyResponse = sharedSiblingRefresh.enhancedReviewBuyResponse;
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
         this.storageDataService.clearSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
         this.storageDataService.setSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
         //Set shared cache data
      }
    }
    this.enhancedValidatePaymentRequest = new EnhancedValidatePaymentRequest;
    this.enhancedValidatePaymentRequest.CustomerKey = localStorage.getItem(this.localStorageKeyEnum.customerKey);
    this.enhancedValidatePaymentRequest.Email = localStorage.getItem(this.localStorageKeyEnum.email);
    this.enhancedValidatePaymentRequest.OrderId = Number(localStorage.getItem(this.localStorageKeyEnum.prepareOrderId));
    this.setIsSeasonTrueForValidatePaymentRequest();
    this.callCompleteOrderMethodBasedOnChangeReplace(isChangeReplace, isCOJChange);
  }

  RefreshParent() {
    if (window.opener != null && !window.opener.closed) {
      window.opener.location.reload();
    }
  }

  setSharedSiblingRefreshOnInit(){
    let sharedSiblingRefresh = null;
    if(this.isUpgradeChange === true) {
      sharedSiblingRefresh = this.storageDataService.getSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, true);
    } else {
      sharedSiblingRefresh = this.storageDataService.getStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, true);
    }
    return sharedSiblingRefresh;
  }

   setReviewByCacheOfSharedService(sharedSiblingRefresh, isCOJChange){
    if (sharedSiblingRefresh?.enhancedReviewBuyResponse) {
      if (isCOJChange || this.isUpgradeChange || sharedSiblingRefresh?.enhancedReviewBuyResponse?.IsRenewSmartcard) {
        this.sharedServices.postSaleReviewBuyCache = sharedSiblingRefresh?.enhancedReviewBuyResponse?.ReviewBuyCache;
      } else {
        this.sharedServices.reviewBuyCache = sharedSiblingRefresh?.enhancedReviewBuyResponse?.ReviewBuyCache;
      }
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

  getCompleteOrder(isCOJChange) {
      this.commonService.loaderRequired = true;
      let isCoj = isCOJChange ? true : false;
      let paymentUrl = this.getPaymentUrl(isCOJChange);    
      let isPostSale = (isCoj || this.isUpgradeChange === true) ? true : false;
      this.isLoaderActive = true;
      this.enhancedCompleteOrderService.enhancedCompleteOrderResponse(this.enhancedValidatePaymentRequest, isPostSale).subscribe(
        res => {
          this.isLoaderActive = false;
          this.sharedServices.isSearchResultPage = false;
          localStorage.removeItem(this.localStorageKeyEnum.prepareOrderId);
          if (res != null) {
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.enhancedValidatePaymentResponse = this.responseData.Data;
              if ((this.enhancedValidatePaymentResponse.PaymentStatus == environment.cancelPaymentStatus) || (this.enhancedValidatePaymentResponse.PaymentStatus == environment.cardExistStatus)) {
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
        });
  }

   getPaymentUrl(isCOJChange){
    if(isCOJChange) return this.appRouteEnum.CojPayment;
    if(this.isUpgradeChange === true) return this.appRouteEnum.upgradePayment;
    return this.appRouteEnum.Payment;
  }

  setIsSeasonTrueForValidatePaymentRequest(){
    if (localStorage.getItem('IsSeason')) {
      this.enhancedValidatePaymentRequest.IsSeason = true;
    }
  }

   getSmartcardCompleteOrder(){
     this.commonService.loaderRequired = true;
      this.completeOrderService.getSmartCardCompleteOrderResponse(this.enhancedValidatePaymentRequest).subscribe(
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
              localStorage.removeItem(this.localStorageKeyEnum.isChangeReplace);
              this.router.navigateByUrl('/' + this.appRouteEnum.PaymentsAndVouchers);
            }
            }
            else {
             this.commonService.loaderRequired = true;
              this.router.navigate([`./` + this.appRouteEnum.Payment]).then(() => {
                this.commonService.showEnhancedCommonErrorPopup();
              });
            }
          }
        }
      );
    }

  checkPaymentStatus(isCoj, paymentUrl) {
      if (isCoj === false && this.isUpgradeChange !== true) {
        this.sharedServices.getBasketCount.emit(this.sharedServices?.enhancedReviewBuyResponse?.BasketCount);
        this.commonService.loaderRequired = true;
      }
      else {
        this.commonService.loaderRequired = false;
      }
      this.router.navigate([`./` + paymentUrl]).then(() => {
        if (this.isUpgradeChange === true) {
          this.storageDataService.setSessionStorageData('isErrorComingFromUpgradeChange', true, true);
        } else {
          this.dialog.open(EnhancedPaymentNotCompletedDialogComponent, {
            disableClose: true,
            panelClass: [
              this.enhancedDynamicClassesNameEnum?.enhancedLogoutPopup,
              this.enhancedDynamicClassesNameEnum?.enhancedLogoutStylePopup,
            ],
            width: '22.688rem',
            autoFocus: false,
            data: {
              Message: this.enhancedValidatePaymentResponse.StatusMessage,
              headerTitle: this.enhancedPaymentPageMessageEnum?.paymentErrorTitle,
            },
          });
        }
      });
  }

   setCompleteOrderData(isCoj) {
    this.sharedServices.enhancedValidatePaymentResponse = this.enhancedValidatePaymentResponse;
    this.storageDataService.clearStorageData("isRedirectFromValidateDo");
    this.storageDataService.setStorageData("isRedirectFromValidateDo", true, true);
    localStorage.setItem(this.localStorageKeyEnum?.validatePaymentResponseText, JSON.stringify(this.enhancedValidatePaymentResponse));
    if (isCoj) {
      this.commonService.loaderRequired = true;
      this.sharedServices.reviewBuyCache = "";
      this.sharedServices.reviewBuyResponse = null;
      //Set shared cache data
      this.sharedServices.setSharedCache();
      this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
      this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isCoj: true } });
    } else if (this.isUpgradeChange === true) {
      this.commonService.loaderRequired = true;
      this.sharedServices.reviewBuyCache = "";
      this.sharedServices.reviewBuyResponse = null;
      this.storageDataService.setSessionStorageData(this.localStorageKeyEnum?.validatePaymentResponseText, this.enhancedValidatePaymentResponse, true);
      //Set shared cache data
      this.sharedServices.setSharedCache();
      this.storageDataService.clearSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
      this.storageDataService.setSessionStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
      //Set shared cache data
      this.router.navigate([`./` + this.appRouteEnum.ViewBooking], { queryParams: { isUpgrade: true } });
    }
    else {
      this.router.navigate([`./` + this.appRouteEnum.Confirmation]);
    }
  }

  errorCompleteOrder(isCoj, paymentUrl) {
    if (isCoj === false && this.isUpgradeChange !== true) {
      this.sharedServices.getBasketCount.emit(this.sharedServices?.enhancedReviewBuyResponse?.BasketCount);
      this.commonService.loaderRequired = true;
    }
    else {
      this.commonService.loaderRequired = false;
    }
    this.router.navigate([`./` + paymentUrl]).then(() => {
      if (Number(this.responseData.ResponseCode) === 501 && this.responseData.ResponseMessage && this.responseData.ResponseMessage.toLowerCase() === this.voidPaymentErrorMessageFromApi.toLowerCase()) {
        this.commonService.showEnhancedCommonErrorPopup(true);
      } else {
        this.commonService.showEnhancedCommonErrorPopup();
      }
    });
  }

}
