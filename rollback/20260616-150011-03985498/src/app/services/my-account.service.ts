import { Injectable, Injector } from '@angular/core';
import { ApiRouteService } from '../utility/api-reference.service';
import { HttpClientService } from '../utility/http-client.service';
import { GetPreferencesRequest, MyPreferencesRequest } from '../models/account/my-preferences.model';
import { SmartCardDto } from '../models/account/my-payment-vouchers.model';
import { CustomerServiceService } from './customer-service.service';
import { ResponseData } from '../models/common/response.model';
import { CustomerForgotPasswordResponse } from '../models/customer/customer-reset-password-request.model';
import { ForgotPasswordMsgEnum, NotificationErrorMsg } from '../utility/app-constants.service';
import { CommonServices } from './common.service';
import { DataLayerService } from '../utility/dataLayers/data-layer.service';
import { NotificationService } from '../utility/toastr-notification/toastr-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { MyProfileForgotPasswordComponent } from '../Component/my-account/my-profile/my-profile-forgot-password/my-profile-forgot-password.component';
import { Observable, Subject } from 'rxjs';
import { StartVerifyEmailResponseDto } from '../models/account/my-bookings.model';

@Injectable({
  providedIn: 'root'
})
export class MyAccountService {
  customerService: CustomerServiceService;
  responseData: ResponseData;
  resetPswSection: boolean = false;
  isSubmitted: boolean = false;
  customerForgotPasswordResponse: CustomerForgotPasswordResponse;
  forgotPasswordMsgEnum: ForgotPasswordMsgEnum;
  commonService: CommonServices;
  dataLayerService: DataLayerService;
  notificationService: NotificationService;
  showPasswordSection = false;
  IsEmailSend: boolean = false;
  sendEmailSuccess = new Subject<boolean>();
  sendEmailSuccess$: Observable<boolean> = this.sendEmailSuccess.asObservable();
  hideForgotPasswordSection = new Subject<boolean>();
  hideForgotPasswordSection$: Observable<boolean> = this.hideForgotPasswordSection.asObservable();
  showChangePasswordSection = new Subject<boolean>();
  showChangePasswordSection$: Observable<boolean> = this.showChangePasswordSection.asObservable();
  NotificationErrorMsg: NotificationErrorMsg;
  trackMyTrainLastUpdatedTimeSubject = new Subject<any>();
  trackMyTrainLastUpdatedTimeSubject$ = this.trackMyTrainLastUpdatedTimeSubject.asObservable();
  startVerifyEmailResponseDto: StartVerifyEmailResponseDto;
  
  constructor(private readonly httpClientService: HttpClientService, private readonly apiPath: ApiRouteService, private readonly injector: Injector, private readonly dialog: MatDialog) {
    this.customerService = this.injector.get(CustomerServiceService);
    this.forgotPasswordMsgEnum = this.injector.get(ForgotPasswordMsgEnum);
    this.commonService = this.injector.get(CommonServices);
    this.dataLayerService = this.injector.get(DataLayerService);
    this.notificationService = this.injector.get(NotificationService);
    this.NotificationErrorMsg = this.injector.get(NotificationErrorMsg);
  }

  //------- My Preferences Section -----//
  getMyBookings(CustomerBookingRequest: any) {
    return this.httpClientService.HttpPostRequest(CustomerBookingRequest, this.apiPath.getMyBookings);
  }

  buyAgain(BuyAgainRequestDto: any) {
    return this.httpClientService.HttpPostRequest(BuyAgainRequestDto, this.apiPath.buyAgain);
  }

  getMyPreferences(getPreferencesRequest: GetPreferencesRequest) {
    return this.httpClientService.HttpPostRequest(getPreferencesRequest, this.apiPath.getMyPreferences);
  }

  getConcentricToken(externalRef: any) {
    return this.httpClientService.HttpPostRequest(externalRef, this.apiPath.getConcentricToken + '?externalRef=' + externalRef);
  }

  saveMyPreferences(myPreferencesRequest: MyPreferencesRequest) {
    return this.httpClientService.HttpPostRequest(myPreferencesRequest, this.apiPath.saveMyPreferences);
  }

  updateAddress(customerInfoUpdateModel) {
    return this.httpClientService.HttpPostRequest(customerInfoUpdateModel, this.apiPath.updateAddress);
  }

  getCustomerDetails(_customerRequest) {
    return this.httpClientService.HttpPostRequest(null, this.apiPath.getCustomerDetails);
  }

  updatePersonalDetail(modifyPersonalDetailRequest) {
    return this.httpClientService.HttpPostRequest(modifyPersonalDetailRequest, this.apiPath.updatePersonalDetail);
  }

