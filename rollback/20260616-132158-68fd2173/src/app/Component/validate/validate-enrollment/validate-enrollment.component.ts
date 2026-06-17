import { Component, Injector, OnInit } from '@angular/core';
import { ValidatePaymentRequest } from 'src/app/models/payment-details/validate-payment-request.model';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { CompleteOrderService } from 'src/app/services/complete-order.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { AppRouteEnum, LocalStorageKeyEnum } from 'src/app/utility/app-constants.service';
import { browserRefresh } from 'src/app/app-component/app.component';
import { PaymentResponse } from 'src/app/models/payment-details/payment-response.model';
import { InfoPopupComponent } from '../../mixing-deck/info-popup/info-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-validate-enrollment',
  templateUrl: './validate-enrollment.component.html',
  styleUrls: ['./validate-enrollment.component.css']
})
export class ValidateEnrollmentComponent implements OnInit {

  sharedServices: SharedService;
  completeOrderService: CompleteOrderService;
  router: Router;
  public spinnerService: NgxSpinnerService;
  storageDataService: StorageDataService;
  sharedServiceCache: SharedServiceCache;
  appRouteEnum: AppRouteEnum;
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
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }

  validatePaymentRequest: ValidatePaymentRequest;
  validateResponse: PaymentResponse;
  responseData: ResponseData;
  browserRefresh: boolean;

  ngOnInit() {
    this.browserRefresh = browserRefresh;
    //Get shared cache data
    if (this.browserRefresh) {
      let sharedSiblingRefresh = this.storageDataService.getStorageData("sharedSibling", true);
      if (sharedSiblingRefresh != null && sharedSiblingRefresh != undefined) {
        this.sharedServices.reviewBuyResponse = sharedSiblingRefresh.reviewBuyResponse;
        if (sharedSiblingRefresh.reviewBuyResponse != null && sharedSiblingRefresh.reviewBuyResponse != undefined) {
          this.sharedServices.reviewBuyCache = sharedSiblingRefresh.reviewBuyResponse.ReviewBuyCache;
        }
        this.sharedServices.searchRequest = sharedSiblingRefresh.searchRequest;
        this.sharedServices.fareBreakdownModelData = sharedSiblingRefresh.fareBreakdownModelData;
        //Set shared cache data
        this.sharedServices.setSharedCache();
        this.storageDataService.clearStorageData("sharedSibling");
        this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
        //Set shared cache data
      }
    }
    this.validatePaymentRequest = new ValidatePaymentRequest;
    this.validatePaymentRequest.CustomerKey = localStorage.getItem('CustomerKey');
    this.validatePaymentRequest.Email = localStorage.getItem('Email');
    if (localStorage.getItem('IsSeason')) {
      this.validatePaymentRequest.IsSeason = true;
    }
    let isChangeReplace = JSON.parse(localStorage.getItem('isChangeReplace'));
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
    this.router.navigate([`./` + this.appRouteEnum.Payment]).then(() => {
      this.dialog.open(InfoPopupComponent, {
        width: '500px',
        disableClose: false,
        data: {
          Message: this.validateResponse.StatusMessage
        }
      });
    });
  }

  callValidateEnrollment() {
    this.completeOrderService.validateEnrollment(this.validatePaymentRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.validateResponse = this.responseData.Data;
            localStorage.setItem(this.localStorageKeyEnum.prepareOrderId, String(this.validateResponse?.OrderId));
            if ((this.validateResponse.Status == environment.cancelPaymentStatus) || (this.validateResponse.Status == environment.cardExistStatus)) {
              this.sharedServices.getBasketCount.emit(this.sharedServices.reviewBuyResponse.BasketCount);
              this.openInfoPopup();
            }
            else {
              if (this.validateResponse.AuthorizationUrl) {
                window.location.href = this.validateResponse.AuthorizationUrl;
              }
              else {
                this.router.navigate([`./` + this.appRouteEnum.ValidatePaymentDo]);
              }
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    );
  }

  callSmartCardValidateEnrollment() {
    this.completeOrderService.validateSmartCardEnrollment(this.validatePaymentRequest).subscribe(
      res => {
        if (res != null) {
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
                this.router.navigate([`./` + this.appRouteEnum.ValidatePaymentDo]);
              }
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      }
    );
  }
}
