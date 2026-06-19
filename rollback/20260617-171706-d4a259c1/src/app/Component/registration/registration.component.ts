import { Component, OnInit, Inject, ViewChild, Renderer2, ElementRef, Injector } from '@angular/core';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { CustomerRegisterRequest } from 'src/app/models/customer/customer-registration-request.model';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { CustomerRegisterResponse } from 'src/app/models/customer/customer-registration-response.model';
import { Address, CustomerLoginResponse } from '../../models/customer/customer-login-response.model';
import { MustMatch, CheckMonth, CheckYear,checkMobileValidation, CheckMoreThanOneSpecialCharachter,CheckForLetterPresence, validateEmailRegex } from 'src/app/utility/custom-validations/must-match-validation';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppRouteEnum, EnhancedAppRouteEnum, Ga4DatalayeEventNameEnum, LocalStorageKeyEnum, QuickBuyEnum, FooterNavigationLinkEnum } from 'src/app/utility/app-constants.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { SharedServiceCache } from 'src/app/services/SharedServiceCache.service';
import { StorageDataService } from 'src/app/services/storage-data.service';
import { DOCUMENT } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import * as moment from 'moment';
import { Moment } from 'moment';
import { CustomerLoginRequest } from 'src/app/models/customer/customer-login-request.model';
import { MyPreferencesResponse, GetPreferencesRequest } from 'src/app/models/account/my-preferences.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { CommonServices } from 'src/app/services/common.service';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { InfoPopupComponent } from '../mixing-deck/info-popup/info-popup.component';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { Subscription } from 'rxjs';
import { EnhancedLoginCommonService } from 'src/app/services/enhanced-login-common.service';



export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
    selector: 'app-registration',
    templateUrl: './registration.component.html',
    styleUrls: ['./registration.component.css'],
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ],
    standalone: false
})

export class RegistrationComponent implements OnInit {
  @ViewChild('dobField',{static: false}) dobYearField : ElementRef;
  showBanner: boolean = false;
  customerRegisterRequest: CustomerRegisterRequest;
  isSubmitted: boolean = false;
  selected: string;
  error: boolean = false;
  maxDate = new Date();
  mxMonth: number = 12;
  mxYear: number = this.maxDate.getFullYear();
  minDate = this.maxDate.setFullYear(this.maxDate.getFullYear() - 15);
  responseData: ResponseData;
  document: any;
  hiddenAddressIdsArray = ["formattedAddress","postCodeFA", "address1FA", "address2FA", "address3FA", "cityFA", "countryFA"];
  customerRegisterResponse: CustomerRegisterResponse;
  isReg: boolean = true;
  fieldTextType: boolean = false;
  repeatFieldTextType: boolean = false;
  customerLoginRequest:CustomerLoginRequest;
  
  customerLoginResponse: CustomerLoginResponse;
  invalidCredential: boolean = false;
  myPreferencesResponse: MyPreferencesResponse;
  getPreferencesRequest: GetPreferencesRequest;
  
  router: Router;
  customerService: CustomerServiceService;
  notificationService: NotificationService;
  appRouteEnum: AppRouteEnum;
  sharedService: SharedService;
  sharedServiceCache: SharedServiceCache;
  storageDataService: StorageDataService;
  spinnerService: NgxSpinnerService;
  el: ElementRef;
  myAccountService: MyAccountService;
  commonService: CommonServices;
  dataLayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;
  isManualAddressSelected: boolean = false;
  ga4DatalayeEventNameEnum: Ga4DatalayeEventNameEnum;
  capsLock: any;
  localStorageKeyEnum: LocalStorageKeyEnum;
  quickBuyEnum: QuickBuyEnum;
  formattedAddressValueChangeSubscription: Subscription;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  enhancedLoginCommonService: EnhancedLoginCommonService;
  footerNavigationLinkEnum: FooterNavigationLinkEnum;


