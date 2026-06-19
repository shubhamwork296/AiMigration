import { Component, OnInit, Input, Output, EventEmitter, Injector } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { CustomerLoginResponse } from 'src/app/models/customer/customer-login-response.model';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { CustomerLoginRequest } from 'src/app/models/customer/customer-login-request.model';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { MyPreferencesResponse, GetPreferencesRequest } from 'src/app/models/account/my-preferences.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonServices } from 'src/app/services/common.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { validateEmailRegex } from 'src/app/utility/custom-validations/must-match-validation';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})

export class LoginComponent implements OnInit {
  showBanner: boolean = false;
  customerServiceService: CustomerServiceService;

  router: Router;
  sharedServices: SharedService;
  storageDataService: StorageDataService;
  myAccountService: MyAccountService;
  appRouteEnum: AppRouteEnum;
  spinnerService: NgxSpinnerService;
  commonService: CommonServices;
  ga4dataLayerService: GA4DatalayerService;
  verifyPasswordFieldTextType: boolean = false;
  capsLock: number;

  constructor(private readonly formbulider: FormBuilder, private readonly injector: Injector) {
    // Dependency Injection without using constructor's param
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.router = this.injector.get(Router);
    this.sharedServices = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.myAccountService = this.injector.get(MyAccountService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.commonService = this.injector.get(CommonServices);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.getPreferencesRequest = new GetPreferencesRequest();
  }

  customerLoginRequest: CustomerLoginRequest;
  responseData: ResponseData;
  customerLoginResponse: CustomerLoginResponse;
  invalidCredential: boolean = false;
  myPreferencesResponse: MyPreferencesResponse;
  getPreferencesRequest: GetPreferencesRequest;
  isLoginButtonDisabled: boolean = false;
  accountLockoutMessage: string;
  isSubmitted: boolean = false;
  ngOnInit() {    
    this.sharedServices.capsLockOn.subscribe((res) => {
      if (res.id == 'sip-password-input' || res.id == 'sip-password-visible-hide-icon') {
        this.capsLock = res.value;
      } else {
        this.capsLock = 2; // when clicks on another fields passwordfield's caps lock message should be hide.
      }
    });
    // page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);

    if (localStorage.getItem('RememberMe') !== null) {
      this.form.get('username').setValue(localStorage.getItem('UserNameRM'));
      this.form.get('password').setValue('');
      this.form.get('rememberme').setValue(true);
    }
    else {
      this.form.reset();
    }
    this.spinnerService.hide();
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
  }

  registerForm() {
    this.router.navigate([`./` + this.appRouteEnum.Register]);
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
            this.isLoginButtonDisabled = true;
            this.customerLoginResponse = this.responseData.Data;
            if (this.customerLoginResponse.IsAuthenticated) {
              this.invalidCredential = false;
              this.showBanner = false;
              localStorage.setItem('CustomerKey', this.customerLoginResponse.CustomerDetail.CustomerKey);
              sessionStorage.setItem('CustomerKey', this.customerLoginResponse.CustomerDetail.CustomerKey);

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
              } else {
                this.isLoginButtonDisabled = false;
                this.showBanner = true;
                this.invalidCredential = true;
                this.spinnerService.hide();
                this.accountLockoutMessage = "You’ll need to enable required cookies in your browser settings to continue using our website. This way we can provide you with personalised information.";
              }
            }
            else {
              this.isLoginButtonDisabled = false;
              this.showBanner = true;
              this.invalidCredential = true;
              this.spinnerService.hide();
              this.accountLockoutMessage = this.responseData.Data.ResponseMessage;
            }
          }
          else {
            this.spinnerService.hide();
            this.isLoginButtonDisabled = false;
          }
        }
      },
      _err => {
        this.spinnerService.hide();
      });
  }

  getMyPreferences(customerDetail) {
    this.commonService.loaderRequired = true;
    this.getPreferencesRequest.CustomerKey = customerDetail.CustomerKey;
    this.getPreferencesRequest.Email = customerDetail.Email;
    this.getPreferencesRequest.IsMasterData = false;
    this.getPreferencesRequest.IsMyPreferencesPage = false;
    this.myAccountService.getMyPreferences(this.getPreferencesRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.myPreferencesResponse = this.responseData.Data;
            this.storageDataService.clearLocalStorageData("myPreferencesResponse");
            this.storageDataService.setLocalStorageData("myPreferencesResponse", this.myPreferencesResponse, true);
            if (this.router.url.includes(this.appRouteEnum.MyBookings))
              this.router.navigateByUrl('/' + this.appRouteEnum.MyBookings)
            else if (this.router.url.includes(this.appRouteEnum.MyPreferences))
              this.router.navigateByUrl('/' + this.appRouteEnum.MyPreferences)
            else if (this.router.url.includes(this.appRouteEnum.PaymentsAndVouchers))
              this.router.navigateByUrl('/' + this.appRouteEnum.PaymentsAndVouchers)
            else if (this.router.url.includes(this.appRouteEnum.MyProfile))
              this.router.navigateByUrl('/' + this.appRouteEnum.MyProfile)
            else
              window.location.href = environment.qttUrl;
          }
        }
        else {
          this.spinnerService.hide();
        }
      }
    );
  }

  hideBanner() {
    this.showBanner = false;
  }
}
