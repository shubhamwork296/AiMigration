import { Component, EventEmitter, Inject, Injector, Input, OnInit, Output, ViewEncapsulation } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { NgxSpinnerService } from "ngx-spinner";
import { LoginPageComponent } from "src/app/Component/login-page/login-page.component";
import { GetPreferencesRequest, MyPreferencesResponse } from "src/app/models/account/my-preferences.model";
import { ResponseData } from "src/app/models/common/response.model";
import { CustomerLoginRequest } from "src/app/models/customer/customer-login-request.model";
import { CustomerLoginResponse } from "src/app/models/customer/customer-login-response.model";
import { CommonServices } from "src/app/services/common.service";
import { CustomerServiceService } from "src/app/services/customer-service.service";
import { MyAccountService } from "src/app/services/my-account.service";
import { SharedService } from "src/app/services/shared-sibling.service";
import { StorageDataService } from "src/app/services/storage-data.service";
import { AppRouteEnum, QuickBuyEnum, LocalStorageKeyEnum, EnhancedAppRouteEnum } from "src/app/utility/app-constants.service";
import { validateEmailRegex } from "src/app/utility/custom-validations/must-match-validation";
import { DataLayerService } from "src/app/utility/dataLayers/data-layer.service";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { MonetateService } from "src/app/utility/monetate/monetate.service";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { environment } from "src/environments/environment";

@Component({
    selector: 'app-login-popup',
    templateUrl: './enhanced-login-popup.component.html',
    styleUrls: ['./enhanced-login-popup.component.html']
})

export class EnhancedLoginPopupComponent implements OnInit{
    showBanner: boolean = false;
    
      notificationService: NotificationService;
      customerServiceService: CustomerServiceService;
      router: Router;
      sharedServices: SharedService;
      storageDataService: StorageDataService;
      myAccountService: MyAccountService;
      appRouteEnum: AppRouteEnum;
      spinnerService: NgxSpinnerService;
      commonService: CommonServices;
      dataLayerService: DataLayerService;
      ga4dataLayerService: GA4DatalayerService;
      passwordFieldTextType: boolean = false;
      capsLock: number;
      quickBuyEnum: QuickBuyEnum;
      localStorageKeyEnum: LocalStorageKeyEnum;
      enhancedAppRouteEnum: EnhancedAppRouteEnum;
      monetateService: MonetateService;
    
    
      constructor(@Inject(MAT_DIALOG_DATA) public data: any, private readonly injector: Injector, private readonly formbulider: FormBuilder, public dialogRef:MatDialogRef<LoginPageComponent> ) {
        // Dependency Injection without using constructor's param
        this.notificationService = this.injector.get(NotificationService);
        this.customerServiceService = this.injector.get(CustomerServiceService);
        this.router = this.injector.get(Router);
        this.sharedServices = this.injector.get(SharedService);
        this.storageDataService = this.injector.get(StorageDataService);
        this.myAccountService = this.injector.get(MyAccountService);
        this.appRouteEnum = this.injector.get(AppRouteEnum);
        this.spinnerService = this.injector.get(NgxSpinnerService);
        this.commonService = this.injector.get(CommonServices);
        this.dataLayerService = this.injector.get(DataLayerService);
        this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
        this.getPreferencesRequest = new GetPreferencesRequest();
        this.quickBuyEnum = this.injector.get(QuickBuyEnum);
        this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
        this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
        this.monetateService = this.injector.get(MonetateService);
      }
      customerLoginRequest: CustomerLoginRequest;
      responseData: ResponseData;
      customerLoginResponse: CustomerLoginResponse;
      invalidCredential: boolean = false;
      lockoutMessage: string;
      myPreferencesResponse: MyPreferencesResponse;
      getPreferencesRequest: GetPreferencesRequest;
      isSubmitted: boolean = false;
    
