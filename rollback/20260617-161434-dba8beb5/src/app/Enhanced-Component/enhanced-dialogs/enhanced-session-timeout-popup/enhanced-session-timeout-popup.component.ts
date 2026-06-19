import { Component, OnInit, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RailCardModel } from 'src/app/models/mixing-deck/railcard.model';
import { SearchRequestModel } from 'src/app/models/mixing-deck/search-request.model';
import { CommonServices } from 'src/app/services/common.service';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { ApiRouteService } from 'src/app/utility/api-reference.service';
import { AppRouteEnum, SessionTimeOutEnum } from 'src/app/utility/app-constants.service';
import { HttpClientService } from 'src/app/utility/http-client.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-enhanced-session-timeout-popup',
    templateUrl: './enhanced-session-timeout-popup.component.html',
    styleUrls: ['./enhanced-session-timeout-popup.component.css'],
    standalone: false
})
export class EnhancedSessionTimeoutPopupComponent implements OnInit {
  headerTitle: string;
  timeCounter: string;
  sharedService: SharedService;
  appRouteEnum: AppRouteEnum;
  commonServices: CommonServices;
  httpClientService: HttpClientService;

  searchRequest: SearchRequestModel;
  sharedSibling: SharedService;
  customerServiceService: CustomerServiceService;
  sessionTimeOutEnum: SessionTimeOutEnum;
  
  constructor(private readonly injector: Injector, @Inject(MAT_DIALOG_DATA) public data: any, private readonly router: Router, public dialogRef: MatDialogRef<EnhancedSessionTimeoutPopupComponent>, private readonly apiPath: ApiRouteService) {
    this.headerTitle = this.data.headerTitle;

    this.sharedService = this.injector.get(SharedService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonServices = this.injector.get(CommonServices);
    this.httpClientService = this.injector.get(HttpClientService);

    this.searchRequest = new SearchRequestModel();
    this.searchRequest.RailCardList = new Array<RailCardModel>();
    this.sharedSibling = this.injector.get(SharedService);
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.sessionTimeOutEnum = this.injector.get(SessionTimeOutEnum);
    this.searchRequest = this.sharedSibling.searchRequest;
  }

  ngOnInit(): void {
    this.sharedService.getTimeCount().subscribe(res => {
      this.timeCounter = res;
    });
  }

  extendSession() {
    let loginResStr = localStorage.getItem('customerLoginResponse');
    if (loginResStr && (localStorage.getItem('CustomerKey') && localStorage.getItem('Email'))) {
      let loginResObj = JSON.parse(loginResStr);
      if (loginResObj?.Expiration) {
        let currentUkTime = new Date((new Date()).toLocaleString('en-US', { timeZone: 'Europe/London' }));
        let tokenExpiryTime = new Date(loginResObj.Expiration);
        if (tokenExpiryTime > currentUkTime) {
          this.commonServices.loaderRequired = false;
          this.commonServices.callRefreshTokenApiForExtendSession();
        } else {
          this.customerServiceService.logout('');
          this.commonServices.removeSessionStorage();
          this.dialogRef.close({ isTimeOut: true });
        }
      } else {
        this.customerServiceService.logout('');
        this.commonServices.removeSessionStorage();
        this.dialogRef.close({ isTimeOut: true });
      }
    } else {
      this.customerServiceService.logout('');
      this.commonServices.removeSessionStorage();
      this.dialogRef.close({ isTimeOut: true });
    }
    this.sharedService.isExtendMySessionBtnClickedOrNot.next(true);
  }

  backTohomePage() {
    let loginResStr = localStorage.getItem('customerLoginResponse');
    if (loginResStr && (localStorage.getItem('CustomerKey') && localStorage.getItem('Email'))) {
      let loginResObj = JSON.parse(loginResStr);
      if (loginResObj?.Expiration) {
        let currentUkTime = new Date((new Date()).toLocaleString('en-US', { timeZone: 'Europe/London' }));
        let tokenExpiryTime = new Date(loginResObj.Expiration);
        if (tokenExpiryTime > currentUkTime) {
          this.commonServices.callRefreshTokenApiForExtendSession();
        } else {
          this.customerServiceService.logout('');
          this.commonServices.removeSessionStorage();
        }
      } else {
        this.customerServiceService.logout('');
        this.commonServices.removeSessionStorage();
      }
    } else {
      this.customerServiceService.logout('');
      this.commonServices.removeSessionStorage();
    }
    this.dialogRef.close();
    this.sharedService.isExtendMySessionBtnClickedOrNot.next(true);
    window.location.href = environment.qttUrl;
  }

  goToSignIn(){
    this.dialogRef.close();
    this.sharedService.isExtendMySessionBtnClickedOrNot.next(true);
    this.router.navigateByUrl(this.appRouteEnum.Login);
  }
}
