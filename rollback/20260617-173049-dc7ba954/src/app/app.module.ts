import { AppRoutingModule } from "./route/app-routing.module";
import { AppComponent } from "./app-component/app.component";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { NgxSpinnerModule } from "ngx-spinner";
import { OrderModule } from "ngx-order-pipe";
import { LoggerModule } from "ngx-logger";
import { environment } from "src/environments/environment";
import { MomentModule } from "ngx-moment";
import {
  LogoutPopup,
} from "./Component/layout/header/header.component";
import { HomeComponent } from "./Component/home/home.component";
import { HttpClientModule } from "@angular/common/http";
import { httpInterceptorProviders } from "./utility/http-interceptors/interceptors-provider";
import { NotificationModule } from "./utility/toastr-notification/toastr.notification.module";
import { SharedService } from "./services/shared-sibling.service";
import { DatePipe } from "@angular/common";
import { LoginPageComponent } from "./Component/login-page/login-page.component";
import { AddressModalComponent } from "./Component/modals/address-modal/address-modal.component";
import { SharedServiceCache } from "./services/SharedServiceCache.service";
import { OnlynumberDirective } from "./utility/custom-validations/only-number-validation";
import { OnlyMobileNumberDirective } from "./utility/custom-validations/only-mobile-number-validation";
import { BlockCopyPasteDirective } from "./utility/custom-validations/block-copy-paste";
import { SmartcardOrderComponent } from "./Component/my-account/smartcard/smartcard-order/smartcard-order.component";
import {
  BookingTypeEnum,
  DeliveryModeEnum,
  AppRouteEnum,
  NativePaymentMethodEnum,
  ErrorMessageEnum,
  Ga4ItemListEnum,
  Ga4DatalayeEventNameEnum,
  TravelSolutionOperatorEnum,
  TravelSolutionDirectionEnum,
  Ga4DatalayerConstantEnum,
  TravelSolutionJourneyTypeEnum,
  PageTypeEnum,
  TicketTypeEnum,
  SeatPrefrenceType,
  BookPassangerAssistEnum,
  AccountHeaderLabelEnum,
  PaymentAndVoucherCreditCardTypeEnum,
  QuickBuyEnum,
  LocalStorageKeyEnum,
  TabIndexValueEnum,
  JourneyTypeEnum,
  ForgotPasswordMsgEnum,
  NotificationErrorMsg,
  CommonIconImg,
  SessionTimeOutEnum,
  TitleListEnum,
  TrackMyTrainEnum,
  SeatPickerMsgsEnum,
  ClubAvantiEnum,
  ClubAvantiTierEnum,
  RewardButtonStatusEnum,
  RewardCodeTypesEnum,
  ClubAvantiTierMaxAndMinJourneyEnum,
  RewardSubCategoryEnum,
  RewardCategoryEnum,
  FooterNavigationLinkEnum,
  ClubAvantiViewPreviousJourneyEnum,  
  DiscountCodePopupEnum,
  DiscountCodeStatusEnum,
  NreOjpNationalRaiURLEnum,
  FilePathEnum,
  ComponentNameEnum,
  MixingDeckCombineListEnum,
  TravelSolutionStatusEnum,
  EnhancedDynamicClassesNameEnum,
  ClassTypeEnum,
  EnhancedMixingDeckPopupMessageEnum,
  EnhancedMixingDeckPopupHeadingEnum,
  EnhancedNavigationHeaderEnum,
  EnhancedAppRouteEnum,
  EnhancedMixingDeckConsoleErrorMessage,
  EnhancedJourneyFilterText,
  EnhancedFooterButtonText,
  EnhancedSearchTypeEnum,
  EnhancedTravelSolutionTypesEnum,
  EnhancedLocalOrSessionStorageKeysEnum,
  EnhancedTravelTypeEnum,
  EnhancedAccessbilityMessageEnum,
  EnhancedPathConstraintTypeEnum,
  EnhancedGa4DatalayeEventNameEnum,
  EnhancedDesignBtnText,
  EnhancedLoginStatus,
  EnhancedModalFooterTextEnum,
  EnhancedActiveClassTypeEnum,
  EnhancedTabIndexTypeEnum,
  EnhancedPassangerTypeEnum,
  EnhancedRailcardTypeEnum,
  EnhancedGA4SearchSourceEnum,
  BookingFlowTypeEnum,
  EnhancedReviewBuyAndDeliveryPageEnum,
  EnhancedTravelExtrasTextEnum,
  EnhancedSeeEarlierAndLaterTrainTextEnum,
  EnhancedAdditionalInformationEnum,
  EnhancedReviewBuyAndDeliveryReservationMessageEnum,
  EnhancedPrefixOfTicketTypeEnum,
  EnhancedReviewBuyAndDeliveryErrorMessageEnum,
  EnhancedJourneyType,
  EnhancedReviewBuyAndDeliveryBtnTextEnum,
  EnhancedReviewBuyReservedOrNonReservedMessageHeading,
  EnhancedOperatorNamesEnum,
  EnhancedFilterStatusEnum,
  EnhancedReviewBuyAndDeliveryIdsEnum,
  EnhancedReviewBuyAndDeliveryPopUpHeaderEnum,
  EnhancedPaymentMethodEnum,
  EnhancedPaymentPageMessageEnum,
  ShowAndHideTextDetailEnum,
  EnhancedConfirmationPageEnum,
  PermissionTextEnum,
  EnhancedLoaderTextEnum,
  EnhancedMonetatePageEventNameEnum
} from "./utility/app-constants.service";
import { CompensationComponent } from "./Component/my-account/my-bookings/compensation/compensation.component";
import { ConfirmModelComponent } from "./Component/my-account/my-profile/confirm-model/confirm-model.component";
import { PortalModule } from "@angular/cdk/portal";
import { ConfirmPopupComponent } from "./Component/review-and-buy/confirm-popup/confirm-popup.component";
import { TimeoutComponent } from "./Component/review-and-buy/timeout/timeout.component";
import { Page404Component } from "./Component/error/page404/page404.component";
import { Page500Component } from "./Component/error/page500/page500.component";
import { DisruptionServiceComponent } from "./Component/mixing-deck/disruption-service/disruption-service.component";
import { RequestSuccessfulComponent } from "./Component/my-account/payments-vouchers/request-successful/request-successful.component";
import { RenewSmartcardComponent } from "./Component/my-account/my-bookings/renew-smartcard/renew-smartcard.component";
import { ChangeSmartcardpopupComponent } from "./Component/my-account/payments-vouchers/change-smartcardpopup/change-smartcardpopup.component";
import { ReplaceSmartcardpopupComponent } from "./Component/my-account/payments-vouchers/replace-smartcardpopup/replace-smartcardpopup.component";
import { RenewPopupComponent } from "./Component/my-account/my-bookings/renew-popup/renew-popup.component";
import { StationSelectionPopupComponent } from "./Component/mixing-deck/station-selection-popup/station-selection-popup.component";
import { DatepickerPopupComponent } from "./Component/mixing-deck/datepicker-popup/datepicker-popup.component";
import { CojDatePickerPopupComponent } from "./Component/my-account/my-bookings/coj-date-picker-popup/coj-date-picker-popup";
import { ViewBookingInfoPopupComponent } from "./Component/my-account/my-bookings/view-booking-info-popup/view-booking-info-popup.component";