  callChangePassword(changePasswordRequest) {
    return this.httpClientService.HttpPostRequest(changePasswordRequest, this.apiPath.changePassword);
  }

  deleteAccount() {
    return this.httpClientService.HttpPostRequest(null, this.apiPath.deleteAccount);
  }

  //------- View Booking Section -----//
  getBookingDetails(bookingDetailsRequestDto: any) {
    return this.httpClientService.HttpPostRequest(bookingDetailsRequestDto, this.apiPath.getBookingDetails);
  }

  downloadTicket(eticketRequestDto: any) {
    return this.httpClientService.HttpPostRequest(eticketRequestDto, this.apiPath.downloadTicket);
  }

  fetchChangeSeat(changeSeatRequest: any, isReservationAvailable: boolean) {
    let apiPath = isReservationAvailable ? this.apiPath.changeSeat : this.apiPath.reserveSeat;
    return this.httpClientService.HttpPostRequest(changeSeatRequest, apiPath);
  }
  fetchViewSeatPickerPostSale(Request: any) {
    return this.httpClientService.HttpPostRequest(Request, this.apiPath.viewSeatPickerPostSale);
  }
  fetchChangeDate(changeDateRequest: any, isReturnTypeTicket: boolean) {
    let apiPath = isReturnTypeTicket ? this.apiPath.ChangeDateReturn : this.apiPath.changeDate;
    return this.httpClientService.HttpPostRequest(changeDateRequest, apiPath);
  }
  fetchSearchSimilarForReserveSeat(reserveSeatRequest: any) {
    return this.httpClientService.HttpPostRequest(reserveSeatRequest, this.apiPath.reserveSeat);
  }
  fetchDataPostSeatpickerAmend(Request: any) {
    return this.httpClientService.HttpPostRequest(Request, this.apiPath.PrepareOrderAmend);
  }

  //------- My Payment Vouchers -----//
  getPaymentVouchers(customerRequest: any) {
    return this.httpClientService.HttpPostRequest(customerRequest, this.apiPath.getPaymentVouchers);
  }

  myRequest() {
    return this.httpClientService.HttpPostRequest(null, this.apiPath.myRequestPath);
  }

  updatePaymentCards(updatePaymentCard: any) {
    return this.httpClientService.HttpPostRequest(updatePaymentCard, this.apiPath.updatePaymentCards);
  }
  linkSmartCard(smartCardRequest:SmartCardDto){
    return this.httpClientService.HttpPostRequest(smartCardRequest,this.apiPath.linkSmartcard);
  }
  unLinkSmartCard(smartCardRequest:SmartCardDto){
    return this.httpClientService.HttpPostRequest(smartCardRequest,this.apiPath.unLinkSmartcard);
  }
  orderSmartCard(orderSmartCardRequestDto:any)
  {
    return this.httpClientService.HttpPostRequest(orderSmartCardRequestDto,this.apiPath.orderSmartcard)
  }

  confirmSmartCard(confirmSmartCardRequest: any){
    return this.httpClientService.HttpPostRequest(confirmSmartCardRequest,this.apiPath.confirmSmartCard)
  }

  transferSmartCard(transferSmartCardRequest: any){
    return this.httpClientService.HttpPostRequest(transferSmartCardRequest,this.apiPath.transferSmartCard)
  }

  transferSmartCardConfirm(transferSmartCardConfirmRequest: any){
    return this.httpClientService.HttpPostRequest(transferSmartCardConfirmRequest,this.apiPath.transferSmartCardConfirm)
  }

  linkSmartCardConfirm(linkSmartCardConfirm: any){
    return this.httpClientService.HttpPostRequest(linkSmartCardConfirm,this.apiPath.linkSmartcardConfirm);
  }

  renewSmartcard(renewSmartcardRequest:any){
    return this.httpClientService.HttpPostRequest(renewSmartcardRequest,this.apiPath.renewSmartcard)
  }

  registerSmartCard(registerSmartCardRequest: any){
    return this.httpClientService.HttpPostRequest(registerSmartCardRequest,this.apiPath.registerSmartCard);
  }

  changeSmartcardApi(changeSmartcard: any){
    return this.httpClientService.HttpPostRequest(changeSmartcard,this.apiPath.changeSmartcard);
  }

  replaceSmartcardApi(replaceSmartcard: any){
    return this.httpClientService.HttpPostRequest(replaceSmartcard,this.apiPath.replaceSmartcard);
  }

  getBookingRefundDetails(RefundDetailsRequest: any) {
    return this.httpClientService.HttpPostRequest(RefundDetailsRequest, this.apiPath.getBookingRefundDetails);
  }

  processOrderRefund(processOrderRequest: any) {
    return this.httpClientService.HttpPostRequest(processOrderRequest, this.apiPath.confirmRefundDetails);
  }

