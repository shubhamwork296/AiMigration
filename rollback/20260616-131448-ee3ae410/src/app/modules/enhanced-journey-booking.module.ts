import {  CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AngularMaterialModule } from "../material/material-module";
import { SharedModule } from "./shared.module";
import { ReactiveFormsModule } from "@angular/forms";
import { EnhancedJourneyBookingRoutingModule } from "../route/enhanced-journey-booking-routing.module";
import { EnhancedBasicDialogComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-base-dialogs/enhanced-basic-dialog.component";
import { EnhancedMixingDeckTicketTypeAndClassComponent } from "../Enhanced-Component/enhanced-ticket-type-and-class/enhanced-ticket-type-and-class.component";
import { EnhancedJourneyDetailsAndItineraryDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-journey-details-and-itinerary-dialogs/enhanced-journey-details-and-itinerary-dialogs.component";
import { EnhancedJourneySummaryDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-journey-summary-dialogs/enhanced-journey-summary-dialogs.component";
import { EnhancedClassDetailsDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-class-details-dialogs/enhanced-class-details-dialogs.component";
import { EnhancedPriceBreakdownDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-price-breakdown-dialogs/enhanced-price-breakdown-dialogs.component";
import { EnhancedRailcardRestrictionsDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-Railcard-restrictions-dialogs/enhanced-Railcard-restrictions-dialogs.component";
import { EnhancedReturnDateAndTimeDialog } from "../Enhanced-Component/enhanced-dialogs/enhanced-return-date-and-time-dialog/enhanced-return-date-and-time-dialog.component";
import { EnhancedSearchJourneyStationDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-search-journey-station-dialogs/enhanced-search-journey-station-dialogs.component";
import { EnhancedAddRailcardDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-add-railcard-dialogs/enhanced-add-railcard-dialogs.component";
import { EnhancedDatepickerPopupComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-datepicker-popup-dialogs/enhanced-datepicker-popup-dialogs.component";
import { EnhancedTicketDetailsDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-ticket-detail-dialogs/enhanced-ticket-detail-dialogs.component";
import { EnhancedTicketInformationDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-ticket-information-dialogs/enhanced-ticket-information-dialogs.component";
import { EnhancedSearchInformationDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-search-information-dialogs/enhanced-search-information-dialogs.component";
import { EnhancedNoTrainAvailableDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-no-trains-available-dialogs/enhanced-no-trains-available-dialogs.component";
import { EnhancedFilterMobileDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-filter-mobile-dialogs/enhanced-filter-mobile-dialogs.component";
import { EnhancedLogoutDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-logout-dialogs/enhanced-logout-dialogs.component";
import { EnhancedSeatpickerPopupComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-seat-picker-dialogs/enhanced-seatpicker-popup.component";
import { EnhancedSessionTimeoutPopupComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-session-timeout-popup/enhanced-session-timeout-popup.component";
import { EnhancedGoBackDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-go-back-dialogs/enhanced-go-back-dialogs.component";
import { EnhancedRemoveJourneyDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-remove-journey-dialogs/enhanced-remove-journey-dialogs.component";
import { EnhancedExpireBasketJourneyDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-expire-basket-journey-dialogs/enhanced-expire-basket-journey-dialogs.component";
import { EnhancedExpiredJourneyDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-expired-journey-dialogs/enhanced-expired-journey-dialogs.component";
import { EnhancedChangeDeliveryOptionDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-change-delivery-option-dialogs/enhanced-change-delivery-option-dialogs.component";
import { EnhancedNoSeatsAvailableDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-no-seats-available-dialogs/enhanced-no-seats-available-dialogs.component";
import { EnhancedChangeSeatPreferenceDialogs } from "../Enhanced-Component/enhanced-dialogs/enhanced-change-seat-preference-dialogs/enhanced-change-seat-preference-dialogs.component";
import { EnhancedTimeoutDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-timeout-dialogs/enhanced-timeout-dialogs.component";
import { EnhancedCommonNotificationDialogsComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-common-notification-dialogs/enhanced-common-notification-dialogs.component";
import { EnhancedCommonErrorPopupComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-common-error-popup/enhanced-common-error-popup.component";
import { SeasonTicketBasketDialogComponent } from "../Enhanced-Component/enhanced-dialogs/season-ticket-basket-dialog/season-ticket-basket-dialog.component";
import { EnhancedCommonConfirmationDialogComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-common-confirmation-dialog/enhanced-common-confirmation-dialog.component";
import { EnhancedPaymentNotCompletedDialogComponent } from "../Enhanced-Component/enhanced-dialogs/enhanced-payment-not-completed-dialog/enhanced-payment-not-completed-dialog.component";
@NgModule({
    declarations:[
        EnhancedBasicDialogComponent,
        EnhancedJourneyDetailsAndItineraryDialogsComponent,
        EnhancedJourneySummaryDialogsComponent,
        EnhancedClassDetailsDialogsComponent,
        EnhancedPriceBreakdownDialogs,
        EnhancedRailcardRestrictionsDialogs,
        EnhancedReturnDateAndTimeDialog,
        EnhancedSearchJourneyStationDialogs,
        EnhancedAddRailcardDialogs,
        EnhancedDatepickerPopupComponent,
        EnhancedTicketDetailsDialogsComponent,
        EnhancedTicketInformationDialogsComponent,
        EnhancedSearchInformationDialogs,
        EnhancedNoTrainAvailableDialogs,
        EnhancedFilterMobileDialogs,
        EnhancedLogoutDialogs,
        EnhancedSeatpickerPopupComponent,
        EnhancedSessionTimeoutPopupComponent,
        EnhancedGoBackDialogsComponent,
        EnhancedRemoveJourneyDialogsComponent,
        EnhancedExpireBasketJourneyDialogsComponent,
        EnhancedExpiredJourneyDialogsComponent,
        EnhancedChangeDeliveryOptionDialogsComponent,
        EnhancedNoSeatsAvailableDialogsComponent,
        EnhancedChangeSeatPreferenceDialogs,
        EnhancedTimeoutDialogsComponent,
        EnhancedCommonNotificationDialogsComponent,
        EnhancedCommonErrorPopupComponent,
        SeasonTicketBasketDialogComponent,
        EnhancedCommonConfirmationDialogComponent,
        EnhancedPaymentNotCompletedDialogComponent
    ], 
    imports:[
        CommonModule,
        EnhancedJourneyBookingRoutingModule,
        AngularMaterialModule,
        SharedModule,
        ReactiveFormsModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class EnhancedJourneyBookingModule {
}