  constructor(private readonly formbuilder: FormBuilder, private readonly _renderer2: Renderer2, @Inject(DOCUMENT) private readonly _document: Document, private readonly injector: Injector, public dialog: MatDialog) {

    // Dependency Injection without using constructor's param
    this.router = this.injector.get(Router);
    this.customerService = this.injector.get(CustomerServiceService);
    this.notificationService = this.injector.get(NotificationService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.sharedService = this.injector.get(SharedService);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.storageDataService = this.injector.get(StorageDataService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.el = this.injector.get(ElementRef);
    this.myAccountService = this.injector.get(MyAccountService);
    this.commonService = this.injector.get(CommonServices);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.ga4DatalayeEventNameEnum = this.injector.get(Ga4DatalayeEventNameEnum);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
    this.quickBuyEnum = this.injector.get(QuickBuyEnum);
    this.trimSpacesFromFormattedAddressFormControl();
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedLoginCommonService = this.injector.get(EnhancedLoginCommonService);
    this.footerNavigationLinkEnum = this.injector.get(FooterNavigationLinkEnum);
  }

    
  register: any = this.formbuilder.group({
    email: new FormControl('', [Validators.required,Validators.maxLength(253)]),
    confirmEmail: new FormControl('', [Validators.required]),
    title: new FormControl(''),
    other:new FormControl(''),
    firstName: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+([ \-']{0,1}[a-zA-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u01FF]+){0,2}[.]{0,1}$/)]),
   
    date: new FormControl(),
    dobMonth:new FormControl('', [Validators.pattern(/^[0-9]+$/), Validators.minLength(2), Validators.maxLength(2)]),
    dobYear: new FormControl('', [Validators.pattern(/^[0-9]+$/), Validators.minLength(4), Validators.maxLength(4)]),
    password: new FormControl('', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!,-_.@;:$%^[\\\\?=>\]/<])[A-Za-z\d!,-_.@;:$%^[\\\\?=>\]/<]{10,}$/)]),
    formattedAddress: new FormControl('', [Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]),
    postCode: new FormControl(''),
    address1: new FormControl(''),
    address2: new FormControl(''),
    address3: new FormControl(''),
    city: new FormControl(''),
    country: new FormControl(''),
    mobile: new FormControl(''),
    confirmPolicy: new FormControl(''),
    rememberme: new FormControl(''),
    confirmClubAvanti: new FormControl(''),
    postCodeFA: new FormControl(''),
    address1FA: new FormControl(''),
    address2FA: new FormControl(''),
    address3FA: new FormControl(''),
    cityFA: new FormControl(''),
    countryFA: new FormControl(''),
  }, {
    validator: [CheckMonth('dobMonth'),CheckYear('dobYear','dobMonth'), MustMatch('email', 'confirmEmail',true) ,checkMobileValidation('mobile'), CheckMoreThanOneSpecialCharachter('password'), validateEmailRegex('email')]
   
  });

  public ngOnInit() {
    this.sharedService.capsLockOn.subscribe((res) => {
      if (res.id == 'password' || res.id == 'rc-password-visible-hide-icon') {
        this.capsLock = res.value;
      } else {
        this.capsLock = 2; // when clicks on another fields passwordfield's caps lock message should be hide.
      }
    });
    this.dataLayerService.loadGTMDataLayerOnPageUpdate();
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);