  getPostSaleBikes(postSaleBikesRequest){
    return this.httpClientService.HttpPostRequest(postSaleBikesRequest, this.apiPath.getPostSaleBikes);
  }

  evaluateAndReservePostSaleBikes(evalAndReservePostSaleBikesDto){
    return this.httpClientService.HttpPostRequest(evalAndReservePostSaleBikesDto, this.apiPath.evalAndReservePostSaleBikes);
  }

  sendEmailToResetPassword(_CustomerSendMailRequst: any, isMyProfile, resetPswForm) {
    this.customerService.sendEmailToResetPasswordCustomer(_CustomerSendMailRequst).subscribe(res => {

      if (res != null) {
        this.responseData = res as ResponseData;

        if (this.responseData.ResponseCode == '200') {

          this.customerForgotPasswordResponse = this.responseData.Data;
          
          this.dataLayerService.loadGTMDataLayerOnResetPassword('Forgot Password', true, '');
          this.customerForgotPasswordResponse.ResponseMessage = this.forgotPasswordMsgEnum.resetEmailSuccessMessage;

          this.IsEmailSend = true;
          this.sendEmailSuccess.next(this.IsEmailSend);

          if (isMyProfile) this.passwordResetLinkConfirmationPopup(this.IsEmailSend, resetPswForm, this.NotificationErrorMsg.passwordResetLinkTitle, true);
        } else {
          this.notificationService.warn(this.responseData.Error);
          this.dataLayerService.loadGTMDataLayerOnResetPassword('Forgot Password', false, this.responseData.Error);
        }
      }
    });
  }
  passwordResetLinkConfirmationPopup(IsEmailSend, resetPswForm, headerTitle, displayedSuccessIcon) {
    let dialogRef = this.dialog.open(MyProfileForgotPasswordComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'common-popup-theme',
      autoFocus: false,
      restoreFocus: false,
      data: { IsEmailSend: IsEmailSend, headerTitle: headerTitle, displayedSuccessIcon: displayedSuccessIcon }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.resetPswSection = false;
      this.hideForgotPasswordSection.next(this.resetPswSection);
      this.showPasswordSection = false;
      this.showChangePasswordSection.next(this.showPasswordSection);
      resetPswForm.reset();
    });
  }

  //PICO-2799 call function for change email address request
  userChangeEmailRequest(changeEmailRequest: any) {
    return this.httpClientService.HttpPostRequest(changeEmailRequest, this.apiPath.changeEmail);
  }

  vatReceiptDataRequest(vatReceiptRequest: any){
    return this.httpClientService.HttpPostRequest(vatReceiptRequest, this.apiPath.vatReceipt);
  }

  //PICO-2799 call function for verify user change email address request
  verifyUserChangeEmailRequest(changeEmailRequest: any) {
    return this.httpClientService.HttpPostRequest(changeEmailRequest, this.apiPath.verifyChangeEmail);
  }
  
  getTrackMyTrainInfo(refreshTrackMyTrainRequest: any){
    return this.httpClientService.HttpPostRequest(refreshTrackMyTrainRequest, this.apiPath.getTrackMyTrainInfo);
  }

  verifyEmailRequest(verifyEmailRequest: any) {
    return this.httpClientService.HttpPostRequest(verifyEmailRequest, this.apiPath.verificationEmail);
  }

  confirmVerifyEmail(confirmVerifyEmail: any) {
    return this.httpClientService.HttpPostRequest(confirmVerifyEmail, this.apiPath.confirmVerifyEmail);
  }

  //PICO-3141 call method for user verification email request
  sentRequestToVerifyEmail(_CustomerSendMailToVerifyEmail: any) {
    try {
      this.verifyEmailRequest(_CustomerSendMailToVerifyEmail).subscribe(res => {
        if (res != null) {
          this.responseData = res as ResponseData;
          if (this.responseData.ResponseCode == '200') {
            this.startVerifyEmailResponseDto = this.responseData.Data;
            if (this.startVerifyEmailResponseDto.IsVerifyEmailSent || this.startVerifyEmailResponseDto.IsEmailAlreadyVerified) {
              this.commonService.successEmailVerificationLinkPopup(this.startVerifyEmailResponseDto.InfoMessage, this.startVerifyEmailResponseDto.MessageHeading, true, '');
            } else {
              this.commonService.successEmailVerificationLinkPopup(this.startVerifyEmailResponseDto.ErroMessage, this.startVerifyEmailResponseDto.MessageHeading, '', true);
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

  getFilteredJourney(confirmVerifyEmail: any) {
    return this.httpClientService.HttpPostRequest(confirmVerifyEmail, this.apiPath.bookingFilter);
  }
}
