import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ResponseData } from 'src/app/models/common/response.model';
import { ChangeEmailRequest, CustomerResetEmailResponse } from 'src/app/models/customer/customer-send-mail-request.model';
import { CommonServices } from 'src/app/services/common.service';
import { CustomerServiceService } from 'src/app/services/customer-service.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { AppRouteEnum } from 'src/app/utility/app-constants.service';
import { GA4DatalayerService } from 'src/app/utility/dataLayers/ga4-datalayer.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';

@Component({
    selector: 'app-reset-email',
    templateUrl: './reset-email.component.html',
    styleUrls: ['./reset-email.component.css'],
    standalone: false
})
export class ResetEmailComponent implements OnInit {

  ProspectId: string;
  CustomerKey: string;
  activatedRoute: ActivatedRoute;
  changeEmailRequest: ChangeEmailRequest;
  myAccountService: MyAccountService;
  responseData: ResponseData;
  isResetEmailSuccess: boolean;
  customerServiceService: CustomerServiceService;
  commonService: CommonServices;
  customerResetEmailResponse: CustomerResetEmailResponse;
  notificationService: NotificationService;
  appRouteEnum: AppRouteEnum;
  ga4dataLayerService: GA4DatalayerService;
  verifyPasswordFieldTextType: boolean = false;
  passwordForm: FormGroup;
  isSubmitted: boolean = false;
  isShowPassword: boolean = true;
  sharedService: SharedService;
  spinnerService: NgxSpinnerService;

  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector, private readonly router: Router) {

    this.activatedRoute = this.injector.get(ActivatedRoute);
    this.myAccountService = this.injector.get(MyAccountService);
    this.customerServiceService = this.injector.get(CustomerServiceService);
    this.commonService = this.injector.get(CommonServices);
    this.notificationService = this.injector.get(NotificationService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.sharedService = this.injector.get(SharedService);
    this.spinnerService = this.injector.get(NgxSpinnerService);
   }

  ngOnInit(): void {
    // Page_meta_data -- Ga4-datalayer event
    this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
    this.sharedService.isShowBuyTicketBtn.next(false);
    this.activatedRoute.queryParams.subscribe(params => {
      this.ProspectId = params['prospectId'];
      this.CustomerKey = params['customerKey'];
    });

    this.createForm();
    this.spinnerService.hide();
  }

  createForm() {
    this.passwordForm = this.formbuilder.group({
      password: new FormControl("", Validators.required),
    });
  }

  resetEmailConfirmationMsg() {
    if (this.passwordForm.get('password').valid) {
      this.changeEmailRequest = new ChangeEmailRequest();
      this.changeEmailRequest.ProspectId = this.ProspectId;
      this.changeEmailRequest.CustomerKey = this.CustomerKey;
      this.changeEmailRequest.Password = this.passwordForm.get('password').value;

      this.myAccountService.verifyUserChangeEmailRequest(this.changeEmailRequest).subscribe((res) => {

        if (res != null) {
          this.responseData = res as ResponseData;

          if (this.responseData.ResponseCode == '200') {

            this.customerResetEmailResponse = this.responseData.Data;

            this.getChangeEmailResponse();

            this.isShowPassword = false;

            this.sharedService.isShowBuyTicketBtn.next(true);

          } else {

            this.notificationService.error(this.responseData.ResponseMessage);
            this.isShowPassword = true;

          }

        }

      });
    }
    this.isSubmitted = true;
  }

  getChangeEmailResponse() {

    if (this.customerResetEmailResponse.IsEmailChanged) {

      this.customerServiceService.logout('');

      this.isResetEmailSuccess = true;

    } else {

      this.isResetEmailSuccess = false;

    }

  }

  goToResetPsw() {
    this.router.navigate(['./' + this.appRouteEnum.ForgotPassword]);
  }

  goToMyProfile() {
    this.router.navigateByUrl('/' + this.appRouteEnum.MyProfile);
  }

  goToSignIn() {
    this.router.navigateByUrl(this.appRouteEnum.Login);
  }

}