      ngOnInit() {
        this.sharedServices.capsLockOn.subscribe((res) => {
          if (res.id == 'lp-password-input' || res.id == 'lp-password-visible-hide-icon') {
            this.capsLock = res.value;
          } else {
            this.capsLock = 2;
          }
        });
        this.dataLayerService.loadGTMDataLayerOnPageUpdate();
        // page_meta_data -- Ga4-datalayer event
        this.ga4dataLayerService.loadGA4DataLayerAllPages(true, true);
        this.monetateService.setPageType();
        this.monetateService.flushEvents();
        if (localStorage.getItem('RememberMe') !== null) {
          this.form.get('username').setValue(localStorage.getItem('UserNameRM'));
          this.form.get('password').setValue('');
          this.form.get('rememberme').setValue(true);
        }
        else {
          this.form.reset();
        }
      }
    
      form: any = this.formbulider.group({
        username: ['', [Validators.required, Validators.maxLength(253)]],
        password: ['', [Validators.required]],
        rememberme: [''],
      },{
        validator: [validateEmailRegex('username')]
      });
    
    
      forgotPassword() {
        this.router.navigate(['./' + this.appRouteEnum.ForgotPassword]);
        this.dialogRef.close();
      }
    
      registerForm() {
        if (this.data != null) {
          this.customerServiceService.isLoginFromSeason = this.data.isLoginFromSeason;
          this.customerServiceService.isLoginFromJE = this.data.isLoginFromJE;
          this.customerServiceService.returnUrl = this.data.returnUrl;
          this.customerServiceService.isLoginFromEnhancedSelectTicketAndClass = this.data?.isLoginFromEnhancedSelectTicketAndClass;
          this.customerServiceService.nreJourneyExtrasResponse = this.data?.nreJourneyExtrasResponse;
          this.customerServiceService.travelSolution = this.data?.travelSolution;
          this.customerServiceService.cameFromFlexibleReturn = this.data?.cameFromFlexibleReturn;
          this.customerServiceService.searchResponse = this.data?.searchResponse;
          this.customerServiceService.mixingDeckSearchRequest = this.data?.mixingDeckSearchRequest;
        }
        this.router.navigate([`./` + this.appRouteEnum.Register]);
        this.dialogRef.close();
      }
    
      submit() {
        this.invalidCredential = false;
        this.form.patchValue({
          username : this.form?.value?.username?.trim()
        });
        if (this.form.valid) {
          this.submitEM.emit(this.form.value);
          let loginFormData = this.form.value;
          if (loginFormData.rememberme) {
            localStorage.setItem('UserNameRM', loginFormData.username);
            localStorage.setItem('RememberMe', 'true');
          }
          else {
            localStorage.removeItem('UserNameRM');
            localStorage.removeItem('RememberMe');
          }
          this.checkCustomerLogin(loginFormData);
        }
        else {
          this.isSubmitted = true;
          this.showBanner = true;
          this.ga4dataLayerService.loadGA4DataLayerForLoginFailure(this.form.get('username').value, this.form.get('password').value);
        }
      }
    
      @Input() error: string | null;
    
      @Output() submitEM = new EventEmitter();
    
