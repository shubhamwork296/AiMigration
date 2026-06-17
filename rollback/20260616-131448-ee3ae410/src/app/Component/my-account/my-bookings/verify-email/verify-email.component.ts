import { Component, Injector, OnInit } from '@angular/core';
import { StartVerifyEmailRequestDto, StartVerifyEmailResponseDto } from 'src/app/models/account/my-bookings.model';
import { ResponseData } from 'src/app/models/common/response.model';
import { CommonServices } from 'src/app/services/common.service';
import { MyAccountService } from 'src/app/services/my-account.service';
import { AppRouteEnum, CommonIconImg, NotificationErrorMsg } from 'src/app/utility/app-constants.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from 'src/app/utility/toastr-notification/toastr-notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  commonService: CommonServices;
  myAccountService: MyAccountService;
  responseData: ResponseData;
  startVerifyEmailRequestDto: StartVerifyEmailRequestDto;
  startVerifyEmailResponseDto: StartVerifyEmailResponseDto;
  notificationErrorMsg: NotificationErrorMsg;
  commonIconImg: CommonIconImg;
  notificationService: NotificationService;
  activatedRoute: ActivatedRoute;
  verificationCode: string;
  customerKey: string;
  isConfirmEmailSuccess: boolean;
  sharedService: SharedService;
  isLoginUser: boolean;
  appRouteEnum: AppRouteEnum;

  constructor(private readonly injector: Injector, private readonly dialog: MatDialog, private readonly router: Router) { 
    this.commonService = this.injector.get(CommonServices);
    this.myAccountService =  this.injector.get(MyAccountService);
    this.notificationErrorMsg =  this.injector.get(NotificationErrorMsg);
    this.commonIconImg = this.injector.get(CommonIconImg);
    this.notificationService = this.injector.get(NotificationService);
    this.myAccountService = this.injector.get(MyAccountService);
    this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
	  this.activatedRoute = this.injector.get(ActivatedRoute);
    this.sharedService = this.injector.get(SharedService);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.verificationCode = params['prospectId'];
      this.customerKey = params['customerKey'];
    });
    if (this.verificationCode && this.customerKey) {
      this.confirmEmailVerificationMsg();
    }
    this.displayVerificationEmailButtons();
  }

  confirmEmailVerificationMsg() {
    try {
      this.startVerifyEmailRequestDto = new StartVerifyEmailRequestDto();
      this.startVerifyEmailRequestDto.VerificationCode = this.verificationCode;
      this.startVerifyEmailRequestDto.CustomerKey = this.customerKey;
      this.myAccountService.confirmVerifyEmail(this.startVerifyEmailRequestDto).subscribe(res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.startVerifyEmailResponseDto = this.responseData.Data;
            if (this.startVerifyEmailResponseDto.IsEmailVerifySuccess) {
              this.isConfirmEmailSuccess = true;
            } else {
              this.isConfirmEmailSuccess = false;
            }
          } else {
            this.notificationService.error(this.responseData.ResponseMessage);
          }
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  displayVerificationEmailButtons() {
    let customerKey = localStorage.getItem('CustomerKey');
    let customerEmail = localStorage.getItem('Email');
    if (customerKey && customerEmail) {
      this.isLoginUser = true;
    } else {
      this.isLoginUser = false;
    }
  }

  goToSign() {
    this.router.navigateByUrl(this.appRouteEnum.Login);
  }

  goToMyAccount() {
    this.router.navigateByUrl('/' + this.appRouteEnum.MyBookings);
  }

  goToBuyTickets() {
    window.location.href = environment.qttUrl;
  }


}
