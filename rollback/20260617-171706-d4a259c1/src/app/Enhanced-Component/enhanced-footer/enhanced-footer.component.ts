import { ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output, ViewEncapsulation } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { EnhancedSearchRequestModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-request.model";
import { SharedService } from "src/app/services/shared-sibling.service";
import { EnhancedPriceBreakdownDialogs } from "../enhanced-dialogs/enhanced-price-breakdown-dialogs/enhanced-price-breakdown-dialogs.component";
import { browserRefresh } from "src/app/app-component/app.component";
import { StorageDataService } from "src/app/services/storage-data.service";
import { DeviceDetectorService } from "ngx-device-detector";
import * as moment from "moment";
import { EnhancedAppRouteEnum, EnhancedDesignBtnText, EnhancedDynamicClassesNameEnum, EnhancedGa4DatalayeEventNameEnum, EnhancedMixingDeckPopupHeadingEnum, EnhancedMixingDeckPopupMessageEnum, LocalStorageKeyEnum, TravelSolutionJourneyTypeEnum } from "src/app/utility/app-constants.service";
import { EnhancedSearchInformationDialogs } from "../enhanced-dialogs/enhanced-search-information-dialogs/enhanced-search-information-dialogs.component";
import { EnhancedSearchResponseModel } from "src/app/models/enhanced-mixing-deck/enhanced-search-response.model";
import { EnhancedLoginCommonService } from "src/app/services/enhanced-login-common.service";
import { SearchStateService } from "src/app/services/search-state.service";
import { GA4DatalayerService } from "src/app/utility/dataLayers/ga4-datalayer.service";
import { EnhancedGA4DatalayerService } from "src/app/utility/dataLayers/enhanced-ga4-datalayer.service";
import { CommonServices } from "src/app/services/common.service";
import { EnhancedGetDeliveryAndBasketJourneyRequest } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-get-delivery-and-basket-journey-request";
import { EnhancedLoginPopupComponent } from "../enhanced-login-page/enhanced-login-popup.component";
import { EnhancedJourneyDetail } from "src/app/models/enhanced-review-buy-and-delivery/enhanced-review-buy-delivery.model";
import { SeasonTicketBasketDialogComponent } from "../enhanced-dialogs/season-ticket-basket-dialog/season-ticket-basket-dialog.component";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
    selector: "app-enhanced-footer",
    templateUrl: "./enhanced-footer.component.html",
    styleUrls: ["./enhanced-footer.component.css"],
    standalone: false
})
export class EnhancedFooterComponent implements OnInit {
  @Input() isDisabled: boolean = true;
  @Input() nextPageString!: string;
  @Input() travelSolution!: any;
  @Input() mixingDeckSearchRequest: EnhancedSearchRequestModel;
  router: Router;
  sharedSibling: SharedService;
  currentSelectedPageUrl: string;
  @Input() totalAmount: number;
  browserRefresh: boolean;
  storageDataService: StorageDataService;
  isMobile: boolean = false;
  isTablet: boolean = false;
  deviceService: DeviceDetectorService;
  @Input() isUserClickedReturnBtn: boolean = false;
  @Output("showReturnDivInMobile") showReturnDivInMobile: EventEmitter<any> =
    new EventEmitter();
  @Input() isReturn: boolean = false;
  @Output() userClickedReturnChange = new EventEmitter<boolean>();
  mixingDeckPopupMsgEnum: EnhancedMixingDeckPopupMessageEnum;
  mixingDeckPopupHeadingEnum: EnhancedMixingDeckPopupHeadingEnum;
  @Input() searchReturnResponse: EnhancedSearchResponseModel;
  @Input() searchResponse: EnhancedSearchResponseModel;
  enhancedLoginCommonService: EnhancedLoginCommonService;
  enhancedAppRouteEnum: EnhancedAppRouteEnum;
  searchStateService: SearchStateService;
  enhancedDynamicClassEnum: EnhancedDynamicClassesNameEnum;
  travelSolutionJourneyTypeEnum: TravelSolutionJourneyTypeEnum;
  @Input() isPriceBreakDownDisabled: boolean = true;
  isDisabledContinue: boolean = false;
  ga4dataLayerService: GA4DatalayerService;
  enhancedGA4DataLayerService: EnhancedGA4DatalayerService;
  enhancedDesignBtnText: EnhancedDesignBtnText;
  enhancedGA4DataLayerEventNameEnum: EnhancedGa4DatalayeEventNameEnum;
  commonServices: CommonServices;
  localStorageEnum: LocalStorageKeyEnum;
  enhancedGetDeliveryAndBasketJourneyRequest: EnhancedGetDeliveryAndBasketJourneyRequest;
  reviewBuyDetail: any;
  @Input() selectedJourneyIndex;
  journeyRemovedClass: boolean = false;
  @Output() callReservationTimeExpiryMethod = new EventEmitter<void>();
  @Input() totalJourneyPrice: number = 0;
  @Input() journeyCount: number = 0;
  @Output() userClickOnNextButton = new EventEmitter<boolean>();
  @Input() multipleJourneySearchResponse: EnhancedJourneyDetail;
  @Output() payNowClicked = new EventEmitter<void>();
  @Input() isPayNowDisabled: number;
  @Input() selectedVouchers: boolean;
  @Input() totalVoucherPrice: number;
  @Input() nreJourneyExtrasResponse: any;
  @Input() isLoaderActive: boolean = false;
  @Input() isPaymentAPICall: boolean = false;
  @Input() cameFromFlexibleReturn: boolean = false;

