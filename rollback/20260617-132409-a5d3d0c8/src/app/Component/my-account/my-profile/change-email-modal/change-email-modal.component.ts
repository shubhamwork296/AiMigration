import { Component, ElementRef, Injector, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ResponseData } from 'src/app/models/common/response.model';
import { ChangeEmailRequest, CustomerResetEmailResponse } from 'src/app/models/customer/customer-send-mail-request.model';
import { MyAccountService } from 'src/app/services/my-account.service';
import { AppRouteEnum, NotificationErrorMsg } from 'src/app/utility/app-constants.service';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { MyProfileForgotPasswordComponent } from '../my-profile-forgot-password/my-profile-forgot-password.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MustMatch, NotMatch, validateEmailRegex } from 'src/app/utility/custom-validations/must-match-validation';
import { SharedService } from 'src/app/services/shared-sibling.service';

@Component({
    selector: 'app-change-email-modal',
    templateUrl: './change-email-modal.component.html',
    styleUrls: ['./change-email-modal.component.css'],
    standalone: false
})
export class ChangeEmailModalComponent implements OnInit {
  
  @ViewChild('currentEmail',{static: false}) currentEmailField : ElementRef;
  headerTitle: string = 'Enter your new email' ;
  displayedChangeEmailIcon: boolean = true;
  PasswordFieldTextType: boolean = false;
  changeEmailForm: FormGroup;
  changeEmailRequest: ChangeEmailRequest;
  myAccountService: MyAccountService;
  responseData: ResponseData;
  notificationService: NotificationService;
  notificationErrorMsg: NotificationErrorMsg;
  customerResetEmailResponse: CustomerResetEmailResponse;
  lockoutMessage: string;
  appRouteEnum: AppRouteEnum;
  router: Router;
  isSubmitted: boolean = false;
  ShowForgottenInCaseError: boolean = false;
  capsLock: number;
  sharedService: SharedService;
  
  constructor(private readonly formbuilder: FormBuilder, private readonly injector: Injector, private readonly dialog: MatDialog, public dialogRef: MatDialogRef<ChangeEmailModalComponent>) {

    this.myAccountService = this.injector.get(MyAccountService);
    this.notificationService = this.injector.get(NotificationService);
    this.notificationErrorMsg =  this.injector.get(NotificationErrorMsg);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.router = this.injector.get(Router);
    this.sharedService = this.injector.get(SharedService);
  }

  ngOnInit(): void {

    this.sharedService.capsLockOn.subscribe((res) => {
      if (res.id == 'cem-password-input' || res.id == 'cem-password-show-hide-icon-span') {
        this.capsLock = res.value;
      } else {
        this.capsLock = 2; // when clicks on another fields passwordfield's caps lock message should be hide.
      }
    });

    this.createForm();

  }

  createForm() {
    this.changeEmailForm = this.formbuilder.group({
      currentEmail: new FormControl("", [Validators.required, Validators.maxLength(253)]),
      password: new FormControl("", Validators.required),
      newEmail: new FormControl("", [Validators.required, Validators.maxLength(253)]),
      confirmEmail: new FormControl("", [Validators.required])
    }, {
      validator: [MustMatch('newEmail', 'confirmEmail', true), NotMatch("currentEmail", "newEmail"),validateEmailRegex('currentEmail'),validateEmailRegex('newEmail')]

    });
  }

  //PICO-2799 create function for open sent email verification popup
  openEmailVerificationLinkPopup(customerResetEmailResponse, displayedSuccessIcon) {

    this.dialog.open(MyProfileForgotPasswordComponent, {
      width: '600px',
      disableClose: false,
      panelClass: 'common-popup-theme',
      autoFocus: false,
      restoreFocus: false,
      data: {
        headerTitle: this.notificationErrorMsg.emailVarificationLinkTitle,
        IsEmailChangeVerificationMailSent: customerResetEmailResponse.IsEmailChangeVerificationMailSent,
        displayedSuccessIcon: displayedSuccessIcon
      }
    });

  }

  //PICO-2799 call api for change email
  sendEmailForVerification() {
    if (localStorage.getItem('OriginalEmail') != this.changeEmailForm.get('currentEmail').value) {
      this.changeEmailForm.get('currentEmail').setErrors({ 'isCurrentEmail': true });
      if (this.changeEmailForm.controls['currentEmail'].invalid) {
        this.currentEmailField.nativeElement.focus();
        return false;
      }
    }
    if (this.changeEmailForm.valid) {

      this.changeEmailRequest = new ChangeEmailRequest();
      this.changeEmailRequest.CurrentEmail = this.changeEmailForm.get('currentEmail').value;
      this.changeEmailRequest.NewEmail = this.changeEmailForm.get('newEmail').value?.trim();
      this.changeEmailRequest.Password = this.changeEmailForm.get('password').value;
      this.myAccountService.userChangeEmailRequest(this.changeEmailRequest).subscribe((res) => {

        if (res != null) {
          this.responseData = res as ResponseData;

          if (this.responseData.ResponseCode == '200') {

            this.customerResetEmailResponse = this.responseData.Data;
            
            this.getChangeEmailResponseForVerification(this.customerResetEmailResponse);

          } else {

            this.notificationService.error(this.responseData.ResponseMessage);

          }

        }
      });
    }
  }

  getChangeEmailResponseForVerification(customerResetEmailResponse) {
    if (customerResetEmailResponse.IsEmailChangeVerificationMailSent) {

      this.ShowForgottenInCaseError = false;
      this.dialogRef.close();

      this.openEmailVerificationLinkPopup(customerResetEmailResponse, true);

    }
    else {

      this.ShowForgottenInCaseError = true;
      this.lockoutMessage = this.responseData.Data.ResponseMessage;

    }
  }

  forgotPassword() {
    this.dialogRef.close({ gotItFlag: true });
  }
  
}