      checkCustomerLogin(loginFormData: any) {
        this.commonService.loaderRequired = true;
        this.customerLoginRequest = new CustomerLoginRequest();
        this.customerLoginRequest.Password = loginFormData.password;
        this.customerLoginRequest.UserEmail = loginFormData.username;
        this.customerServiceService.checkCustomerLogin(this.customerLoginRequest).subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                this.customerLoginResponse = this.responseData.Data;
                if (this.customerLoginResponse.IsAuthenticated) {
                  this.invalidCredential = false;
                  this.showBanner = false;
                  localStorage.setItem('CustomerKey', this.customerLoginResponse.CustomerDetail.CustomerKey);
                  sessionStorage.setItem('CustomerKey', this.customerLoginResponse.CustomerDetail.CustomerKey);
                  this.setLoginData();
                }
                else {
                  this.invalidCredential = true;
                  this.showBanner = true;
                  this.spinnerService.hide();
                  this.lockoutMessage = this.responseData.Data.ResponseMessage;
                }
              }
              else {
                this.spinnerService.hide();
                this.notificationService.error(this.responseData.Data.ResponseMessage);
              }
            }
          });
      }
    
      setLoginData() {
        if (localStorage.getItem('CustomerKey')) {
          localStorage.setItem('Title', this.customerLoginResponse.CustomerDetail.Title);
          this.storageDataService.clearLocalStorageData("customerLoginResponse");
          this.storageDataService.setLocalStorageData("customerLoginResponse", this.customerLoginResponse, true);
          localStorage.setItem('Email', this.customerLoginResponse.CustomerDetail.Email);
          localStorage.setItem('OriginalEmail', this.customerLoginResponse.CustomerDetail.OriginalEmail);
          localStorage.setItem('FirstName', this.customerLoginResponse.CustomerDetail.FirstName);
          localStorage.setItem('LastName', this.customerLoginResponse.CustomerDetail.LastName);
          localStorage.setItem('UserName', this.customerLoginResponse.CustomerDetail.UserName);
          sessionStorage.setItem('Email', this.customerLoginResponse.CustomerDetail.Email);
          this.sharedServices.sendCustomerData(this.customerLoginResponse.CustomerDetail.FirstName, this.customerLoginResponse.CustomerDetail.LastName);
          this.ga4dataLayerService.loadGA4DataLayerForLoginSuccess();
          this.getMyPreferences(this.customerLoginResponse.CustomerDetail);
    
          if (this.router.url.includes(this.appRouteEnum.Reset) || this.router.url.includes(this.appRouteEnum.Login)
            || this.router.url.includes(this.appRouteEnum.ForgotPassword) || this.router.url.includes(this.appRouteEnum.Register)
          ) {
            window.location.href = environment.qttUrl;
          }
          else if (this.data.returnUrl) {
            this.dialogRef.close();
            return;
          }
        }
        else {
          this.invalidCredential = true;
          this.showBanner = true;
          this.spinnerService.hide();
          this.lockoutMessage = "You’ll need to enable required cookies in your browser settings to continue using our website. This way we can provide you with personalised information.";
        }
      }
    
      getMyPreferences(customerDetail) {
        if (this.data.isLoginFromOutside) {
          this.commonService.loaderRequired = true;
        }
        else {
          this.commonService.loaderRequired = false;
        }
        if (this.data != null && !this.data.isLoginFromSeason && !this.data.isLoginFromJE && !this.router.url.includes(this.appRouteEnum.MixingDeck) && !this.router.url.includes(this.appRouteEnum.JourneyExtras) && !this.data.isLoginFromAccount && !this.data.isLoginFromOutside && !this.data.isLoginFromQuickBuy) {
          this.commonService.loaderRequired = true;
        }
        else if ((this.router.url.includes(this.appRouteEnum.JourneyExtras) || this.router.url.includes(this.appRouteEnum.MixingDeck)) && this.data?.isLoginFromJE && !this.data?.isLoginFromAccount && !this.data?.isLoginFromOutside && !this.data?.isLoginFromQuickBuy) {
          this.commonService.loaderRequired = true;
        }
        else if (this.data?.isLoginFromSeason && !this.data?.isLoginFromJE && !this.data?.isLoginFromAccount && !this.data?.isLoginFromOutside && !this.data?.isLoginFromQuickBuy) {
          this.commonService.loaderRequired = true;
        }
        else if (this.data?.isLoginFromAccount && !this.data?.isLoginFromQuickBuy) {
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.commonService.loaderRequired = true;
          });
        }
    
        this.getPreferencesRequest.CustomerKey = customerDetail.CustomerKey;
        this.getPreferencesRequest.Email = customerDetail.Email;
        this.getPreferencesRequest.IsMasterData = false;
        this.getPreferencesRequest.IsMyPreferencesPage = false;
        this.getMyPreferencesData();
      }
    
      getMyPreferencesData() {
        this.myAccountService.getMyPreferences(this.getPreferencesRequest).subscribe(
          res => {
            if (res != null) {
              this.responseData = res as ResponseData;
              if (this.responseData.ResponseCode == '200') {
                this.myPreferencesResponse = this.responseData.Data;
                this.storageDataService.clearLocalStorageData("myPreferencesResponse");
                this.storageDataService.setLocalStorageData("myPreferencesResponse", this.myPreferencesResponse, true);
                if(this.conditionToCheckReturnUrlWithMixingDeckOrSelectTicketAndClass()){
                  this.spinnerService.hide();
                  this.dialogRef.close();
                }
                else if (this.conditionToRedirectOnDeliveryModesWhenIsLoginDataNotMatched()) {
                  this.router.navigate([`./` + this.appRouteEnum.DeliveryMode]);
                }
                else if (this.doesLoginFromMixingDeckOrTravelExtra()) {
                  this.router.navigate([`./` + this.appRouteEnum.DeliveryMode]);
                }
                else if (this.doesUserLoginFromSeason()) {
                  this.router.navigate([`./` + this.appRouteEnum.JourneyExtras]);
                  this.spinnerService.hide();
                }
                else if (this.checkIsLoginFromAccount()) {
                  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
                  })
                }
                else if (this.checkIsLoginFromQuickBuy()) {
                  this.dialogRef.close(true);
                  return;
                }
                else if (this.commonService.doesDeliveryPageSkipped() && this.data != null && !this.data.isLoginFromOutside) {
                  localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'true');
                  localStorage.setItem(this.localStorageKeyEnum.isQuickBuyOrContinue, this.quickBuyEnum.default);
                  this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
                }
              }
              else {
                this.spinnerService.hide();
              }
              this.dialogRef.close();
            }
          }
        );
      }
    
      checkIsLoginFromQuickBuy() {
        return this.data?.isLoginFromQuickBuy;
      }
    
      hideBanner() {
        this.showBanner = false;
      }
    
      onClosePopup() {
        if (this.data?.isQuickBuy) {
          this.dialogRef.close(false);
        }
      }
    
      doesLoginFromMixingDeckOrTravelExtra() {
        return ((this.router.url.includes(this.appRouteEnum.JourneyExtras) || this.router.url.includes(this.appRouteEnum.MixingDeck)) && this.data?.isLoginFromJE && !this.data?.isLoginFromAccount && !this.data?.isLoginFromOutside && !this.data?.isLoginFromQuickBuy && !this.commonService.doesDeliveryPageSkipped());
      }
    
      checkIsLoginFromAccount(){
        return this.data?.isLoginFromAccount && !this.data?.isLoginFromQuickBuy
      }

      conditionToCheckReturnUrlWithMixingDeckOrSelectTicketAndClass(){
        return (this.data?.returnUrl) && (this.router.url.includes(this.appRouteEnum.MixingDeck) || this.router.url.includes(this.enhancedAppRouteEnum.selectTicketAndClass));
      }

      conditionToRedirectOnDeliveryModesWhenIsLoginDataNotMatched(){
        return !this.data?.isLoginFromSeason && !this.data?.isLoginFromJE && !this.router.url.includes(this.appRouteEnum.MixingDeck) && !this.router.url.includes(this.appRouteEnum.JourneyExtras) && !this.data?.isLoginFromAccount && !this.data?.isLoginFromOutside && !this.data?.isLoginFromQuickBuy;
      }

      doesUserLoginFromSeason(){
        return this.data?.isLoginFromSeason && !this.data?.isLoginFromJE && !this.data?.isLoginFromAccount && !this.data?.isLoginFromOutside && !this.data?.isLoginFromQuickBuy;
      }
}