import { CookieService } from "ngx-cookie-service";
import { PrioritySeatPopupComponent } from "./Component/my-account/my-bookings/priority-seat-popup/priority-seat-popup.component";
import { DatePickerPopupAmendSeatComponent } from "./Component/amend-seat-reservation/date-picker-popup-amend-seat/date-picker-popup-amend-seat.component";
import { CojJourneyExtrasComponent } from "./Component/coj-journey-extras/coj-journey-extras.component";
import { ClubAvantiPopupComponent } from "./Component/my-account/my-preferences/club-avanti-popup/club-avanti-popup.component";
import { LoyaltySignupPopupComponent } from "./Component/my-account/my-preferences/loyalty-signup-popup/loyalty-signup-popup.component";
import {
  DeviceDetectorService,
} from "ngx-device-detector";
import { SharedModule } from "./modules/shared.module";
import { TicketInfoComponent } from "./Component/mixing-deck/ticket-info/ticket-info.component";
import { SeatpickerPopupComponent } from "./Component/review-and-buy/seatpicker-popup/seatpicker-popup.component";
import { SessionTimeoutPopupComponent } from './Component/session-timeout-popup/session-timeout-popup.component';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { IdleExpiry, SimpleExpiry } from "@ng-idle/core";
import { TrackMyTrainComponent } from "./Component/my-account/my-bookings/track-my-train/track-my-train.component";
import { ClipboardModule } from "@angular/cdk/clipboard";
import { DiscountCodeNotificationPopupComponent } from "./Component/coj-mixing-deck/discount-code-notification-popup/discount-code-notification-popup.component";
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginPageComponent,
    AddressModalComponent,
    LogoutPopup,
    OnlynumberDirective,
    OnlyMobileNumberDirective,
    BlockCopyPasteDirective,
    SmartcardOrderComponent,
    CompensationComponent,
    ConfirmModelComponent,
    ConfirmPopupComponent,
    TimeoutComponent,
    Page404Component,
    Page500Component,
    DisruptionServiceComponent,
    RequestSuccessfulComponent,
    RenewSmartcardComponent,
    ChangeSmartcardpopupComponent,
    ReplaceSmartcardpopupComponent,
    RenewPopupComponent,
    StationSelectionPopupComponent,
    DatepickerPopupComponent,
    CojDatePickerPopupComponent,
    ViewBookingInfoPopupComponent,
    PrioritySeatPopupComponent,
    DatePickerPopupAmendSeatComponent,
    CojJourneyExtrasComponent,
    ClubAvantiPopupComponent,
    LoyaltySignupPopupComponent,
    TicketInfoComponent,
    SeatpickerPopupComponent,
    SessionTimeoutPopupComponent,
    TrackMyTrainComponent,
    DiscountCodeNotificationPopupComponent,
  ],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxSpinnerModule,
    OrderModule,
    PortalModule,
    NotificationModule,
    LoggerModule.forRoot({
      serverLoggingUrl: environment.logPath,
      level: environment.logLevel,
      serverLogLevel: environment.serverLogLevel,
      disableConsoleLogging: environment.disableConsoleLog,
    }),
    MomentModule.forRoot({
      relativeTimeThresholdOptions: {
        m: 59,
      },
    }),
    SharedModule,
    NgIdleKeepaliveModule.forRoot(),
    ClipboardModule
  ],
  exports: [LoginPageComponent],
  providers: [
    httpInterceptorProviders,
    SharedService,
    DatePipe,
    SharedServiceCache,
    BookingTypeEnum,
    DeliveryModeEnum,
    AppRouteEnum,
    NativePaymentMethodEnum,
    CookieService,
    ErrorMessageEnum,
    Ga4ItemListEnum,
    Ga4DatalayeEventNameEnum,
    TravelSolutionOperatorEnum,
    TravelSolutionDirectionEnum,
    Ga4DatalayerConstantEnum,
    TravelSolutionJourneyTypeEnum,
    PageTypeEnum,
    TicketTypeEnum,
    SeatPrefrenceType,
    BookPassangerAssistEnum,
    AccountHeaderLabelEnum,
    PaymentAndVoucherCreditCardTypeEnum,
    QuickBuyEnum,
    LocalStorageKeyEnum,
    DeviceDetectorService,
    JourneyTypeEnum,
    TabIndexValueEnum,
    ForgotPasswordMsgEnum,
    NotificationErrorMsg,
    CommonIconImg,
    SessionTimeOutEnum,
    {
      provide: IdleExpiry,
      useClass: SimpleExpiry
    },
    TitleListEnum,
    TrackMyTrainEnum,
    SeatPickerMsgsEnum,
    ClubAvantiEnum,
    ClubAvantiTierEnum,
    RewardButtonStatusEnum,
    RewardCodeTypesEnum,
    ClubAvantiTierMaxAndMinJourneyEnum,
    RewardSubCategoryEnum,
    RewardCategoryEnum,
    FooterNavigationLinkEnum,
    ClubAvantiViewPreviousJourneyEnum,    
    DiscountCodePopupEnum,
    DiscountCodeStatusEnum,
    NreOjpNationalRaiURLEnum,
    FilePathEnum,
    ComponentNameEnum,
    MixingDeckCombineListEnum,
    TravelSolutionStatusEnum,
    EnhancedDynamicClassesNameEnum,
    ClassTypeEnum,
    EnhancedMixingDeckPopupMessageEnum,
    EnhancedMixingDeckPopupHeadingEnum,
    EnhancedNavigationHeaderEnum,
    EnhancedAppRouteEnum,
    EnhancedMixingDeckConsoleErrorMessage,
    EnhancedJourneyFilterText,
    EnhancedFooterButtonText,
    EnhancedSearchTypeEnum,
    EnhancedTravelSolutionTypesEnum,
    EnhancedLocalOrSessionStorageKeysEnum,
    EnhancedTravelTypeEnum,
    EnhancedAccessbilityMessageEnum,
    EnhancedPathConstraintTypeEnum,
    EnhancedGa4DatalayeEventNameEnum,
    EnhancedDesignBtnText,
    EnhancedLoginStatus,
    EnhancedModalFooterTextEnum,
    EnhancedActiveClassTypeEnum,
    EnhancedTabIndexTypeEnum,
    EnhancedPassangerTypeEnum,
    EnhancedRailcardTypeEnum,
    EnhancedGA4SearchSourceEnum,
    BookingFlowTypeEnum,
    EnhancedReviewBuyAndDeliveryPageEnum,
    EnhancedTravelExtrasTextEnum,
    EnhancedSeeEarlierAndLaterTrainTextEnum,
    EnhancedAdditionalInformationEnum,
    EnhancedReviewBuyAndDeliveryReservationMessageEnum,
    EnhancedPrefixOfTicketTypeEnum,
    EnhancedReviewBuyAndDeliveryErrorMessageEnum,
    EnhancedJourneyType,
    EnhancedReviewBuyAndDeliveryBtnTextEnum,
    EnhancedReviewBuyReservedOrNonReservedMessageHeading,
    EnhancedOperatorNamesEnum,
    EnhancedFilterStatusEnum,
    EnhancedReviewBuyAndDeliveryIdsEnum,
    EnhancedReviewBuyAndDeliveryPopUpHeaderEnum,
    EnhancedPaymentMethodEnum,
    EnhancedPaymentPageMessageEnum,
    ShowAndHideTextDetailEnum,
    EnhancedConfirmationPageEnum,
    PermissionTextEnum,
    EnhancedLoaderTextEnum,
    EnhancedMonetatePageEventNameEnum
  ],
  bootstrap: [AppComponent],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
