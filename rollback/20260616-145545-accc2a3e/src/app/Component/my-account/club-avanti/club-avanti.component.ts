import { Component, ElementRef, Injector, OnInit } from "@angular/core";
import * as moment from "moment";
import { NgxSpinnerService } from "ngx-spinner";
import { ClubAvantiJourneylistResponseDto, ClubAvantiMemberShipDetailsRequestDto, ClubAvantiMemberShipDetailsResponseDto, ClubAvantiRewardDetailRequestDto, ClubAvantiRewardDetailResponseDto, RegisterToClubAvantiRequestDto } from "src/app/models/account/club-avanti.model";
import { ResponseData } from "src/app/models/common/response.model";
import { ClubAvantiService } from "src/app/services/club-avanti.service";
import { CommonServices } from "src/app/services/common.service";
import { LocalStorageKeyEnum, ClubAvantiEnum, ClubAvantiTierEnum, NotificationErrorMsg, RewardButtonStatusEnum, RewardCodeTypesEnum, AppRouteEnum, ClubAvantiTierMaxAndMinJourneyEnum, RewardSubCategoryEnum, RewardCategoryEnum } from "src/app/utility/app-constants.service";
import { NotificationService } from "src/app/utility/toastr-notification/toastr-notification.service";
import { ClubAvantiBasicDialogComponent } from "./club-avanti-basic-dialog/club-avanti-basic-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ViewPreviousJourneyDialogComponent } from "./view-previous-journey-dialog/view-previous-journey-dialog.component";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { SharedService } from "src/app/services/shared-sibling.service";
import { Subscription } from "rxjs";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";

@Component({
    selector: 'app-club-avanti',
    templateUrl: './club-avanti.component.html',
    styleUrls: ['./club-avanti.component.css']
})

export class ClubAvantiComponent implements OnInit {
    hideHeaderFlag: boolean = true;
    myProfileHideHeaderFlag: boolean = true;
    clubAvantiEnum: ClubAvantiEnum;
    customerKey: string;
    localStorageKeyEnum: LocalStorageKeyEnum;
    commonService: CommonServices;
    clubAvantiAPI_Service: ClubAvantiService;
    responseData: ResponseData;
    notificationService: NotificationService;
    clubAvantiMemberShipDetailResponse: ClubAvantiMemberShipDetailsResponseDto;
    clubAvantiMemberShipDetailRequest: ClubAvantiMemberShipDetailsRequestDto;
    silverTierDivId: string;
    golderTierDivId: string;
    platinumTierDivId: string;
    showOrHideAllTiersBtnText: string;
    noOfJourneysAvailableInSilverTier = [1,2,3,4,5,6,7,8];
    noOfJounreysAvailableInGoldeTier = [9,10,11,12,13,14,15,16,17,18,19,20];
    clubAvantiTierEnum: ClubAvantiTierEnum;
    showSilverTierDiv: boolean = false;
    showGoldTierDiv: boolean = false;
    showPlatinumDiv: boolean = false;
    showQualifyingSilverTierDiv: boolean = false;
    showQualifyingGoldTierDiv: boolean = false;
    showQualifyingPlatinumDiv: boolean = false;
    atTheStationRewardsObject;
    travelDiscountsRewardsObject;
    alwaysOnBenefitRewardsObject;
    showOrLessMemberShipDetailBtnText: boolean = true;
    registerToClubAvantiRequest: RegisterToClubAvantiRequestDto;
    joinClubAvantiCheckbox: boolean = false;
    isLoaderOnJoinClubAvantiBtn: boolean = false;
    spinnerService: NgxSpinnerService;
    notificationErrorMsg: NotificationErrorMsg;
    clubAvantiRewardsDetailRequest: ClubAvantiRewardDetailRequestDto;
    clubAvantiRewardDetailResponse: ClubAvantiRewardDetailResponseDto;
    rewardStatusEnum: RewardButtonStatusEnum;
    rewardApiInterval;
    clubAvantiJourneyDetailResponse: ClubAvantiJourneylistResponseDto;
    rewardCodeTypeEnum: RewardCodeTypesEnum;
    appRouteEnum: AppRouteEnum;
    clubAvantiTierMaxAndMinJourneyEnum: ClubAvantiTierMaxAndMinJourneyEnum;
    sharedService: SharedService;
    isThisInternalServerError: boolean = false;
    clubAvantiTechnicalErrorSubscription: Subscription;
    rewardsSubCategoryEnum: RewardSubCategoryEnum;
    rewardCategoryEnum: RewardCategoryEnum;
    customerFirstName: string;
    ga4dataLayerService: GA4DatalayerService;

