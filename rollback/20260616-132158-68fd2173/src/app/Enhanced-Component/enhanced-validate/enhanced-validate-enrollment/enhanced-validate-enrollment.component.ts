import { Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { browserRefresh } from 'src/app/app-component/app.component';
import { InfoPopupComponent } from 'src/app/Component/mixing-deck/info-popup/info-popup.component';
import { ResponseData } from 'src/app/models/common/response.model';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { AppRouteEnum, EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedLocalOrSessionStorageKeysEnum, EnhancedPaymentPageMessageEnum, LocalStorageKeyEnum, EnhancedLoaderTextEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';
import { PaymentResponse } from 'src/app/models/payment-details/payment-response.model';
import { EnhancedCompleteOrderService } from 'src/app/services/enhanced-complete-order.service';
import { CommonServices } from 'src/app/services/common.service';
import { EnhancedValidatePaymentRequest } from 'src/app/models/enhanced-payment-details/enhanced-validate-payment-request.model';
import { EnhancedCommonErrorPopupComponent } from '../../enhanced-dialogs/enhanced-common-error-popup/enhanced-common-error-popup.component';

@Component({
  selector: 'app-enhanced-validate-enrollment',
  templateUrl: './enhanced-validate-enrollment.component.html',
  styleUrls: ['./enhanced-validate-enrollment.component.css']
})
export class EnhancedValidateEnrollmentComponent {
   browserRefresh: boolean;
   storageDataService: StorageDataService;
   sharedServices: SharedService;
   sharedServiceCache: SharedServiceCache;
   enhancedValidatePaymentRequest: EnhancedValidatePaymentRequest;
   router: Router;
   appRouteEnum: AppRouteEnum;
   completeOrderService: CompleteOrderService;
   responseData: ResponseData;
   localStorageKeyEnum: LocalStorageKeyEnum;
   validateResponse: PaymentResponse;
   enhancedCompleteOrderService: EnhancedCompleteOrderService;
   enhancedLocalOrSessionStorageKeyEnum: EnhancedLocalOrSessionStorageKeysEnum;
   commonService: CommonServices;
   enhancedAppRouteEnum: EnhancedAppRouteEnum;
   enhancedLoaderTextEnum: EnhancedLoaderTextEnum;
   isLoaderActive : boolean = false;
   enhancedDynamicClassesNameEnum: EnhancedDynamicClassesNameEnum;
   enhancedPaymentPageMessageEnum: EnhancedPaymentPageMessageEnum;
   
   constructor(private readonly injector: Injector, private readonly dialog: MatDialog) {
     this.storageDataService = this.injector.get(StorageDataService);
     this.sharedServices = this.injector.get(SharedService);
     this.sharedServiceCache = this.injector.get(SharedServiceCache);
     this.router = this.injector.get(Router);
     this.appRouteEnum = this.injector.get(AppRouteEnum);
     this.completeOrderService = this.injector.get(CompleteOrderService);
     this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
     this.enhancedCompleteOrderService = this.injector.get(EnhancedCompleteOrderService);
     this.enhancedLocalOrSessionStorageKeyEnum = this.injector.get(EnhancedLocalOrSessionStorageKeysEnum);
     this.commonService = this.injector.get(CommonServices);
     this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
     this.enhancedLoaderTextEnum = this.injector.get(EnhancedLoaderTextEnum);
     this.enhancedDynamicClassesNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
     this.enhancedPaymentPageMessageEnum = this.injector.get(EnhancedPaymentPageMessageEnum);
    }

  ngOnInit() {
    this.browserRefresh = browserRefresh;
        //Get shared cache data
        if (this.browserRefresh) {
          let sharedSiblingRefresh = this.storageDataService.getStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, true);
          if (sharedSiblingRefresh) {
            this.sharedServices.enhancedReviewBuyResponse = sharedSiblingRefresh.enhancedReviewBuyResponse;
            if (sharedSiblingRefresh?.enhancedReviewBuyResponse) {
              this.sharedServices.reviewBuyCache = sharedSiblingRefresh.enhancedReviewBuyResponse.ReviewBuyCache;
            }
            this.sharedServices.searchRequest = sharedSiblingRefresh.searchRequest;
            this.sharedServices.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
            //Set shared cache data
            this.sharedServices.setSharedCache();
            this.storageDataService.clearStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling);
            this.storageDataService.setStorageData(this.enhancedLocalOrSessionStorageKeyEnum?.sharedSibling, this.sharedServiceCache, true);
            //Set shared cache data
          }
        }
        this.enhancedValidatePaymentRequest = new EnhancedValidatePaymentRequest;
        this.enhancedValidatePaymentRequest.CustomerKey = localStorage.getItem(this.localStorageKeyEnum.customerKey);
        this.enhancedValidatePaymentRequest.Email = localStorage.getItem(this.localStorageKeyEnum.email);
        if (localStorage.getItem('IsSeason')) {
         this.enhancedValidatePaymentRequest.IsSeason = true;
        }
        let isChangeReplace = JSON.parse(localStorage.getItem(this.localStorageKeyEnum.isChangeReplace));
        if(isChangeReplace){
         this.callSmartCardValidateEnrollment();
        }
        else {
         this.callValidateEnrollment();
        }
  }

  RefreshParent() {
    if (window.opener != null && !window.opener.closed) {
      window.opener.location.reload();
    }
  }

  openInfoPopup(){
      this.router.navigate([`./` + this.enhancedAppRouteEnum.payment]).then(() => {
        this.dialog.open(EnhancedCommonErrorPopupComponent, {
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassesNameEnum?.enhancedFooterAlertCommonPanelClass,
            this.enhancedDynamicClassesNameEnum?.enhancedRailcardNotAppliedPanelClass,
          ],
          width: "45rem",
          autoFocus: false,
          data: {
            Message: this.validateResponse?.StatusMessage,
            headerTitle: `${this.enhancedPaymentPageMessageEnum?.cardAlreadyExistTitle}`,
            isCardAlreadyExist: true
          },
        });
      });
    }

  callValidateEnrollment() {
      this.isLoaderActive = true;
      this.enhancedCompleteOrderService.enhancedValidateEnrollment(this.enhancedValidatePaymentRequest).subscribe(
        res => {
          if (res != null) {
            this.isLoaderActive = false;
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.validateResponse = this.responseData.Data;
              localStorage.setItem(this.localStorageKeyEnum.prepareOrderId, String(this.validateResponse?.OrderId));
              if ((this.validateResponse.Status == environment.cancelPaymentStatus) || (this.validateResponse.Status == environment.cardExistStatus)) {
                this.sharedServices.getBasketCount.emit(this.sharedServices?.enhancedReviewBuyResponse?.BasketCount);
                this.openInfoPopup();
              }
              else {
                if (this.validateResponse.AuthorizationUrl) {
                  window.location.href = this.validateResponse.AuthorizationUrl;
                }
                else {
                  this.router.navigate([`./` + this.enhancedAppRouteEnum.enhancedValidatePaymentDo]);
                }
              }
            }
            else {
              console.log(this.responseData.ResponseMessage);
              this.commonService.showEnhancedCommonErrorPopup();
            }
          }
        }
      );
    }
  
    callSmartCardValidateEnrollment() {
      this.isLoaderActive = true;
      this.enhancedCompleteOrderService.validateSmartCardEnrollment(this.enhancedValidatePaymentRequest).subscribe(
        res => {
          if (res != null) {
            this.isLoaderActive = false;
            this.responseData = res as ResponseData;
            if (this.responseData.ResponseCode == '200') {
              this.validateResponse = this.responseData.Data;
              if ((this.validateResponse.Status == environment.cancelPaymentStatus) || (this.validateResponse.Status == environment.cardExistStatus)) {
                this.openInfoPopup();
              }
              else {
                if (this.validateResponse.AuthorizationUrl) {
                  window.location.href = this.validateResponse.AuthorizationUrl;
                }
                else {
                  this.router.navigate([`./` + this.enhancedAppRouteEnum.enhancedValidatePaymentDo]);
                }
              }
            }
            else {
              console.log(this.responseData.ResponseMessage);
              this.commonService.showEnhancedCommonErrorPopup();
            }
          }
        }
      );
    }
}
