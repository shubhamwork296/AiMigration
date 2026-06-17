import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AppRouteEnum, DiscountCodePopupEnum, DiscountCodeStatusEnum, TravelSolutionDirectionEnum } from 'src/app/utility/app-constants.service';
import { SharedService } from 'src/app/services/shared-sibling.service';
import { CommonServices } from 'src/app/services/common.service';

@Component({
  selector: 'app-discount-code-notification-popup',
  templateUrl: './discount-code-notification-popup.component.html',
  styleUrls: ['./discount-code-notification-popup.component.css']
})
export class DiscountCodeNotificationPopupComponent {
  Success: boolean;
  Message: string;
  headerTitle: string;
  OutwordDiscountCodeStatus: string;
  ReturnDiscountCodeStatus: string;
  discountCodeEnum: DiscountCodePopupEnum;
  discountCodeStatusEnum: DiscountCodeStatusEnum;
  appRouteEnum: AppRouteEnum;
  iconClose: boolean = false;
  travelSolutionDirectionEnum: TravelSolutionDirectionEnum;
  commonService: CommonServices; 
  IsContinueButtonVisible:boolean;
  IsGoBackButtonVisible:boolean;
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DiscountCodeNotificationPopupComponent>, 
  public sharedSibling : SharedService, private readonly injector: Injector, private readonly router: Router) {
    this.discountCodeEnum = this.injector.get(DiscountCodePopupEnum);
    this.discountCodeStatusEnum = this.injector.get(DiscountCodeStatusEnum);
    this.travelSolutionDirectionEnum = this.injector.get(TravelSolutionDirectionEnum);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.commonService = this.injector.get(CommonServices);
   
    if(data){
      this.OutwordDiscountCodeStatus = data?.OutwordDiscountCodeStatus;
      this.ReturnDiscountCodeStatus = data?.ReturnDiscountCodeStatus;
    }
    this.setHeaderTitleAccordingToDiscountCodeStatus();
  }

  setHeaderTitleAccordingToDiscountCodeStatus(){
   
    if(this.commonService.checkDiscountCodeActive(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)){
      this.headerTitle = this.discountCodeEnum?.discountCodeActiveTitle;
      this.iconClose = true;
      this.IsContinueButtonVisible=true;
      this.IsGoBackButtonVisible=false;
     
    } else if(this.commonService.checkDiscountCodeExpired(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)){
      this.headerTitle = this.discountCodeEnum?.discountCodeExpiredTitle;
      this.iconClose = false;
      this.IsContinueButtonVisible=true;
      this.IsGoBackButtonVisible=true;
    } 
    else if(this.commonService.checkReturndDiscountCodeExpiredOutwordActive(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)
    ||this.commonService.checkOutwordDiscountCodeExpiredReturnActive(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)
    || this.commonService.checkNoFareOutwordDiscountCodeAndReturnActive(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)
    ||this.commonService.checkNoFareReturnDiscountCodeAndOutwordActive(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)
    ||this.commonService.checkNoFareOutwordDiscountCodeAndReturnExpired(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)
    ||this.commonService.checkExpiredOutwordDiscountCodeAndReturnNoFare(this.OutwordDiscountCodeStatus,this.ReturnDiscountCodeStatus)){

      this.headerTitle = this.discountCodeEnum?.discountCodeIssuesTitle;
      this.iconClose = false;
      this.IsContinueButtonVisible=false;
      this.IsGoBackButtonVisible=true;
    } 
    else {
      this.headerTitle = this.discountCodeEnum?.noDiscountCodeFaresAvailableTitle;
      this.iconClose = false;
      this.IsContinueButtonVisible=true;
      this.IsGoBackButtonVisible=true;
    }
  }

  onClickOfCancelBtn(){
    this.dialogRef.close();
    this.router.navigate(["./"+ this.appRouteEnum.ViewBooking]);
  }
  
  onClickOfContinueBtn(){
    if(this.OutwordDiscountCodeStatus?.toUpperCase() === this.discountCodeStatusEnum?.expired?.toUpperCase() || this.OutwordDiscountCodeStatus?.toUpperCase() === this.discountCodeStatusEnum?.noFares?.toUpperCase()){
      this.dialogRef.close();
      this.commonService.callToggleOnChangeForNoFaresAndExpiredDiscountCode.next(true);
    }
  }
 
   

}