  constructor(
    private readonly injector: Injector,
    public dialog: MatDialog,
    private readonly cd: ChangeDetectorRef,
    public spinnerService: NgxSpinnerService
  ) {
    this.router = this.injector.get(Router);
    this.sharedSibling = this.injector.get(SharedService);
    this.storageDataService = this.injector.get(StorageDataService);
    this.deviceService = this.injector.get(DeviceDetectorService);
    this.mixingDeckPopupMsgEnum = this.injector.get(
      EnhancedMixingDeckPopupMessageEnum
    );
    this.mixingDeckPopupHeadingEnum = this.injector.get(
      EnhancedMixingDeckPopupHeadingEnum
    );
    this.enhancedLoginCommonService = this.injector.get(
      EnhancedLoginCommonService
    );
    this.enhancedAppRouteEnum = this.injector.get(EnhancedAppRouteEnum);
    this.enhancedDynamicClassEnum = this.injector.get(
      EnhancedDynamicClassesNameEnum
    );
    this.searchStateService = this.injector.get(SearchStateService);
    this.ga4dataLayerService = this.injector.get(GA4DatalayerService);
    this.enhancedDesignBtnText = this.injector.get(EnhancedDesignBtnText);
    this.enhancedGA4DataLayerEventNameEnum = this.injector.get(
      EnhancedGa4DatalayeEventNameEnum
    );
    this.enhancedGA4DataLayerService = this.injector.get(
      EnhancedGA4DatalayerService
    );
    this.travelSolutionJourneyTypeEnum = this.injector.get(
      TravelSolutionJourneyTypeEnum
    );
    this.commonServices = this.injector.get(CommonServices);
    this.localStorageEnum = this.injector.get(LocalStorageKeyEnum);
  }

  ngOnInit(): void {
    this.sharedSibling.getIsDisabledContinue().subscribe((isOpen) => {
      this.isDisabledContinue = isOpen;
    });
    this.isMobile = this.deviceService.isMobile() && window.screen.width < 1024;
    this.isTablet = (this.deviceService.isTablet() || this.commonServices.checkIsiPad(navigator.userAgent)) && window.screen.width < 1024;
    this.browserRefresh = browserRefresh;
    this.currentSelectedPageUrl = this.router.url;
    this.isUserClickedReturnBtn = false;
    //Get shared cache data
    if (this.browserRefresh) {
      this.getSharedCacheData();
    }
    this.sharedSibling.isJourneyRemoved$.subscribe((isRemovedJourney) => {
      if (isRemovedJourney) this.journeyRemovedClass = true;
    });
  }

