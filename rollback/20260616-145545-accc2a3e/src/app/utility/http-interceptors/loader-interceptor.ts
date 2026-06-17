import { Injectable, Injector } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { NgxSpinnerService } from "ngx-spinner";
import { SharedService } from 'src/app/services/shared-sibling.service';
import { ApiRouteService } from '../api-reference.service';
import { CommonServices } from '../../services/common.service';
import { AppRouteEnum, LocalStorageKeyEnum, NativePaymentMethodEnum } from "../app-constants.service";
import { Router } from "@angular/router";
import { StorageDataService } from "src/app/services/storage-data.service";
@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  time: number = 0;
  interval;
  previousAPi: string;
  route: Router;
  appRouteEnum: AppRouteEnum;
  apiPath: ApiRouteService;
  storageDataService: StorageDataService;
  localStorageKeyEnum: LocalStorageKeyEnum;
  constructor(public spinnerService: NgxSpinnerService, private readonly sharedService: SharedService,
     public commonService: CommonServices, private readonly nativePaymentMethodEnum: NativePaymentMethodEnum
    ,private readonly injector: Injector) { 
    this.route = this.injector.get(Router);
    this.appRouteEnum = this.injector.get(AppRouteEnum);
    this.apiPath = this.injector.get(ApiRouteService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.localStorageKeyEnum = this.injector.get(LocalStorageKeyEnum);
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(this.checkToShowLoaderInCaseOfRegisterClubAvantiAPI(req)){
    this.spinnerService.show();
    }
    if(!this.route.url.includes(this.appRouteEnum.myAccountPrefix) && this.commonService?.checkNewBookingFlowKeyInLocalStorage() && this.commonService.checkIsSeasonInLocalStorage() && !this.commonService.setIsUpgradeInLocalStorage() && !this.commonService.setIsCOJInLocalStorage()  && (req.url?.includes(this.apiPath?.enhancedTravelSolutionAPI_Prefix) || req.url?.includes(this.apiPath?.enhancedReviewBuyAPI_Prefix) ||  req.url?.includes(this.apiPath?.enhancedPaymentAPI_Prefix) || req.url?.includes(this.apiPath?.basconfigAPI_prefix) || req.url?.includes(this.apiPath?.CustomerRefresh)) && !req.url?.includes(this.apiPath?.customerLogin) && !req.url?.includes(this.apiPath?.getMyPreferences) && !req.url?.includes(this.apiPath?.enhancedReviewBuySaveAndGeDeliveryAndBasketDetails)){
      if(req.url?.includes(this.apiPath?.CustomerRefresh) && !this.newAPILoaderURL_List(this.previousAPi)){
        this.spinnerService.hide();
      } else if(!this.newAPILoaderURL_List(this.previousAPi) && !this.newAPILoaderURL_List(req?.url)) {
        this.spinnerService.hide();
      }
    }
    if(!req.url.includes(this.apiPath.CustomerRefresh)){
      this.sharedService.isSearchResultPage = false;
    }
    if (req.url.includes(this.apiPath.travelSolutionSearch) || req.url.includes(this.apiPath.travelSolutionReturnSearch)
      || req.url.includes(this.apiPath.seasonFlexiSearch)) {
        this.setLoaderMessageForSearchPage();
    }
    else if (req.url.includes(this.apiPath.evaluateRequestDetails) && this.sharedService.searchRequest.TravelSolutionDirection != 'FLEXI') {
      this.sharedService.loaderMessage = "Please wait, we are loading reservation and additional services.";
    }
    else if (req.url.includes(this.apiPath.createReservation) || req.url.includes(this.apiPath.getDeliveryModeData)
      || (req.url.includes(this.apiPath.evaluateRequestDetails) && this.sharedService.searchRequest.TravelSolutionDirection == 'FLEXI')) {
      this.sharedService.loaderMessage = "Please wait, we are loading delivery options.";
    }
    else if (req.url.includes(this.apiPath.saveDeliveryModeData)) {
      this.sharedService.loaderMessage = "Please wait, we are loading your basket.";
    }
    else if ((this.storageDataService.getSessionStorageData(this.localStorageKeyEnum.newDesignJourneyBookingFlow, false) === 'false' || this.commonService.setIsUpgradeInLocalStorage() || this.commonService.setIsCOJInLocalStorage())
       && (req.url.includes(this.apiPath.paymentDetails) || req.url.includes(this.apiPath.paymentInitiate) || req.url.includes(this.apiPath.completeOrder) || req.url.includes(this.apiPath.completeOrderSmartCard))) {
      this.setLoaderMessageForPayment(req);
    }
    else if(this.checkToShowLoaderInCaseOfRegisterClubAvantiAPI(req)){
      this.setLoaderMessage(req);
    }
    this.previousAPi = req.url;
    
    let NoLoaderAPIS: Array<string> =
      [
        this.apiPath.locationList,
        this.apiPath.buyAgain,
        this.apiPath.customerLogin,
        this.apiPath.getMyPreferences,
        this.apiPath.createReservation,
        this.apiPath.getConcentricToken,
        this.apiPath.saveDeliveryModeData,
        this.apiPath.addDiscount,
        this.apiPath.paymentDetails,
        this.apiPath.paymentInitiate,
        this.apiPath.railcardStationList,
        this.apiPath.getBookingDetails,
        this.apiPath.ProcessCojOrder,
        this.apiPath.CojCompleteOrder,
        this.apiPath.PrepareOrderAmend,
        this.apiPath.CustomerRefresh,
        this.apiPath.updateDeliveryModeData,
        this.apiPath.removeTravelExtras,
        this.apiPath.confirmRefundDetails,
        this.apiPath.quickBuyService,
        this.apiPath.cancelOrderSmartCard,
        this.apiPath.getDeliveryAndBasketJourney,
        this.apiPath.getBasketJourney
      ];
    if (NoLoaderAPIS.findIndex(a => (req.url).includes(a)) >= 0 && this.commonService.loaderRequired) {
      this.time = 0;
      clearInterval(this.interval)
      return next.handle(req);
    }
    else {
      return next.handle(req).pipe(
        finalize(() => {
          this.time = 0;
          clearInterval(this.interval)
          if(this.commonService.checkNewBookingFlowKeyInLocalStorage() && this.commonService.checkIsSeasonInLocalStorage() && req.url?.includes(this.apiPath.getMyPreferences) && this.sharedService.isUserClickedOnReviewBtn){
            this.spinnerService.show();
          } else {
            this.spinnerService.hide();
            this.commonService.loaderRequired = false;
          }
        })
      );
    }
  }

  setLoaderMessage(req) {
    if (req.url.includes(this.apiPath.getMyBookings)) {
      this.sharedService.loaderMessage = "Please wait, we are loading your bookings.";
    }
    else if (req.url.includes(this.apiPath.getCustomerDetails)) {
      this.sharedService.loaderMessage = "Please wait, we are loading your details.";
    }
    else if (req.url.includes(this.apiPath.updatePersonalDetail)) {
      this.sharedService.loaderMessage = "Please wait, we are updating your details.";
    }
    else if (req.url.includes(this.apiPath.changePassword)) {
      this.sharedService.loaderMessage = "Please wait, we are updating your password.";
    }
    else if (req.url.includes(this.apiPath.deleteAccount)) {
      this.sharedService.loaderMessage = "Please wait, we are deleting your account.";
    }
    else if (req.url.includes(this.apiPath.updateAddress) || req.url.includes(this.apiPath.modifyAddress)) {
      this.sharedService.loaderMessage = "Please wait, we are updating your addresses.";
    }
    else if (req.url.includes(this.apiPath.registerCustomer)) {
      this.sharedService.loaderMessage = "Please wait, we are registering user.";
    }
    else if (req.url.includes(this.apiPath.getBookingRefundDetails)) {
      this.sharedService.loaderMessage = "Please wait, we are loading your refund details.";
    }
    else if (req.url.includes(this.apiPath.confirmRefundDetails)) {
      this.sharedService.loaderMessage = "Please wait, we are processing your refund request.";
    }
    else {
      if (!req.url.includes(this.apiPath.CustomerRefresh) && 
      (this.storageDataService.getSessionStorageData(this.localStorageKeyEnum.newDesignJourneyBookingFlow, false) === 'false' || !this.commonService.checkIsSeasonInLocalStorage() || this.commonService.setIsUpgradeInLocalStorage() || this.commonService.setIsCOJInLocalStorage())) {
        this.sharedService.loaderMessage = "Please wait.";
      } else if(!this.route.url.includes(this.appRouteEnum.myAccountPrefix) && this.commonService?.checkNewBookingFlowKeyInLocalStorage() && this.commonService.checkIsSeasonInLocalStorage()
        && !this.commonService.setIsUpgradeInLocalStorage() && !this.commonService.setIsCOJInLocalStorage() && this.newAPILoaderURL_List(req?.url)){
        if(!this.sharedService.isStationListAPILoaderRequired && (req.url?.includes(this.apiPath?.locationList) || req.url?.includes(this.apiPath?.railcardStationList))){
          this.sharedService.isNewLoaderForNewFlow = false;
        } else {
          this.sharedService.isNewLoaderForNewFlow = true;
        }
        
      }
    }
  }

  setLoaderMessageForSearchPage() {
    this.sharedService.loaderMessage = "Please wait, we are loading times and fares.";
    this.sharedService.isSearchResultPage = true;
    this.interval = setInterval(() => {
      this.time++;
      if (this.time < 15) {
        this.sharedService.loaderMessage = "Please wait, we are loading times and fares.";
      } else if (this.time > 14 && this.time <= 30) {
        this.sharedService.loaderMessage = "Sorry, results are taking longer than usual.";
      } else if (this.time > 30 && this.time < 60) {
        this.sharedService.loaderMessage = "Please wait whilst we find you the quickest trains and best prices. Sorry, results are taking longer than usual.";
      }
    }, 1000);
  }

  setLoaderMessageForPayment(req) {
    if (req.url.includes(this.apiPath.paymentDetails)) {
      this.sharedService.loaderMessage = "Please wait, we are loading payment options.";
    }
    else if (req.url.includes(this.apiPath.paymentInitiate)) {
      if (req.body && (req.body.includes(this.nativePaymentMethodEnum.netsGooglePay) || req.body.includes(this.nativePaymentMethodEnum.netsApplePay))) {
        this.sharedService.loaderMessage = "Please wait, we are processing your payment.";
      } else {
        this.sharedService.loaderMessage = "Please wait, we are redirecting you to payment gateway.";
      }
    }
    else if (req.url.includes(this.apiPath.completeOrder) || req.url.includes(this.apiPath.completeOrderSmartCard)) {
      this.sharedService.isSearchResultPage = true;
      this.sharedService.loaderMessage = "Nearly there… please resist the urge to click refresh or leave this page whilst we complete our final checks.";
    }
  }

  checkToShowLoaderInCaseOfRegisterClubAvantiAPI(req){
    return (!req.url.includes(this.apiPath.registerToClubAvanti) && !this.previousAPi?.includes(this.apiPath.registerToClubAvanti)
  && !req.url.includes(this.apiPath.getClubAvantiRewardsDetail) && !this.previousAPi?.includes(this.apiPath.getClubAvantiRewardsDetail))
    || (req.url.includes(this.apiPath.getClubAvanti)) || (!this.route.url.includes(this.appRouteEnum.clubAvanti));
  }

  newAPILoaderURL_List(url){
    return url?.includes(this.apiPath?.customerLogin) 
    || url?.includes(this.apiPath?.getMyPreferences) 
    || url?.includes(this.apiPath?.enhancedReviewBuySaveAndGeDeliveryAndBasketDetails)
    || url?.includes(this.apiPath?.CustomerLogOut)
    || url?.includes(this.apiPath?.enhancedTravelSolutionRouteDetails)
    || url?.includes(this.apiPath?.locationList)
    || url?.includes(this.apiPath?.railcardStationList)
    || url?.includes(this.apiPath?.enhancedTicketInfoSearch)
    || url?.includes(this.apiPath?.enhancedViewSeatPicker)
    || url?.includes(this.apiPath?.enhancedReviewBuyUpdateReservation)
    || url?.includes(this.apiPath?.enhancedReviewBuyGetDeliveryAndBasketJourney)
    || url?.includes(this.apiPath?.enhancedReviewBuyAddRemoveTravelExtras)
    || url?.includes(this.apiPath?.enhancedReviewBuyUpdateDeliveryMode)
    || url?.includes(this.apiPath?.enhancedReviewBuyAddDiscountCode)
    || url?.includes(this.apiPath?.enhancedReviewBuyRemoveJourney)
    || url?.includes(this.apiPath?.enhancedReviewBuyModifyAddress)
    || url?.includes(this.apiPath?.enhancedSmartCardValidation)
    || url?.includes(this.apiPath?.enhancedUpdatePaymentCards)
    || url?.includes(this.apiPath?.enhancedDownloadTicket)
    || url?.includes(this.apiPath?.enhancedBookPassangerAssist)
    || url?.includes(this.apiPath?.enhancedPaymentInitiate)
    || url?.includes(this.apiPath?.enhancedReviewBuyUpdateSeatPreferences)
    || url?.includes(this.apiPath?.enhancedPaymentDetails)
  }
}