    constructor(private readonly injector: Injector, private readonly el: ElementRef, public dialog: MatDialog, public router: Router){
        this.clubAvantiEnum = this.injector.get(ClubAvantiEnum);
        this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
        this.commonService = this.injector.get(CommonServices);
        this.clubAvantiAPI_Service = this.injector.get(ClubAvantiService);
        this.notificationService = this.injector.get(NotificationService);
        this.clubAvantiTierEnum = this.injector.get(ClubAvantiTierEnum);
        this.spinnerService = this.injector.get(NgxSpinnerService);
        this.clubAvantiMemberShipDetailRequest = new ClubAvantiMemberShipDetailsRequestDto();
        this.registerToClubAvantiRequest = new RegisterToClubAvantiRequestDto();
        this.notificationErrorMsg = this.injector.get(NotificationErrorMsg);
        this.clubAvantiRewardsDetailRequest = new ClubAvantiRewardDetailRequestDto();
        this.rewardStatusEnum = this.injector.get(RewardButtonStatusEnum);
        this.rewardCodeTypeEnum = this.injector.get(RewardCodeTypesEnum);
        this.appRouteEnum = this.injector.get(AppRouteEnum);
        this.clubAvantiTierMaxAndMinJourneyEnum = this.injector.get(ClubAvantiTierMaxAndMinJourneyEnum);
        this.sharedService = this.injector.get(SharedService);
        this.rewardsSubCategoryEnum = this.injector.get(RewardSubCategoryEnum);
        this.rewardCategoryEnum = this.injector.get(RewardCategoryEnum);
        this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    }

    ngOnInit(){
        // page_meta_data -- Ga4-datalayer event
        this.ga4dataLayerService.loadGA4DataLayerAllPages(true);
        this.customerKey = localStorage.getItem(this.localStorageKeyEnum.customerKey);
        this.showOrHideAllTiersBtnText = this.clubAvantiEnum?.showAllTierBtnText;
        this.getClubAvantiMemberShipDetailApiCall();
        this.clubAvantiTechnicalErrorSubscription = this.commonService.clubAvantiTechnicalError$.subscribe(value => {
            this.isThisInternalServerError = value.isThisClubAvantiTechnicalError;
            if(this.isThisInternalServerError){
                this.callGA4DataLayerForTechnicalErrorClubAvanti(value.errorMessage);
            }
        });
        this.customerFirstName = localStorage.getItem('FirstName');
        if (this.sharedService?.reviewBuyResponse) {
            this.sharedService.reviewBuyCache = this.sharedService.reviewBuyResponse.ReviewBuyCache;
            this.sharedService.getBasketCount.emit(this.sharedService.reviewBuyResponse.BasketCount);
        }
    }

    getClubAvantiMemberShipDetailApiCall(){
        this.clubAvantiMemberShipDetailRequest.customerKey = this.customerKey;
        try{
            this.commonService.loaderRequired = true;
            this.clubAvantiAPI_Service.getClubAvantiMemberShipDetail(this.clubAvantiMemberShipDetailRequest).subscribe(res =>{
                if(res != null){
                    this.responseData = res as ResponseData;
                    if(this.responseData.ResponseCode == '200'){
                        this.clubAvantiMemberShipDetailResponse = this.responseData?.Data;
                        this.filterAtTheStationRewards();
                        this.filterTravelDiscountsRewards();
                        this.filterAlwaysOnBenefitRewards();
                        this.showOrHideGoldPlatinumAndSilverTierDiv();
                    }
                } 
                
            });
        } catch(error){
            console.log(error);
        }
    }

    showOrHideTiersDetail(){
        if(this.showOrHideAllTiersBtnText == this.clubAvantiEnum?.showAllTierBtnText){
            this.showGoldTierDiv = true;
            this.showSilverTierDiv = true;
            this.showPlatinumDiv = true;
            this.showQualifyingSilverTierDiv = true;
            this.showQualifyingGoldTierDiv = false;
            this.showQualifyingPlatinumDiv = false;
        } else {
            this.showOrHideGoldPlatinumAndSilverTierDiv();
        }
        this.showOrHideAllTiersBtnText = this.showOrHideAllTiersBtnText === this.clubAvantiEnum?.showAllTierBtnText ? this.clubAvantiEnum?.showLessTierBtnText : this.clubAvantiEnum?.showAllTierBtnText;
    }