  getSharedCacheData() {
    const cachedData = this.storageDataService.getStorageData(
      "sharedService",
      true
    );
    if (cachedData) {
      this.sharedSibling.journeySummaryModel = cachedData?.journeySummaryModel;
      this.sharedSibling.searchRequest = cachedData?.searchRequest;
    }
  }

  onUserClickReturnBtn(value) {
    this.userClickedReturnChange.emit(true);
  }

  nextPage() {
    try {
      this.userClickOnNextButton.emit(true);

      this.ga4dataLayerService.loadGA4selectItem(
        this.sharedSibling.journeySummaryModel,
        null,
        0,
        this.mixingDeckSearchRequest,
        null,
        false,
        true
      );

      if (
        this.commonServices?.checkIsSeasonJourneyAvailable() &&
        this.sharedSibling?.reviewBuyResponse?.BasketCount > 0
      ) {
        let dialogRef = this.dialog.open(SeasonTicketBasketDialogComponent, {
          disableClose: true,
          panelClass: [
            this.enhancedDynamicClassEnum.enhancedCommonInfoPopup,
            this.enhancedDynamicClassEnum?.enhancedRailcardNotAppliedPanelClass,
          ],
          width: "45rem",
          autoFocus: false,
        });
        dialogRef.afterClosed().subscribe((dialogResult) => {
          if (dialogResult) {
            this.commonServices.redirectToReviewBuyPage();
          }
        });
        return; // stop further execution
      }

      let isOnSearchResult = this.currentSelectedPageUrl?.replace(/^\/+/, '') === this.enhancedAppRouteEnum?.searchResult;
      let isOnSelectTicket = this.currentSelectedPageUrl?.replace(/^\/+/, '') === this.enhancedAppRouteEnum?.selectTicketAndClass;

      let destination = "";
      let ctaName = "";

      if (isOnSearchResult) {
        destination = `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`;
        ctaName = this.enhancedDesignBtnText?.ticketAndClassText;
      } else if (isOnSelectTicket) {
        destination = `/${this.enhancedAppRouteEnum?.deliveryAndReviewBy}`;
        ctaName = this.enhancedDesignBtnText?.reviewBuyText;
      }

      this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(
        ctaName,
        this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText,
        this.currentSelectedPageUrl,
        destination,
        true
      );

      let isOnSelectTicketRoute =
        this.currentSelectedPageUrl.includes(`/${this.enhancedAppRouteEnum?.selectTicketAndClass}`);

      isOnSelectTicketRoute
        ? this.checkLoginToProceedFurther()
        : this.checkReturnServiceDepartueDate();

      this.cd.detectChanges();
    } catch (error) {
      console.error(error);
    }
  }

  checkLoginToProceedFurther() {
    try {
      this.storageDataService.setStorageData(
        this.localStorageEnum?.selectedTicketFareDetail,
        this.travelSolution,
        true
      );
      this.authenticateUser();
    } catch (error) {
      console.log(error);
    }
  }

  showPriceBreakdownDetailDiv() {
    if (
      this.currentSelectedPageUrl.includes(`/${this.enhancedAppRouteEnum?.searchResult}`)
    ) {
      return false;
    }
    return true;
  }

