
import { Component, Injector, OnInit } from '@angular/core';
import { CustomerResetPasswordRequst, CustomerResetPasswordResponse } from 'src/app/models/customer/customer-reset-password-request.model';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { ResponseData } from 'src/app/models/common/response.model';
import { MustMatch, CheckMoreThanOneSpecialCharachter } from 'src/app/utility/custom-validations/must-match-validation';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { AppRouteEnum } from '../../utility/app-constants.service';
import { CommonServices } from 'src/app/services/common.service';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { SharedService } from 'src/app/services/shared-sibling.service';
@Component({
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css'],
    standalone: false
})

export class ResetPasswordComponent implements OnInit {

  customerResetPasswordRequst: CustomerResetPasswordRequst;
  customerResetPasswordResponse:CustomerResetPasswordResponse;

  appRouteEnum: AppRouteEnum;
  customerService: CustomerServiceService;
  notificationService: NotificationService;
  activatedRoute: ActivatedRoute;
  router: Router;
  commonService: CommonServices;
  datalayerService: DataLayerService;
  ga4dataLayerService: GA4DatalayerService;
  spinnerService: NgxSpinnerService;
  sharedService: SharedService;
  isNewPswCapsLock: number;
  isConfrmPswCapsLock: number;

  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector) {

    // Dependency Injection without using constructor's param
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.customerService = this.injector.get(CustomerServiceService);
    this.notificationService = this.injector.get(NotificationService);
    this.activatedRoute = this.injector.get(ActivatedRoute);
    this.router = this.injector.get(Router);
    this.commonService = this.injector.get(CommonServices);
    this.datalayerService = this.injector.get(DataLayerService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.sharedService = this.injector.get(SharedService);

    this.commonService.loadGTMDataLayerAllPages();
  }
  isSubmitted: boolean = false;
  error: boolean = false;
  IsPasswordChanged: boolean = false;
  responseData: ResponseData;
  idToken: string;
  Token: string;
  fieldTextType: boolean = false;
  repeatFieldTextType: boolean = false;

  resetPassword: any = this.formbuilder.group({
    password: new FormControl('', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!,-_.@;:$%^[\\\\?=>\]/<])[A-Za-z\d!,-_.@;:$%^[\\\\?=>\]/<]{10,}$/)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validator: [MustMatch('password', 'confirmPassword',false), CheckMoreThanOneSpecialCharachter('password')] })

  ngOnInit() {
    this.sharedService.capsLockOn.subscribe((res) => {
      if (res.id == 'password' || res.id == 'rp-body-np-mat-icon') {
        this.isNewPswCapsLock = res.value;
        this.isConfrmPswCapsLock = 2;
      } else if (res.id == 'rp-body-cp-input' || res.id == 'rp-body-cp-mat-icon') {
        this.isConfrmPswCapsLock = res.value;
        this.isNewPswCapsLock = 2;
      } else { // when clicks on another fields passwordfield's caps lock message should be hide.
        this.isConfrmPswCapsLock = 2;
        this.isNewPswCapsLock = 2;
      }
    });
    // PICO-2010 - Page_meta_data Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.activatedRoute.queryParams.subscribe(params => {
      this.idToken = params['idToken'];
      this.Token = params['token'];
    });
    this.spinnerService.hide();
  }

  signUpHere() {
    this.router.navigate([`./` + this.appRouteEnum.Register]);
  }

  submit() {
    if (this.resetPassword.valid) {
      let resetPaawordFormData = this.resetPassword.value;
      this.customerResetPasswordRequst = new CustomerResetPasswordRequst();
      this.customerResetPasswordRequst.NewPassword = resetPaawordFormData.password;
      this.customerResetPasswordRequst.IdToken = this.idToken;
      this.customerResetPasswordRequst.Token = this.Token;
      this.resetPasswordCustomer(this.customerResetPasswordRequst)
    }
    this.isSubmitted = true;
  }

  resetPasswordCustomer(_CustomerResetPasswordRequst: any) {
    this.customerService.resetPasswordCustomer(this.customerResetPasswordRequst).subscribe(res => {
      if (res != null) {
        this.responseData = res as ResponseData;
        if (this.responseData.ResponseCode == '200') {
          this.customerResetPasswordResponse=this.responseData.Data;
          if(this.customerResetPasswordResponse.IsPasswordReset){
            this.IsPasswordChanged = true;
            this.datalayerService.loadGTMDataLayerOnResetPassword('Password Reset', true, '');
          }
          else{
            this.notificationService.error(this.customerResetPasswordResponse.ResponseMessage);
            this.datalayerService.loadGTMDataLayerOnResetPassword('Password Reset', false, this.customerResetPasswordResponse.ResponseMessage);
          }
        } 
        else {
          this.notificationService.error(this.responseData.ResponseMessage);
          this.datalayerService.loadGTMDataLayerOnResetPassword('Password Reset', false, this.responseData.ResponseMessage);
        }
      }

    })
  }
}