    showOrHideGoldPlatinumAndSilverTierDiv(){
        if(this.clubAvantiMemberShipDetailResponse?.LoyaltyTier?.toLowerCase() == this.clubAvantiTierEnum?.silverTier?.toLowerCase()){
            this.showSilverTierDiv = true;
            this.showGoldTierDiv = false;
            this.showPlatinumDiv = false;
            this.showQualifyingSilverTierDiv = true;
            this.showQualifyingGoldTierDiv = false;
            this.showQualifyingPlatinumDiv = false;
        } else if(this.clubAvantiMemberShipDetailResponse?.LoyaltyTier?.toLowerCase() == this.clubAvantiTierEnum?.goldTier?.toLowerCase()){
            this.showSilverTierDiv = false;
            this.showGoldTierDiv = true;
            this.showPlatinumDiv = false;
            this.showQualifyingSilverTierDiv = false;
            this.showQualifyingGoldTierDiv = true;
            this.showQualifyingPlatinumDiv = false;
        } else if(this.clubAvantiMemberShipDetailResponse?.LoyaltyTier?.toLowerCase() == this.clubAvantiTierEnum?.platinumTier?.toLowerCase()){
            this.showSilverTierDiv = false;
            this.showGoldTierDiv = false;
            this.showPlatinumDiv = true;
            this.showQualifyingSilverTierDiv = false;
            this.showQualifyingGoldTierDiv = false;
            this.showQualifyingPlatinumDiv = true;
        }
    }

