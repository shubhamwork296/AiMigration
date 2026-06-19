import { Injectable, Injector } from '@angular/core';
import { HttpClientService } from '../utility/http-client.service';
import { ApiRouteService } from '../utility/api-reference.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseData } from '../models/common/response.model';
import { CustomerLoginResponse } from '../models/customer/customer-login-response.model';
import { SharedService } from './shared-sibling.service';
import { StorageDataService } from './storage-data.service';
import { AppRouteEnum, LocalStorageKeyEnum } from '../utility/app-constants.service';
import { CommonServices } from './common.service';
import { EnhancedSearchResponseModel } from '../models/enhanced-mixing-deck/enhanced-search-response.model';
import { EnhancedSearchRequestModel } from '../models/enhanced-mixing-deck/enhanced-search-request.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerServiceService {
  customerEmail: string;
  customerPassword: string;
  isLoginFromJE: boolean;
  isLoginFromSeason: boolean;
  returnUrl: string;

  public currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private customerLoginResponse: CustomerLoginResponse;
  httpClientService: HttpClientService;
  apiPath: ApiRouteService;
  appRouteEnum: AppRouteEnum;
  sharedService: SharedService;
  storageDataService: StorageDataService;
  commonServices: CommonServices;
  localStorageKeyEnum: LocalStorageKeyEnum;
  isLoginFromEnhancedSelectTicketAndClass: boolean;
  nreJourneyExtrasResponse: any;
  travelSolution: any;
  cameFromFlexibleReturn: boolean;
  searchResponse: EnhancedSearchResponseModel;
  mixingDeckSearchRequest: EnhancedSearchRequestModel;

  constructor(private readonly injector: Injector) {
    this.currentUserSubject = new BehaviorSubject<any>(localStorage.getItem('CustomerKey'));
    this.currentUser = this.currentUserSubject.asObservable();
    // Dependency Injection without using constructor's param
    this.httpClientService = this.injector.get(HttpClientService);
    this.apiPath = this.injector.get(ApiRouteService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.sharedService = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.commonServices = this.injector.get(CommonServices);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  checkCustomerLogin(customerLoginRequest: any) {
    return this.httpClientService.HttpPostRequest(customerLoginRequest, this.apiPath.customerLogin)
      .pipe(map(user => {
        let responseData = user as ResponseData;
        if (responseData.ResponseCode == '200') {
          this.customerLoginResponse = responseData.Data;
          if (this.customerLoginResponse.IsAuthenticated) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem('SokenId', this.customerLoginResponse.SokenId);
            this.currentUserSubject.next(this.customerLoginResponse.CustomerDetail.CustomerKey);
          }
        }
        return user;
      }));
  }

  registerCustomer(customerRegisterRequest: any) {
    return this.httpClientService.HttpPostRequest(customerRegisterRequest, this.apiPath.registerCustomer);
  }

  resetPasswordCustomer(customerResetPasswordRequst: any) {
    return this.httpClientService.HttpPostRequest(customerResetPasswordRequst, this.apiPath.ressetPasswordCustomer);
  }
  sendEmailToResetPasswordCustomer(customerSendMailRequst: any) {
    return this.httpClientService.HttpPostRequest(customerSendMailRequst, this.apiPath.ressetPasswordEmailLinkCustomer);
  }

  logout(url: string) {
    // remove user from local storage to log user out
    this.sharedService.isLogin = false;
    this.sharedService.basketCount = 0;
    localStorage.removeItem('Email');
    localStorage.removeItem('OriginalEmail');
    localStorage.removeItem('CustomerKey');
    localStorage.removeItem('FirstName');
    localStorage.removeItem('LastName');
    localStorage.removeItem('myPreferencesResponse');
    localStorage.removeItem('SokenId');
    localStorage.removeItem('RememberMe');
    localStorage.removeItem('UserName');
    localStorage.removeItem('Title');
    localStorage.removeItem('UserNameRM');
    this.storageDataService.clearLocalStorageData("customerLoginResponse");
    this.sharedService.reviewBuyResponse = null; // Remove basket data
    this.sharedService.getBasketCount.emit(0); // Remove basket data
    this.sharedService.reviewBuyCache = "";
    localStorage.removeItem('paymentData');
    localStorage.removeItem('getDataFromNRE');
    if (url.includes(this.appRouteEnum.SeasonSolutions) || url.includes(this.appRouteEnum.MixingDeck) || url.includes(this.appRouteEnum.JourneyExtras))
      this.sharedService.clearSharedCache(url);
    else
      this.storageDataService.clearStorageData("sharedSibling");
    this.currentUserSubject.next(null);
  }

  logOutCustomer() {
    return this.httpClientService.HttpGetRequest(this.apiPath.CustomerLogOut);
  }

}
