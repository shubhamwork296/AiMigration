import { Component, Injector, OnInit } from '@angular/core';
import { CustomerSendMailRequst } from 'src/app/models/customer/customer-send-mail-request.model';
import { FormControl, FormBuilder, Validators } from '@angular/forms';
import { ResponseData } from 'src/app/models/common/response.model';
import { CustomerForgotPasswordResponse } from 'src/app/models/customer/customer-reset-password-request.model';
import { DataLayerService } from 'src/app/utility/dataLayers/data-layer.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { CommonServices } from 'src/app/services/common.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { AppRouteEnum, ForgotPasswordMsgEnum } from 'src/app/utility/app-constants.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { Router } from '@angular/router';
import { validateEmailRegex } from 'src/app/utility/custom-validations/must-match-validation';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
  customerSendMailRequst: CustomerSendMailRequst;
  error: boolean = false;
  isSubmitted: boolean = false;
  IsEmailSend: boolean = false;
  responseData: ResponseData;
  customerForgotPasswordResponse: CustomerForgotPasswordResponse;
  invalidEmailError: boolean = false;
  commonService: CommonServices;
  datalayerService : DataLayerService;
  gA4DatalayerService:GA4DatalayerService;
  spinnerService: NgxSpinnerService;
  forgotPasswordMsgEnum: ForgotPasswordMsgEnum;
  myAccountService: MyAccountService;
  appRouteEnum: AppRouteEnum;
  isResetPassword: boolean = true;

  constructor(private readonly formBuilder: FormBuilder, private readonly injector: Injector, private readonly router: Router) { 
      this.commonService = this.injector.get(CommonServices);
      this.datalayerService = this.injector.get(DataLayerService);
      this.gA4DatalayerService = this.injector.get(GA4DatalayerService);
      this.spinnerService = this.injector.get(NgxSpinnerService);
      this.forgotPasswordMsgEnum = this.injector.get(ForgotPasswordMsgEnum);
      this.myAccountService = this.injector.get(MyAccountService);
      this.appRouteEnum = this.injector.get(AppRouteEnum);
    }
  sendMailToResetPassword: any = this.formBuilder.group({
    email: new FormControl('', [Validators.required, Validators.maxLength(253)])
  },{
    validator: [validateEmailRegex('email')]
  })
  ngOnInit() {
    this.datalayerService.loadGTMDataLayerOnPageUpdate();
    // page_meta_data -- Ga4-datalayer event
    this.gA4DatalayerService.loadGA4DataLayerAllPages(true);
    this.spinnerService.hide();
    this.myAccountService.sendEmailSuccess$.subscribe(sendEmailSuccess => {
      this.IsEmailSend = sendEmailSuccess;
      this.isResetPassword = false;
    });
  }

  submit() {
    if (this.sendMailToResetPassword.valid) {
      let sendMailToResetPasswordFormData = this.sendMailToResetPassword.value;
      this.customerSendMailRequst = new CustomerSendMailRequst();
      this.customerSendMailRequst.UserEmail = sendMailToResetPasswordFormData.email;
      this.myAccountService.sendEmailToResetPassword(this.customerSendMailRequst, false, '');
    }
    this.isSubmitted = true;
  }

}