    addClassOnTrainIconAccordingToCompletedTrip(tripNo){
        if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= tripNo){
            return true;
        }
        return false;
    }

    displayTierRewardMessageHeading(){
        let rewardMessageHeading;
        if(this.clubAvantiMemberShipDetailResponse?.LoyaltyTier?.toLowerCase() == this.clubAvantiTierEnum?.silverTier?.toLowerCase()){
            if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted <= 5){
                rewardMessageHeading = this.clubAvantiEnum?.myProgressSilverTierStartAwayRewardHeadingText;
            } else if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted > 5){
                rewardMessageHeading = this.clubAvantiEnum?.myProgressSilverTierNearlyAtGoldTierRewardHeadingText;
            }
        } else if(this.clubAvantiMemberShipDetailResponse?.LoyaltyTier?.toLowerCase() == this.clubAvantiTierEnum?.goldTier?.toLowerCase()){
            if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= 9 && this.clubAvantiMemberShipDetailResponse?.TripsCompleted < 16){
                rewardMessageHeading = this.clubAvantiEnum?.myProgressGoldTierWelcomeRewardHeadingText;
            } else{
                rewardMessageHeading = this.clubAvantiEnum?.myProgessGoldTierNearlyAtPlatinumRewardHeadingText;
            }
        } else {
            rewardMessageHeading = this.clubAvantiEnum?.myProgressPlatinumTierWelcomeRewardHeadingText;
        }
        return rewardMessageHeading;
    }

    filterAtTheStationRewards(){
        this.atTheStationRewardsObject = this.clubAvantiMemberShipDetailResponse?.MyReward?.RewardsList?.filter(e => 
            e.RewardSubCategoryCode === this.rewardsSubCategoryEnum?.atTheStationRewardSubCategory);
    }

    filterTravelDiscountsRewards(){
        this.travelDiscountsRewardsObject = this.clubAvantiMemberShipDetailResponse?.MyReward?.RewardsList?.filter(e => 
            e.RewardSubCategoryCode === this.rewardsSubCategoryEnum?.travelDiscountRewardSubCategory);
    }

    filterAlwaysOnBenefitRewards(){
        this.alwaysOnBenefitRewardsObject = this.clubAvantiMemberShipDetailResponse?.MyReward?.RewardsList?.filter(e => 
            e.RewardCategoryCode?.toLowerCase() === this.rewardCategoryEnum?.benefitCategory?.toLowerCase());
    }

    onClickOfMemberShipDetailsBtn(){
        this.showOrLessMemberShipDetailBtnText = !this.showOrLessMemberShipDetailBtnText;
    }

    registerToClubAvantiApiCall() {
        this.registerToClubAvantiRequest.CustomerKey = this.customerKey;
        this.registerToClubAvantiRequest.FirstName = localStorage.getItem(this.localStorageKeyEnum.firstName);
        this.isLoaderOnJoinClubAvantiBtn = true;
        try{
            this.clubAvantiAPI_Service.registerToClubAvanti(this.registerToClubAvantiRequest).subscribe(res => {
                if(res != null){
                    this.responseData = res as ResponseData;
                    if(this.responseData.ResponseCode == '200'){
                        this.isThisInternalServerError = false;
                        this.isLoaderOnJoinClubAvantiBtn = false;
                        this.clubAvantiMemberShipDetailResponse = this.responseData?.Data;
                    }
                }
            });
        } catch(error){
            console.log(error);
        }
    }

    openLoyaltySignupPopup(){
        if(this.joinClubAvantiCheckbox){
            this.registerToClubAvantiApiCall();
        }
    }

    showUpcomingLoyaltyTierMessage(){
        if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= 0 && this.clubAvantiMemberShipDetailResponse?.TripsCompleted <= this.clubAvantiTierMaxAndMinJourneyEnum.maxJourneyForSilver){
            return `needed for ${this.clubAvantiTierEnum?.goldTier} rewards`;
        } else if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted < this.clubAvantiTierMaxAndMinJourneyEnum.minJourneyForPlatinum){
            return `needed for ${this.clubAvantiTierEnum?.platinumTier} rewards`;
        }
    }

    showUpcomingLoyaltyTierMessageOnBookNowBanner(){
        if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= 0 && this.clubAvantiMemberShipDetailResponse?.TripsCompleted <= this.clubAvantiTierMaxAndMinJourneyEnum.maxJourneyForSilver){
            return this.remainingJourneysToCompleteCurrentTier() > 1 ? `more qualifying journeys till ${this.clubAvantiTierEnum?.goldTier}` : `more qualifying journey till ${this.clubAvantiTierEnum?.goldTier}`;
        } else if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted < this.clubAvantiTierMaxAndMinJourneyEnum.minJourneyForPlatinum){
            return this.remainingJourneysToCompleteCurrentTier() > 1 ? `more qualifying journeys till ${this.clubAvantiTierEnum?.platinumTier}` : `more qualifying journey till ${this.clubAvantiTierEnum?.platinumTier}`;
        }
    }

    remainingJourneysToCompleteCurrentTier(){
        if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= 0 && this.clubAvantiMemberShipDetailResponse?.TripsCompleted <= this.clubAvantiTierMaxAndMinJourneyEnum.maxJourneyForSilver){
            return this.clubAvantiTierMaxAndMinJourneyEnum.minJourneyForGold - this.clubAvantiMemberShipDetailResponse?.TripsCompleted; // We have used 9 bcz when user is on silver tier and completed 8 journey's that time we need to show 1 journey remains to react next tier
        } else if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted < this.clubAvantiTierMaxAndMinJourneyEnum.minJourneyForPlatinum){
            return this.clubAvantiTierMaxAndMinJourneyEnum.minJourneyForPlatinum - this.clubAvantiMemberShipDetailResponse?.TripsCompleted; // We have used 21 bcz when user is on gold tier and completed 20 journey's that time we need to show 1 journey remains to react next tier
        }
    }

    setRewardBtnStatus(rewardCodeStatus: string){
        if(rewardCodeStatus.toLowerCase() == this.rewardStatusEnum?.redeemed.toLowerCase()){
            return this.rewardStatusEnum?.redeemed;
        } else if(rewardCodeStatus.toLowerCase() == this.rewardStatusEnum?.expired.toLowerCase()){
            return this.rewardStatusEnum?.expired;
        } else {
            return this.rewardStatusEnum?.active;
        }
    }

    getClubAvantiJourneyList(){
        this.callGA4DataLayerOnClickOfViewJourneyHistory(this.router.url);
        this.clubAvantiRewardsDetailRequest.CustomerAccountId = this.clubAvantiMemberShipDetailResponse.CustomerAccountId.toString();
        try{
            this.clubAvantiAPI_Service.getClubAvantiJourneyList(this.clubAvantiRewardsDetailRequest).subscribe(res=>{
                if(res != null){
                    this.responseData = res as ResponseData;
                    if(this.responseData.ResponseCode == '200'){
                        this.clubAvantiJourneyDetailResponse = this.responseData?.Data;
                        this.openPreviousJourneyPopup();
                    }
                }
            })
        } catch(error){
            console.log(error);
        }
    }

    setRewardsDateAccordingToStatus(rewardCodeStatus, rewardDate){
        if(rewardCodeStatus.toLowerCase() == this.rewardStatusEnum?.redeemed.toLowerCase()){
            return `${this.rewardStatusEnum?.redeemed} on ${moment(new Date(rewardDate)).format('DD MMMM YYYY')}`;
        } else if(rewardCodeStatus.toLowerCase() == this.rewardStatusEnum?.expired.toLowerCase()){
            return `${this.rewardStatusEnum?.expired} ${moment(new Date(rewardDate)).format('DD MMMM YYYY')}`;
        } else {
            return `Expires ${moment(new Date(rewardDate)).format('DD MMMM YYYY')}`;
        }
    }

    openClubAvantiBarCodePopup(selectedReward) {
        this.dialog.open(ClubAvantiBasicDialogComponent, {
            width: '600px',
            disableClose: true,
            panelClass: 'common-popup-theme',
            autoFocus: false,
            restoreFocus: false,
            data: {
                codeType: selectedReward?.CodeType,
                barCode: selectedReward?.Code,
                headerTitle: selectedReward?.RewardCategoryCodeDescription
            }
        });
        this.ga4dataLayerService.loadGALayerForClubAvantiRewardsAndBenefits(this.router.url, selectedReward);
    }

    openPreviousJourneyPopup(){
        this.dialog.open(ViewPreviousJourneyDialogComponent, {
            width: '600px',
            disableClose: true,
            panelClass: 'common-popup-theme',
            autoFocus: false, 
            restoreFocus: false,
            data: {
                previousJourneyList: this.clubAvantiJourneyDetailResponse.JourneyList
            }
        });
        this.ga4dataLayerService.loadGALayerForViewJourneyHistory(this.clubAvantiJourneyDetailResponse?.JourneyList?.slice(0,5));
    }

    addZeroBeforeTripCompletedNumber(tripCompleted){
        if(tripCompleted.toString().length > 1){
            return tripCompleted;
        } else{
            return `0${tripCompleted}`;
        }
    }

    noOfRewardsTextMessage(rewardCount){
        return rewardCount > 1 ? `${rewardCount} rewards` : `${rewardCount} reward`;
    }

    onClickOfBookNow(){
        this.callGA4DataLayerOnClickOfBannerBookNowBtn(this.router.url, '/'+ this.appRouteEnum.clubAvantiBookNowURL);
        window.location.href = environment.qttUrl;
    }

    onClickOfAddAndUpdateMobileNo() {
        this.router.navigate([`./` + this.appRouteEnum.MyProfile], {fragment: 'mp-personal-form'});
    }

    onClickOfUpdateCommsPref() {
        this.router.navigate([`./`, this.appRouteEnum.MyPreferences], {fragment: 'mp-communication'});
    }

    showAddOrUpdateMobileNoText(mobileNo){
        return mobileNo ? 'Update mobile number' : 'Add mobile number';
    }

    onClickSetUpAnAlert(){
        window.open(`${environment.qttUrl}${this.appRouteEnum.setUpAnAlertClubAvanti}`, '_blank');
    }

    onClickViewClubAvantiFAQ(){
        window.open(`${environment.qttUrl}${this.appRouteEnum.viewClubAvantiFAQ}`, '_blank');
    }

    onClickOnTermsAndCondition(){
        window.open(`${environment.qttUrl}${this.appRouteEnum.clubAvantiTermsAndCondition}`, '_blank');
    }

    rewardsForTravelDiscountsSection(reward){
        return (reward?.CodeType?.toLowerCase() ==  this.rewardCodeTypeEnum?.eCom?.toLowerCase() || reward?.CodeType?.toLowerCase() ==  this.rewardCodeTypeEnum?.stdPrem?.toLowerCase() || reward?.CodeType?.toLowerCase() ==  this.rewardCodeTypeEnum?.compFirstClass?.toLowerCase());
    }

    rewardsForAtTheStationSection(reward){
        return (reward?.CodeType?.toLowerCase() ==  this.rewardCodeTypeEnum.freeCoffee.toLowerCase() || reward?.CodeType?.toLowerCase() ==  this.rewardCodeTypeEnum.compFirstClassLounge.toLowerCase());
    }

    checkToShowRedeemAndBookNowBtn(reward){
        return (reward?.RewardCodeStatus?.toLowerCase() !== this.rewardStatusEnum?.redeemed?.toLowerCase() && reward?.RewardCodeStatus?.toLowerCase() !== this.rewardStatusEnum?.expired?.toLowerCase());
    }

    calculateDateDifference(memberShiprRefreshDate){
        let currentDate = moment(new Date()).subtract(1,'day');
        let dateDiff = moment(new Date(memberShiprRefreshDate)).diff(currentDate,"days");
        
        return dateDiff > 1 ? `(${dateDiff} days to go)` : `(${dateDiff} day to go)`;
    }

    scrollIntoViewOnRewardsSection(){
        document.querySelector('#rewardSectionDiv').scrollIntoView();
    }

    onRefreshClick(){
       location.reload();
    }

    bindRewardIcon(rewardCodeType, rewardCodeStatus){
        let iconImage;
        switch(rewardCodeType.toLowerCase()){
            case this.rewardCodeTypeEnum.tenPercentDiscount.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/discounted_shops-gray.svg" : "assets/images/club-avanti/discounted_shops.svg";
                break;
            case this.rewardCodeTypeEnum.freeCoffee.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/hot_drinks-gray.svg" : "assets/images/club-avanti/hot_drinks.svg";
                break;
            case this.rewardCodeTypeEnum.eCom.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/ten-percent-off-first-journey-gray.svg" : "assets/images/club-avanti/ten-percent-off-first-journey.svg";
                break;
            case this.rewardCodeTypeEnum.stdPrem.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/free_SP_ticket-gray.svg" : "assets/images/club-avanti/free_SP_ticket.svg";
                break;
            case this.rewardCodeTypeEnum.compFirstClass.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/free_first_ticket-gray.svg" : "assets/images/club-avanti/free_first_ticket.svg";
                break;
            case this.rewardCodeTypeEnum.compFirstClassLounge.toLowerCase():
                iconImage = this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus) ? 
                "assets/images/club-avanti/first_class_lounge_access-gray.svg" : "assets/images/club-avanti/first_class_lounge_access.svg";
                break;
        }
        return iconImage;
    }

    bindAltAttributeOfRewardIcon(rewardCodeType){
        let rewardMessage;
        switch(rewardCodeType.toLowerCase()){
            case this.rewardCodeTypeEnum.tenPercentDiscount.toLowerCase():
                rewardMessage = this.clubAvantiEnum.tenPercentLoyaltyRewardText + ' icon';
                break;
            case this.rewardCodeTypeEnum.freeCoffee.toLowerCase():
                rewardMessage = this.clubAvantiEnum.freeHotDrinkOnBoardRewardText + ' icon';;
                break;
            case this.rewardCodeTypeEnum.eCom.toLowerCase():
                rewardMessage = this.clubAvantiEnum.myProgressTierStandardReturnRewardText + ' icon';;
                break;
            case this.rewardCodeTypeEnum.stdPrem.toLowerCase():
                rewardMessage = this.clubAvantiEnum.myProgressTierStandardPremiumRewardText + ' icon';;
                break;
            case this.rewardCodeTypeEnum.compFirstClass.toLowerCase():
                rewardMessage = this.clubAvantiEnum.myProgressTierFirstClassRewardText + ' icon';;
                break;
            case this.rewardCodeTypeEnum.compFirstClassLounge.toLowerCase():
                rewardMessage = this.clubAvantiEnum.myProgressTierFirstClassLoungeRewardText + ' icon';
                break;
        }
        return rewardMessage;
    }

    showQualifyingJourneyProgressBar(){
        let cssNamePrefix = "qualifying-journeys-";
        if(this.clubAvantiMemberShipDetailResponse?.TripsCompleted >= 21){
            return `${cssNamePrefix}21`;
        }else if (this.hideProgressBarIconInCaseOfZeroOrNullJourneys()){
            return `${cssNamePrefix}${this.clubAvantiMemberShipDetailResponse?.TripsCompleted} p-0`;
        }else{
            return `${cssNamePrefix}${this.clubAvantiMemberShipDetailResponse?.TripsCompleted}`;
        }
    }

    hideProgressBarIconInCaseOfZeroOrNullJourneys(){
        return this.clubAvantiMemberShipDetailResponse?.TripsCompleted == 0 || this.clubAvantiMemberShipDetailResponse?.TripsCompleted == null;
    }

    showClubAvantiRegistrationOrInProcessBanner(){
        return !this.isThisInternalServerError && this.clubAvantiMemberShipDetailResponse && !this.clubAvantiMemberShipDetailResponse?.IsRegistrationError && (!this.clubAvantiMemberShipDetailResponse?.IsRegisteredToLoyality || this.clubAvantiMemberShipDetailResponse?.IsRegistrationInProgress);
    }

    showClubAvantiRegisteredUserJourneyDetailDiv(){
        return !this.isThisInternalServerError && this.clubAvantiMemberShipDetailResponse && !this.clubAvantiMemberShipDetailResponse?.IsRegistrationError && (this.clubAvantiMemberShipDetailResponse?.IsRegisteredToLoyality && !this.clubAvantiMemberShipDetailResponse?.IsRegistrationInProgress);
    }

    ngOnDestroy(){
        if (this.rewardApiInterval) {
            clearInterval(this.rewardApiInterval);
        }
        this.clubAvantiTechnicalErrorSubscription?.unsubscribe();
    }

    callGA4DataLayerForTechnicalErrorClubAvanti(errorMessage){
        this.ga4dataLayerService.loadGA4DataLayerForClubAvantiTechnicalError(errorMessage);
    }

    callGA4DataLayerOnClickOfBannerBookNowBtn(currentUrl, destinationUrl){
        this.ga4dataLayerService.loadGA4DataLayerForBookTicketCTAClubAvanti(currentUrl, destinationUrl);
    }

    callGA4DataLayerOnClickOfViewJourneyHistory(currentUrl){
        this.ga4dataLayerService.loadGA4DataLayerForViewJourneyHistoryCTAClubAvanti(currentUrl);
    }

    addDisabledClassInCaseOfRedeemedOrExpired(rewardCodeStatus){
        if(this.rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus)){
            return 'color-neutrals text-strikeout';
        }
        return '';
    }

    showOrHideClubAvantiRewardStatusParaTag(reward){
        return reward?.RewardCodeStatus?.toLowerCase() !== this.rewardStatusEnum?.expired?.toLowerCase() && reward?.RewardCodeStatus?.toLowerCase() !== this.rewardStatusEnum?.redeemed?.toLowerCase()
    }

    addDynamicClassInCaseOfRedeemedOrExpiredReward(reward){
        return this.checkCaseForRedeemedOrExpiredReward(reward) ? '' : 'pt-04';
    }
    
    checkCaseForRedeemedOrExpiredReward(reward){
        return this.showExpiredTextPara(reward) || this.showRedeemedTextDiv(reward);
    }

    rewardIconInCaseOfExpiredOrRedeemedAward(rewardCodeStatus){
        return rewardCodeStatus?.toLowerCase() === this.rewardStatusEnum?.expired?.toLowerCase() || rewardCodeStatus?.toLowerCase() === this.rewardStatusEnum?.redeemed?.toLowerCase();
    }

    addDisabledClassOnRewardTextInCaseOfRedeemedOrExpiredReward(reward){
        return this.checkCaseForRedeemedOrExpiredReward(reward) ? 'rewards-disabled-txt' : '';
    }

    showRedeemedTextDiv(reward){
        return reward?.RewardCodeStatus?.toLowerCase() === this.rewardStatusEnum?.redeemed?.toLowerCase();
    }

    showExpiredTextPara(reward){
        return reward?.RewardCodeStatus?.toLowerCase() === this.rewardStatusEnum?.expired?.toLowerCase();
    }

    disabledViewPreviousJourneyBtn(){
        return this.clubAvantiMemberShipDetailResponse?.TripsCompleted === null || this.clubAvantiMemberShipDetailResponse?.TripsCompleted === 0;
    }

}