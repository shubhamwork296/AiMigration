import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonServices } from 'src/app/services/common.service';
import { AppRouteEnum, ForgotPasswordMsgEnum } from 'src/app/utility/app-constants.service';

@Component({
    selector: 'app-my-profile-forgot-password',
    templateUrl: './my-profile-forgot-password.component.html',
    standalone: false
})
export class MyProfileForgotPasswordComponent {
  headerTitle: string;
  forgotPasswordMsgEnum: ForgotPasswordMsgEnum;
  commonService: CommonServices;
  appRouteEnum: AppRouteEnum;

  constructor(private readonly injector: Injector, public dialogRef: MatDialogRef<MyProfileForgotPasswordComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.forgotPasswordMsgEnum = this.injector.get(ForgotPasswordMsgEnum);
    this.commonService = this.injector.get(CommonServices);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.headerTitle = this.data.headerTitle;
  }

}