    this.setMaxDate();
    this.spinnerService.hide();
  }
 
  //PICO-1877 checked dob for club avanti validation
  checkClubAvntiChecked() {
    let dobmonth = this.register.get('dobMonth').value;
    let dobyear = this.register.get('dobYear').value;
    if (dobmonth && dobyear) {
      let ageDifference = this.calculateAge(dobmonth, dobyear);
      if (ageDifference >= 16) {
        return true;
      } else {        
        return false;
      }
    }
    else {
      return true;
    }
  }

  // calculate age for PICO-1877 
  calculateAge(dobMonth: any, dobYear: any) {
    const now = new Date();
    let ageDiff = now.getFullYear() - dobYear;
    let monthDifference = now.getMonth() - dobMonth;
    if (monthDifference < 0) {
      ageDiff--;
    }
    return ageDiff;
  }

  call(){
    this.register.get('address1').setErrors(null);
    this.register.get('city').setErrors(null);
  }

  CheckLetterPresence(e: KeyboardEvent){
    if(this.register.get('mobile').hasError('letterError')){
        CheckForLetterPresence(e,this.register.get('mobile'));
    }
  }

  setMaxMonth(){
    if(this.register.get('dobYear').value == this.mxYear && this.register.get('dobMonth').value > ((new Date()).getMonth() + 1)){
        this.register.get('dobMonth').setErrors({ 'invalid': true });
    }
    else if(this.register.get('dobMonth').value > 12){
      this.register.get('dobMonth').setErrors({ 'invalid': true });
    }
    else {
      this.register.get('dobMonth').setErrors(null);
    }
  }

  setMaxYear(){
    if(this.register.get('dobYear').value.length != 4){
      this.register.get('dobYear').setErrors({ 'invalid': true });
    }
    else if(this.register.get('dobYear').value > this.mxYear){
      this.register.get('dobYear').setErrors({ 'invalid': true });
    }
    else if(this.register.get('dobYear').value == this.mxYear){
      this.setMaxMonth();
    }
    else {
      this.register.get('dobYear').setErrors(null);
      if(this.register.get('dobMonth').value <= 12){
        this.register.get('dobMonth').setErrors(null);
    }
    }
  }

  convertMonth(){
        let monthVal= this.register.get('dobMonth').value;
        if(monthVal.length===1){
          monthVal=`0${monthVal}`;
          this.register.patchValue({dobMonth: monthVal});
        }
  }

  checkBothDobField(){
    let dobmonth= this.register.get('dobMonth').value;
    let dobyear= this.register.get('dobYear').value;
    if((!dobmonth&&dobyear)){
      this.register.get('dobMonth').setErrors({ monthError: true});
    }
    if((dobmonth&&!dobyear)){
      this.register.get('dobYear').setErrors({ yearError: true});
    }
  }

  submit() {
    this.convertMonth();
    this.checkBothDobField();
    this.register.markAllAsTouched();    
    let registerFormData = this.register.value;
    if (registerFormData.confirmClubAvanti) {
      let isClubAvntiError = this.checkClubAvntiChecked();
      if (!isClubAvntiError) {
        this.register.get('dobMonth').setErrors({ 'isClubAvantiError': true });
        if (this.register.controls['dobMonth'].invalid) {
          this.dobYearField.nativeElement.focus();
          this.isSubmitted = true;
          this.showBanner = true;
          return false;
        }
      }
    }
    const otherTitleControl = this.register.controls['other'];
    if (otherTitleControl.value == '' && registerFormData.title=="Other") {
      otherTitleControl.setErrors({ other: true });
      return false;
    } else {
      otherTitleControl.setErrors(null);
    }
    let elementValue = document.getElementById('formattedAddress')['value'];
    const ctrlValue = this.register.controls['formattedAddress'];
    ctrlValue.setValue(elementValue);
    if (elementValue) {
      this.hiddenAddressIdsArray.forEach(x => {
        let addressElementValue = document.getElementById(x)['value'];
        const ctrlAddressValue = this.register.controls[x];
        ctrlAddressValue.setValue(addressElementValue);
      });
    }
    for (const key of Object.keys(this.register.controls)) {
      if (this.register.controls[key].invalid) {
        const invalidControl = this.el.nativeElement.querySelector('[formcontrolname="' + key + '"]');
        invalidControl.focus();
        break;
      }
    }
    this.registerData(registerFormData);
    this.isSubmitted = true;
    this.showBanner = true;
  }

  registerData(registerFormData) {
    if (this.register.valid) {
      registerFormData = this.register.value;
      this.customerRegisterRequest = new CustomerRegisterRequest();
      this.customerRegisterRequest.Email = registerFormData.email?.trim();
      this.customerRegisterRequest.FirstName = registerFormData.firstName;
      this.customerRegisterRequest.LastName = registerFormData.lastName;
      if(registerFormData.title=="Other"){
        this.customerRegisterRequest.Title=registerFormData.other;
      }else{
        this.customerRegisterRequest.Title = registerFormData.title;
      }
      this.customerRegisterRequest.Password = registerFormData.password;
      let sendDOB =  `${registerFormData.dobMonth}/${registerFormData.dobYear}`;
      this.customerRegisterRequest.DateOfBirth = (sendDOB.length===7)? sendDOB: "";
      this.customerRegisterRequest.Address = new Address();
      if(this.isManualAddressSelected){
        this.customerRegisterRequest.Address.Address1 = registerFormData.address1;
        this.customerRegisterRequest.Address.Address2 = registerFormData.address2;
        this.customerRegisterRequest.Address.Address3 = registerFormData.address3;
        this.customerRegisterRequest.Address.City = registerFormData.city;
        this.customerRegisterRequest.Address.Country = registerFormData.country;
        this.customerRegisterRequest.Address.CountryCode = registerFormData.countryCode;
        this.customerRegisterRequest.Address.PostCode = registerFormData.postCode;
      }else {
        this.customerRegisterRequest.Address.FullAddress = registerFormData.formattedAddress;
        this.customerRegisterRequest.Address.Address1 = registerFormData.address1FA;
        this.customerRegisterRequest.Address.Address2 = registerFormData.address2FA;
        this.customerRegisterRequest.Address.Address3 = registerFormData.address3FA;
        this.customerRegisterRequest.Address.City = registerFormData.cityFA;
        this.customerRegisterRequest.Address.Country = registerFormData.countryFA;
        this.customerRegisterRequest.Address.CountryCode = registerFormData.countryCodeFA;
        this.customerRegisterRequest.Address.PostCode = registerFormData.postCodeFA;
      }
      
      this.customerRegisterRequest.Mobile = registerFormData.mobile;
      //For Avanti Loyality registration
      this.customerRegisterRequest.EnrolForLoyality = registerFormData.confirmClubAvanti ? registerFormData.confirmClubAvanti : false;
      if (registerFormData.rememberme) {
        localStorage.setItem('UserNameRM', registerFormData.email?.trim());
        localStorage.setItem('RememberMe', 'true');
      }
      else {
        localStorage.removeItem('UserNameRM');
        localStorage.removeItem('RememberMe');
      }
      this.registerCustomer(this.customerRegisterRequest);
    }
  }

  setMaxDate() {
    let currentDate = new Date();
    let date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    let month = currentDate.getMonth() - 1;
    let year = currentDate.getFullYear() - 15;
    let maxDate = new Date(new Date(new Date(new Date().setFullYear(year)).setMonth(month)).setDate(date))
    this.maxDate = maxDate;
  }
  registerCustomer(_CustomerRegisterRequest: any) {
    this.customerService.registerCustomer(this.customerRegisterRequest).subscribe(res => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.customerRegisterResponse = this.responseData.Data;
          this.checkRegistrationResponse();

          this.isCheckedJoinClubAvanti(_CustomerRegisterRequest);
          
        }
        else {
          if (this.responseData.ResponseMessage == 'oneStepCustomerInternalRegistration:') {
            this.notificationService.warn('You are temporarily unable to create an account because an account with this email address was only recently deleted.')
          }
          else {
            this.notificationService.warn(this.responseData.ResponseMessage);
          }
        }
      }
    });
  }

  isCheckedJoinClubAvanti(_CustomerRegisterRequest) {
    if (_CustomerRegisterRequest.EnrolForLoyality) {
      if (this.customerRegisterResponse.EnrolledForLoyality) {
        this.ga4dataLayerService.loadGALayerForClubAvanti(this.ga4DatalayeEventNameEnum.sucessfullyAccCreatedForClubAvanti);
      } else {
        this.ga4dataLayerService.loadGALayerForClubAvanti(this.ga4DatalayeEventNameEnum.accountFailedForClubAvanti, this.customerRegisterResponse.ResponseMessage);
      }
    }
  }

  checkRegistrationResponse() {
    if (this.customerRegisterResponse.IsRegistered) {
      localStorage.setItem('CustomerKey', this.customerRegisterResponse.CustomerKey);
      //Set shared cache data
      this.sharedService.registrationCustomerEmail = this.customerRegisterResponse.CustomerEmail;
      this.sharedService.registrationCustomerPassword = this.customerRegisterResponse.CustomerPassword;
      this.sharedService.registrationIsLoginFromJE = this.customerService.isLoginFromJE;
      this.sharedService.registrationIsLoginFromSeason = this.customerService.isLoginFromSeason;
      this.sharedService.registrationReturnUrl = this.customerService.returnUrl;
      this.sharedService.setSharedCache();
      this.storageDataService.clearStorageData("sharedSibling");
      this.storageDataService.setStorageData("sharedSibling", this.sharedServiceCache, true);
      // If club avanti check box selected and club avanti regiteration failed
      if (this.customerRegisterRequest.EnrolForLoyality && !this.customerRegisterResponse.EnrolledForLoyality) {
        this.clubAvantiErrorPopup();
      }
      else {
        this.concentricData();
      }
    }
    else if (this.customerRegisterResponse.IsEmailExist) {
      this.notificationService.warn(this.customerRegisterResponse.ResponseMessage);
    }
  }

  afterRegSuccess(token) {
    const s1 = this._renderer2.createElement("script");
    s1.innerHTML = `
                let widget_config = {
                  templateId: "57sYDaqBYeB",
                  hideButtons: true,
                  token: "`+ token + `",
                  widgetId: "Dh8HZjHyTw",
                }
              `
    this._renderer2.appendChild(this._document.body, s1);
    const s2 = this._renderer2.createElement("script");
    s2.src = 'https://widget.sandbox.consentric.io/public/init.js';
    s2.id = "init";
    this._renderer2.appendChild(this._document.body, s2);
  }

  chosenYearHandler(normalizedYear: Moment) {
    const ctrlValue = this.register.controls['date'];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.year(normalizedYear.year());
    ctrlValue.setValue(ctrlValue.value);
  }

  chosenMonthHandler(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.register.controls['date'];
    ctrlValue.setValue(moment(this.minDate));
    ctrlValue.value.month(normalizedMonth.month());
    ctrlValue.value.year(normalizedMonth.year());
    ctrlValue.setValue(ctrlValue.value);
    datepicker.close();
  }

  checkCustomerLogin() {
    this.commonService.loaderRequired = true;
    this.customerLoginRequest = new CustomerLoginRequest();
    this.customerLoginRequest.Password = this.customerRegisterResponse.CustomerPassword;
    this.customerLoginRequest.UserEmail = this.customerRegisterResponse.CustomerEmail;
    this.customerService.checkCustomerLogin(this.customerLoginRequest).subscribe(
      res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.customerLoginResponse = this.responseData.Data;
            if (this.customerLoginResponse.IsAuthenticated) {
              this.invalidCredential = false;
              localStorage.setItem('Title', this.customerLoginResponse.CustomerDetail.Title);
              this.storageDataService.clearLocalStorageData("customerLoginResponse");
              this.storageDataService.setLocalStorageData("customerLoginResponse", this.customerLoginResponse, true);
              localStorage.setItem('Email', this.customerLoginResponse.CustomerDetail.Email);
              localStorage.setItem('OriginalEmail', this.customerLoginResponse.CustomerDetail.OriginalEmail);
              localStorage.setItem('CustomerKey', this.customerLoginResponse.CustomerDetail.CustomerKey);
              localStorage.setItem('FirstName', this.customerLoginResponse.CustomerDetail.FirstName);
              localStorage.setItem('LastName', this.customerLoginResponse.CustomerDetail.LastName);
              localStorage.setItem('UserName', this.customerLoginResponse.CustomerDetail.UserName);
              this.sharedService.sendCustomerData(this.customerLoginResponse.CustomerDetail.FirstName, this.customerLoginResponse.CustomerDetail.LastName);
              this.getMyPreferences(this.customerLoginResponse.CustomerDetail);
              this.redirectedAfterLogin();
            }
            else {
              this.invalidCredential = true;
            }
          }
          else {
            console.log(this.responseData.ResponseMessage);
          }
        }
      });
  }

  redirectedAfterLogin() {
    if (this.customerService.isLoginFromJE) {
      if (this.commonService.doesDeliveryPageSkipped()) {
        localStorage.setItem(this.appRouteEnum.isBrowserBackButton, 'true');
        localStorage.setItem(this.localStorageKeyEnum.isQuickBuyOrContinue, this.quickBuyEnum.default);
        this.router.navigate([`./` + this.appRouteEnum.deliveryAndReviewbuy]);
      } else {
        this.router.navigate([`./` + this.appRouteEnum.DeliveryMode]);
      }
    }
    else if (this.customerService.isLoginFromSeason) {
      this.router.navigate([`./` + this.appRouteEnum.JourneyExtras]);
    }
    else if (this.customerService.returnUrl != null && this.customerService.returnUrl != undefined) {
      if (this.customerService.returnUrl.includes(this.appRouteEnum.MixingDeck) || this.customerService.returnUrl.includes(this.appRouteEnum.SeasonSolutions)
        || this.customerService.returnUrl.includes(this.appRouteEnum.JourneyExtras))
        this.router.navigateByUrl(this.customerService.returnUrl);
      else
        this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
    } else if(this.customerService?.isLoginFromEnhancedSelectTicketAndClass){
        this.commonService.createRequestForGetDeliveryAndBasketJourneyAPI(this.customerService?.nreJourneyExtrasResponse, this.customerService?.travelSolution, this.customerService?.cameFromFlexibleReturn, this.customerService?.searchResponse);
        this.sharedService.sendSearchRequest(this.customerService?.mixingDeckSearchRequest);
        let enhancedGetDeliveryAndBasketJourneyRequest = this.sharedService.enhancedGetDeliveryAndBasketJourneyRequest;
        enhancedGetDeliveryAndBasketJourneyRequest.PreviousCache = this.sharedService.reviewBuyCache;
        this.enhancedLoginCommonService.callGetDeliveryAndBasketJourneyApi(enhancedGetDeliveryAndBasketJourneyRequest);
    } else {
      this.router.navigate([`./` + this.appRouteEnum.MyBookings]);
    }
  }

  getMyPreferences(customerDetail) {
    this.commonService.loaderRequired = true;
    this.getPreferencesRequest = new GetPreferencesRequest();
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
          }
        }
      }
    );
  }

  clearDate() {
    const ctrlValue = this.register.controls['date'];
    ctrlValue.setValue(null);
  }
  hideBanner() {
    this.showBanner = false;
  }

  // Method to display club avanti registration error in popup
  clubAvantiErrorPopup() {
    let dialogRef = this.dialog.open(InfoPopupComponent, {
      disableClose: true,
      width: '600px',
      data: {
        Message: this.customerRegisterResponse.EnrolmentFailureMessage,
        CTAText: "Complete account registration"
      }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.concentricData();
    });
  }

  // Method to display concentric data
  concentricData() {
    if (this.customerRegisterResponse.IsConcentricRegistered) {
      let token = this.customerRegisterResponse.consentrictoken;
      this.isReg = false;
      this.afterRegSuccess(token);
    } else {
      this.notificationService.warn("Concentric not registered.");
      this.checkCustomerLogin();
    }
  }

  showOtherAddressFields() {
    this.isManualAddressSelected = !this.isManualAddressSelected;
    this.setValidationOnAddressField();
    this.hiddenAddressIdsArray.forEach(x => {
      document.getElementById(x)['value'] = '';
    });
    this.resetManualAddressField();
    this.register.markAsUntouched();
  }

  setValidationOnAddressField() {
    this.register.markAsUntouched();
    if(this.isManualAddressSelected){
      this.addValidationonAddressControls();
    } else {
      this.clearValidationFromAddressControls();
    }
  }

  addValidationonAddressControls() {
    this.register.get('postCode').setValidators([Validators.required, Validators.minLength(4), Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('postCode').updateValueAndValidity();
    this.register.get('address1').setValidators([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('address1').updateValueAndValidity();
    this.register.get('address2').setValidators([Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('address2').updateValueAndValidity();
    this.register.get('address3').setValidators([Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('address3').updateValueAndValidity();
    this.register.get('city').setValidators([Validators.required, Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('city').updateValueAndValidity();
    this.register.get('country').setValidators([Validators.pattern(/^[^\s]+(\s+[^\s]+)*$/)]);
    this.register.get('country').updateValueAndValidity();
    this.register.get('formattedAddress').clearValidators();
  }

  resetManualAddressField () {
    this.register.patchValue({
      postCode: '',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      country: ''
    });
  }

  clearValidationFromAddressControls() {
    this.register.get('formattedAddress').setValidators([Validators.required]);
    this.register.get('formattedAddress').updateValueAndValidity();
    this.register.get('postCode').clearValidators();
    this.register.get('address1').clearValidators();
    this.register.get('address2').clearValidators();
    this.register.get('address3').clearValidators();
    this.register.get('country').clearValidators();
    this.register.get('city').clearValidators();
  }

  trimSpacesFromFormattedAddressFormControl(){
    this.formattedAddressValueChangeSubscription = this.register.controls['formattedAddress'].valueChanges
    .subscribe(x=>{
      if(x && x.includes(' ')){
        this.register.controls['formattedAddress'].setValue(x.trim().replace(/\s/g, ""))
      }
    });
  }

  ngOnDestroy(){
    this.formattedAddressValueChangeSubscription.unsubscribe();
  }
  
}
