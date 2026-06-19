import { Injectable, Injector } from "@angular/core";
import { EnhancedLoginPopupComponent } from "../Enhanced-Component/enhanced-login-page/enhanced-login-popup.component";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { EnhancedAppRouteEnum, EnhancedDynamicClassesNameEnum, EnhancedReviewBuyAndDeliveryPageEnum, LocalStorageKeyEnum } from "../utility/app-constants.service";
import { NgxSpinnerService } from "ngx-spinner";
import { EnhancedReviewBuyAndDeliveryService } from "./enhanced-review-buy-and-delivery.service";
import { InfoPopupComponent } from "../Component/mixing-deck/info-popup/info-popup.component";
import { ResponseData } from "../models/common/response.model";
import { EnhancedReviewBuyAndDeliveryResponse } from "../models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { SharedServiceCache } from "./SharedServiceCache.service";
import { SharedService } from "./shared-sibling.service";
import { StorageDataService } from "./storage-data.service";
import { CommonServices } from "./common.service";
import { EnhancedNoSeatsAvailableDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-no-seats-available-dialogs/enhanced-no-seats-available-dialogs.component";

@Injectable({
  providedIn: "root",
})
export class EnhancedLoginCommonService {
  dialog: MatDialog;
  router: Router;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  spinnerService: NgxSpinnerService;
  loaderRequired: boolean = false;
  enhancedDynamicClassNameEnum: EnhancedDynamicClassesNameEnum;
  enhancedReviewBuyAndDelivery: EnhancedReviewBuyAndDeliveryService;
  enhancedReviewBuyAndDeliveryPageEnum: EnhancedReviewBuyAndDeliveryPageEnum;
  responseData: ResponseData;
  localStorageEnum: LocalStorageKeyEnum;
  enhancedReviewBuyAndDeliveryResponse: EnhancedReviewBuyAndDeliveryResponse;
  sharedServiceCache: SharedServiceCache;
  sharedService: SharedService;
  storageDataService: StorageDataService;
  commonServices: CommonServices;

  constructor(private readonly injector: Injector) {
    this.dialog = this.injector.get(MatDialog);
    this.router = this.injector.get(Router);
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.spinnerService = this.injector.get(NgxSpinnerService);
    this.enhancedDynamicClassNameEnum = this.injector.get(EnhancedDynamicClassesNameEnum);
    this.enhancedReviewBuyAndDelivery = this.injector.get(EnhancedReviewBuyAndDeliveryService);
    this.enhancedReviewBuyAndDeliveryPageEnum = this.injector.get(EnhancedReviewBuyAndDeliveryPageEnum);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
    this.sharedServiceCache = this.injector.get(SharedServiceCache);
    this.sharedService = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.commonServices = this.injector.get(CommonServices);
  }

  checkLogin() {
    if (!this.responseData?.Data?.IsBlock) {
      let customerKey = localStorage.getItem("CustomerKey");
      let customerEmail = localStorage.getItem("Email");
      if (customerKey != null && customerEmail != null) {
        localStorage.setItem(this.localStorageEnum.isBrowserBackButton, 'true');
        this.router.navigate([`./` + this.enhancedAppRouteEnum.deliveryAndReviewBy]);
      } else {
        this.spinnerService.hide();
        this.loaderRequired = true;
        this.dialog.open(EnhancedLoginPopupComponent, {
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassNameEnum
              ?.enhancedCommonPopupThemePanelClass,
            this.enhancedDynamicClassNameEnum
              ?.enhancedSignInDialogPopupPanelClass,
          ],
          width: "42rem",
          autoFocus: false,
          data: { isLoginFromJE: true },
        });
      }
    }
  }
  
    callGetDeliveryAndBasketJourneyApi(enhancedGetDeliveryAndBasketJourneyRequest) {
      try{
        this.spinnerService.show();
        this.enhancedReviewBuyAndDelivery.enhancedSaveAndGetDeliveryAndBasketJourney(enhancedGetDeliveryAndBasketJourneyRequest).subscribe(res => {
          if(res != null){
            this.sharedService.isNewLoaderForNewFlow = false;
            this.responseData = res as ResponseData
            if(this.responseData.ResponseCode == '200') {
              if (this.responseData.Data != null) {
                if(this.responseData?.Data?.DeliveryAndBasketJourneyResponse){
                  this.responseData?.Data?.DeliveryAndBasketJourneyResponse?.BasketJourneyResponse?.Journey?.forEach(journey => {
                    this.commonServices.getOrganisedOutwardAndReturnSeatInfo(journey?.OutwardSeat);
                    this.commonServices.getOrganisedOutwardAndReturnSeatInfo(journey?.ReturnSeat);
                    // Remove Standard Premium from TicketType from OutwardDetail
                    this.commonServices.removeStandPreFromTicketTypeForOutAndReturn(journey);
                  });
                  
                  this.enhancedReviewBuyAndDeliveryResponse = this.responseData?.Data?.DeliveryAndBasketJourneyResponse ? this.responseData?.Data?.DeliveryAndBasketJourneyResponse?.BasketJourneyResponse : this.responseData?.Data;
                  this.sharedService.enhancedReviewBuyResponse = this.responseData?.Data?.DeliveryAndBasketJourneyResponse ? this.enhancedReviewBuyAndDeliveryResponse : this.responseData?.Data;
                }
                this.sharedService.reviewBuyCache = this.responseData?.Data?.ReviewBuyCache;
                this.sharedService.ReservationCache = this.responseData?.Data?.ReviewBuyCache;
                localStorage.setItem(this.localStorageEnum.reviewMergedFlowAppSetting, String(this.responseData?.Data?.IsReviewMergedFlowEnabled));

                this.commonServices.cacheSharedData();
                
                this.setReservationData();
              } else{
                this.spinnerService.hide();
                console.log(this.responseData?.ResponseMessage);
              }
            } else {
              console.log(this.responseData.ResponseMessage);
              this.commonServices.showEnhancedCommonErrorPopup(false, this.responseData?.Data?.IsRestrictedReturnFare);
              this.spinnerService.hide();
            }
          }
        });
      } catch(error)  {
        console.log(error);
      }
    }
  
    setReservationData() {
      if (this.responseData?.Data?.ReservationMessage != null) {
        let respMsg = this.responseData?.Data?.ReservationMessage;
        let modifiedMsg = respMsg.replace(this.enhancedReviewBuyAndDeliveryPageEnum?.oldNoMoreSeatAvailableMessage, this.enhancedReviewBuyAndDeliveryPageEnum?.newNoMoreSeatAvailableMessage);
  
        this.spinnerService.hide();
        let dialogRef = this.dialog.open(EnhancedNoSeatsAvailableDialogsComponent, {
          disableClose: true,
          panelClass: [this.enhancedDynamicClassNameEnum?.enhancedCommonInfoPopup, this.enhancedDynamicClassNameEnum?.enhancedGoBackDialog, this.enhancedDynamicClassNameEnum?.enhancedNoSeatAvailableDialogPanelClass],
          width: "45rem",
          autoFocus: false,
          data: {
            Message: modifiedMsg,
          },
        });
        dialogRef.afterClosed().subscribe( value => {
          if(value){
            this.router.navigate([`./` + this.enhancedAppRouteEnum.searchResult]);
          } else {
            this.setNavigationAccordingToDeliveryPageSkipCondition();
          }
        });
      } else {
        this.setNavigationAccordingToDeliveryPageSkipCondition();
      }
    }

    setNavigationAccordingToDeliveryPageSkipCondition(){
      if (!this.responseData?.Data?.IsBlock) {
        localStorage.setItem(this.localStorageEnum.isBrowserBackButton, 'true');
        this.router.navigate([`./` + this.enhancedAppRouteEnum.deliveryAndReviewBy]);
      }
  }
}