import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard'
import { AppRouteEnum, ClubAvantiEnum, RewardCodeTypesEnum } from 'src/app/utility/app-constants.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-club-avanti-basic-dialog',
    templateUrl: './club-avanti-basic-dialog.component.html',
    styleUrls: ['./club-avanti-basic-dialog.component.css'],
    standalone: false
})
export class ClubAvantiBasicDialogComponent  {
  headerTitle: string;
  barCode: string;
  codeType: string;
  rewardCodeTypeEnum: RewardCodeTypesEnum;
  clubAvantiRewardHotDrinkIcon: boolean = false;
  clubAvantiTrainTicketIcon: boolean = false;
  barCodeWidth = 2;
  barCodeHeight = 54;
  barCodeMargin = 0;
  barCodeMarginTop = 0;
  barCodeMarginBottom = 2;
  barCodeMarginLeft = 0;
  barCodeMarginRight = 0;
  barCodeFontSize = 14;
  barCodeFont = 'Averta, Helvetica, Verdana, Arial, Sans-Serif';
  appRouteEnum: AppRouteEnum;
  clubAvantiEnum: ClubAvantiEnum;

  
  constructor(@Inject(MAT_DIALOG_DATA) public data:any, public dialogRef: MatDialogRef<ClubAvantiBasicDialogComponent>,
   private readonly clipboard: Clipboard, private readonly injector: Injector) {
    this.rewardCodeTypeEnum = this.injector.get(RewardCodeTypesEnum);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.clubAvantiEnum = this.injector.get(ClubAvantiEnum);
    if(data){
      this.headerTitle = this.data?.headerTitle;
      this.barCode = this.data?.barCode;
      this.codeType =  this.data?.codeType;
    }
  }

  copyBarCodeText(){
    this.clipboard.copy(this.barCode);
  }

  onClickOnTermsAndCondition(){
    window.open(`${environment.qttUrl}${this.appRouteEnum.clubAvantiTermsAndCondition}`, '_blank');
  }

  showRewardDescription(rewardCodeType){
    let rewardTitle;
    switch(rewardCodeType.toLowerCase()){
        case this.rewardCodeTypeEnum.eCom.toLowerCase():
            rewardTitle = this.clubAvantiEnum.myProgressTierStandardReturnRewardText;
            break;
        case this.rewardCodeTypeEnum.stdPrem.toLowerCase():
            rewardTitle = 'a ' + this.clubAvantiEnum.myProgressTierStandardPremiumRewardText.charAt(0).toLowerCase() + this.clubAvantiEnum.myProgressTierStandardPremiumRewardText.slice(1);
            break;
        case this.rewardCodeTypeEnum.compFirstClass.toLowerCase():
            rewardTitle = 'a ' + this.clubAvantiEnum.myProgressTierFirstClassRewardText.charAt(0).toLowerCase() + this.clubAvantiEnum.myProgressTierFirstClassRewardText.slice(1);
            break;
    }
    return rewardTitle;
  }

  hasTenPercentDiscountOrHotCoffeeTypeReward(){
    return this.codeType?.includes(this.rewardCodeTypeEnum.tenPercentDiscount) || this.codeType?.includes(this.rewardCodeTypeEnum.freeCoffee) || this.codeType?.includes(this.rewardCodeTypeEnum.compFirstClassLounge)
  }
}