  showPriceBreakdownPopup() {
    this.dialog.open(EnhancedPriceBreakdownDialogs, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassEnum?.enhancedFooterPriceBreakDownPanelClass,
      ],
      width: "45rem",
      autoFocus: false,
      data: {
        searchRequest: this.mixingDeckSearchRequest,
        selectedOutwardFare: this.travelSolution?.selectedOutwardFare,
        selectedReturnFare: this.travelSolution?.selectedReturnFare,
        selectedJourneyIndex: this.selectedJourneyIndex,
        isReviewBuy: this.isOnDeliveryAndReviewPage(),
        isPaymentPage: this.isExistPaymentPage(),
        selectedVouchers: this.selectedVouchers,
        totalVoucherPrice: this.totalVoucherPrice
      },
    });
  }

  onReturnBtnClick() {
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(
      this.enhancedDesignBtnText?.selectReturnTrainText,
      this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText,
      this.currentSelectedPageUrl,
      `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`,
      true
    );
    this.onUserClickReturnBtn(true);
    this.showReturnSection();
  }

  showReturnSection() {
    this.showReturnDivInMobile.emit();
  }

  changeTextToProceedOnNextInWeb() {
    if (
      this.currentSelectedPageUrl.includes(`/${this.enhancedAppRouteEnum?.searchResult}`)
    ) {
      return `Select ticket & class`;
    } else if (
      this.currentSelectedPageUrl.includes(`/${this.enhancedAppRouteEnum?.selectTicketAndClass}`)
    ) {
      return `Review`;
    }
  }

  changeTextToProceedOnNextInMobile(isMobile, isReturn) {
    if (isMobile && isReturn) {
      if (
        this.currentSelectedPageUrl ==
        `/${this.enhancedAppRouteEnum?.searchResult}`
      ) {
        return `Select return train`;
      } else if (
        this.currentSelectedPageUrl ==
        `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`
      ) {
        return `Return ticket`;
      }
    }
  }
  checkReturnServiceDepartueDate() {
    if (
      this.mixingDeckSearchRequest?.TravelSolutionDirection !== "ONE_WAY" &&
      this.mixingDeckSearchRequest?.TravelSolutionDirection !== "OPEN_RETURN" &&
      moment(this.travelSolution?.selectedReturnTravelSolution.DepartureDate) <=
        moment(this.travelSolution?.selectedOutwardTravelSolution.ArrivalDate)
    ) {
      let message = this.mixingDeckPopupMsgEnum?.selectDifferentReturnTimeMsg;
      let heading = this.mixingDeckPopupHeadingEnum?.selectDifferentReturnTime;
      this.showCommonPopupForUserInformation(message, heading);
      return false;
    } else {
      this.spinnerService.show();
      this.sharedSibling.isNewLoaderForNewFlow = true;
      this.searchStateService.set({
        outAndRetTravelSolData: this.travelSolution,
        searchResponse: this.searchResponse,
        searchReturnResponse: this.searchReturnResponse,
        mixingDeckSearchRequest: this.mixingDeckSearchRequest,
      });
      setTimeout(() => {
        this.router.navigate([this.travelSolution?.reDirectedUrl], {
          state: { part: this.travelSolutionJourneyTypeEnum.outwardString },
        });
      }, 2000);
    }
  }

  showCommonPopupForUserInformation(message, heading) {
    let dialogRef = this.dialog.open(EnhancedSearchInformationDialogs, {
      disableClose: true,
      panelClass: [
        this.enhancedDynamicClassEnum?.enhancedFooterAlertCommonPanelClass,
      ],
      width: "45rem",
      autoFocus: false,
      data: {
        Message: message,
        isReturn: this.isReturn,
        isOutwardClicked: false,
        isReturnClicked: false,
        heading: heading,
      },
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  onDisabledClick(event: MouseEvent) {
    let target = event.target as HTMLElement;

    // Traverse up to the parent with a button inside
    let parentDiv = target.closest("#efc-qtt-footer-btns");
    if (!parentDiv) return;

    // Get the button under the overlay (by position)
    let buttons = parentDiv.querySelectorAll("button");
    let clickedButtonText = "";
    let clickedButtonId = "";

    for (let btn of Array.from(buttons)) {
      let rect = btn.getBoundingClientRect();
      let x = event.clientX;
      let y = event.clientY;

      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        clickedButtonText = btn.textContent?.trim() || "";
        clickedButtonId = btn.id?.trim() || "";
        break;
      }
    }
    if (clickedButtonId !== "efc-qtt-footer-price-breakdown-btn") {
      // Now use this text as needed
      this.handleDisabledClick(clickedButtonText);
    }
  }

  handleDisabledClick(text: string){
    let isOnSearchResult = this.currentSelectedPageUrl?.replace(/^\/+/, '') === this.enhancedAppRouteEnum?.searchResult;
        let isOnSelectTicket = this.currentSelectedPageUrl?.replace(/^\/+/, '') === this.enhancedAppRouteEnum?.selectTicketAndClass;

        let destination = '';
        let ctaName = '';

        if (isOnSearchResult) {
          destination = `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`;
        } else if (isOnSelectTicket) {
          destination = `/${this.enhancedAppRouteEnum?.deliveryAndReviewBy}`;
        }
    this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(text,this.enhancedGA4DataLayerEventNameEnum?.ctaClickAttemptActionText, this.currentSelectedPageUrl, destination, true);
  }

  getCaptureGa4DisabledClickEvent() {
    if (
      this.currentSelectedPageUrl ==
      `/${this.enhancedAppRouteEnum?.searchResult}`
    ) {
      return this.isDisabled;
    } else if (
      this.currentSelectedPageUrl ==
      `/${this.enhancedAppRouteEnum?.selectTicketAndClass}`
    ) {
      return !this.isPriceBreakDownDisabled;
    }
    return false;
  }

  callingToRedirectReviewBuyPage() {
    if (
      this.sharedSibling.reviewBuyResponse != null &&
      this.sharedSibling.reviewBuyResponse.BasketCount != 0
    ) {
      this.reviewBuyDetail =
        this.sharedSibling?.reviewBuyResponse?.Journey?.find(
          (x) => x.SeasonDeatil != null
        );
      if (this.reviewBuyDetail != null || this.reviewBuyDetail != undefined) {
        return false;
      }
    }
    this.commonServices.createRequestForGetDeliveryAndBasketJourneyAPI(this.nreJourneyExtrasResponse, this.travelSolution, this.cameFromFlexibleReturn, this.searchResponse);
    this.sharedSibling.sendSearchRequest(this.mixingDeckSearchRequest);
    this.onClickToMoveOnReviewBuy();
  }

  authenticateUser() {
    let customerKey = localStorage.getItem("CustomerKey");
    let customerEmail = localStorage.getItem("Email");
    if (customerKey && customerEmail) {
      this.callingToRedirectReviewBuyPage();
    } else {
      this.sharedSibling.isUserClickedOnReviewBtn = true;
      let dialogRef = this.dialog.open(EnhancedLoginPopupComponent, {
        disableClose: true,
        panelClass: [
          this.enhancedDynamicClassEnum?.enhancedCommonPopupThemePanelClass,
          this.enhancedDynamicClassEnum?.enhancedSignInDialogPopupPanelClass,
        ],
        width: "42rem",
        autoFocus: false,
        data: { isLoginFromQuickBuy: true, isQuickBuy: true, isLoginFromEnhancedSelectTicketAndClass: true, 
          nreJourneyExtrasResponse: this.nreJourneyExtrasResponse, 
          travelSolution: this.travelSolution, 
          cameFromFlexibleReturn: this.cameFromFlexibleReturn, 
          searchResponse: this.searchResponse,
          mixingDeckSearchRequest: this.mixingDeckSearchRequest
        },
      });
      dialogRef.afterClosed().subscribe((flag) => {
        if (flag) {
          this.callingToRedirectReviewBuyPage();
        }
      });
    }
  }

  onClickToMoveOnReviewBuy() {
    let enhancedGetDeliveryAndBasketJourneyRequest = this.sharedSibling.enhancedGetDeliveryAndBasketJourneyRequest;
    enhancedGetDeliveryAndBasketJourneyRequest.PreviousCache =
      this.sharedSibling.reviewBuyCache;
    this.enhancedLoginCommonService.callGetDeliveryAndBasketJourneyApi(
      enhancedGetDeliveryAndBasketJourneyRequest
    );
  }

  moveToPaymentPage(){
    try{
      let destination = `/${this.enhancedAppRouteEnum?.payment}`;
      this.enhancedGA4DataLayerService.loadGA4DataLayerOnCheckoutClickOrAttempt(
        this.enhancedDesignBtnText?.paymentText,
        this.enhancedGA4DataLayerEventNameEnum?.ctaClickActionText,
        this.currentSelectedPageUrl,
        destination,
        true
      );
      this.enhancedGA4DataLayerService.loadGA4DataLayerForDiscountAppliedOrBeginCheckout(this.sharedSibling.searchRequest, this.sharedSibling?.enhancedReviewBuyResponse?.Journey, false, this.totalJourneyPrice);
      let discountedJourney = this.sharedSibling?.enhancedReviewBuyResponse?.Journey.filter(j => (j?.DiscountedPrice ?? 0) > 0);
      if(discountedJourney?.length > 0) {
        this.enhancedGA4DataLayerService.loadGA4DataLayerForDiscountAppliedOrBeginCheckout(this.sharedSibling.searchRequest, discountedJourney, true, this.totalJourneyPrice);
      }
      this.callReservationTimeExpiryMethod.emit();
    } catch (error){
      console.log(error);
    }
  }

  isOnDeliveryAndReviewPage(): boolean {
    return this.router?.url?.includes(
      this.enhancedAppRouteEnum.deliveryAndReviewBy
    );
  }

  showPaxIconWithDetail(): boolean {
    // Ticket class / other pages → always show
    if (!this.isOnDeliveryAndReviewPage() && !this.isExistPaymentPage()) {
      return true;
    }

    // Review & Buy page → show only when single journey
    return this.journeyCount === 1;
  }

  shouldShowNextReviewButton(): boolean {
    return (
      !this.isOnDeliveryAndReviewPage() &&
      !this.isExistPaymentPage() &&
      this.showPriceBreakdownDetailDiv() &&
      (((this.isMobile || this.isTablet) &&
        this.travelSolution?.selectedOutwardTravelSolution &&
        this.isUserClickedReturnBtn) ||
        ((this.isMobile || this.isTablet) && !this.isReturn))
    );
  }

  getPassengerData() {
    if (this.isOnDeliveryAndReviewPage()) {
      return this.multipleJourneySearchResponse;
    } else {
      return this.mixingDeckSearchRequest;
    }
  }

  isExistPaymentPage(): boolean {
    return this.router?.url?.includes(this.enhancedAppRouteEnum.payment);
  }

  onPayNowClick() {
    this.payNowClicked.emit();
  }

  getFooterAriaLabel(): string {
    try {
      let parts: string[] = [];

      // Adults
      let adultCount = +this.getPassengerData()?.Adult || 0;
      if (adultCount > 0) {
        parts.push(adultCount === 1 ? "1 adult" : `${adultCount} adults`);
      }

      // Children
      let childCount = +this.getPassengerData()?.Child || 0;
      if (childCount > 0) {
        parts.push(childCount === 1 ? "1 child" : `${childCount} children`);
      }

      // eVoucher
      if (this.selectedVouchers) {
        parts.push("eVoucher applied");
      }

      // Price
      let price: number = null;
      if (this.travelSolution?.singleFare > 0) {
        price = this.travelSolution?.singleFare;
      } else if (this.travelSolution?.totalFare > 0) {
        price = this.travelSolution?.totalFare;
      } else if (
        (this.isOnDeliveryAndReviewPage() || this.isExistPaymentPage()) &&
        this.totalJourneyPrice != null
      ) {
        price = this.totalJourneyPrice;
      } else {
        price = 0;
      }
      parts.push(`total price £${this.sharedSibling.formatPrice(price)}`);

      return parts.join(", ");
    } catch (error) {
      console.error(error);
    }
  }

  getFinalJourneyPrice(): number {
    let price = this.totalJourneyPrice || 0;

    if (this.isExistPaymentPage() && this.selectedVouchers) {
      // hamesha bade se chhote ka difference
      // price = Math.abs(price - this.totalVoucherPrice);
      if (this.totalVoucherPrice >= price) {
      price = 0;
      } else {
      price = price - this.totalVoucherPrice;
      }
    }

    return price;
  }

  getNextButtonAriaLabel(): string {
    if (this.currentSelectedPageUrl?.includes(`/${this.enhancedAppRouteEnum?.searchResult}`)) {
      return `${this.enhancedDesignBtnText.ticketAndClassText}`;
    }
    if (this.currentSelectedPageUrl?.includes(`/${this.enhancedAppRouteEnum?.selectTicketAndClass}`)) {
      return `${this.enhancedDesignBtnText.reviewBuyText}`;
    }
  }
}